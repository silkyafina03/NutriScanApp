import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from 'react-router-dom';
import "../styles/Beranda.css";

function Beranda() {
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    try {
      // Check apakah browser mendukung localStorage
      if (typeof(Storage) !== "undefined") {
        const hasVisited = localStorage.getItem("hasVisitedBeranda");
        if (!hasVisited) {
          setShowNotification(true);
          localStorage.setItem("hasVisitedBeranda", "true");
        }
      } else {
        // Fallback jika localStorage tidak tersedia
        setShowNotification(true);
      }
    } catch (error) {
      // Error handling
      setShowNotification(true);
    }
    
    // Untuk demo - paksa tampilkan setelah 1 detik
    setTimeout(() => {
      setShowNotification(true);
    }, 1000);
  }, []);

  return (
    <>
      <Navbar />
      {showNotification && (
        <div className="notification-banner">
          <p>Lengkapi Profile Anda</p>
          <div className="notification-actions">
            <Link to="/Profil" className="notif-link">Ke Profil</Link>
            <button className="close-button" onClick={() => setShowNotification(false)}>✖</button>
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
            <Link to="/Scan"><button className="beranda-button">Scan Sekarang</button></Link>
          </div>

          <div className="beranda-image-wrapper">
            <div className="image-inner-container">
              <img src="/images/tumpeng.jpg" alt="Makanan" className="main-image" />
              <img src="/images/img2.jpg" className="circle-image top-left" />
              <img src="/images/img3.jpg" className="circle-image mid-left" />
              <img src="/images/img4.jpg" className="circle-image bot-left" />
              <img src="/images/img2.jpeg" className="circle-image bot-right" />
              <img src="/images/img5.jpg" className="circle-image mid-right" />
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}

export default Beranda;