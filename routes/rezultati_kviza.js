const express = require('express');
const router = express.Router();
const db = require('../db');

// Route to save or update quiz results
router.post('/submit', async (req, res) => {
    try {
        const { user_id, lesson_id, quiz_id, score, total_questions } = req.body;

        if (!user_id || !lesson_id || !quiz_id || score === undefined || total_questions === undefined) {
            return res.status(400).json({ error: 'Nedostaju potrebni podaci' });
        }
        
        // Ovaj upit će ili uneti novi red, ili ažurirati postojeći ako korisnik ponovo polaže isti kviz.
        // NAPOMENA: Za ovo je potrebno da imaš UNIQUE ključ na kolonama (user_id, lesson_id, quiz_id) u bazi.
        const query = `
            INSERT INTO rezultati_kviza (user_id, lesson_id, quiz_id, score, total_questions) 
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE score = VALUES(score), total_questions = VALUES(total_questions);
        `;

        const [results] = await db.query(query, [user_id, lesson_id, quiz_id, score, total_questions]);
        
        res.status(201).json({ message: 'Rezultat kviza uspešno sačuvan', resultId: results.insertId });

    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Greška u bazi podataka' });
    }
});

// Route to get quiz result for a specific user, lesson, and quiz
router.get('/result', async (req, res) => {
    try {
        const { user_id, lesson_id, quiz_id } = req.query;

        if (!user_id || !lesson_id || !quiz_id) {
            return res.status(400).json({ error: 'Nedostaju potrebni parametri' });
        }

        const query = 'SELECT score, total_questions FROM rezultati_kviza WHERE user_id = ? AND lesson_id = ? AND quiz_id = ?';
        const [results] = await db.query(query, [user_id, lesson_id, quiz_id]);

        if (results.length > 0) {
            return res.status(200).json(results[0]);
        } else {
            return res.status(404).json({ message: 'Rezultat nije pronađen' });
        }
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Greška u bazi podataka' });
    }
});

module.exports = router;