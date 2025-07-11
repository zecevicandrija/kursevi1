import React, { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api"; // Uvozimo naš centralizovani API klijent
import {
  MDBModal,
  MDBModalHeader,
  MDBModalBody,
  MDBModalFooter,
  MDBBtn,
} from "mdb-react-ui-kit";

const AuthContext = React.createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Stanje za praćenje inicijalnog učitavanja
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const navigate = useNavigate();

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  }, [navigate]);

  useEffect(() => {
    // Funkcija koja proverava token i dohvata sveže podatke o korisniku
    const verifyUserSession = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Pozivamo novi /me endpoint da dobijemo najsvežije podatke
          const response = await api.get('/api/auth/me');
          const freshUser = response.data;

          // Ažuriramo stanje i localStorage
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
        } catch (error) {
          // Ako token nije validan (istekao je), odjavi korisnika
          console.error("Sesija nije validna, odjavljivanje:", error);
          logout();
        }
      }
      setLoading(false); // Završili smo sa inicijalnom proverom
    };
    
    verifyUserSession();

    // Dodajemo listener da osveži podatke kada se korisnik vrati na tab
    window.addEventListener('focus', verifyUserSession);

    // Čistimo listener kada se komponenta uništi
    return () => {
      window.removeEventListener('focus', verifyUserSession);
    };
  }, [logout]);

  const login = async (email, sifra) => {
    try {
      const response = await api.post("/api/auth/login", { email, sifra });

      if (response.status === 200) {
        const { user: loggedInUser, token } = response.data;
        setUser(loggedInUser);
        localStorage.setItem("user", JSON.stringify(loggedInUser));
        localStorage.setItem("token", token);
        navigate("/");
      }
    } catch (error) {
      setModalMessage("Došlo je do greške prilikom prijave. Proverite kredencijale.");
      setShowModal(true);
      console.error("Error logging in:", error);
      throw error;
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  // updateUser ostaje isti, već koristi 'api' klijent
  const updateUser = async (userData) => { /* ... */ };

  // Vrednost koju pružamo je sada memoizovana i uključuje 'loading'
  const value = React.useMemo(() => ({ user, loading, login, logout, updateUser }), [user, loading, logout]);

  return (
    <>
      <AuthContext.Provider value={value}>
        {/* Ne renderujemo decu dok se ne završi provera sesije */}
        {!loading && children}
      </AuthContext.Provider>

      <MDBModal show={showModal} tabIndex="-1" centered>
        <MDBModalHeader>Greška</MDBModalHeader>
        <MDBModalBody>{modalMessage}</MDBModalBody>
        <MDBModalFooter>
          <MDBBtn color="secondary" onClick={closeModal}>Zatvori</MDBBtn>
        </MDBModalFooter>
      </MDBModal>
    </>
  );
};

export const useAuth = () => useContext(AuthContext);