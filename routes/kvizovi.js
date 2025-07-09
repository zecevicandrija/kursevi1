const express = require('express');
const router = express.Router();
const db = require('../db');

// Endpoint for getting all quizzes
router.get('/', async (req, res) => {
    try {
        const query = 'SELECT * FROM kvizovi';
        const [results] = await db.query(query);
        res.status(200).json(results);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Endpoint for getting quizzes by lesson ID
router.get('/lesson/:lessonId', async (req, res) => {
    try {
        const { lessonId } = req.params;
        const query = 'SELECT * FROM kvizovi WHERE lesson_id = ?';
        const [results] = await db.query(query, [lessonId]);
        // Format results as an object with `pitanja` key, as before
        res.status(200).json({ pitanja: results });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Endpoint for adding a new quiz
router.post('/', async (req, res) => {
    try {
        const { lesson_id, question, answers, correct_answer } = req.body;

        if (!lesson_id || !question || !answers || !correct_answer) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const query = 'INSERT INTO kvizovi (lesson_id, question, answers, correct_answer) VALUES (?, ?, ?, ?)';
        const [results] = await db.query(query, [lesson_id, question, JSON.stringify(answers), correct_answer]);
        
        res.status(201).json({ message: 'Quiz added successfully', quizId: results.insertId });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Endpoint for updating an existing quiz
router.put('/:id', async (req, res) => {
    try {
        const quizId = req.params.id;
        const { lesson_id, question, answers, correct_answer } = req.body;

        if (!lesson_id || !question || !answers || !correct_answer) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const query = 'UPDATE kvizovi SET lesson_id = ?, question = ?, answers = ?, correct_answer = ? WHERE id = ?';
        const [results] = await db.query(query, [lesson_id, question, JSON.stringify(answers), correct_answer, quizId]);
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: `Quiz with ID ${quizId} not found.` });
        }
        
        res.status(200).json({ message: `Quiz with ID ${quizId} updated successfully` });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Endpoint for deleting a quiz
router.delete('/:id', async (req, res) => {
    try {
        const quizId = req.params.id;
        const query = 'DELETE FROM kvizovi WHERE id = ?';
        const [results] = await db.query(query, [quizId]);

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: `Quiz with ID ${quizId} not found.` });
        }
        
        res.status(200).json({ message: `Quiz with ID ${quizId} deleted successfully` });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;