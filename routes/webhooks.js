const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../db');
const generateRandomPassword = require('../utils/passwordGenerator');

// Middleware ostaje isti
router.use(express.raw({ type: 'application/json' }));

router.post('/lemon-squeezy', async (req, res) => {
    // --- 1. Provera potpisa (ostaje ista) ---
    try {
        const secret = process.env.LEMON_SQUEEZY_SIGNING_SECRET;
        const hmac = crypto.createHmac('sha256', secret);
        const digest = Buffer.from(hmac.update(req.body).digest('hex'), 'utf8');
        const signature = Buffer.from(req.get('X-Signature') || '', 'utf8');

        if (!crypto.timingSafeEqual(digest, signature)) {
            console.warn("Webhook sa neispravnim potpisom primljen.");
            return res.status(400).send('Invalid signature.');
        }
    } catch (error) {
        console.error("Greška prilikom verifikacije potpisa:", error);
        return res.status(500).send('Greška na serveru.');
    }

    // --- 2. Obrada podataka ---
    const payload = JSON.parse(req.body.toString());
    const eventName = payload.meta.event_name;
    
    if (eventName === 'order_created') {
        const orderData = payload.data.attributes;

        if (orderData.status !== 'paid') {
            console.log(`Porudžbina primljena, ali status nije 'paid'. Status: ${orderData.status}. Preskačem.`);
            return res.status(200).send('Porudžbina primljena, ali nije plaćena.');
        }

        let connection;
        try {
            // Započinjemo transakciju
            connection = await db.getConnection();
            await connection.beginTransaction();

            // --- IZMENA POČINJE OVDE ---
            
            // 1. Dobijamo variant_id iz podataka koje nam Lemon Squeezy garantovano šalje
            const variantId = orderData.first_order_item?.variant_id;
            if (!variantId) {
                // Ako iz nekog razloga nema variant_id, prekidamo proces
                throw new Error('Variant ID nedostaje u webhook payload-u.');
            }

            // 2. Pomoću variant_id pronalazimo naš interni ID kursa u našoj bazi
            const [kursevi] = await connection.query('SELECT id FROM kursevi WHERE lemon_squeezy_variant_id = ?', [variantId]);
            if (kursevi.length === 0) {
                // Ako ne nađemo kurs, bacamo grešku. Proveri da li je variant_id ispravno upisan u bazu.
                throw new Error(`Nijedan kurs nije pronađen za variant_id: ${variantId}`);
            }
            const kursId = kursevi[0].id; // Ovo je naš interni, pouzdani ID kursa

            // --- IZMENA SE ZAVRŠAVA OVDE ---

            // Ostatak koda sada koristi pouzdano dobijen 'kursId'
            const userEmail = orderData.user_email.toLowerCase();
            const userName = orderData.user_name;

            const [existingUsers] = await connection.query('SELECT id FROM korisnici WHERE email = ?', [userEmail]);
            let userId;

            if (existingUsers.length > 0) {
                userId = existingUsers[0].id;
                console.log(`Korisnik sa emailom ${userEmail} već postoji. ID: ${userId}`);
            } else {
                const password = generateRandomPassword();
                const hashedPassword = await bcrypt.hash(password, 10);
                const [ime, ...prezimeParts] = userName.split(' ');
                const prezime = prezimeParts.join(' ') || ime;

                const [newUserResult] = await connection.query(
                    'INSERT INTO korisnici (ime, prezime, email, sifra, uloga) VALUES (?, ?, ?, ?, ?)',
                    [ime, prezime, userEmail, hashedPassword, 'korisnik']
                );
                userId = newUserResult.insertId;
                console.log(`Novi korisnik kreiran. ID: ${userId}. Lozinka (pre heširanja): ${password}`);
                // OVDE ĆEMO KASNIJE DODATI LOGIKU ZA SLANJE EMAIL-A
            }

            const [postojecaKupovina] = await connection.query('SELECT id FROM kupovina WHERE korisnik_id = ? AND kurs_id = ?', [userId, kursId]);
            if (postojecaKupovina.length === 0) {
                await connection.query('INSERT INTO kupovina (korisnik_id, kurs_id) VALUES (?, ?)', [userId, kursId]);
                console.log(`Kurs sa ID-jem ${kursId} je uspešno dodeljen korisniku sa ID-jem ${userId}.`);
            } else {
                console.log(`Korisnik ${userId} već poseduje kurs ${kursId}. Preskačem dodelu.`);
            }

            await connection.query(
                'INSERT INTO transakcije (lemon_squeezy_order_id, korisnik_id, kurs_id, iznos, valuta, status_placanja, podaci_kupca) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [
                    payload.data.id, userId, kursId,
                    orderData.total / 100, orderData.currency, orderData.status,
                    JSON.stringify(payload)
                ]
            );

            await connection.commit();
            console.log(`Uspešno obrađena porudžbina ${payload.data.id} za kurs ${kursId}`);

        } catch (error) {
            if (connection) await connection.rollback();
            console.error("Greška pri obradi 'order_created' događaja:", error);
            return res.status(500).send('Greška na serveru prilikom obrade webhooka.');
        } finally {
            if (connection) connection.release();
        }
    }

    res.status(200).send('Webhook uspešno primljen i obrađen.');
});

module.exports = router;