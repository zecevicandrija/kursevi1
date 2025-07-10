const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../db');
const generateRandomPassword = require('../utils/passwordGenerator');
const { Resend } = require('resend');

router.use(express.raw({ type: 'application/json' }));

router.post('/lemon-squeezy', async (req, res) => {
    // Provera potpisa ostaje ista...
    try {
        const secret = process.env.LEMON_SQUEEZY_SIGNING_SECRET;
        const hmac = crypto.createHmac('sha256', secret);
        const digest = Buffer.from(hmac.update(req.body).digest('hex'), 'utf8');
        const signature = Buffer.from(req.get('X-Signature') || '', 'utf8');
        if (!crypto.timingSafeEqual(digest, signature)) {
            return res.status(400).send('Invalid signature.');
        }
    } catch (error) {
        return res.status(500).send('Greška prilikom verifikacije potpisa.');
    }

    const payload = JSON.parse(req.body.toString());
    const eventName = payload.meta.event_name;
    
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        let userId;
        let userEmail;
        let userName;
        let kursId;

        // Prvo određujemo koji događaj obrađujemo i izvlačimo podatke
        if (eventName === 'order_created') {
            const orderData = payload.data.attributes;
            if (orderData.status !== 'paid') {
                await connection.release();
                return res.status(200).send('Porudžbina primljena, ali nije plaćena.');
            }
            const variantId = orderData.first_order_item?.variant_id;
            if (!variantId) throw new Error('Variant ID nedostaje u order_created payload-u.');
            
            const [kursevi] = await connection.query('SELECT id FROM kursevi WHERE lemon_squeezy_variant_id = ?', [variantId]);
            if (kursevi.length === 0) throw new Error(`Kurs nije pronađen za variant_id: ${variantId}`);
            
            kursId = kursevi[0].id;
            userEmail = orderData.user_email.toLowerCase();
            userName = orderData.user_name;

        } else if (eventName === 'subscription_created' || eventName === 'subscription_payment_success') {
            const subscriptionData = payload.data.attributes;
            userEmail = subscriptionData.user_email.toLowerCase();
        } else {
            // Ako događaj nije ni jedan od ova dva, ne radimo ništa
            await connection.release();
            return res.status(200).send('Događaj nije relevantan, preskačem.');
        }

        // Sada kada imamo email, pronalazimo ili kreiramo korisnika
        const [existingUsers] = await connection.query('SELECT id FROM korisnici WHERE email = ?', [userEmail]);
        
        if (existingUsers.length > 0) {
            userId = existingUsers[0].id;
        } else if (eventName === 'order_created') { // Novi korisnik se kreira samo kod prve kupovine
            const password = generateRandomPassword();
            const hashedPassword = await bcrypt.hash(password, 10);
            const [ime, ...prezimeParts] = userName.split(' ');
            const prezime = prezimeParts.join(' ') || ime;

            console.log(`Korisnik je kupio, mejl mu je: ${userEmail}, generisana šifra mu je: ${password}`);

            const [newUserResult] = await connection.query(
                'INSERT INTO korisnici (ime, prezime, email, sifra, uloga) VALUES (?, ?, ?, ?, ?)',
                [ime, prezime, userEmail, hashedPassword, 'korisnik']
            );
            userId = newUserResult.insertId;
            
            // Slanje emaila samo novom korisniku
            try {
                const resend = new Resend(process.env.RESEND_API_KEY);
                await resend.emails.send({
                    from: 'MotionAcademy <office@undovrbas.com>', // Koristi svoj verifikovani domen
                    to: userEmail,
                    subject: 'Dobrodošli! Vaš nalog je kreiran.',
                    html: `<h1>Pozdrav ${ime},</h1><p>Hvala Vam na kupovini kursa! Vaš nalog je uspešno kreiran.</p><p>Podaci za prijavu:</p><ul><li>Email: ${userEmail}</li><li>Lozinka: <strong>${password}</strong></li></ul>`
                });
                console.log(`Email dobrodošlice poslat na ${userEmail}`);
            } catch (emailError) {
                console.error("Greška prilikom slanja email-a:", emailError);
            }
        } else {
            // Ako je događaj obnova pretplate, a korisnik ne postoji, to je greška
            throw new Error(`Korisnik sa emailom ${userEmail} nije pronađen za produžavanje pretplate.`);
        }

        // Ako je bila prva kupovina, dodaj je u 'kupovina' tabelu
        if (eventName === 'order_created' && kursId) {
            const [postojecaKupovina] = await connection.query('SELECT id FROM kupovina WHERE korisnik_id = ? AND kurs_id = ?', [userId, kursId]);
            if (postojecaKupovina.length === 0) {
                await connection.query('INSERT INTO kupovina (korisnik_id, kurs_id) VALUES (?, ?)', [userId, kursId]);
            }
        }

        // Ako je pretplata, ažuriraj datum isteka
        if (eventName === 'subscription_created' || eventName === 'subscription_payment_success') {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 31);
            await connection.query('UPDATE korisnici SET subscription_expires_at = ? WHERE id = ?', [expiryDate, userId]);
            console.log(`Pretplata za korisnika ID ${userId} je produžena do ${expiryDate.toISOString()}.`);
        }

        // Evidencija transakcije (samo za order_created)
        if (eventName === 'order_created') {
            await connection.query(
                'INSERT INTO transakcije (lemon_squeezy_order_id, korisnik_id, kurs_id, iznos, valuta, status_placanja, podaci_kupca) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [payload.data.id, userId, kursId, payload.data.attributes.total / 100, payload.data.attributes.currency, payload.data.attributes.status, JSON.stringify(payload)]
            );
        }

        await connection.commit();
        res.status(200).send('Webhook uspešno obrađen.');

    } catch (error) {
        if (connection) await connection.rollback();
        console.error(`Greška pri obradi događaja '${eventName}':`, error);
        return res.status(500).send('Greška na serveru prilikom obrade webhooka.');
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;