const express = require('express');
const router = express.Router();
const db = require('../db');

// Endpoint za dobavljanje završenih lekcija po korisniku
router.get('/korisnik/:korisnikId', async (req, res) => {
    try {
        const korisnikId = req.params.korisnikId;
        const query = 'SELECT * FROM kompletirane_lekcije WHERE korisnik_id = ?';
        const [results] = await db.query(query, [korisnikId]);
        res.status(200).json(results);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Endpoint za dodavanje nove završenog lekcije
router.post('/', async (req, res) => {
    try {
        const { korisnik_id, kurs_id, lekcija_id } = req.body;

        if (!korisnik_id || !kurs_id || !lekcija_id) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Provera da li je lekcija već kompletirana da se ne duplira unos
        const checkQuery = 'SELECT id FROM kompletirane_lekcije WHERE korisnik_id = ? AND lekcija_id = ?';
        const [existing] = await db.query(checkQuery, [korisnik_id, lekcija_id]);

        if (existing.length > 0) {
            return res.status(409).json({ message: 'Lekcija je već obeležena kao završena.' });
        }

        const insertQuery = 'INSERT INTO kompletirane_lekcije (korisnik_id, kurs_id, lekcija_id) VALUES (?, ?, ?)';
        const [results] = await db.query(insertQuery, [korisnik_id, kurs_id, lekcija_id]);
        
        res.status(201).json({ message: 'Lekcija uspešno dodata', kompletiranaLekcijaId: results.insertId });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Endpoint za brisanje završenih lekcija po ID-u
router.delete('/:id', async (req, res) => {
    try {
        const kompletiranaLekcijaId = req.params.id;
        const query = 'DELETE FROM kompletirane_lekcije WHERE id = ?';
        const [results] = await db.query(query, [kompletiranaLekcijaId]);

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: `Kompletirana lekcija sa ID-jem ${kompletiranaLekcijaId} nije pronađena.` });
        }

        res.status(200).json({ message: `Kompletirana lekcija sa ID-jem ${kompletiranaLekcijaId} uspešno obrisana` });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Endpoint za dobavljanje završenih lekcija po korisniku i kursu
router.get('/user/:korisnikId/course/:kursId', async (req, res) => {
    try {
        const { korisnikId, kursId } = req.params;
        const query = 'SELECT lekcija_id FROM kompletirane_lekcije WHERE korisnik_id = ? AND kurs_id = ?';
        const [results] = await db.query(query, [korisnikId, kursId]);
        // Vraćamo samo niz ID-jeva lekcija radi efikasnosti na frontendu
        const lekcijeIds = results.map(item => item.lekcija_id);
        res.status(200).json(lekcijeIds);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;