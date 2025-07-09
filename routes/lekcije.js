const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const db = require('../db');


// Cloudinary konfiguracija
cloudinary.config({
    cloud_name: 'dovqpbkx7',
    api_key: '118693182487561',
    api_secret: 'tKNo-wTaktb9giOj5Qb2ibl5qvI'
});

// Multer konfiguracija za upload
const upload = multer({ storage: multer.memoryStorage() });

// ------------------------- LEKCIJE -------------------------

// Sve lekcije
router.get('/', (req, res) => {
    db.query('SELECT * FROM lekcije', (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.status(200).json(results);
    });
});

// Lekcije po kursu
router.get('/course/:courseId', (req, res) => {
    const { courseId } = req.params;
    db.query('SELECT * FROM lekcije WHERE course_id = ?', [courseId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.status(200).json(results);
    });
});

// Dodavanje lekcije
router.post('/', upload.single('video'), async (req, res) => {
    const { course_id, title, content, section, assignment } = req.body;

    if (!course_id || !title || !content) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        let videoUrl = '';

        if (req.file) {
            const result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { resource_type: 'video' },
                    (error, result) => error ? reject(error) : resolve(result)
                );
                uploadStream.end(req.file.buffer);
            });
            videoUrl = result.secure_url;
        }

        const query = 'INSERT INTO lekcije (course_id, title, content, video_url, section, assignment) VALUES (?, ?, ?, ?, ?, ?)';
        db.query(query, [course_id, title, content, videoUrl, section, assignment || null], (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error', details: err.message });
            res.status(201).json({ message: 'Lesson added successfully', lessonId: results.insertId });
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Ažuriranje lekcije
router.put('/:id', upload.single('video'), async (req, res) => {
    const lessonId = req.params.id;
    const { course_id, title, content, section, video_url, assignment } = req.body;

    if (!course_id || !title || !content) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        let newVideoUrl = video_url;

        if (req.file) {
            const result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { resource_type: 'video' },
                    (error, result) => error ? reject(error) : resolve(result)
                );
                uploadStream.end(req.file.buffer);
            });
            newVideoUrl = result.secure_url;
        }

        const query = 'UPDATE lekcije SET course_id = ?, title = ?, content = ?, video_url = ?, section = ?, assignment = ? WHERE id = ?';
        db.query(query, [course_id, title, content, newVideoUrl, section, assignment, lessonId], (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.status(200).json({ message: `Lesson with ID ${lessonId} updated successfully` });
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Brisanje lekcije
router.delete('/:id', (req, res) => {
    const lessonId = req.params.id;
    db.query('DELETE FROM lekcije WHERE id = ?', [lessonId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.status(200).json({ message: `Lesson with ID ${lessonId} deleted successfully` });
    });
});

// Sekcije po kursu
router.get('/sections/:courseId', (req, res) => {
    const { courseId } = req.params;
    db.query('SELECT DISTINCT section FROM lekcije WHERE course_id = ?', [courseId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.status(200).json(results.map(row => row.section));
    });
});

// Broj lekcija po kursu
router.get('/count/:courseId', (req, res) => {
    const { courseId } = req.params;
    db.query('SELECT COUNT(*) AS lessonCount FROM lekcije WHERE course_id = ?', [courseId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.status(200).json({ lessonCount: results[0].lessonCount });
    });
});

// ✅ DeepSeek AI pregled koda
router.post('/deepseek-review', async (req, res) => {
    const { code, language } = req.body;
    console.log('Primljen zahtev za DeepSeek:', { code, language });

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                "Authorization": "Bearer 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",
                 'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000'
            },
            body: JSON.stringify({
                model: 'deepseek/deepseek-chat-v3-0324:free',
                messages: [
                    { role: 'system', content: 'You are a helpful code reviewer.' },
                    { role: 'user', content: `Ovo je moj kod:\n\`\`\`${language}\n${code}\n\`\`\`\nMolim te pogledaj greške i predloži poboljšanja.` }
                ],
                stream: false
            })
        });

        const data = await response.json();
        console.log('DeepSeek response:', data);
        const reply = data?.choices?.[0]?.message?.content || 'Greška u AI odgovoru.';
        res.json({ success: true, message: reply });
    } catch (err) {
        console.error('DeepSeek API error:', err);
        res.status(500).json({ success: false, error: 'Greška pri povezivanju sa DeepSeek API-jem' });
    }
});

module.exports = router;