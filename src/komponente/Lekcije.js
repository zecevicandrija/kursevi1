import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../login/auth';
import './Lekcije.css';

const Lekcije = () => {
    const [lekcije, setLekcije] = useState([]);
    const [courses, setCourses] = useState([]);
    const [sections, setSections] = useState([]); // New state for sections
    const [newLekcija, setNewLekcija] = useState({ course_id: '', title: '', content: '', section: '', assignment: '' });
    const [video, setVideo] = useState(null);
    const [loading, setLoading] = useState(false); // New state for loading
    const { user } = useAuth(); // Fetch user from AuthContext

    useEffect(() => {
        const fetchLekcije = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/lekcije');
                setLekcije(response.data);
            } catch (error) {
                console.error('Error fetching lessons:', error);
            }
        };

        const fetchCourses = async () => {
            if (!user || !user.id) return; // Ensure user and user.id are available

            try {
                const response = await axios.get(`http://localhost:5000/api/kursevi/instruktor/${user.id}`);
                setCourses(response.data);
            } catch (error) {
                console.error('Error fetching courses:', error);
            }
        };

        fetchLekcije();
        fetchCourses();
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewLekcija({ ...newLekcija, [name]: value });

        if (name === 'course_id') {
            fetchSections(value); // Fetch sections when a course is selected
        }
    };

    const handleSectionInput = (e) => {
        setNewLekcija({ ...newLekcija, section: e.target.value });
    };

    const fetchSections = async (courseId) => {
        try {
            const response = await axios.get(`http://localhost:5000/api/lekcije/sections/${courseId}`);
            setSections(response.data);
        } catch (error) {
            console.error('Error fetching sections:', error);
        }
    };

    const handleVideoChange = (e) => {
        setVideo(e.target.files[0]);
    };

    const handleAddLekcija = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
        const formData = new FormData();
        formData.append('course_id', newLekcija.course_id);
        formData.append('title', newLekcija.title);
        formData.append('content', newLekcija.content);
        formData.append('section', newLekcija.section);
        formData.append('assignment', newLekcija.assignment);
        if (video) {
            formData.append('video', video);
        }

        const response = await axios.post('http://localhost:5000/api/lekcije', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        // Osvežite listu lekcija
        const lekcijeResponse = await axios.get('http://localhost:5000/api/lekcije');
        setLekcije(lekcijeResponse.data);
        setNewLekcija({ course_id: '', title: '', content: '', section: '', assignment: '' });
        setVideo(null);
    } catch (error) {
        console.error('Error adding lesson:', error);
        alert(`Greška pri dodavanju lekcije: ${error.response?.data?.error || error.message}`);
    } finally {
        setLoading(false);
    }
};
    return (
        <div className="lekcije-container">
            <h3 className='lekcijenaslov1'>Napravite Lekcije</h3>

            <form onSubmit={handleAddLekcija} className="add-lekcija-form">
                <div>
                    <label htmlFor="course_id">Izaberite kurs:</label>
                    <select
                        id="course_id"
                        name="course_id"
                        value={newLekcija.course_id}
                        onChange={handleInputChange}
                        required
                    >
                        <option value="">-- Izaberite kurs --</option>
                        {courses.map((course) => (
                            <option key={course.id} value={course.id}>
                                {course.naziv}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="title">Naslov lekcije:</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={newLekcija.title}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="content">Sadržaj lekcije:</label>
                    <textarea
                        id="content"
                        name="content"
                        value={newLekcija.content}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="section">Sekcija:</label>
                    <select
                        id="section"
                        name="section"
                        value={newLekcija.section}
                        onChange={handleInputChange}
                    >
                        <option value="">-- Izaberite sekciju --</option>
                        {sections.map((section, index) => (
                            <option key={index} value={section}>
                                {section}
                            </option>
                        ))}
                    </select>
                    <input
                        type="text"
                        placeholder="Nova sekcija"
                        value={newLekcija.section}
                        onChange={handleSectionInput} // Posebna funkcija za unos nove sekcije
                    />
                </div>
                <div>
                    <label htmlFor="video">Izaberite Video:</label>
                    <input
                        type="file"
                        id="video"
                        name="video"
                        accept="video/*"
                        onChange={handleVideoChange}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="assignment">Zadatak (opciono):</label>
                    <textarea
                        id="assignment"
                        name="assignment"
                        value={newLekcija.assignment}
                        onChange={handleInputChange}
                        placeholder="Unesite zadatak za lekciju"
                    />
                </div>

                <button type="submit" disabled={loading}>Dodaj Lekciju</button>
                {loading && <p>Dodavanje lekcije... Molimo sačekajte.</p>}
            </form>
        </div>
    );
};

export default Lekcije;