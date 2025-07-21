// backend/routes/sekcije.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// --- PUT /api/sekcije/order - Ažuriranje redosleda sekcija ---
router.put('/order', async (req, res) => {
    try {
        const { orderedIds } = req.body; // Očekujemo niz ID-jeva: [3, 1, 2]

        if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
            return res.status(400).json({ error: 'Niz ID-jeva je neophodan.' });
        }

        const promises = orderedIds.map((id, index) => {
            const query = 'UPDATE sekcije SET redosled = ? WHERE id = ?';
            // redosled kreće od 1, a index od 0
            return db.query(query, [index + 1, id]);
        });

        await Promise.all(promises);

        res.status(200).json({ message: 'Redosled sekcija je uspešno sačuvan.' });
    } catch (error) {
        console.error('Greška pri ažuriranju redosleda:', error);
        res.status(500).json({ error: 'Greška na serveru.' });
    }
});

// --- PUT /api/sekcije/:id - Izmena naziva sekcije ---
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { naziv } = req.body;

        if (!naziv) {
            return res.status(400).json({ error: 'Naziv sekcije je obavezan.' });
        }

        const query = 'UPDATE sekcije SET naziv = ? WHERE id = ?';
        const [result] = await db.query(query, [naziv, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Sekcija nije pronađena.' });
        }

        res.status(200).json({ message: 'Naziv sekcije uspešno ažuriran.' });
    } catch (error) {
        console.error('Greška pri ažuriranju sekcije:', error);
        res.status(500).json({ error: 'Greška na serveru.' });
    }
});



// --- DELETE /api/sekcije/:id - Brisanje sekcije ---
// Upozorenje: Ovo će obrisati sekciju. Lekcije će ostati, ali će njihov `sekcija_id` biti `NULL`
// zbog `ON DELETE SET NULL` pravila koje smo definisali.
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const query = 'DELETE FROM sekcije WHERE id = ?';
        const [result] = await db.query(query, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Sekcija nije pronađena.' });
        }

        res.status(200).json({ message: 'Sekcija uspešno obrisana.' });
    } catch (error) {
        console.error('Greška pri brisanju sekcije:', error);
        res.status(500).json({ error: 'Greška na serveru.' });
    }
});



// --- POST /api/sekcije - Kreiranje nove sekcije za kurs ---
router.post('/', async (req, res) => {
    try {
        const { kurs_id, naziv } = req.body;

        if (!kurs_id || !naziv) {
            return res.status(400).json({ error: 'ID kursa i naziv sekcije su obavezni.' });
        }

        // Pronađi najveći trenutni `redosled` za dati kurs da bi novu sekciju dodali na kraj
        const [maxOrderResult] = await db.query(
            'SELECT MAX(redosled) as maxRedosled FROM sekcije WHERE kurs_id = ?',
            [kurs_id]
        );

        const noviRedosled = (maxOrderResult[0].maxRedosled || 0) + 1;

        // Ubaci novu sekciju u bazu
        const query = 'INSERT INTO sekcije (kurs_id, naziv, redosled) VALUES (?, ?, ?)';
        const [result] = await db.query(query, [kurs_id, naziv, noviRedosled]);

        res.status(201).json({ message: 'Sekcija je uspešno kreirana.', insertId: result.insertId });

    } catch (error) {
        console.error('Greška pri kreiranju sekcije:', error);
        res.status(500).json({ error: 'Greška na serveru.' });
    }
});

module.exports = router;