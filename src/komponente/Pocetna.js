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
          const response = await fetch(`http://localhost:5000/api/wishlist/${user.id}`);
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
      await fetch('http://localhost:5000/api/wishlist', {
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

  const VerticalLines = () => {
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
            Od editovanja i strategije do mentorstva – jednom mestu da tvoj rad donosi rezultat.
          </p>
        </div>
      </section>
      {/* Service Cards Section with Carousel */}
      <section className="service-cards-section">
        <div className="service-cards-grid">
          <div className="service-cards-container" ref={carouselRef}>
            <button className="carousel-btn prev" onClick={prevSlide}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

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
          <h2 className="testimonials-title">STA KAZU ONI<br />KOJI SU VEĆ<br />PROBALI</h2>

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
            <h2>NEST VISE O</h2>
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
            <Link to="/kontakt" className="cta-btn">ZAPOCNI SARADNJU</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">
            <h3>Kursevi</h3>
            <p>Transformišite svoje znanje u karijeru</p>
          </div>
          <div className="footer-links">
            <Link to="/">Početna</Link>
            <Link to="/kursevi">Kursevi</Link>
            <Link to="/onama">O nama</Link>
            <Link to="/kontakt">Kontakt</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 Kursevi. Sva prava zadržana.</p>
        </div>
      </footer>
    </div>
  );
}

export default Pocetna;