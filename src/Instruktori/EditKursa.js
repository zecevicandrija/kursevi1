import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../login/api'; // Prilagodi putanju do api.js
import './EditKursa.css';

const EditKursa = () => {
    const { kursId } = useParams(); // Uzima ID kursa iz URL-a
    const navigate = useNavigate();
    
    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Stanja za modal za izmenu lekcije
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingLesson, setEditingLesson] = useState(null);
    const [editForm, setEditForm] = useState({ title: '', content: '' });
    const [videoFile, setVideoFile] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            // Paralelno dohvatamo i podatke o kursu i listu lekcija
            const [courseResponse, lessonsResponse] = await Promise.all([
                api.get(`/api/kursevi/${kursId}`),
                api.get(`/api/lekcije/course/${kursId}`)
            ]);
            setCourse(courseResponse.data);
            setLessons(lessonsResponse.data);
        } catch (error) {
            console.error("Greška pri dohvatanju podataka:", error);
        } finally {
            setIsLoading(false);
        }
    }, [kursId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDeleteLesson = async (lessonId) => {
        if (window.confirm('Da li ste sigurni da želite da obrišete ovu lekciju?')) {
            try {
                await api.delete(`/api/lekcije/${lessonId}`);
                setLessons(prevLessons => prevLessons.filter(l => l.id !== lessonId));
            } catch (error) {
                console.error("Greška pri brisanju lekcije:", error);
            }
        }
    };
    
    const handleOpenEditModal = (lesson) => {
        setEditingLesson(lesson);
        setEditForm({ title: lesson.title, content: lesson.content });
        setVideoFile(null); // Resetuj fajl pri svakom otvaranju
        setIsEditModalOpen(true);
    };

    const handleEditFormChange = (e) => setEditForm({ ...editForm, [e.target.name]: e.target.value });
    const handleVideoChange = (e) => setVideoFile(e.target.files[0]);

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('title', editForm.title);
        formData.append('content', editForm.content);
        formData.append('course_id', editingLesson.course_id); // Potreban je course_id
        formData.append('section', editingLesson.section || ''); // I ostali podaci
        if (videoFile) {
            formData.append('video', videoFile);
        } else {
            formData.append('video_url', editingLesson.video_url || ''); // Pošalji stari URL ako nema novog videa
        }

        try {
            await api.put(`/api/lekcije/${editingLesson.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setIsEditModalOpen(false);
            await fetchData(); // Osveži listu lekcija
        } catch (error) {
            console.error("Greška pri ažuriranju lekcije:", error);
        }
    };

    if (isLoading) return <div className="edit-kurs-container"><h2>Učitavanje...</h2></div>;

    return (
        <div className="edit-kurs-container">
            <button onClick={() => navigate('/instruktor')} className="back-button">Nazad na Tablu</button>
            <h1>Uređivanje Lekcija za: {course?.naziv}</h1>

            <div className="lessons-grid">
                {lessons.map(lesson => (
                    <div className="lesson-card-edit" key={lesson.id}>
                        <h4>{lesson.title}</h4>
                        <p>{lesson.content}</p>
                        {lesson.video_url && (
                            <video className="lesson-video-preview" controls src={lesson.video_url}></video>
                        )}
                        <div className="lesson-actions">
                            <button onClick={() => handleOpenEditModal(lesson)} className="edit-btn">Izmeni</button>
                            <button onClick={() => handleDeleteLesson(lesson.id)} className="delete-btn">Obriši</button>
                        </div>
                    </div>
                ))}
            </div>

            {isEditModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button className="close-modal-button" onClick={() => setIsEditModalOpen(false)}>&times;</button>
                        <h2>Izmeni Lekciju: {editingLesson?.title}</h2>
                        <form onSubmit={handleEditSubmit} className="modal-form">
                            <label>Naslov: <input type="text" name="title" value={editForm.title} onChange={handleEditFormChange} required /></label>
                            <label>Sadržaj: <textarea name="content" value={editForm.content} onChange={handleEditFormChange} required></textarea></label>
                            <label>Zameni Video (opciono): <input type="file" accept="video/*" onChange={handleVideoChange} /></label>
                            <button type="submit" className="save-button">Sačuvaj Izmene</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditKursa;