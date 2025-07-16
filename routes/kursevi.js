const express = require('express');
const router = express.Router();
const multer = require('multer');
const db = require('../db');
const uploadToBunny = require('../utils/bunnyHelper'); // Uvozimo naš Bunny.net helper

// Multer ostaje isti
const upload = multer({ storage: multer.memoryStorage() });

// GET Svi kursevi
router.get('/', async (req, res) => {
    try {
        const query = 'SELECT * FROM kursevi';
        const [results] = await db.query(query);
        res.status(200).json(results);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Greška na serveru' });
    }
});

// GET Specifičan kurs po ID-ju
router.get('/:id', async (req, res) => {
    try {
        const courseId = req.params.id;
        const query = 'SELECT * FROM kursevi WHERE id = ?';
        const [results] = await db.query(query, [courseId]);
        if (results.length === 0) {
            return res.status(404).json({ error: 'Kurs nije pronađen' });
        }
        res.status(200).json(results[0]);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Greška na serveru' });
    }
});

// GET Kursevi po ID-ju instruktora
router.get('/instruktor/:id', async (req, res) => {
    try {
        const instructorId = req.params.id;
        const query = 'SELECT * FROM kursevi WHERE instruktor_id = ?';
        const [results] = await db.query(query, [instructorId]);
        res.status(200).json(results);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Greška na serveru' });
    }
});


// --- POST Novi kurs sa slikom ---
router.post('/', upload.single('slika'), async (req, res) => {
    try {
        const { naziv, opis, instruktor_id, cena, is_subscription, lemon_squeezy_variant_id } = req.body;

        if (!naziv || !opis || !instruktor_id || cena === undefined || !req.file) {
            return res.status(400).json({ error: 'Nedostaju obavezna polja ili slika.' });
        }

        const uniqueFileName = `slika-kursa-${Date.now()}-${req.file.originalname.replace(/\s/g, '_')}`;
        const slikaUrl = await uploadToBunny(req.file.buffer, uniqueFileName);

        const query = 'INSERT INTO kursevi (naziv, opis, instruktor_id, cena, slika, is_subscription, lemon_squeezy_variant_id) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const [dbResult] = await db.query(query, [naziv, opis, instruktor_id, cena, slikaUrl, is_subscription || 0, lemon_squeezy_variant_id]);
        
        res.status(201).json({ message: 'Kurs uspešno dodat', courseId: dbResult.insertId });
    } catch (error) {
        console.error("Greška prilikom dodavanja kursa:", error);
        res.status(500).json({ error: 'Došlo je do greške na serveru.' });
    }
});


// --- PUT Ažuriranje kursa sa (opciono) novom slikom ---
router.put('/:id', upload.single('slika'), async (req, res) => {
    try {
        const courseId = req.params.id;
        const { naziv, opis, cena, instruktor_id, is_subscription, lemon_squeezy_variant_id } = req.body;

        const fieldsToUpdate = {};
        if (naziv) fieldsToUpdate.naziv = naziv;
        if (opis) fieldsToUpdate.opis = opis;
        if (cena) fieldsToUpdate.cena = cena;
        if (instruktor_id) fieldsToUpdate.instruktor_id = instruktor_id;
        if (is_subscription !== undefined) fieldsToUpdate.is_subscription = is_subscription;
        if (lemon_squeezy_variant_id) fieldsToUpdate.lemon_squeezy_variant_id = lemon_squeezy_variant_id;

        if (req.file) {
            const uniqueFileName = `slika-kursa-${Date.now()}-${req.file.originalname.replace(/\s/g, '_')}`;
            fieldsToUpdate.slika = await uploadToBunny(req.file.buffer, uniqueFileName);
        }

        if (Object.keys(fieldsToUpdate).length === 0) {
            return res.status(400).json({ error: 'Nema polja za ažuriranje' });
        }

        const query = 'UPDATE kursevi SET ? WHERE id = ?';
        const [results] = await db.query(query, [fieldsToUpdate, courseId]);

        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Kurs nije pronađen' });
        }

        res.status(200).json({ message: 'Kurs uspešno ažuriran' });
    } catch (error) {
        console.error("Greška prilikom ažuriranja kursa:", error);
        res.status(500).json({ error: 'Došlo je do greške na serveru.' });
    }
});


// --- DELETE Brisanje kursa (ostaje isto) ---
router.delete('/:id', async (req, res) => {
    try {
        const courseId = req.params.id;
        const query = 'DELETE FROM kursevi WHERE id = ?';
        const [results] = await db.query(query, [courseId]);

        if (results.affectedRows === 0) {
            return res.status(404).json({ error: `Kurs sa ID-jem ${courseId} nije pronađen` });
        }
        res.status(200).json({ message: `Kurs sa ID-jem ${courseId} uspešno obrisan` });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Greška na serveru' });
    }
});

module.exports = router;