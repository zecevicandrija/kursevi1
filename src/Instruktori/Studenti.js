import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../login/api'; // Koristimo naš centralizovani API klijent
import './Studenti.css';

const Studenti = () => {
    const [studenti, setStudenti] = useState([]);
    const [kursNaziv, setKursNaziv] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const { kursId } = useParams();
    const navigate = useNavigate();

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            // Paralelno dohvatamo i listu studenata i ime kursa
            const [studentiResponse, kursResponse] = await Promise.all([
                api.get(`/api/kupovina/studenti/${kursId}`),
                api.get(`/api/kursevi/${kursId}`)
            ]);

            setStudenti(studentiResponse.data);
            setKursNaziv(kursResponse.data.naziv);

        } catch (error) {
            console.error('Greška pri dohvatanju podataka:', error);
        } finally {
            setIsLoading(false);
        }
    }, [kursId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredStudenti = studenti.filter(student =>
        student.ime.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.prezime.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return <div className="studenti-container"><h2>Učitavanje...</h2></div>;
    }

    return (
        <div className="studenti-container">
            <button onClick={() => navigate('/instruktor')} className="back-button-studenti">← Nazad na Tablu</button>
            <h2 className="studenti-title">
                Studenti na kursu: <span>{kursNaziv}</span>
            </h2>
            <div className="search-wrapper">
                <input 
                    type="text"
                    placeholder="Pretraži po imenu, prezimenu ili email-u"
                    className="studenti-search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            {filteredStudenti.length > 0 ? (
                <ul className="studenti-list">
                    <li className="student-item header">
                        <span className="student-name">Ime i Prezime</span>
                        <span className="student-email">Email</span>
                        <span className="student-date">Datum Kupovine</span>
                    </li>
                    {filteredStudenti.map(student => (
                        <li key={student.student_id} className="student-item">
                            <span className="student-name">{student.ime} {student.prezime}</span>
                            <span className="student-email">{student.email}</span>
                            <span className="student-date">{new Date(student.datum_kupovine).toLocaleDateString()}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="no-students">Nema studenata koji odgovaraju pretrazi.</p>
            )}
        </div>
    );
};

export default Studenti;