import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../login/api"; // Koristimo naš novi, centralizovani API klijent
import { useAuth } from "../login/auth";
import "./KupljenKurs.css";

const KupljenKurs = () => {
  const [kupljeniKursevi, setKupljeniKursevi] = useState([]);
  const [ratings, setRatings] = useState({});
  const [progress, setProgress] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Proveravamo da li je korisnikova pretplata aktivna na osnovu datuma iz user objekta
  const imaAktivnuPretplatu =
    user &&
    user.subscription_expires_at &&
    new Date(user.subscription_expires_at) > new Date();

  const fetchData = useCallback(async () => {
    if (user && user.id) {
      try {
        setIsLoading(true);
        // Dohvatamo sve kupljene kurseve
        const response = await api.get(`/api/kupovina/user/${user.id}`);
        const kursevi = response.data;
        setKupljeniKursevi(kursevi);

        // Paralelno dohvatamo rejtinge i progres za sve kurseve
        const ratingsPromises = kursevi.map((k) =>
          api
            .get(`/api/ratings/user/${user.id}/course/${k.id}`)
            .catch(() => ({ data: {} }))
        );
        const progressPromises = kursevi.map((k) =>
          Promise.all([
            api.get(`/api/lekcije/course/${k.id}`),
            api.get(`/api/kompletirane_lekcije/user/${user.id}/course/${k.id}`),
          ]).catch(() => [])
        );

        const ratingsResults = await Promise.all(ratingsPromises);
        const progressResults = await Promise.all(progressPromises);

        const newRatings = {};
        ratingsResults.forEach((res, index) => {
          newRatings[kursevi[index].id] = res.data.ocena;
        });

        const newProgress = {};
        progressResults.forEach((res, index) => {
          if (res.length === 2) {
            const totalLessons = res[0].data.length;
            const completedLessons = res[1].data.length;
            if (totalLessons > 0) {
              newProgress[kursevi[index].id] =
                (completedLessons / totalLessons) * 100;
            }
          }
        });

        setRatings(newRatings);
        setProgress(newProgress);
      } catch (error) {
        console.error("Greška pri dohvatanju podataka o kursevima:", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [user?.id]); //user?.id

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleProduziPretplatu = async (kurs) => {
    if (!user) return alert("Morate biti prijavljeni.");

    try {
      const response = await api.post("/api/placanje/kreiraj-checkout", {
        kurs_id: kurs.id,
        ime: user.ime,
        prezime: user.prezime,
        email: user.email,
      });
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error("Greška pri produžavanju pretplate:", error);
      alert("Došlo je do greške, molimo pokušajte ponovo.");
    }
  };

  if (isLoading) {
    return (
      <div className="kupljeni-kursevi-container1">
        <p>Učitavanje...</p>
      </div>
    );
  }

  return (
    <div className="kupljeni-kursevi-container1">
      <h2 className="naslovkupljeni1">Moji Kursevi</h2>
      {!user && (
        <p>
          Molimo vas da se prijavite da biste videli svoje kupljene kurseve.
        </p>
      )}
      {user && kupljeniKursevi.length === 0 && <p>Nema kupljenih kurseva.</p>}

      {user && kupljeniKursevi.length > 0 && (
        <div className="kurs-list1">
          {kupljeniKursevi.map((kurs) => {
            const isCourseAccessible =
              !kurs.is_subscription || imaAktivnuPretplatu;

            return (
              <div key={kurs.id} className="kurs-card1">
                {kurs.slika && (
                  <img
                    src={kurs.slika}
                    alt={kurs.naziv}
                    className="kurs-slika1"
                  />
                )}
                <h3>{kurs.naziv}</h3>
                <p>{kurs.opis}</p>

                {/* <div className="info-group1">
                                    <p>Moja Ocena:</p>
                                    <p><b>{ratings[kurs.id] ? `${ratings[kurs.id]}⭐` : 'Nema ocene'}</b></p>
                                </div> */}

                <div className="info-group1">
                  <div className="progres-container">
                    <h4>Progres</h4>
                    <div className="progres-bar">
                      <div
                        className="progres-popunjeno"
                        style={{ width: `${progress[kurs.id] || 0}%` }}
                      ></div>
                      <span className="procenti-start">
                        {progress[kurs.id]
                          ? `${Math.round(progress[kurs.id])}%`
                          : "0%"}
                      </span>
                    </div>
                  </div>
                </div>

                <p>
    Pristup aktivan do:{" "}
    <strong>
        {kurs.is_subscription 
            ? new Date(user.subscription_expires_at).toLocaleDateString()
            : "zauvek"}
    </strong>
</p>

                <div className="button-group1">
                  {isCourseAccessible ? (
                    <button
                      onClick={() => navigate(`/kurs/${kurs.id}`)}
                      className="kurs-link1"
                    >
                      Pristupi kursu
                    </button>
                  ) : (
                    <>
                      <p className="istekla-pretplata1">
                        Pretplata je istekla!
                      </p>
                      <button
                        onClick={() => handleProduziPretplatu(kurs)}
                        className="produzi-link1"
                      >
                        Produži Pretplatu
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default KupljenKurs;
