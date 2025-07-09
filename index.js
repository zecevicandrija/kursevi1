require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const db = require('./db');
const authRouter = require('./routes/auth');
const korisniciRouter = require('./routes/korisnici'); 
const kurseviRouter = require('./routes/kursevi');
const lekcijeRouter = require('./routes/lekcije');
const wishlistRouter = require('./routes/wishlist');
const kupovinaRouter = require('./routes/kupovina');
const ratingsRouter = require('./routes/ratings');
const komentariRouter = require('./routes/komentari');
const kompletirane_lekcijeRouter = require('./routes/kompletirane_lekcije');
const popustiRouter = require('./routes/popusti');
const kvizoviRouter = require('./routes/kvizovi');
const rezultatiKvizaRouter = require('./routes/rezultati_kviza');
const placanjeRouter = require('./routes/placanje');
const webhooksRouter = require('./routes/webhooks');

const app = express();
const port = process.env.PORT || 3306;

// Cloudinary konfiguracija
cloudinary.config({
  cloud_name: 'dovqpbkx7',
  api_key: '118693182487561',
  api_secret: 'tKno-wTaktb9giOj5Qb2ibl5qvI',
  api_environment_variable: 'CLOUDINARY_URL=cloudinary://118693182487561:tKno-wTaktb9giOj5Qb2ibl5qvI@dovqpbkx7'
});

// Middleware
app.use('/api/webhooks', webhooksRouter);
// Definišemo listu dozvoljenih adresa
const allowedOrigins = [
    'https://learningplatform1.netlify.app',
    'https://learningplatform1.netlify.app/' // Dodajemo i verziju sa kosom crtom
];

app.use(cors({
    origin: function (origin, callback) {
        // Dozvoli zahteve koji nemaju origin (npr. Postman, mobilne aplikacije)
        if (!origin) return callback(null, true);

        // Proveri da li je dolazeći origin na našoj listi dozvoljenih
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        
        return callback(null, true);
    }
}));
app.use(bodyParser.json());


const upload = multer({ storage: multer.memoryStorage() });

// Database connection
// db.connect((err) => {
//     if (err) throw err;
//     console.log('Connected to MySQL database');
// });

// Routes
app.use('/api/auth', authRouter);
app.use('/api/korisnici', korisniciRouter);
app.use('/api/kursevi', kurseviRouter);
app.use('/api/lekcije', lekcijeRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/kupovina', kupovinaRouter);
app.use('/api/ratings', ratingsRouter);
app.use('/api/komentari', komentariRouter);
app.use('/api/kompletirane_lekcije', kompletirane_lekcijeRouter);
app.use('/api/popusti', popustiRouter);
app.use('/api/kvizovi', kvizoviRouter);
app.use('/api/rezultati_kviza', rezultatiKvizaRouter);
app.use('/api/placanje', placanjeRouter);


// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
