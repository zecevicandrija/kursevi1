import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth';
import api from './api';
import './MojProfil.css';

const MojProfil = () => {
    const { user, logout, setUser: setAuthUser } = useAuth();
    
    const [formData, setFormData] = useState({
        ime: '',
        prezime: '',
        email: '',
        currentPassword: '',
        newPassword: ''
    });

    const [wishlist, setWishlist] = useState([]);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const fetchWishlist = useCallback(async () => {
        if (user) {
            try {
                const response = await api.get(`/api/wishlist/${user.id}`);
                setWishlist(response.data);
            } catch (error) {
                console.error('Greška pri dohvatanju liste želja:', error);
            }
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            setFormData({
                ime: user.ime || '',
                prezime: user.prezime || '',
                email: user.email || '',
                currentPassword: '',
                newPassword: ''
            });
            fetchWishlist();
        }
    }, [user, fetchWishlist]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        try {
            // Ažuriranje osnovnih podataka
            const profileUpdateData = {
                ime: formData.ime,
                prezime: formData.prezime,
                email: formData.email,
            };
            await api.put(`/api/korisnici/${user.id}`, profileUpdateData);

            // Ažuriranje lozinke samo ako su polja popunjena
            if (formData.currentPassword && formData.newPassword) {
                await api.post('/api/auth/change-password', {
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword
                });
            }

            const response = await api.get('/api/auth/me');
            setAuthUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));

            setMessage('Profil je uspešno ažuriran!');
            setFormData(prevState => ({ ...prevState, currentPassword: '', newPassword: '' }));

        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Došlo je do greške.';
            setMessage(errorMessage);
            console.error("Greška prilikom ažuriranja profila:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveFromWishlist = async (kursId) => {
        try {
            await api.delete('/api/wishlist', {
                data: { korisnik_id: user.id, kurs_id: kursId }
            });
            setWishlist(prevWishlist => prevWishlist.filter(item => item.kurs_id !== kursId));
        } catch (error) {
            console.error('Greška pri brisanju iz liste želja:', error);
        }
    };
    
    if (!user) {
        return <div className="profil-container"><p>Molimo vas da se ulogujete.</p></div>;
    }

    return (
        <div className="profil-container">
            <div className="profil-content-wrapper">
                {/* --- Leva Kartica - Profil --- */}
                <div className="profil-card">
                    <h2 className="profil-header">Moj Profil</h2>
                    <form onSubmit={handleSubmit} className="profil-form">
                        <div className="profil-form-group">
                            <label htmlFor="ime">Ime</label>
                            <input id="ime" name="ime" type="text" value={formData.ime} onChange={handleInputChange} required />
                        </div>
                        <div className="profil-form-group">
                            <label htmlFor="prezime">Prezime</label>
                            <input id="prezime" name="prezime" type="text" value={formData.prezime} onChange={handleInputChange} required />
                        </div>
                        <div className="profil-form-group">
                            <label htmlFor="email">Email</label>
                            <input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
                        </div>
                        
                        <hr className="profil-divider" />
                        
                        <h3 className="profil-subheader">Promena Lozinke</h3>
                        
                        <div className="profil-form-group">
                            <label htmlFor="currentPassword">Trenutna Lozinka</label>
                            <input id="currentPassword" name="currentPassword" type="password" value={formData.currentPassword} onChange={handleInputChange} placeholder="Unesite za promenu lozinke" />
                        </div>
                        <div className="profil-form-group">
                            <label htmlFor="newPassword">Nova Lozinka</label>
                            <input id="newPassword" name="newPassword" type="password" value={formData.newPassword} onChange={handleInputChange} placeholder="Unesite novu lozinku" />
                        </div>
                        
                        {message && <p className="profil-message">{message}</p>}
                        
                        <button type="submit" className="profil-submit-btn" disabled={isLoading}>
                            {isLoading ? 'Ažuriranje...' : 'Sačuvaj Promene'}
                        </button>
                    </form>
                </div>

                {/* --- Desna Kartica - Wishlist --- */}
                <div className="wishlist-card">
                    <h2 className="profil-header">Lista Želja</h2>
                    {wishlist.length > 0 ? (
                        <ul className="wishlist-list">
                            {wishlist.map(item => (
                                <li key={item.kurs_id} className="wishlist-item">
                                    <span className="wishlist-item-name">{item.naziv}</span>
                                    <button onClick={() => handleRemoveFromWishlist(item.kurs_id)} className="wishlist-remove-btn">Ukloni</button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="wishlist-empty">Vaša lista želja je prazna.</p>
                    )}
                </div>
            </div>
            <button onClick={logout} className="profil-logout-btn">Odjavi se</button>
        </div>
    );
};

export default MojProfil;