import React, { useState } from 'react';
import api from '../login/api';
import './Popust.css';

const Popust = () => {
    const [discountCode, setDiscountCode] = useState('');
    const [discountPercent, setDiscountPercent] = useState('');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false); // Stanje za praćenje da li je poruka greška

    const createDiscount = async () => {
        // Resetujemo poruke pre svakog slanja
        setMessage('');
        setIsError(false);

        if (!discountCode || !discountPercent) {
            setMessage('Oba polja su obavezna.');
            setIsError(true);
            return;
        }

        try {
            const response = await api.post('/api/popusti/create', {
                code: discountCode,
                discountPercent: Number(discountPercent),
            });

            if (response.data.success) {
                setMessage('Kod popusta je uspešno kreiran!');
                setIsError(false);
                setDiscountCode('');
                setDiscountPercent('');
            }
        } catch (err) {
            // Prikazujemo poruku o grešci koju nam pošalje backend
            const errorMessage = err.response?.data?.message || 'Greška prilikom kreiranja koda popusta.';
            setMessage(errorMessage);
            setIsError(true);
            console.error('Detalji greške:', err);
        }
    };

    return (
        <div className="popust-container">
            <h3 className="popust-title">Kreiraj Popust Kod</h3>
            <div className="popust-form">
                <input 
                    type="text" 
                    className="popust-input" 
                    placeholder="Unesite kod" 
                    value={discountCode} 
                    onChange={(e) => setDiscountCode(e.target.value)} 
                />
                <input 
                    type="number" 
                    className="popust-input" 
                    placeholder="Unesite procenat (npr. 20)" 
                    value={discountPercent} 
                    onChange={(e) => setDiscountPercent(e.target.value)} 
                />
                <button className="popust-dugme" onClick={createDiscount}>Kreiraj</button>
            </div>
            {/* Poruka se prikazuje samo ako postoji, sa odgovarajućom bojom */}
            {message && (
                <p className={`popust-message ${isError ? 'error' : 'success'}`}>
                    {message}
                </p>
            )}
        </div>
    );
};

export default Popust;