import React, { useState, useEffect, useRef } from 'react';
import './Pocetna.css';
import { Link } from 'react-router-dom';
import filip from '../images/filip.jpg';
import { useAuth } from '../login/auth';
import { useNavigate } from 'react-router-dom';
import { FaVideo, FaChessBoard, FaChalkboardTeacher, FaComments, FaRocket, FaFilm } from 'react-icons/fa';
import { FaStar, FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import filip2 from '../images/filip2.png'


const Pocetna = () => {
  const { user, updateUser } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const navigate = useNavigate();
  const [animatedText, setAnimatedText] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const typingSpeed = 600; // ms per character
  const pauseDuration = 3000; // ms to pause after typing
  const words = ['profil', 'video', 'kontent', 'rast', 'brand'];
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slidesToShow, setSlidesToShow] = useState(3);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const carouselRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });


  const services = [
    {
      number: '[01]',
      title: 'VIDEO EDITING ZA KREATORE',
      description: 'Brzi, dinamični editovi koji drže pažnju i guraju video u viral.',
      icon: <FaVideo className="service-icon" />
    },
    {
      number: '[02]',
      title: 'KREIRANJE STRATEGIJE ZA KONTENT',
      description: 'Plan koji tvoju publiku pretvara u kupce i drži ih angažovanim.',
      icon: <FaChessBoard className="service-icon" />
    },
    {
      number: '[03]',
      title: 'MENTORSTVO ZA UČENJE EDITINGA I PRONALASKA KLIJENATA',
      description: 'Pokazujem ti korak po korak kako da od pregleda napraviš prihod.',
      icon: <FaChalkboardTeacher className="service-icon" />
    },
    {
      number: '[04]',
      title: 'KONSULTACIJE 1 NA 1',
      description: 'Zajedno gledamo tvoj sadržaj i pravimo plan koji radi.',
      icon: <FaComments className="service-icon" />
    },
    {
      number: '[05]',
      title: 'VIRAL OPTIMIZATION',
      description: 'Prilagođavam tvoje ideje i edit da algoritam ne može da ih zaobiđe.',
      icon: <FaRocket className="service-icon" />
    },
    {
      number: '[06]',
      title: 'SNIMANJE I EDIT ZA KLIJENTE PO DOGOVORU',
      description: 'Ako ti treba gotov video - ja ga snimim, editujem i spremim za objavu.',
      icon: <FaFilm className="service-icon" />
    }
  ];
  const testimonials = [
    {
      id: 1,
      name: "Nikola Kvocka",
      title: "Izirit - Petar I Marko",
      quote: "Ne moraš da veruješ meni - veruj projektima i ljudima koji su već radili sa mnom.",
      stars: 5
    },
    {
      id: 2,
      name: "Sheraton Wellness",
      title: "Wellness · Spa · Beauty & Shop",
      quote: "Jako smo prezadovoljni saradnjom sa Filipom, uvek profesionalan i kreativan. Zato planiramo i ubuduće da razvijamo još veće projekte zajedno.",
      stars: 5
    },
    {
      id: 3,
      name: "Bojan Fashion",
      title: "Jedan od najboljih frizera na Balkanu",
      quote: "Sve je ispoštovano i završeno čak i pre roka. Prezadovoljan sam saradnjom sa Filipom i sigurno nastavljamo i dalje.",
      stars: 5
    },
    {
      id: 4,
      name: "Palink Digital",
      title: "",
      quote: "Vrhunska saradnja! Video edit je ispao odlično, sve uradeno brzo i kvalitetno. Komunikacija je bila jednostavna, sve smo se lako dogovorili i sve je išlo glatko. Preporuka svima koji traže pouzdanog editora.",
      stars: 5
    }
  ];

  useEffect(() => {
    const fetchWishlist = async () => {
      if (user) {
        try {
          const response = await fetch(`https://horses-1.onrender.com/api/wishlist/${user.id}`);
          if (response.ok) {
            const data = await response.json();
            setWishlist(data);
          } else {
            console.error('Failed to fetch wishlist');
          }
        } catch (error) {
          console.error('Error:', error);
        }
      }
    };

    fetchWishlist();
  }, [user]);
  // Animation effect
  useEffect(() => {
    let timer;
    const currentWord = words[currentWordIndex];

    if (!isDeleting) {
      // Typing animation
      if (animatedText.length < currentWord.length) {
        timer = setTimeout(() => {
          setAnimatedText(currentWord.substring(0, animatedText.length + 1));
        }, typingSpeed);
      } else {
        // After typing complete, pause then start deleting
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, pauseDuration);
      }
    } else {
      // Deleting animation
      if (animatedText.length > 0) {
        timer = setTimeout(() => {
          setAnimatedText(animatedText.substring(0, animatedText.length - 1));
        }, typingSpeed);
      } else {
        // After deleting complete, move to next word
        setIsDeleting(false);
        setCurrentWordIndex((prev) => (prev + 1) % words.length);
      }
    }

    return () => clearTimeout(timer);
  }, [animatedText, isDeleting, currentWordIndex])

  useEffect(() => {
    const updateSlidesToShow = () => {
      if (window.innerWidth >= 1200) {
        setSlidesToShow(3);
      } else if (window.innerWidth >= 768) {
        setSlidesToShow(2);
      } else {
        setSlidesToShow(1);
      }
    };

    updateSlidesToShow();
    window.addEventListener('resize', updateSlidesToShow);

    return () => window.removeEventListener('resize', updateSlidesToShow);
  }, []);

  // Navigation functions
  const nextSlide = () => {
    setCurrentSlide((prev) =>
      prev < services.length - slidesToShow ? prev + 3 : 0
    );
  };

  const prevSlide = () => {
    setCurrentSlide((prev) =>
      prev > 0 ? prev - 3 : services.length - slidesToShow
    );
  };

  // Add these navigation functions
  const nextTestimonial = () => {
    setCurrentTestimonial((prev) =>
      prev === testimonials.length - 1 ? 0 : prev + 1
    );
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) =>
      prev === 0 ? testimonials.length - 1 : prev - 1
    );
  };


  const handleCourseClick = (kursId) => {
    navigate(`/kurs/${kursId}`);
  };

  const handleAddCoursesClick = () => {
    navigate('/kursevi');
  };

  const handleRemoveFromWishlist = async (kursId) => {
    if (!user) {
      alert('Please log in to remove from wishlist.');
      return;
    }

    try {
      await fetch('https://horses-1.onrender.com/api/wishlist', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          korisnik_id: user.id,
          kurs_id: kursId,
        }),
      });

      setWishlist(wishlist.filter(item => item.kurs_id !== kursId));
    } catch (error) {
      console.error('Error removing course from wishlist:', error);
    }
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Poruka je uspešno poslata! Kontaktiraćemo vas uskoro.');
    setFormData({ name: '', email: '', message: '' });
  };

  /* const VerticalLines = () => {
    return (
      <div className="vertical-lines">
        {[...Array(6)].map((_, index) => (
          <div
            key={index}
            className="line"
            style={{ left: `${15 * (index + 1)}%` }}
          />
        ))}
      </div>
    );
  };
 */
  return (
    <div className="pocetna-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1>
              <span className="bold-white">TVOJ KONTENT VEĆ </span>
              <span className="bold-orange">VREDI.</span>
              <span className="bold-white"> JA TI POKAZUJEM KAKO DA GA</span>
              <span className="bold-orange"> NAPLATIŠ!</span>
            </h1>
            <p>
              Bilo da ti treba edit koji prodaje, strategija koja donesi zaradu
              ili mentorstvo koje skraćuje put – tu sam da ti pomognem da skratiš vreme i povećaš prihode.
            </p>
            <div className="divider-line"></div>
            <Link to="/kursevi" className="cta-btn">POGLEDAJ KAKO</Link>
          </div>
          <div className="hero-image">
            <img src={filip} alt="Filip" className="profile-image" />
          </div>
        </div>
        <div className="scroll-down-container">
  <div className="rotating-text-wrapper">
    <svg className="rotating-text-svg" viewBox="0 0 150 150">
      <path
        id="circlePath"
        fill="none"
        d="M 75, 75 m -60, 0 a 60,60 0 1,1 120,0 a 60,60 0 1,1 -120,0"
      />
      <text>
        <textPath href="#circlePath">
          • SCROLL DOWN • SCROLL DOWN
        </textPath>
      </text>
    </svg>
  </div>
  <div className="arrow-down">
    ↓
  </div>
</div>
      </section>

      {/* About Section */}
      <section className="about-section"> {/* Added vertical lines */}
        <div className="about-content">
          <div className="about-text">
            <h2>KO SAM JA DA TI PRIČAM O OVOME? EVO TI <span className="bold-orange">RAZLOG</span></h2>
            <div className="stats">
              <div className="stat-number">50+</div>
              <div className="stat-text">Klijenata je otišlo virano uz moju pomoć</div>
            </div>
            <p>
              Ja sam Filip Motion, video editor i mentor koji pomaže kreatorima da od pregleda dođu do prihoda.
              Radim sa onima koji žele više od običnog lajka.
            </p>
            <p>
              Kroz edit i strategiju pomogao sam desetinama da odu virano i unovče svoj kontent.
              Ako znaš da imaš potencijala, ja ti pomažem da ga pretvoriš u rezultat.
            </p>
          </div>
          <div className="about-image">
            <img src={filip2} alt="Filip Motion" className="about-profile" />
          </div>
        </div>
      </section>
      {/* New Services Section with Animation */}
      <section className="services-section">
        <div className="vertical-lines" />
        <div className="services-content">
          <div className="services-text">
            <h2 className="services-headline">
              <span className="white">EVO ŠTA SVE</span>
              <span className="orange">MOGU DA</span>
              <span className="orange">URADIM</span>
              <span className="white">ZA TVOJ</span>
              <span className="white">
                <span className="animated-word">{animatedText.toUpperCase()}_</span>
              </span>
            </h2>
          </div>
          <p className="services-description">
            Od editovanja i strategije do mentorstva i viralnih ideja – sve na jednom mestu da tvoj rad donosi rezultat.
          </p>
        </div>
      </section>
      {/* Service Cards Section with Carousel */}
      <section className="service-cards-section">
        <div className="service-cards-grid">
          <div className="service-cards-container" ref={carouselRef}>
           

            <div className="carousel-wrapper">
              <div
                className="service-cards-inner"
                style={{ transform: `translateX(-${currentSlide * (100 / slidesToShow)}%)` }}
              >
                {services.map((service, index) => (
                  <div
                    key={index}
                    className="service-card"
                    style={{
                      flex: `0 0 ${100 / slidesToShow}%`,
                      maxWidth: `${100 / slidesToShow}%`
                    }}
                  >
                    <div className="service-icon-container">
                      {service.icon}
                    </div>
                    <div className="service-number">{service.number}</div>
                    <h3>{service.title}</h3>
                    <p>{service.description}</p>
                  </div>
                ))}
              </div>
            </div>
             <button className="carousel-btn prev" onClick={prevSlide}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <button className="carousel-btn next" onClick={nextSlide}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18L15 12L9 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      <section className="testimonials-section">
        <div className="testimonials-content">
          <h2 className="testimonials-title">STA KAŽU ONI<br />KOJI SU VEĆ<br />PROBALI</h2>

          <div className="testimonial-subtitle">
            <p>Ne moraš da veruješ meni - veruj brojkama i</p>
            <p>ljudima koji su već radili sa mnom.</p>
          </div>

          <div className="testimonial-card">
            <div className="testimonial-header">
              <div className="client-image">
                <img src={filip} alt="Client" />
              </div>
              <div className="client-info">
                <h3 className="client-name">{testimonials[currentTestimonial].name}</h3>
                <div className="stars">
                  {[...Array(testimonials[currentTestimonial].stars)].map((_, i) => (
                    <FaStar key={i} className="star" />
                  ))}
                </div>
              </div>
            </div>

            <p className="testimonial-quote">{testimonials[currentTestimonial].quote}</p>

            <div className="testimonial-navigation">
              <button className="nav-btn prev" onClick={prevTestimonial}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <div className="testimonial-counter">
                <span className="current">{currentTestimonial + 1}</span>
                <span className="total">/{testimonials.length}</span>
              </div>

              <button className="nav-btn next" onClick={nextTestimonial}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 18L15 12L9 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>
      <section className="mentorship-section">
        <div className="mentorship-content">
          <div className="mentorship-header">
            <h2>HAJDE DA TI KAZEM</h2>
            <h2>NEŠTO VIŠE O</h2>
            <h2>MENTORSTVU I</h2>
            <h2>EDITINGU</h2>
            <p className="subtitle">Dve ključne stvari u mom radu štede tvoje vreme i vode tvoj kontent do zarade.</p>
          </div>

          <div className="process-steps">
            <div className="step-line"></div>

            <div className="process-step step-right">
              <div className="step-number">[01]</div>
              <div className="step-content">
                <h3>JAVI SE U DM</h3>
                <p>Kratko mi piši ko si, šta imaš, koliko si daleko stigao i šta tačno želiš da postigneš.</p>
                <div className="divider"></div>
                <p className="highlight">Zajedno gledamo šta ti najviše odgovara - samo mentorstvo, samo editing ili sve u paketu da radi za tebe.</p>
              </div>
            </div>

            <div className="process-step step-left">
              <div className="step-number">[02]</div>
              <div className="step-content">
                <h3>BIRAMO PAKET</h3>
                <p>Zajedno gledamo šta ti najviše odgovara - samo mentorstvo, samo editing ili sve u paketu da radi za tebe.</p>
              </div>
            </div>

            <div className="process-step step-right">
              <div className="step-number">[03]</div>
              <div className="step-content">
                <h3>DOGOVARAMO PLAN</h3>
                <p>Pravimo konkretan plan rada, teme, datume i korake. Znaš tačno šta, kada i kako radiš.</p>
              </div>
            </div>

            <div className="process-step step-left">
              <div className="step-number">[04]</div>
              <div className="step-content">
                <h3>PRATIMO REZULTATE</h3>
                <p>Pratimo brojke, prilagođavamo svaki sledeći korak i radimo dok ne stignemo do cilja.</p>
              </div>
            </div>
          </div>

          <div className="cta-container">
            <Link to="/kontakt" className="cta-btn">ZAPOČNI SARADNJU</Link>
          </div>
        </div>
      </section>
           {/* New Target Audience Section */}
<section className="target-section">
      <div className="target-container">
        <div className="target-left">
          
          
          
         
          
          <h1>SAZNAJ ODMAH DA LI JE OVO <span className="highlight-orange">ZA TEBE</span></h1>
          <p>Ako se pronađeš u ovim stavkama, jasno ti je da je ovo pravi potez za tvoj kontent i zaradu.</p>
        </div>
        
        <div className="target-right">
          <h2>KRENI ODMAH</h2>
          <ul className="target-list">
            <li><div className="checkmark"></div>Kreatore koji žele više od pregleda</li>
            <li><div className="checkmark"></div>One koji hoće da skrate put do zarade</li>
            <li><div className="checkmark"></div>One koji nemaju vremena za editovanje</li>
            <li><div className="checkmark"></div>One koji hoće strategiju koja radi</li>
            <li><div className="checkmark"></div>One koji hoće da grade profil ozbiljno</li>
          </ul>
        </div>
      </div>
    </section>
    {/* ContactSection */}
     <section className="contact-section">
      <div className="contact-container">
        <div className="contact-content">
          <div className="heading-group">
            <h1>HAJDE DA</h1>
            <h1>NAPRAVIMO NEŠTO</h1>
            <h1>ŠTO ZAISTA</h1>
            <h2 className="highlight-orange">FUNKCIONIŠE</h2>
          </div>
          
          
          
          <p className="contact-description">
            Radim sa ljudima koji su spremni da naprave pravi potez — bez pritiska,<br />
            samo mi se javi i reci šta ti je na umu. Hajde da to pretvorimo u nešto<br />
            stvarno.
          </p>
          
          
          
          <div className="cta-container">
            <a href="/kontakt" className="cta-button">
              KONTAKTIRAJ ME I KREIRAJ
            </a>
          </div>
        </div>
      </div>
    </section>
      {/* Add the new Connect Section */}
      <section className="connect-section">
      <div className="connect-container">
        <div className="connect-header">
          <h1>POVEŽI SE SA MNOM</h1>
          <h1 className='orange'>VEĆ DANAS!</h1>
          <p className="connect-intro">
            Ako imaš ideju ili problem – piši mi.
          </p>
          <p className='connect-intro'>Jedna poruka može da pokrene ceo projekat.</p>
        </div>
        
        <div className="connect-content">
          <div className="connect-column form-column">
            <form onSubmit={handleSubmit} className="connect-form">
              <div className="form-group">
                <label htmlFor="name">Ime i Prezime</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Unesite svoje ime i prezime"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Unesite svoju email adresu"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="message">Tvoja poruka</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Opišite svoju ideju ili problem"
                  rows="5"
                  required
                ></textarea>
              </div>
              
              <button type="submit" className="submit-btn">
                Pošalji ovu poruku
              </button>
            </form>
          </div>
          
          <div className="connect-column contact-column">
            <div className="direct-contact">
              <p className="contact-note">Ako ti je lakše – javi mi se direktno</p>
              
              <ul className="contact-methods">
                <li className="contact-method">
                  <div className="contact-icon instagram">
                    <svg viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </div>
                  <div className="contact-details">
                    <div className="contact-value">FILIP.MOTION</div>
                  </div>
                </li>
                
                <li className="contact-method">
                  <div className="contact-icon email">
                    <svg viewBox="0 0 24 24">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                  </div>
                  <div className="contact-details">
                    <div className="contact-value">MOTIONFILIP@GMAIL.COM</div>
                  </div>
                </li>
                
                <li className="contact-method">
                  <div className="contact-icon linkedin">
                    <svg viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                  </div>
                  <div className="contact-details">
                    <div className="contact-value">FILIP.MOTION</div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

      {/* Footer */}
      <footer className="new-footer">
  <div className="footer-content">
    <div className="copyright">
      © 2025 Filip Motion. Sva prava zadržana.
    </div>
  </div>
</footer>
    </div>
  );
}

export default Pocetna;