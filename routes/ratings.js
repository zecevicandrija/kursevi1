const express = require('express');
const router = express.Router();
const db = require('../db');

// Endpoint za dodavanje ili ažuriranje ocene
router.post('/', async (req, res) => {
    try {
        const { korisnik_id, kurs_id, ocena } = req.body;

        if (!korisnik_id || !kurs_id || !ocena) {
            return res.status(400).json({ error: 'Nedostaju obavezna polja' });
        }
        if (ocena < 1 || ocena > 5) {
            return res.status(400).json({ error: 'Ocena mora biti između 1 i 5.' });
        }

        // 1. Proveri da li je korisnik kupio kurs
        const [kupovinaResults] = await db.query(
            'SELECT id FROM kupovina WHERE korisnik_id = ? AND kurs_id = ?',
            [korisnik_id, kurs_id]
        );

        if (kupovinaResults.length === 0) {
            return res.status(403).json({ error: 'Korisnik mora kupiti kurs pre ocenjivanja.' });
        }

        // 2. Proveri da li je korisnik već ocenio kurs
        const [existingRating] = await db.query(
            'SELECT id FROM ratings WHERE korisnik_id = ? AND kurs_id = ?',
            [korisnik_id, kurs_id]
        );

        if (existingRating.length > 0) {
            // 3a. Ako postoji, ažuriraj postojeću ocenu
            await db.query(
                'UPDATE ratings SET ocena = ? WHERE korisnik_id = ? AND kurs_id = ?',
                [ocena, korisnik_id, kurs_id]
            );
            return res.status(200).json({ message: 'Ocena je uspešno ažurirana.' });
        } else {
            // 3b. Ako ne postoji, dodaj novu ocenu
            await db.query(
                'INSERT INTO ratings (korisnik_id, kurs_id, ocena) VALUES (?, ?, ?)',
                [korisnik_id, kurs_id, ocena]
            );
            res.status(201).json({ message: 'Ocena je uspešno dodata.' });
        }

    } catch (error) {
        console.error('Greška pri rukovanju ocenom:', error);
        res.status(500).json({ error: 'Greška na serveru.' });
    }
});

// Endpoint za dobijanje prosečne ocene za kurs
router.get('/average/:kurs_id', async (req, res) => {
    try {
        const kursId = req.params.kurs_id;
        const [results] = await db.query(
            'SELECT AVG(ocena) AS averageRating FROM ratings WHERE kurs_id = ?',
            [kursId]
        );
        
        const averageRating = results[0]?.averageRating ? parseFloat(results[0].averageRating) : 0;
        res.status(200).json({ averageRating });

    } catch (error) {
        console.error('Greška pri dobavljanju prosečne ocene:', error);
        res.status(500).json({ error: 'Greška na serveru.' });
    }
});

// Endpoint za dobijanje ocene korisnika za kurs
router.get('/user/:korisnik_id/course/:kurs_id', async (req, res) => {
    try {
        const { korisnik_id, kurs_id } = req.params;

        if (!korisnik_id || !kurs_id) {
            return res.status(400).json({ error: 'Nedostaju obavezni parametri' });
        }

        const [results] = await db.query(
            'SELECT ocena FROM ratings WHERE korisnik_id = ? AND kurs_id = ?',
            [korisnik_id, kurs_id]
        );

        if (results.length > 0) {
            res.status(200).json({ ocena: results[0].ocena });
        } else {
            // Nije greška ako ocena ne postoji, samo je nema
            res.status(200).json({ ocena: null }); 
        }
    } catch (error) {
        console.error('Greška pri dobavljanju ocene korisnika:', error);
        res.status(500).json({ error: 'Greška na serveru.' });
    }
});

module.exports = router;