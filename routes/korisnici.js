const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');

// Endpoint za dobavljanje svih korisnika
router.get('/', async (req, res) => {
    try {
        // Iz bezbednosnih razloga, nikada ne šaljemo lozinke na frontend
        const query = 'SELECT id, ime, prezime, email, uloga FROM korisnici';
        const [results] = await db.query(query);
        res.status(200).json(results);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Greška na serveru' });
    }
});

// Endpoint za dodavanje novog korisnika
router.post('/', async (req, res) => {
    // Uklonili smo 'adresa' i 'telefon' jer više ne postoje u bazi
    const { ime, prezime, email, sifra, uloga } = req.body;

    try {
        if (!ime || !prezime || !email || !sifra || !uloga) {
            return res.status(400).json({ error: 'Nedostaju obavezna polja' });
        }

        const hashedPassword = await bcrypt.hash(sifra, 10);
        
        const query = 'INSERT INTO korisnici (ime, prezime, email, sifra, uloga) VALUES (?, ?, ?, ?, ?)';
        const [results] = await db.query(query, [ime, prezime, email, hashedPassword, uloga]);
        
        res.status(201).json({ message: 'Korisnik uspešno dodat', userId: results.insertId });
    } catch (error) {
        // Bolje rukovanje greškom ako email već postoji
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Korisnik sa datim email-om već postoji.' });
        }
        console.error('Greška u bazi podataka:', error);
        res.status(500).json({ error: 'Greška na serveru' });
    }
});

// Endpoint za ažuriranje korisnika
router.put('/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const { ime, prezime, email, sifra } = req.body;

        const fieldsToUpdate = {};

        // Proveravamo svako polje i dodajemo ga u objekat za ažuriranje samo ako postoji
        if (ime) fieldsToUpdate.ime = ime;
        if (prezime) fieldsToUpdate.prezime = prezime;
        if (email) fieldsToUpdate.email = email;
        
        // Lozinku hešujemo samo ako je poslata nova
        if (sifra) {
            fieldsToUpdate.sifra = await bcrypt.hash(sifra, 10);
        }

        // Ako nijedno polje nije poslato za ažuriranje, vraćamo grešku
        if (Object.keys(fieldsToUpdate).length === 0) {
            return res.status(400).json({ message: 'Nema podataka za ažuriranje.' });
        }

        // Dinamički kreiramo SQL upit
        const setClauses = Object.keys(fieldsToUpdate).map(key => `${key} = ?`).join(', ');
        const queryValues = Object.values(fieldsToUpdate);

        const query = `UPDATE korisnici SET ${setClauses} WHERE id = ?`;
        queryValues.push(userId); // Dodajemo ID korisnika na kraj parametara

        const [results] = await db.query(query, queryValues);

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: `Korisnik sa ID-jem ${userId} nije pronađen.` });
        }

        res.status(200).json({ message: `Profil korisnika je uspešno ažuriran.` });

    } catch (error) {
        console.error('Database error during update:', error);
        res.status(500).json({ error: 'Greška na serveru.' });
    }
});


// Endpoint za brisanje korisnika
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const query = 'DELETE FROM korisnici WHERE id = ?';
        const [results] = await db.query(query, [userId]);

        // Proveravamo da li je red uopšte obrisan
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: `Korisnik sa ID-jem ${userId} nije pronađen.` });
        }

        res.status(200).json({ message: `Korisnik sa ID-jem ${userId} uspešno obrisan.` });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Greška na serveru' });
    }
});

module.exports = router;