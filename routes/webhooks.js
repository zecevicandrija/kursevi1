const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../db');
const generateRandomPassword = require('../utils/passwordGenerator');
const { Resend } = require('resend');

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
    
    let connection; // Definišemo konekciju ovde da bude dostupna u svim blokovima
    
    try {
        // --- LOGIKA ZA JEDNOKRATNU KUPOVINU ---
        if (eventName === 'order_created') {
            const orderData = payload.data.attributes;

            if (orderData.status !== 'paid') {
                console.log(`Porudžbina primljena, ali status nije 'paid'. Status: ${orderData.status}. Preskačem.`);
                return res.status(200).send('Porudžbina primljena, ali nije plaćena.');
            }

            connection = await db.getConnection();
            await connection.beginTransaction();

            const variantId = orderData.first_order_item?.variant_id;
            if (!variantId) throw new Error('Variant ID nedostaje u webhook payload-u.');
            
            const [kursevi] = await connection.query('SELECT id FROM kursevi WHERE lemon_squeezy_variant_id = ?', [variantId]);
            if (kursevi.length === 0) throw new Error(`Nijedan kurs nije pronađen za variant_id: ${variantId}`);
            
            const kursId = kursevi[0].id;
            const userEmail = orderData.user_email.toLowerCase();
            const userName = orderData.user_name;

            const [existingUsers] = await connection.query('SELECT id FROM korisnici WHERE email = ?', [userEmail]);
            let userId;

            if (existingUsers.length > 0) {
                userId = existingUsers[0].id;
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
                
                // Slanje email-a
                try {
                    const resend = new Resend(process.env.RESEND_API_KEY);
                    await resend.emails.send({
                        from: 'MotionAcademy <kontakt@undovrbas.com>',
                        to: userEmail,
                        subject: 'Dobrodošli! Vaš nalog je kreiran.',
                        html: `<h1>Pozdrav ${ime},</h1><p>Vaš nalog je uspešno kreiran. Lozinka: <strong>${password}</strong></p>`
                    });
                } catch (emailError) {
                    console.error("Greška prilikom slanja email-a:", emailError);
                }
            }

            const [postojecaKupovina] = await connection.query('SELECT id FROM kupovina WHERE korisnik_id = ? AND kurs_id = ?', [userId, kursId]);
            if (postojecaKupovina.length === 0) {
                await connection.query('INSERT INTO kupovina (korisnik_id, kurs_id) VALUES (?, ?)', [userId, kursId]);
            }

            await connection.query(
                'INSERT INTO transakcije (lemon_squeezy_order_id, korisnik_id, kurs_id, iznos, valuta, status_placanja, podaci_kupca) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [payload.data.id, userId, kursId, orderData.total / 100, orderData.currency, orderData.status, JSON.stringify(payload)]
            );

            await connection.commit();
        
        // --- NOVA LOGIKA ZA PRETPLATE ---
        } else if (eventName === 'subscription_created' || eventName === 'subscription_payment_success') {
            
            connection = await db.getConnection();
            await connection.beginTransaction();

            const subscriptionData = payload.data.attributes;
            const userEmail = subscriptionData.user_email.toLowerCase();

            // Pronalazimo korisnika po emailu
            const [users] = await connection.query('SELECT id FROM korisnici WHERE email = ?', [userEmail]);

            if (users.length === 0) {
                // Ako korisnik iz nekog razloga ne postoji, ovo je greška koju treba istražiti.
                // Možda je promenio email u međuvremenu. Za sada, prekidamo.
                throw new Error(`Korisnik sa emailom ${userEmail} nije pronađen za produžavanje pretplate.`);
            }
            const userId = users[0].id;

            // Računamo novi datum isteka (današnji datum + 31 dan)
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 31);

            // Ažuriramo korisnika sa novim datumom isteka
            await connection.query(
                'UPDATE korisnici SET subscription_expires_at = ? WHERE id = ?',
                [expiryDate, userId]
            );

            await connection.commit();
            console.log(`Pretplata za korisnika ID ${userId} je produžena do ${expiryDate.toISOString()}.`);
        }

        res.status(200).send('Webhook uspešno primljen i obrađen.');

    } catch (error) {
        if (connection) await connection.rollback();
        console.error(`Greška pri obradi događaja '${eventName}':`, error);
        return res.status(500).send('Greška na serveru prilikom obrade webhooka.');
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;