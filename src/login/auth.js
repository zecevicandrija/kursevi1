import React, { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api"; // Uverite se da je putanja do api.js tačna
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
  const [loading, setLoading] = useState(true);
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
    const verifyUserSession = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get('/api/auth/me');
          const freshUser = response.data;
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
        } catch (error) {
          console.error("Sesija nije validna, odjavljivanje:", error);
          logout();
        }
      }
      setLoading(false);
    };
    
    verifyUserSession();
    window.addEventListener('focus', verifyUserSession);
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

  // Ova funkcija sada nije direktno korišćena u MojProfil, ali je ostavljamo za buduće potrebe
  const updateUser = async (userData) => { /* ... */ };

  // --- KLJUČNA IZMENA JE OVDE ---
  // Dodajemo 'setUser' u objekat koji delimo kroz kontekst.
  const value = React.useMemo(
    () => ({ user, setUser, loading, login, logout, updateUser }), 
    [user, loading, logout] // setUser se ne menja, pa ne mora u dependency array
  );

  return (
    <>
      <AuthContext.Provider value={value}>
        {!loading && children}
      </AuthContext.Provider>
      <MDBModal show={showModal} tabIndex="-1" centered>
        {/* ... ostatak modala ... */}
      </MDBModal>
    </>
  );
};

export const useAuth = () => useContext(AuthContext);