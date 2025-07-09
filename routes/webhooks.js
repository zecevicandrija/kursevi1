// backend/routes/webhooks.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../db');
const generateRandomPassword = require('../utils/passwordGenerator');

// Middleware da uhvatimo 'raw' body, neophodan za verifikaciju
router.use(express.raw({ type: 'application/json' }));

router.post('/lemon-squeezy', async (req, res) => {
    // --- 1. SIGURNOSNA PROVERA POTPISA ---
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

    // --- 2. OBRADA PODATAKA IZ WEBHOOK-a ---
    const payload = JSON.parse(req.body.toString());
    const eventName = payload.meta.event_name;
    
    // Obrađujemo samo događaj kada je porudžbina uspešno kreirana
    if (eventName === 'order_created') {
        const orderData = payload.data.attributes;
        const customData = payload.meta.custom_data;

        // Proveravamo da li je status 'paid'
        if (orderData.status !== 'paid') {
            console.log(`Porudžbina ${orderData.identifier} primljena, ali status nije 'paid'. Status: ${orderData.status}. Preskačem.`);
            return res.status(200).send('Porudžbina primljena, ali nije plaćena.');
        }

        try {
            const kursId = customData.kurs_id;
            const userEmail = orderData.user_email.toLowerCase();
            const userName = orderData.user_name;

            // --- 3. PROVERA DA LI KORISNIK VEĆ POSTOJI ---
            const [existingUsers] = await db.query('SELECT id FROM korisnici WHERE email = ?', [userEmail]);
            let userId;

            if (existingUsers.length > 0) {
                // Ako korisnik postoji, samo koristimo njegov postojeći ID
                userId = existingUsers[0].id;
                console.log(`Korisnik sa emailom ${userEmail} već postoji. ID: ${userId}`);
            } else {
                // Ako korisnik ne postoji, kreiramo novog
                console.log(`Korisnik sa emailom ${userEmail} ne postoji. Kreiram novog.`);
                const password = generateRandomPassword();
                const hashedPassword = await bcrypt.hash(password, 10);
                
                // Pokušaj da podeliš ime i prezime
                const [ime, ...prezimeParts] = userName.split(' ');
                const prezime = prezimeParts.join(' ') || ime; // Ako nema prezimena, koristi ime

                const [newUserResult] = await db.query(
                    'INSERT INTO korisnici (ime, prezime, email, sifra, uloga) VALUES (?, ?, ?, ?, ?)',
                    [ime, prezime, userEmail, hashedPassword, 'korisnik']
                );
                userId = newUserResult.insertId;

                console.log(`Novi korisnik kreiran. ID: ${userId}. Lozinka (pre heširanja): ${password}`);
                // OVDE ĆEMO KASNIJE DODATI LOGIKU ZA SLANJE EMAIL-A SA LOZINKOM
            }

            // --- 4. DODELA KURSA KORISNIKU ---
            // Proveravamo da li korisnik već poseduje ovaj kurs
            const [postojecaKupovina] = await db.query('SELECT id FROM kupovina WHERE korisnik_id = ? AND kurs_id = ?', [userId, kursId]);
            if(postojecaKupovina.length === 0) {
                await db.query('INSERT INTO kupovina (korisnik_id, kurs_id) VALUES (?, ?)', [userId, kursId]);
                console.log(`Kurs sa ID-jem ${kursId} je uspešno dodeljen korisniku sa ID-jem ${userId}.`);
            } else {
                console.log(`Korisnik ${userId} već poseduje kurs ${kursId}. Preskačem dodelu.`);
            }

            // --- 5. EVIDENCIJA TRANSAKCIJE ---
            await db.query(
                'INSERT INTO transakcije (lemon_squeezy_order_id, korisnik_id, kurs_id, iznos, valuta, status_placanja, podaci_kupca) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [
                    payload.data.id,
                    userId,
                    kursId,
                    orderData.total / 100, // LemonSqueezy šalje iznos u centima
                    orderData.currency,
                    orderData.status,
                    JSON.stringify(payload)
                ]
            );
            console.log(`Transakcija ${payload.data.id} je uspešno evidentirana u bazi.`);

        } catch (error) {
            console.error("Greška pri obradi 'order_created' događaja:", error);
            // Vraćamo 500 da bi Lemon Squeezy pokušao ponovo da pošalje webhook
            return res.status(500).send('Greška na serveru prilikom obrade webhooka.');
        }
    }

    // Uvek vraćamo 200 OK ako je sve prošlo kako treba, da Lemon Squeezy zna da smo primili webhook.
    res.status(200).send('Webhook uspešno primljen i obrađen.');
});

module.exports = router;