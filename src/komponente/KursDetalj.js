// src/components/KursDetalj.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../login/api.js';                 // <- promenjeno
import { useAuth } from '../login/auth.js';
import ReactStars from 'react-stars';
import './KursDetalj.css';
import Komentari from '../Instruktori/Komentari.js';
import PrikazKviza from './PrikazKviza.js';
import Editor from '@monaco-editor/react';
import ReactPlayer from 'react-player';
import Hls from 'hls.js';

if (typeof window !== "undefined" && !window.Hls) {
  window.Hls = Hls;
}

const PlayIcon = () => <i className="icon-play"></i>;
const AssignmentIcon = () => <i className="icon-assignment"></i>;
const HeartIcon = ({ filled }) => <i className={filled ? "icon-heart-filled" : "icon-heart"}></i>;


const KursDetalj = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [kurs, setKurs] = useState(null);
    const [lekcije, setLekcije] = useState([]);
    const [otvorenaLekcija, setOtvorenaLekcija] = useState(null);
    const [wishlisted, setWishlisted] = useState(false);
    const [kupioKurs, setKupioKurs] = useState(false);
    const [rating, setRating] = useState(0);
    const [currentVideoUrl, setCurrentVideoUrl] = useState('');
    const [currentContent, setCurrentContent] = useState('');
    const [completedLessons, setCompletedLessons] = useState(new Set());
    const [quiz, setQuiz] = useState([]);
    const [code, setCode] = useState('// Unesite svoj kod ovde');
    const [language, setLanguage] = useState('javascript');
    const [showEditor, setShowEditor] = useState(false);
    const [savedCodes, setSavedCodes] = useState({});
    const [reviewFeedback, setReviewFeedback] = useState(null);
    const [activeSection, setActiveSection] = useState(null);
    const [currentStreamUrl, setCurrentStreamUrl] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const kursResponse      = await api.get(`/api/kursevi/${id}`);
                setKurs(kursResponse.data);

                const lekcijeResponse   = await api.get(`/api/lekcije/course/${id}`);
                setLekcije(lekcijeResponse.data);

                if (lekcijeResponse.data.length) {
                    const firstSection = lekcijeResponse.data.reduce((a, l) => a || l.section, '');
                    setActiveSection(firstSection);
                }

                if (user) {
                    const kupovinaResponse = await api.get(`/api/kupovina/user/${user.id}`);
                    const purchased        = kupovinaResponse.data.find(c => c.id === +id);
                    setKupioKurs(!!purchased);

                    if (purchased) {
                        try {
                            const ratingResponse = await api.get(`/api/ratings/user/${user.id}/course/${id}`);
                            setRating(ratingResponse.data.ocena || 0);
                        } catch { /* nema ocene */ }
                    }

                    const completedResponse = await api.get(`/api/kompletirane_lekcije/user/${user.id}/course/${id}`);
                    setCompletedLessons(new Set(completedResponse.data.map(l => l.lekcija_id)));

                    const wishlistResponse = await api.get(`/api/wishlist/check`, {
                        params: { korisnik_id: user.id, kurs_id: id }
                    });
                    setWishlisted(wishlistResponse.data.exists);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchData();
    }, [id, user]);

    /* ---------- preostale funkcije ---------- */

    const handleCompletionToggle = async (lessonId) => {
        if (!user) return;
        const updated = new Set(completedLessons);
        updated.has(lessonId) ? updated.delete(lessonId) : updated.add(lessonId);
        setCompletedLessons(updated);

        try {
            await api.post('/api/kompletirane_lekcije', {
                korisnik_id: user.id,
                kurs_id: id,
                lekcija_id: lessonId,
                completed: updated.has(lessonId)
            });
        } catch (err) {
            console.error(err);
        }
    };

    const handleLessonClick = async (lekcijaId) => {
        if (!kupioKurs) return;
        const lekcija = lekcije.find(l => l.id === lekcijaId);
        if (!lekcija) return;

        setOtvorenaLekcija(lekcija);
        setCurrentStreamUrl('');
        //setCurrentVideoUrl(lekcija.video_url);
        //setCurrentContent(lekcija.content);
        setReviewFeedback(null);

        if (lekcija.video_url) {
        try {
            const response = await api.get(`/api/lekcije/${lekcija.id}/stream`);
            console.log("STREAM ENDPOINT VRAĆA:", response.data.url);
            setCurrentStreamUrl(response.data.url);
            
        } catch (error) {
            console.error("Greška pri dohvatanju video linka:", error);
            alert("Nije moguće učitati video.");
            setCurrentStreamUrl('error');
        }
    }

        await fetchQuiz(lekcijaId);

        if (lekcija.assignment) {
            setShowEditor(true);
            determineLanguage(lekcija.assignment);
            setCode(savedCodes[lekcijaId] || getDefaultCode(language));
        } else {
            setShowEditor(false);
        }
    };

    const fetchQuiz = async (lessonId) => {
        try {
            const { data } = await api.get(`/api/kvizovi/lesson/${lessonId}`);
            const parsed = data.pitanja.map(p => ({
                ...p,
                answers: Array.isArray(p.answers) ? p.answers : JSON.parse(p.answers)
            }));
            setQuiz(parsed);
        } catch (e) {
            console.error(e);
        }
    };

    const determineLanguage = (assignment) => {
        const text = assignment.toLowerCase();
        if (text.includes('react') || text.includes('jsx')) setLanguage('javascript');
        else if (text.includes('html')) setLanguage('html');
        else if (text.includes('css')) setLanguage('css');
        else setLanguage('javascript');
    };

    const getDefaultCode = (lang) => {
        switch (lang) {
            case 'html':
                return '<!DOCTYPE html>\n<html>\n<head>\n  <title>Page Title</title>\n</head>\n<body>\n\n</body>\n</html>';
            case 'css':
                return '/* Add your CSS here */\nbody {\n  margin: 0;\n  padding: 0;\n}';
            default:
                return '// Unesite svoj JavaScript kod ovde';
        }
    };

    const handleSaveCode = async () => {
        if (!otvorenaLekcija?.id || !user) return;
        try {
            await api.post('/api/saved-codes', {
                user_id: user.id,
                lesson_id: otvorenaLekcija.id,
                code,
                language
            });
            setSavedCodes({ ...savedCodes, [otvorenaLekcija.id]: code });
            alert('Kod je uspešno sačuvan!');
        } catch {
            alert('Došlo je do greške pri čuvanju koda');
        }
    };

    const handleWishlistToggle = async () => {
        if (!user) return;
        try {
            if (wishlisted) {
                await api.delete('/api/wishlist', { data: { korisnik_id: user.id, kurs_id: id } });
                setWishlisted(false);
            } else {
                await api.post('/api/wishlist', { korisnik_id: user.id, kurs_id: id });
                setWishlisted(true);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddToCart = () => {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        if (!cart.find(c => c.id === kurs.id)) {
            localStorage.setItem('cart', JSON.stringify([...cart, kurs]));
            window.dispatchEvent(new Event('cart-updated'));
        }
        navigate('/korpa');
    };

    const handleRatingSubmit = async () => {
        if (!user || !kupioKurs || !rating) return;
        try {
            await api.post('/api/ratings', { korisnik_id: user.id, kurs_id: id, ocena: rating });
            alert('Uspešno ste ocenili kurs!');
        } catch {
            alert('Došlo je do greške pri ocenjivanju');
        }
    };

    const handleReviewCode = async () => {
        try {
            const { data } = await api.post('/api/lekcije/deepseek-review', { code, language });
            if (data.success) setReviewFeedback({ message: data.message });
            else setReviewFeedback({ message: 'AI nije vratio validan odgovor.', error: data.error });
        } catch (error) {
            setReviewFeedback({ message: 'Greška pri proveri koda.', error: error.message });
        }
    };

    /* ---------- render ---------- */

    const groupedLessons = lekcije.reduce((acc, l) => {
        (acc[l.section] ||= []).push(l);
        return acc;
    }, {});

    if (!kurs) return <div className="loading">Učitavanje...</div>;

    return (
    <div className="course-detail-page">
        {/* Zaglavlje ostaje isto */}
        <div className="course-header">
            <div className="header-content">
                <h1 className="course-title-header">{kurs.naziv}</h1>
                <p className="course-subtitle">{kurs.opis}</p>
                <p className="course-meta-header">
                   Kreirano: {new Date(kurs.created_at).toLocaleDateString()}
                </p>
            </div>
        </div>

        {/* ===== NOVI RASPORED - Leva i Desna kolona ===== */}
        <div className="course-layout-wrapper">

            {/* --- LEVA KOLONA (Sidebar) --- */}
            <aside className="sidebar-left">
                <div className="sidebar-sticky-content">
                    {/* Kartica za akcije i ocene */}
                    <div className="course-actions-card">
                        {!kupioKurs ? (
                            <>
                                <div className="price-tag">{kurs.cena} RSD</div>
                                <button onClick={handleAddToCart} className="btn btn-purchase">Dodaj u korpu</button>
                                <button onClick={handleWishlistToggle} className="btn btn-wishlist">
                                    <HeartIcon filled={wishlisted} />
                                    {wishlisted ? 'Ukloni iz liste želja' : 'Dodaj u listu želja'}
                                </button>
                            </>
                        ) : (
                            <div className="rating-section">
                                <h4>Ocenite kurs</h4>
                                <ReactStars
                                    count={5}
                                    value={rating}
                                    onChange={setRating}
                                    size={30}
                                    color2="#ffd700"
                                />
                                <button
                                    onClick={handleRatingSubmit}
                                    className="btn btn-primary"
                                    disabled={!rating}
                                >
                                    Pošalji ocenu
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Kartica sa listom lekcija */}
                    <div className="lessons-list-card">
                        <h4>Sadržaj kursa</h4>
                        {Object.keys(groupedLessons).map(section => (
                            <div key={section} className="lesson-section">
                                <h5
                                    className="section-header"
                                    onClick={() => setActiveSection(activeSection === section ? null : section)}
                                >
                                    {section}
                                    <span className={`chevron ${activeSection === section ? 'expanded' : ''}`} />
                                </h5>
                                {activeSection === section && (
                                    <ul className="lessons-list">
                                        {groupedLessons[section].map(lekcija => (
                                            <li
                                                key={lekcija.id}
                                                className={`lesson-item ${otvorenaLekcija?.id === lekcija.id ? 'active' : ''} ${!kupioKurs ? 'disabled' : ''}`}
                                                onClick={() => kupioKurs && handleLessonClick(lekcija.id)}
                                            >
                                                <div className="lesson-item-title">
                                                    {lekcija.assignment ? <AssignmentIcon /> : <PlayIcon />}
                                                    <span>{lekcija.title}</span>
                                                </div>
                                                {kupioKurs && (
                                                    <input
                                                        type="checkbox"
                                                        checked={completedLessons.has(lekcija.id)}
                                                        onChange={e => {
                                                            e.stopPropagation();
                                                            handleCompletionToggle(lekcija.id);
                                                        }}
                                                        title="Označi kao završeno"
                                                        className="lesson-complete-checkbox"
                                                    />
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </aside>

           {/* --- DESNA KOLONA (Glavni sadržaj) --- */}
<div className="main-content-right">
    
    {/* Prikaz videa ili thumbnail-a (Ovaj deo je bio u redu) */}
    <div className="content-display-area">
        {kupioKurs && otvorenaLekcija ? (
            <div className="lesson-player-card">
                <h3>{otvorenaLekcija.title}</h3>
                {otvorenaLekcija.video_url && (
                    <div className='player-wrapper'>
                        {!currentStreamUrl && <div className="player-placeholder">Učitavanje videa...</div>}
                        {currentStreamUrl === 'error' && <div className="player-placeholder">Greška pri učitavanju videa.</div>}
                        {currentStreamUrl && currentStreamUrl !== 'error' && (
                            <iframe
                                src={currentStreamUrl}
                                allowTransparency="true"
                                loading="lazy"
                                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                                allowFullScreen={true}
                                style={{
      aspectRatio: 2,
      border: 'none',
      display: 'block',
    }}
                            ></iframe>
                        )}
                    </div>
                )}
                <p className="lesson-content-text">{otvorenaLekcija.content}</p>
            </div>
        ) : (
            <div className="course-thumbnail-wrapper">
            </div>
        )}
    </div>

    {/* === VRAĆENE SEKCIJE ISPOD VIDEA === */}

    {/* Zadatak i Code Editor - prikazuje se samo ako lekcija postoji i ima zadatak */}
    {kupioKurs && otvorenaLekcija && otvorenaLekcija.assignment && (
        <div className="assignment-card">
            <h3>Zadatak</h3>
            <p className="assignment-text">{otvorenaLekcija.assignment}</p>
            {showEditor && (
                <div className="code-editor-wrapper">
                     <div className="editor-header">
                         <h4>Code Editor</h4>
                         <select value={language} onChange={e => setLanguage(e.target.value)}>
                             <option value="javascript">JavaScript</option>
                             <option value="html">HTML</option>
                             <option value="css">CSS</option>
                         </select>
                     </div>
                     <Editor
                         height="400px"
                         language={language}
                         theme="vs-dark"
                         value={code}
                         onChange={setCode}
                         options={{ minimap: { enabled: false }, fontSize: 14, wordWrap: 'on' }}
                     />
                     <div className="editor-actions">
                         <button className="btn btn-secondary" onClick={handleSaveCode}>Sačuvaj Kod</button>
                         <button className="btn btn-primary" onClick={handleReviewCode}>Proveri Kod (AI)</button>
                         <button className="btn btn-success" onClick={() => alert('Run Code')}>Pokreni Kod</button>
                     </div>
                     {reviewFeedback && (
                         <div className="ai-feedback">
                             <h4>AI Povratna Informacija:</h4>
                             <pre>{reviewFeedback.message}</pre>
                         </div>
                     )}
                </div>
            )}
        </div>
    )}
    
    {/* Prikaz Kviza - prikazuje se samo ako lekcija postoji i ima kviz */}
    {kupioKurs && otvorenaLekcija && quiz && quiz.length > 0 && (
         <PrikazKviza quizData={quiz} />
    )}

    {/* Komentari - prikazuju se uvek za dati kurs */}
    {/* <Komentari kursId={id} kupioKurs={kupioKurs} /> */}
</div>
        </div>
    </div>
);
};

export default KursDetalj;