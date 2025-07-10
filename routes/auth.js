const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // 1. Uvozimo jsonwebtoken
const authMiddleware = require('../middleware/token');

// Endpoint za registraciju korisnika (ostaje isti kao što smo ga sredili)
router.post('/register', async (req, res) => {
    try {
        const { ime, prezime, email, sifra, uloga } = req.body;
        if (!ime || !prezime || !email || !sifra || !uloga) {
            return res.status(400).json({ error: 'Sva polja su obavezna.' });
        }
        const [existingUsers] = await db.query('SELECT email FROM korisnici WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(409).json({ error: 'Korisnik sa ovim emailom već postoji.' });
        }
        const hashedPassword = await bcrypt.hash(sifra, 10);
        const query = "INSERT INTO korisnici (ime, prezime, email, sifra, uloga) VALUES (?, ?, ?, ?, ?)";
        await db.query(query, [ime, prezime, email, hashedPassword, uloga]);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Greška prilikom registracije:', error);
        res.status(500).json({ error: 'Došlo je do greške na serveru.' });
    }
});

// Endpoint za prijavljivanje (login) korisnika
router.post('/login', async (req, res) => {
    try {
        const { email, sifra } = req.body;
        if (!email || !sifra) {
            return res.status(400).json({ error: 'Email i šifra su obavezni.' });
        }

        // 2. Ažuriramo upit da formatira datum radi kompatibilnosti sa JavaScript-om
        const query = 'SELECT id, ime, prezime, email, sifra, uloga, DATE_FORMAT(subscription_expires_at, "%Y-%m-%dT%H:%i:%sZ") as subscription_expires_at FROM korisnici WHERE email = ?';
        const [results] = await db.query(query, [email]);

        if (results.length === 0) {
            return res.status(401).json({ message: 'Pogrešni kredencijali.' });
        }
        
        const user = results[0];
        const isMatch = await bcrypt.compare(sifra, user.sifra);

        if (!isMatch) {
            return res.status(401).json({ message: 'Pogrešni kredencijali.' });
        }
        
        // 3. Kreiramo JWT token
        const token = jwt.sign(
            { id: user.id, uloga: user.uloga }, // Podaci koje čuvamo u tokenu
            process.env.JWT_SECRET,             // Naš tajni ključ iz .env fajla
            { expiresIn: '7d' }                 // Opcije (npr. token traje 7 dana)
        );

        const { sifra: userPassword, ...userWithoutPassword } = user;
        
        // 4. Šaljemo i korisnika i token nazad frontendu
        res.status(200).json({ user: userWithoutPassword, token: token });

    } catch (error) {
        console.error('Greška prilikom prijavljivanja:', error);
        res.status(500).json({ error: 'Došlo je do greške na serveru.' });
    }
});

router.get('/me', authMiddleware, async (req, res) => {
    try {
        // req.user.id dolazi iz authMiddleware-a
        const query = 'SELECT id, ime, prezime, email, uloga, DATE_FORMAT(subscription_expires_at, "%Y-%m-%dT%H:%i:%sZ") as subscription_expires_at FROM korisnici WHERE id = ?';
        const [users] = await db.query(query, [req.user.id]);

        if (users.length === 0) {
            return res.status(404).json({ message: 'Korisnik nije pronađen.' });
        }
        res.json(users[0]);
    } catch (error) {
        res.status(500).json({ message: 'Greška na serveru.' });
    }
});

module.exports = router;