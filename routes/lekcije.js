const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const db = require('../db');

// Multer konfiguracija ostaje ista
const upload = multer({ storage: multer.memoryStorage() });

// Pomoćna funkcija koja "pretvara" Cloudinary upload u Promise
const uploadToCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ resource_type: 'video' }, (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
        stream.end(fileBuffer);
    });
};

// GET Sve lekcije
router.get('/', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM lekcije');
        res.status(200).json(results);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// GET Lekcije po kursu
router.get('/course/:courseId', async (req, res) => {
    try {
        const { courseId } = req.params;
        const [results] = await db.query('SELECT * FROM lekcije WHERE course_id = ?', [courseId]);
        res.status(200).json(results);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// POST Dodavanje lekcije
router.post('/', upload.single('video'), async (req, res) => {
    try {
        const { course_id, title, content, section, assignment } = req.body;

        if (!course_id || !title || !content) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        let videoUrl = '';
        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer);
            videoUrl = result.secure_url;
        }

        const query = 'INSERT INTO lekcije (course_id, title, content, video_url, section, assignment) VALUES (?, ?, ?, ?, ?, ?)';
        const [results] = await db.query(query, [course_id, title, content, videoUrl, section, assignment || null]);
        
        res.status(201).json({ message: 'Lesson added successfully', lessonId: results.insertId });
    } catch (error) {
        console.error('Error adding lesson:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// PUT Ažuriranje lekcije
router.put('/:id', upload.single('video'), async (req, res) => {
    try {
        const lessonId = req.params.id;
        const { course_id, title, content, section, video_url, assignment } = req.body;

        if (!course_id || !title || !content) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        let newVideoUrl = video_url || ''; // Ako se stari URL obriše na frontendu

        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer);
            newVideoUrl = result.secure_url;
        }

        const query = 'UPDATE lekcije SET course_id = ?, title = ?, content = ?, video_url = ?, section = ?, assignment = ? WHERE id = ?';
        const [results] = await db.query(query, [course_id, title, content, newVideoUrl, section, assignment, lessonId]);
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: `Lesson with ID ${lessonId} not found.` });
        }
        
        res.status(200).json({ message: `Lesson with ID ${lessonId} updated successfully` });
    } catch (error) {
        console.error('Error updating lesson:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE Brisanje lekcije
router.delete('/:id', async (req, res) => {
    try {
        const lessonId = req.params.id;
        const [results] = await db.query('DELETE FROM lekcije WHERE id = ?', [lessonId]);
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: `Lesson with ID ${lessonId} not found.` });
        }

        res.status(200).json({ message: `Lesson with ID ${lessonId} deleted successfully` });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// GET Sekcije po kursu
router.get('/sections/:courseId', async (req, res) => {
    try {
        const { courseId } = req.params;
        const [results] = await db.query('SELECT DISTINCT section FROM lekcije WHERE course_id = ? ORDER BY section ASC', [courseId]);
        res.status(200).json(results.map(row => row.section));
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// GET Broj lekcija po kursu
router.get('/count/:courseId', async (req, res) => {
    try {
        const { courseId } = req.params;
        const [results] = await db.query('SELECT COUNT(*) AS lessonCount FROM lekcije WHERE course_id = ?', [courseId]);
        res.status(200).json({ lessonCount: results[0].lessonCount });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// DeepSeek AI ruta - NIJE POTREBNA IZMENA
router.post('/deepseek-review', async (req, res) => {
    const { code, language } = req.body;

    try {
        // Ovaj deo koda ne koristi našu bazu, već poziva spoljni API
        // i već je ispravno napisan koristeći async/await.
        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${process.env.DEEPSEEK_KEY}`, // Koristimo .env varijablu
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: 'You are a helpful code reviewer. Provide feedback in Serbian.' },
                    { role: 'user', content: `Ovo je moj kod:\n\`\`\`${language}\n${code}\n\`\`\`\nMolim te pogledaj greške i predloži poboljšanja.` }
                ],
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('DeepSeek API error response:', errorBody);
            throw new Error(`DeepSeek API returned status ${response.status}`);
        }

        const data = await response.json();
        const reply = data?.choices?.[0]?.message?.content || 'Greška u AI odgovoru.';
        res.json({ success: true, message: reply });
    } catch (err) {
        console.error('DeepSeek API error:', err);
        res.status(500).json({ success: false, error: 'Greška pri povezivanju sa DeepSeek API-jem' });
    }
});

module.exports = router;