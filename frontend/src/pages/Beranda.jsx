import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from 'react-router-dom';
import "../styles/Beranda.css";

function Beranda() {
  const [showNotification, setShowNotification] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    checkUserProfile();
    checkFirstVisit();
  }, []);

  const checkUserProfile = () => {
    try {
      // Only check localStorage in development or if available
      if (import.meta.env.VITE_NODE_ENV !== 'production' && typeof(Storage) !== "undefined") {
        const userData = localStorage.getItem("user_data");
        const userId = localStorage.getItem("user_id");
        
        if (userData && userId) {
          setUserProfile(JSON.parse(userData));
        }
      }
    } catch (error) {
      console.warn('Error checking user profile:', error);
    }
  };

  const checkFirstVisit = () => {
    try {
      // Environment-aware localStorage usage
      const isProduction = import.meta.env.VITE_NODE_ENV === 'production';
      
      if (!isProduction && typeof(Storage) !== "undefined") {
        // Development: Use localStorage
        const hasVisited = localStorage.getItem("hasVisitedBeranda");
        if (!hasVisited) {
          setShowNotification(true);
          localStorage.setItem("hasVisitedBeranda", "true");
        }
      } else {
        // Production: Show notification based on session or other logic
        // You might want to use sessionStorage or check user authentication status
        const hasVisitedSession = sessionStorage.getItem("hasVisitedBeranda");
        if (!hasVisitedSession) {
          setShowNotification(true);
          sessionStorage.setItem("hasVisitedBeranda", "true");
        }
      }
    } catch (error) {
      console.warn('Error checking visit status:', error);
      // Fallback: show notification for first-time experience
      setShowNotification(true);
    }
  };

  const handleCloseNotification = () => {
    setShowNotification(false);
  };

  const shouldShowProfileNotification = () => {
    // Show notification if:
    // 1. First visit notification is active
    // 2. No user profile data exists (in development)
    return showNotification && (!userProfile || Object.keys(userProfile).length === 0);
  };

  return (
    <>
      <Navbar />
      
      {/* Profile completion notification */}
      {shouldShowProfileNotification() && (
        <div className="notification-banner">
          <p>Lengkapi Profile Anda untuk pengalaman yang lebih personal</p>
          <div className="notification-actions">
            <Link to="/form" className="notif-link">Isi Profile</Link>
            <button 
              className="close-button" 
              onClick={handleCloseNotification}
              aria-label="Tutup notifikasi"
            >
              ✖
            </button>
          </div>
        </div>
      )}

      {/* Welcome back notification for existing users */}
      {userProfile && !showNotification && (
        <div className="welcome-banner">
          <p>Selamat datang kembali! Siap untuk scan makanan hari ini?</p>
          <div className="notification-actions">
            <Link to="/scan" className="notif-link">Mulai Scan</Link>
            <button 
              className="close-button" 
              onClick={() => setUserProfile(null)}
              aria-label="Tutup banner"
            >
              ✖
            </button>
          </div>
        </div>
      )}

      <section className="beranda-section">
        <div className="circle-decor"></div>
        <div className="beranda-content">
          <div className="beranda-text">
            <h1 className="beranda-title">
              Cukup Scan,<br />Ketahui Nutrisi Makananmu!
            </h1>
            <p className="beranda-description">
              Dapatkan Informasi Nutrisi makananmu hanya dengan satu<br />
              foto
            </p>
            <Link to="/scan">
              <button className="beranda-button">Scan Sekarang</button>
            </Link>
          </div>

          <div className="beranda-image-wrapper">
            <div className="image-inner-container">
              <img 
                src="/images/tumpeng.jpg" 
                alt="Makanan Tradisional Indonesia" 
                className="main-image"
                loading="lazy"
              />
              <img 
                src="/images/img2.jpg" 
                alt="Makanan sehat" 
                className="circle-image top-left"
                loading="lazy"
              />
              <img 
                src="/images/img3.jpg" 
                alt="Variasi makanan" 
                className="circle-image mid-left"
                loading="lazy"
              />
              <img 
                src="/images/img4.jpg" 
                alt="Makanan bergizi" 
                className="circle-image bot-left"
                loading="lazy"
              />
              <img 
                src="/images/img2.jpeg" 
                alt="Makanan segar" 
                className="circle-image bot-right"
                loading="lazy"
              />
              <img 
                src="/images/img5.jpg" 
                alt="Makanan lezat" 
                className="circle-image mid-right"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </>
  );
}

export default Beranda;