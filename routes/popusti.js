const express = require('express');
const router = express.Router();
const db = require('../db');

// Endpoint for applying a discount code (sada je zastareo, /validate je bolji)
router.post('/apply', async (req, res) => {
    try {
        const { code } = req.body;
        const query = 'SELECT procenat FROM popusti WHERE kod = ?';
        const [results] = await db.query(query, [code]);

        if (results.length === 0) {
            return res.status(404).json({ valid: false, message: 'Kod za popust nije pronađen.' });
        }
        res.status(200).json({ valid: true, discountPercent: results[0].procenat });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Endpoint for creating a discount code
router.post('/create', async (req, res) => {
    try {
        const { code, discountPercent } = req.body;

        if (!code || discountPercent === undefined) {
            return res.status(400).json({ success: false, message: 'Sva polja su obavezna' });
        }

        const query = 'INSERT INTO popusti (kod, procenat) VALUES (?, ?)';
        await db.query(query, [code, discountPercent]);
        
        res.status(201).json({ success: true, message: 'Popust kod je uspešno kreiran.' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Ovaj kod za popust već postoji.' });
        }
        console.error('Database error:', error);
        res.status(500).json({ success: false, message: 'Greška pri kreiranju popusta' });
    }
});

// Endpoint for validating a discount code
router.post('/validate', async (req, res) => {
    try {
        const { code } = req.body;
        const query = 'SELECT * FROM popusti WHERE kod = ?';
        const [results] = await db.query(query, [code]);

        if (results.length === 0) {
            return res.json({
                valid: false,
                message: 'Neispravan kod za popust.'
            });
        }
        
        const discount = results[0];
        res.json({
            valid: true,
            discountPercent: discount.procenat,
            discountId: discount.id,
        });

    } catch (error) {
        console.error('Error validating discount code:', error);
        res.status(500).send('Internal server error');
    }
});

module.exports = router;