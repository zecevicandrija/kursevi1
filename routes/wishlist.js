const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../db');
const generateRandomPassword = require('../utils/passwordGenerator');

// Middleware ostaje isti
router.use(express.raw({ type: 'application/json' }));

router.post('/lemon-squeezy', async (req, res) => {
    // Provera potpisa ostaje ista...
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

    const payload = JSON.parse(req.body.toString());
    const eventName = payload.meta.event_name;
    
    if (eventName === 'order_created') {
        const orderData = payload.data.attributes;
        const customData = payload.meta.custom_data;

        if (orderData.status !== 'paid') {
            return res.status(200).send('Porudžbina primljena, ali nije plaćena.');
        }

        // --- Započinjemo transakciju ---
        let connection;
        try {
            connection = await db.getConnection(); // Uzimamo jednu konekciju iz pool-a
            await connection.beginTransaction(); // Započinjemo transakciju

            const kursId = customData.kurs_id;
            const userEmail = orderData.user_email.toLowerCase();
            const userName = orderData.user_name;

            // Provera da li korisnik postoji
            const [existingUsers] = await connection.query('SELECT id FROM korisnici WHERE email = ?', [userEmail]);
            let userId;

            if (existingUsers.length > 0) {
                userId = existingUsers[0].id;
            } else {
                // Kreiranje novog korisnika
                const password = generateRandomPassword();
                const hashedPassword = await bcrypt.hash(password, 10);
                const [ime, ...prezimeParts] = userName.split(' ');
                const prezime = prezimeParts.join(' ') || ime;

                const [newUserResult] = await connection.query(
                    'INSERT INTO korisnici (ime, prezime, email, sifra, uloga) VALUES (?, ?, ?, ?, ?)',
                    [ime, prezime, userEmail, hashedPassword, 'korisnik']
                );
                userId = newUserResult.insertId;
                // OVDE ĆEMO KASNIJE DODATI LOGIKU ZA SLANJE EMAIL-A
            }

            // Dodela kursa korisniku
            const [postojecaKupovina] = await connection.query('SELECT id FROM kupovina WHERE korisnik_id = ? AND kurs_id = ?', [userId, kursId]);
            if(postojecaKupovina.length === 0) {
                await connection.query('INSERT INTO kupovina (korisnik_id, kurs_id) VALUES (?, ?)', [userId, kursId]);
            }

            // Evidencija transakcije
            await connection.query(
                'INSERT INTO transakcije (lemon_squeezy_order_id, korisnik_id, kurs_id, iznos, valuta, status_placanja, podaci_kupca) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [
                    payload.data.id, userId, kursId, 
                    orderData.total / 100, orderData.currency, orderData.status, 
                    JSON.stringify(payload)
                ]
            );

            // Ako je sve prošlo, potvrđujemo transakciju
            await connection.commit();

        } catch (error) {
            // Ako se desila bilo kakva greška, poništavamo SVE što je urađeno
            if (connection) await connection.rollback();
            console.error("Greška pri obradi 'order_created' događaja:", error);
            return res.status(500).send('Greška na serveru prilikom obrade webhooka.');
        } finally {
            // Uvek oslobađamo konekciju nazad u pool
            if (connection) connection.release();
        }
    }

    res.status(200).send('Webhook uspešno primljen i obrađen.');
});

module.exports = router;