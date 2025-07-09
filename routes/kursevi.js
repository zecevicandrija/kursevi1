const express = require('express');
const router = express.Router();
const db = require('../db');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

// Pomoćna funkcija koja "pretvara" Cloudinary upload u Promise
const uploadToCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
            if (error) {
                return reject(error);
            }
            resolve(result);
        });
        stream.end(fileBuffer);
    });
};

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

// POST Novi kurs sa slikom
router.post('/', upload.single('slika'), async (req, res) => {
    try {
        const { naziv, opis, instruktor_id, cena, lemon_squeezy_variant_id } = req.body;

        if (!naziv || !opis || !instruktor_id || cena === undefined || !req.file) {
            return res.status(400).json({ error: 'Nedostaju obavezna polja ili slika.' });
        }

        // 1. Sačekaj da se slika otpremi na Cloudinary
        const cloudinaryResult = await uploadToCloudinary(req.file.buffer);
        const slikaUrl = cloudinaryResult.secure_url;

        // 2. Sačekaj da se podaci upišu u bazu
        const query = 'INSERT INTO kursevi (naziv, opis, instruktor_id, cena, slika, lemon_squeezy_variant_id) VALUES (?, ?, ?, ?, ?, ?)';
        const [dbResult] = await db.query(query, [naziv, opis, instruktor_id, cena, slikaUrl, lemon_squeezy_variant_id]);
        
        res.status(201).json({ message: 'Kurs uspešno dodat', courseId: dbResult.insertId });
    } catch (error) {
        console.error("Greška prilikom dodavanja kursa:", error);
        res.status(500).json({ error: 'Došlo je do greške na serveru.' });
    }
});

// PUT Ažuriranje kursa sa (opciono) novom slikom
router.put('/:id', upload.single('slika'), async (req, res) => {
    try {
        const courseId = req.params.id;
        const { naziv, opis, cena, instruktor_id, lemon_squeezy_variant_id } = req.body;

        if (!naziv && !opis && !cena && !instruktor_id && !lemon_squeezy_variant_id && !req.file) {
            return res.status(400).json({ error: 'Nema polja za ažuriranje' });
        }

        const updateFields = {};
        if (naziv) updateFields.naziv = naziv;
        if (opis) updateFields.opis = opis;
        if (cena) updateFields.cena = cena;
        if (instruktor_id) updateFields.instruktor_id = instruktor_id;
        if (lemon_squeezy_variant_id) updateFields.lemon_squeezy_variant_id = lemon_squeezy_variant_id;

        // Ako je poslata nova slika, otpremi je i dodaj URL u polja za ažuriranje
        if (req.file) {
            const cloudinaryResult = await uploadToCloudinary(req.file.buffer);
            updateFields.slika = cloudinaryResult.secure_url;
        }

        const query = 'UPDATE kursevi SET ? WHERE id = ?';
        const [results] = await db.query(query, [updateFields, courseId]);

        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Kurs nije pronađen' });
        }

        res.status(200).json({ message: 'Kurs uspešno ažuriran' });
    } catch (error) {
        console.error("Greška prilikom ažuriranja kursa:", error);
        res.status(500).json({ error: 'Došlo je do greške na serveru.' });
    }
});

// DELETE Brisanje kursa
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