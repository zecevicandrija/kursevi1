// backend/routes/placanje.js
const express = require('express');
const router = express.Router();
const { LemonsqueezyClient } = require('lemonsqueezy.ts');
const db = require('../db');

// Inicijalizacija Lemon Squeezy klijenta
const ls = new LemonsqueezyClient(process.env.LEMON_SQUEEZY_API_KEY);

router.post('/kreiraj-checkout', async (req, res) => {
    // 1. Proširili smo promenljive koje primamo iz req.body
    const { kurs_id, email, ime, prezime } = req.body;

    // 2. Ažurirali smo validaciju da proverava sva nova polja
    if (!kurs_id || !email || !ime || !prezime) {
        return res.status(400).json({ error: 'Sva polja (ID kursa, email, ime, prezime) su obavezna.' });
    }

    try {
        // Pronađi variant_id kursa u našoj bazi
        const query = 'SELECT lemon_squeezy_variant_id FROM kursevi WHERE id = ?';
        db.query(query, [kurs_id], async (err, results) => {
            if (err || results.length === 0 || !results[0].lemon_squeezy_variant_id) {
                return res.status(404).json({ error: 'Kurs ili odgovarajuća varijanta proizvoda nisu pronađeni.' });
            }

            const variantId = results[0].lemon_squeezy_variant_id;

            // Kreiraj checkout koristeći Lemon Squeezy API
            const checkout = await ls.createCheckout({
                storeId: parseInt(process.env.LEMON_SQUEEZY_STORE_ID, 10),
                variantId: parseInt(variantId, 10),
                
                // 3. Dodali smo checkout_data objekat da unapred popunimo formu
                checkout_data: {
                    email: email,
                    name: `${ime} ${prezime}`,
                },

                // Custom podaci su i dalje tu, važni su za naš webhook
                custom: {
                    kurs_id: String(kurs_id), 
                }
            });

            // Pošalji checkout URL nazad frontendu
            res.json({ url: checkout.data.attributes.url });
        });

    } catch (error) {
        console.error("Greška prilikom kreiranja checkout-a:", error);
        res.status(500).json({ error: 'Došlo je do greške na serveru.' });
    }
});

module.exports = router;