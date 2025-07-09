const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');

// Endpoint za registraciju korisnika
router.post('/register', async (req, res) => {
    const { ime, prezime, email, sifra, uloga } = req.body;

    try {
        if (!ime || !prezime || !email || !sifra || !uloga) {
            return res.status(400).json({ error: 'Sva polja su obavezna.' });
        }

        // Proveri da li korisnik već postoji
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
    const { email, sifra } = req.body;

    try {
        if (!email || !sifra) {
            return res.status(400).json({ error: 'Email i šifra su obavezni.' });
        }

        const query = 'SELECT * FROM korisnici WHERE email = ?';
        const [results] = await db.query(query, [email]);

        if (results.length === 0) {
            // Korisnik nije pronađen
            return res.status(401).json({ message: 'Pogrešni kredencijali.' });
        }
        
        const user = results[0];
        const isMatch = await bcrypt.compare(sifra, user.sifra);

        if (!isMatch) {
            // Šifra se ne poklapa
            return res.status(401).json({ message: 'Pogrešni kredencijali.' });
        }
        
        // Uklanjamo šifru iz objekta koji šaljemo nazad radi sigurnosti
        const { sifra: userPassword, ...userWithoutPassword } = user;
        
        // Uspešno prijavljivanje
        res.status(200).json({ user: userWithoutPassword });

    } catch (error) {
        console.error('Greška prilikom prijavljivanja:', error);
        res.status(500).json({ error: 'Došlo je do greške na serveru.' });
    }
});


module.exports = router;