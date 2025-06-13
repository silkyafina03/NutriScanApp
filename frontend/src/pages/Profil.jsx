import React, { useState, useEffect } from 'react';
import Navbar from "../components/Navbar";
import { Link } from 'react-router-dom';
import { getData } from "../utils/api"; // Import utility API
import "../styles/Profil.css";

// Komponen terpisah untuk handle image dengan loading state
const ProfileImage = ({ src, alt, className, onImageStateChange }) => {
  const [imageState, setImageState] = useState('loading');
  const [imageSrc, setImageSrc] = useState(src);

  useEffect(() => {
    setImageSrc(src);
    setImageState('loading');
  }, [src]);

  const handleLoad = () => {
    console.log('✅ Profile image loaded successfully');
    setImageState('loaded');
    if (onImageStateChange) onImageStateChange('loaded');
  };

  const handleError = () => {
    console.log('❌ Profile image failed to load, using fallback');
    console.log('Failed src:', imageSrc);
    setImageState('error');
    const fallbackUrl = "https://cdn-icons-png.flaticon.com/512/847/847969.png";
    setImageSrc(fallbackUrl);
    if (onImageStateChange) onImageStateChange('error');
  };

  return (
    <div className="profile-image-wrapper" style={{ 
      position: 'relative',
      zIndex: 10, 
      filter: 'none', 
      backdropFilter: 'none' 
    }}>
      {imageState === 'loading' && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '12px',
          color: '#666',
          zIndex: 11
        }}>
        </div>
      )}
      <img
        src={imageSrc}
        alt={alt}
        className={className}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          opacity: imageState === 'loading' ? 0.7 : 1, 
          transition: 'opacity 0.2s ease', 
          position: 'relative',
          zIndex: 12, 
          filter: 'none !important', 
          backdropFilter: 'none !important', 
          transform: 'translateZ(0)', 
          backfaceVisibility: 'hidden', 
          perspective: 1000 
        }}
      />
    </div>
  );
};

const Profil = () => {
  const [userProfile, setUserProfile] = useState({
    nama: "Loading...",
    foto: "https://cdn-icons-png.flaticon.com/512/847/847969.png",
    jenis_kelamin: "",
    usia: 0,
    berat_badan: "",
    tinggi_badan: "",
    aktivitas: "",
    porsi_makan: ""
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Helper function untuk validasi dan format base64
  const processImageData = (fotoData) => {
    if (!fotoData || typeof fotoData !== 'string') {
      console.log('❌ No valid foto data provided');
      return "https://cdn-icons-png.flaticon.com/512/847/847969.png";
    }

    const trimmedData = fotoData.trim();
    
    console.log('=== PROCESSING IMAGE DATA ===');
    console.log('Data type:', typeof fotoData);
    console.log('Data length:', fotoData.length);
    console.log('First 100 chars:', fotoData.substring(0, 100));
    console.log('Last 50 chars:', fotoData.substring(fotoData.length - 50));
    console.log('Contains "data:image":', fotoData.includes('data:image'));
    console.log('Contains "base64,":', fotoData.includes('base64,'));
    
    // Case 1: Sudah format data URL lengkap
    if (trimmedData.startsWith('data:image/')) {
      console.log('✅ Complete data URL found');
      return trimmedData;
    }
    
    // Case 2: Ada prefix "data:image" tapi format tidak standar
    if (trimmedData.includes('data:image') && trimmedData.includes('base64,')) {
      const base64Part = trimmedData.split('base64,')[1];
      if (base64Part && base64Part.length > 50) {
        const result = `data:image/jpeg;base64,${base64Part}`;
        console.log('✅ Extracted and reformatted base64 from mixed format');
        return result;
      }
    }
    
    // Case 3: Pure base64 string (paling umum)
    if (/^[A-Za-z0-9+/=\s]+$/.test(trimmedData) && trimmedData.length > 100) {
      
      const cleanBase64 = trimmedData.replace(/\s/g, '');
      
      if (cleanBase64.length % 4 === 0) {
        const result = `data:image/jpeg;base64,${cleanBase64}`;
        console.log('✅ Added JPEG base64 prefix to clean base64');
        return result;
      } else {
        console.log('❌ Invalid base64 format (length not multiple of 4)');
      }
    }
    
    // Case 4: Coba detect image format dari base64 header
    if (trimmedData.length > 50) {
      const cleanData = trimmedData.replace(/\s/g, '');
      
      // Detect image type dari base64 signature
      let mimeType = 'jpeg'; 
      if (cleanData.startsWith('/9j/')) mimeType = 'jpeg';
      else if (cleanData.startsWith('iVBORw0KGgo')) mimeType = 'png';
      else if (cleanData.startsWith('R0lGODlh')) mimeType = 'gif';
      else if (cleanData.startsWith('UklGR')) mimeType = 'webp';
      
      const result = `data:image/${mimeType};base64,${cleanData}`;
      console.log(`✅ Detected ${mimeType} format and added prefix`);
      return result;
    }
    
    console.log('❌ Could not process image data, using fallback');
    return "https://cdn-icons-png.flaticon.com/512/847/847969.png";
  };
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userId = localStorage.getItem('user_id');
        
        if (!userId) {
          setError('User ID tidak ditemukan. Silakan isi form terlebih dahulu.');
          setIsLoading(false);
          return;
        }

        console.log('=== FETCHING USER PROFILE ===');
        console.log('User ID:', userId);

        // Fetch data menggunakan utility API
        const [userResponseData, profilData] = await Promise.all([
          getData(`/api/users/${userId}`),
          getData(`/api/profil/${userId}`).catch(error => {
            // Jika profil tidak ada (404), return default
            if (error.message.includes('404')) {
              return { nama: "User", foto: null };
            }
            throw error;
          })
        ]);
        
        console.log('=== USER RESPONSE DATA ===');
        console.log('userResponseData:', userResponseData);
        
        const userData = userResponseData.user || userResponseData;
        console.log('=== EXTRACTED USER DATA ===');
        console.log('userData:', userData);
        
        console.log('=== PROFIL DATA FROM API ===');
        console.log('profilData:', profilData);
        console.log('profilData.nama:', profilData.nama);
        console.log('profilData.foto exists:', !!profilData.foto);
        
        if (profilData.foto) {
          console.log('profilData.foto type:', typeof profilData.foto);
          console.log('profilData.foto length:', profilData.foto.length);
        }
        
        // Process foto dengan function helper
        const processedFotoUrl = processImageData(profilData.foto);
        
        const finalProfile = {
          nama: profilData.nama || "User",
          foto: processedFotoUrl,
          jenis_kelamin: userData.jenis_kelamin || "Tidak diketahui",
          usia: userData.usia || 0,
          berat_badan: userData.berat_badan || "Tidak diketahui",
          tinggi_badan: userData.tinggi_badan || "Tidak diketahui",
          aktivitas: userData.aktivitas || "Tidak diketahui",
          porsi_makan: userData.porsi_makan || "Tidak diketahui"
        };
        
        console.log('=== FINAL PROFILE SET ===');
        console.log('finalProfile:', finalProfile);
        console.log('Final foto URL preview:', finalProfile.foto.substring(0, 100) + '...');
        
        setUserProfile(finalProfile);

      } catch (error) {
        console.error('=== ERROR FETCHING USER PROFILE ===');
        console.error('Error details:', error);
        
        // Fallback ke localStorage
        console.log('=== ATTEMPTING FALLBACK TO LOCALSTORAGE ===');
        const localUserData = localStorage.getItem('user_data');
        if (localUserData) {
          try {
            const userData = JSON.parse(localUserData);
            console.log('Found localStorage data:', userData);
            
            setUserProfile({
              nama: "User",
              foto: "https://cdn-icons-png.flaticon.com/512/847/847969.png",
              jenis_kelamin: userData.jenis_kelamin || "Tidak diketahui",
              usia: userData.usia || 0,
              berat_badan: userData.berat_badan || "Tidak diketahui",
              tinggi_badan: userData.tinggi_badan || "Tidak diketahui",
              aktivitas: userData.aktivitas || "Tidak diketahui",
              porsi_makan: userData.porsi_makan || "Tidak diketahui"
            });
          } catch (parseError) {
            console.error('Error parsing localStorage data:', parseError);
            setError('Gagal memuat data profil. Data localStorage rusak.');
          }
        } else {
          console.log('No localStorage data found');
          setError('Gagal memuat data profil. ' + error.message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Handler untuk debug image state
  const handleImageStateChange = (state) => {
    console.log('Image state changed to:', state);
  };

  if (isLoading) {
    return (
      <>
        <Navbar/>
        <div className="profil-container">
          <div className="main-content">
            <div className="content-wrapper">
              <div className="header">
                <h1 className="header-title">Loading...</h1>
                <p className="header-subtitle">Memuat data profil...</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar/>
        <div className="profil-container">
          <div className="main-content">
            <div className="content-wrapper">
              <div className="header">
                <h1 className="header-title">Error</h1>
                <p className="header-subtitle" style={{color: 'red'}}>{error}</p>
                <Link to="/Form">
                  <button style={{
                    marginTop: '20px',
                    padding: '10px 20px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}>
                    Isi Form Profil
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar/>
      <div className="profil-container">
        {/* Decorative circles */}
        <div className="decorative-circle decorative-circle-top"></div>
        <div className="decorative-circle decorative-circle-bottom"></div>

        {/* Main content */}
        <div className="main-content">
          <div className="content-wrapper">
            {/* Header */}
            <div className="header">
              <h1 className="header-title">
                Profil Pengguna
              </h1>
              <p className="header-subtitle">Informasi lengkap profil Anda</p>
            </div>

            {/* Profile card background blur */}
            <div className="profile-card">
              <div className="profile-card-content">
                {/* Left side - foto dan nama */}
                <div className="profile-photo-section">
                  <div className="photo-container">
                    <ProfileImage
                      src={userProfile.foto}
                      alt={userProfile.nama}
                      className="profile-photo"
                      onImageStateChange={handleImageStateChange}
                    />
                    <div className="photo-badge">
                      <svg className="w-6 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                  </div>
                  <h2 className="profile-name">
                    {userProfile.nama}
                  </h2>
                </div>

                {/* Right side - User Information */}
                <div className="profile-info-section">
                  <h3 className="info-title">Informasi Pengguna</h3>
                  <div className="info-grid">
                    {/* Jenis kelamin */}
                    <div className="info-card">
                      <div className="info-card-header">
                        <div className="info-icon">
                          <svg className="w-6 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 4a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93L14.5 14H16c.55 0 1 .45 1 1s-.45 1-1 1h-1.5v2c0 .55-.45 1-1 1s-1-.45-1-1v-2H11c-.55 0-1-.45-1-1s.45-1 1-1h1.5l1.75-2.07C12.4 11.58 11 9.95 11 8a4 4 0 0 1 1-3z"/>
                          </svg>
                        </div>
                        <h4 className="info-label">Jenis Kelamin</h4>
                      </div>
                      <p className="info-value">{userProfile.jenis_kelamin}</p>
                    </div>

                    {/* Usia */}
                    <div className="info-card">
                      <div className="info-card-header">
                        <div className="info-icon">
                          <svg className="w-6 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.08 5.49-.08 5.49s-.93.93-.56 1.01c.73.16 1.82-1.62 2.55-2.78-.08.87.48 1.64 1.28 1.34.8-.3 1.01-1.6.72-2.63-.29-1.03-1.35-1.92-2.39-2.01-.94-.07-1.39.53-1.52.58z"/>
                          </svg>
                        </div>
                        <h4 className="info-label">Usia</h4>
                      </div>
                      <p className="info-value">{userProfile.usia} tahun</p>
                    </div>

                    {/* Tinggi Badan */}
                    <div className="info-card">
                      <div className="info-card-header">
                        <div className="info-icon">
                          <svg className="w-6 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M13 6.99h3L12 2 8 6.99h3v10.02H8L12 22l4-4.99h-3z"/>
                          </svg>
                        </div>
                        <h4 className="info-label">Tinggi Badan</h4>
                      </div>
                      <p className="info-value">{userProfile.tinggi_badan} cm</p>
                    </div>

                    {/* Berat Badan */}
                    <div className="info-card">
                      <div className="info-card-header">
                        <div className="info-icon">
                          <svg className="w-6 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 3c-2.4 0-4.35 1.95-4.35 4.35C7.65 9.75 9.6 11.7 12 11.7s4.35-1.95 4.35-4.35C16.35 4.95 14.4 3 12 3zm-.5 13c-3.03 0-5.5 2.47-5.5 5.5v.5h11v-.5c0-3.03-2.47-5.5-5.5-5.5z"/>
                          </svg>
                        </div>
                        <h4 className="info-label">Berat Badan</h4>
                      </div>
                      <p className="info-value">{userProfile.berat_badan} kg</p>
                    </div>

                    {/* Aktivitas */}
                    <div className="info-card">
                      <div className="info-card-header">
                        <div className="info-icon">
                          <svg className="w-6 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.28 2.91-.73 4.19-1.01 1.29-2.88 4.65-3.48 4.65z"/>
                          </svg>
                        </div>
                        <h4 className="info-label">Aktivitas</h4>
                      </div>
                      <p className="info-value">{userProfile.aktivitas}</p>
                    </div>

                    {/* Porsi makanan */}
                    <div className="info-card">
                      <div className="info-card-header">
                        <div className="info-icon">
                          <svg className="w-6 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
                          </svg>
                        </div>
                        <h4 className="info-label">Porsi Makan</h4>
                      </div>
                      <p className="info-value">{userProfile.porsi_makan} porsi/hari</p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="action-buttons">
                    <Link to="/Edit-Profil">
                      <button className="btn-primary">
                        Edit Profil
                      </button>
                    </Link>
                    <Link to="/Kalori-Harian">
                      <button className="btn-secondary">
                        Kalori Harian
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profil;