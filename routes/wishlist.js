const express = require('express');
const router = express.Router();
const db = require('../db');

// Endpoint za dodavanje kursa u listu želja
router.post('/', async (req, res) => {
    try {
        const { korisnik_id, kurs_id } = req.body;
        if (!korisnik_id || !kurs_id) {
            return res.status(400).json({ error: 'Nedostaju obavezna polja.' });
        }
        const query = 'INSERT INTO wishlist (korisnik_id, kurs_id) VALUES (?, ?)';
        await db.query(query, [korisnik_id, kurs_id]);
        res.status(201).json({ message: 'Kurs uspešno dodat u listu želja.' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Ovaj kurs je već u listi želja.' });
        }
        console.error('Database error:', error);
        res.status(500).json({ error: 'Greška na serveru.' });
    }
});

// Endpoint za dohvatanje liste želja korisnika
router.get('/:korisnik_id', async (req, res) => {
    try {
        const korisnikId = req.params.korisnik_id;
        const query = `
            SELECT w.kurs_id, k.naziv, k.slika
            FROM wishlist w
            JOIN kursevi k ON w.kurs_id = k.id
            WHERE w.korisnik_id = ?
        `;
        const [results] = await db.query(query, [korisnikId]);
        res.status(200).json(results);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Greška na serveru.' });
    }
});

// Endpoint za brisanje kursa iz liste želja
router.delete('/', async (req, res) => {
    try {
        const { korisnik_id, kurs_id } = req.body;
        if (!korisnik_id || !kurs_id) {
            return res.status(400).json({ error: 'Nedostaju obavezna polja.' });
        }
        const query = 'DELETE FROM wishlist WHERE korisnik_id = ? AND kurs_id = ?';
        const [results] = await db.query(query, [korisnik_id, kurs_id]);
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Stavka nije pronađena u listi želja.' });
        }
        res.status(200).json({ message: 'Kurs uspešno uklonjen iz liste želja.' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Greška na serveru.' });
    }
});

module.exports = router;