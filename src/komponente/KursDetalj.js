import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../login/auth.js';
import ReactStars from 'react-stars';
import './KursDetalj.css'; // Obavezno koristite novi CSS
import Komentari from '../Instruktori/Komentari.js';
import PrikazKviza from './PrikazKviza.js';
import Editor from '@monaco-editor/react';

// Pretpostavimo da imate ove ikonice, ili ih zamenite sa react-icons
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


    useEffect(() => {
        const fetchData = async () => {
            try {
                const kursResponse = await axios.get(`https://horses-1.onrender.com/api/kursevi/${id}`);
                setKurs(kursResponse.data);

                const lekcijeResponse = await axios.get(`https://horses-1.onrender.com/api/lekcije/course/${id}`);
                setLekcije(lekcijeResponse.data);
                // Set first section as active by default
                if (lekcijeResponse.data.length > 0) {
                    // Group lessons to find the first section name
                    const firstSectionName = lekcijeResponse.data.reduce((acc, lekcija) => {
                        if (!acc) acc = lekcija.section;
                        return acc;
                    }, '');
                    setActiveSection(firstSectionName);
                }


                if (user) {
                    const kupovinaResponse = await axios.get(`https://horses-1.onrender.com/api/kupovina/user/${user.id}`);
                    const purchasedCourse = kupovinaResponse.data.find(course => course.id === parseInt(id));
                    setKupioKurs(!!purchasedCourse);

                    if (purchasedCourse) {
                        try {
                            const ratingResponse = await axios.get(`https://horses-1.onrender.com/api/ratings/user/${user.id}/course/${id}`);
                            setRating(ratingResponse.data.ocena || 0);
                        } catch (error) {
                            console.error('Error fetching rating:', error);
                        }
                    }

                    const completedResponse = await axios.get(`https://horses-1.onrender.com/api/kompletirane_lekcije/user/${user.id}/course/${id}`);
                    setCompletedLessons(new Set(completedResponse.data.map(lesson => lesson.lekcija_id)));

                    const wishlistResponse = await axios.get(`https://horses-1.onrender.com/api/wishlist/check?korisnik_id=${user.id}&kurs_id=${id}`);
                    setWishlisted(wishlistResponse.data.exists);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [id, user]);

    // Ostatak vaših funkcija (handleCompletionToggle, handleLessonClick, etc.) ostaje isti...
    // ... (sve funkcije do return)
     const handleCompletionToggle = async (lessonId) => {
       if (!user) return;

       const updatedCompletedLessons = new Set(completedLessons);
       if (completedLessons.has(lessonId)) {
           updatedCompletedLessons.delete(lessonId);
       } else {
           updatedCompletedLessons.add(lessonId);
       }
       setCompletedLessons(updatedCompletedLessons);

       try {
           await axios.post('https://horses-1.onrender.com/api/kompletirane_lekcije', {
               korisnik_id: user.id,
               kurs_id: id,
               lekcija_id: lessonId,
               completed: updatedCompletedLessons.has(lessonId)
           });
       } catch (error) {
           console.error('Error updating lesson completion:', error);
       }
   };

   const handleLessonClick = async (lekcijaId) => {
       if (!kupioKurs) return;

       const lekcija = lekcije.find(l => l.id === lekcijaId);
       if (!lekcija) return;

       setOtvorenaLekcija(lekcija);
       setCurrentVideoUrl(lekcija.video_url);
       setCurrentContent(lekcija.content);
       setReviewFeedback(null); // Reset AI feedback when changing lessons

       await fetchQuiz(lekcijaId);

       if (lekcija.assignment) {
           setShowEditor(true);
           determineLanguage(lekcija.assignment);
           if (savedCodes[lekcijaId]) {
               setCode(savedCodes[lekcijaId]);
           } else {
               setCode(getDefaultCode(language));
           }
       } else {
           setShowEditor(false);
       }
   };

   const fetchQuiz = async (lessonId) => {
       try {
           const response = await axios.get(`https://horses-1.onrender.com/api/kvizovi/lesson/${lessonId}`);
           const updatedPitanja = response.data.pitanja.map(pitanje => {
               let parsedAnswers;
               try {
                   parsedAnswers = JSON.parse(pitanje.answers);
               } catch (e) {
                   parsedAnswers = pitanje.answers;
               }
               return {
                   ...pitanje,
                   answers: Array.isArray(parsedAnswers) ? parsedAnswers : [parsedAnswers]
               };
           });
           setQuiz(updatedPitanja);
       } catch (error) {
           console.error('Error fetching quiz:', error);
       }
   };

   const determineLanguage = (assignment) => {
       const assignmentLower = assignment.toLowerCase();
       if (assignmentLower.includes('react') || assignmentLower.includes('jsx')) {
           setLanguage('javascript');
       } else if (assignmentLower.includes('html')) {
           setLanguage('html');
       } else if (assignmentLower.includes('css')) {
           setLanguage('css');
       } else {
           setLanguage('javascript');
       }
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
           await axios.post('https://horses-1.onrender.com/api/saved-codes', {
               user_id: user.id,
               lesson_id: otvorenaLekcija.id,
               code: code,
               language: language
           });
           setSavedCodes({ ...savedCodes, [otvorenaLekcija.id]: code });
           alert('Kod je uspešno sačuvan!');
       } catch (error) {
           console.error('Error saving code:', error);
           alert('Došlo je do greške pri čuvanju koda');
       }
   };
    const handleWishlistToggle = async () => {
       if (!user) return;
       try {
           if (wishlisted) {
               await axios.delete('https://horses-1.onrender.com/api/wishlist', { data: { korisnik_id: user.id, kurs_id: id } });
               setWishlisted(false);
           } else {
               await axios.post('https://horses-1.onrender.com/api/wishlist', { korisnik_id: user.id, kurs_id: id });
               setWishlisted(true);
           }
       } catch (error) {
           console.error('Error updating wishlist:', error);
       }
   };

   const handleAddToCart = () => {
       const existingCart = JSON.parse(localStorage.getItem('cart')) || [];
       const courseExists = existingCart.find(item => item.id === kurs.id);
       if (!courseExists) {
           const updatedCart = [...existingCart, kurs];
           localStorage.setItem('cart', JSON.stringify(updatedCart));
           window.dispatchEvent(new Event('cart-updated'));
       }
       navigate('/korpa');
   };

   const handleRatingSubmit = async () => {
       if (!user || !kupioKurs || rating === 0) return;
       try {
           await axios.post('https://horses-1.onrender.com/api/ratings', { korisnik_id: user.id, kurs_id: id, ocena: rating });
           alert('Uspešno ste ocenili kurs!');
       } catch (error) {
           console.error('Error submitting rating:', error);
           alert('Došlo je do greške pri ocenjivanju');
       }
   };

   const handleReviewCode = async () => {
       try {
           const resp = await axios.post('https://horses-1.onrender.com/api/lekcije/deepseek-review', { code, language });
           if (resp.data.success) {
               setReviewFeedback({ message: resp.data.message });
           } else {
               setReviewFeedback({ message: 'AI nije vratio validan odgovor.', error: resp.data.error || 'Nepoznata greška' });
           }
       } catch (error) {
           console.error('Greška pri proveri koda:', error);
           setReviewFeedback({ message: 'Došlo je do greške pri proveri koda.', error: error.message });
       }
   };
    // Grupisanje lekcija ostaje isto
    const groupedLessons = lekcije.reduce((acc, lekcija) => {
        (acc[lekcija.section] = acc[lekcija.section] || []).push(lekcija);
        return acc;
    }, {});


    if (!kurs) return <div className="loading">Učitavanje...</div>;

    return (
        <div className='course-detail-page'>
            <div className="course-header">
                <div className="header-content">
                    <h1 className="course-title-header">{kurs.naziv}</h1>
                    <p className="course-subtitle">{kurs.opis}</p>
                    <p className="course-meta-header">Kreirao: {kurs.instruktor_ime} | Datum: {new Date(kurs.created_at).toLocaleDateString()}</p>
                </div>
            </div>

            <div className='course-layout-wrapper'>
                <div className='main-content'>
                    {(!kupioKurs || !otvorenaLekcija) && kurs.thumbnail_url && (
                        <div className="course-thumbnail-wrapper">
                             <img src={kurs.thumbnail_url} alt={kurs.naziv} className="course-thumbnail" />
                        </div>
                    )}

                    {kupioKurs && otvorenaLekcija && (
                        <div className="lesson-player-card">
                            {currentVideoUrl && <video key={currentVideoUrl} src={currentVideoUrl} controls autoPlay className="lesson-video" />}
                        </div>
                    )}
                    
                    <div className="lesson-content-card">
                        {otvorenaLekcija ? (
                            <>
                                <h3>O lekciji: {otvorenaLekcija.title}</h3>
                                <p>{currentContent}</p>
                            </>
                        ) : (
                            <>
                                <h3>O kursu</h3>
                                <p>Izaberite lekciju sa desne strane da biste počeli sa učenjem.</p>
                            </>
                        )}
                    </div>
                    
                    {kupioKurs && otvorenaLekcija && (
                        <>
                             {otvorenaLekcija.assignment && (
                                <div className="assignment-card">
                                    <h3>Zadatak</h3>
                                    <p className="assignment-text">{otvorenaLekcija.assignment}</p>
                                    {showEditor && (
                                        <div className="code-editor-wrapper">
                                            <div className="editor-header">
                                                <h4>Code Editor</h4>
                                                <select value={language} onChange={(e) => setLanguage(e.target.value)}>
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

                            <PrikazKviza quizData={quiz} />
                        </>
                    )}

                    <Komentari kursId={id} kupioKurs={kupioKurs} />
                </div>

                <aside className='sidebar'>
                    <div className='sidebar-sticky-content'>
                        <div className='course-actions-card'>
                            {!kupioKurs ? (
                                <>
                                    <div className="price-tag">{kurs.cena} RSD</div>
                                    <button onClick={handleAddToCart} className='btn btn-purchase'>Dodaj u korpu</button>
                                    <button onClick={handleWishlistToggle} className='btn btn-wishlist'>
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
                                        color2={'#ffd700'}
                                    />
                                    <button onClick={handleRatingSubmit} className="btn btn-primary" disabled={rating === 0}>
                                        Pošalji ocenu
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className='lessons-list-card'>
                            <h4>Sadržaj kursa</h4>
                            {Object.keys(groupedLessons).map((section) => (
                                <div key={section} className="lesson-section">
                                    <h5 className="section-header" onClick={() => setActiveSection(activeSection === section ? null : section)}>
                                        {section}
                                        <span className={`chevron ${activeSection === section ? 'expanded' : ''}`}></span>
                                    </h5>
                                    {activeSection === section && (
                                        <ul className="lessons-list">
                                            {groupedLessons[section].map((lekcija) => (
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
                                                            onChange={(e) => {
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
            </div>
        </div>
    );
};

export default KursDetalj;