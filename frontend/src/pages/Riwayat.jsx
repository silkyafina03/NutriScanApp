// pages/Riwayat.jsx
import React, { useState, useEffect } from 'react';
import Navbar from "../components/Navbar";
import "../styles/Riwayat.css";

const Riwayat = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('');
  const [foodHistory, setFoodHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ambil user_id dari localStorage atau context/props
  // Sesuaikan dengan cara Anda menyimpan user_id di aplikasi
  const getUserId = () => {
    // Contoh: ambil dari localStorage
    return localStorage.getItem('user_id') || '1'; // default user_id = 1 untuk testing
  };

  // Fetch data riwayat dari API
  const fetchRiwayat = async () => {
    try {
      setLoading(true);
      const userId = getUserId();
      
      const response = await fetch(`http://localhost:5000/api/riwayat/${userId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // Jika tidak ada riwayat, set array kosong
          setFoodHistory([]);
          setError(null);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } else {
        const data = await response.json();
        
        // Transform data dari API ke format yang digunakan di komponen
        const transformedData = data.map(item => ({
          id: item.id,
          name: item.name,
          image: item.image,
          calories: `${item.calories} kkal`,
          protein: `${item.protein} g`,
          lemak: `${item.fat} g`, // API menggunakan 'fat', komponen menggunakan 'lemak'
          karbohidrat: `${item.carbs} g`, // API menggunakan 'carbs', komponen menggunakan 'karbohidrat'
          category: getCategoryFromName(item.name), // Helper function untuk kategori
          tanggal: item.tanggal
        }));
        
        setFoodHistory(transformedData);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching riwayat:', err);
      setError('Gagal mengambil data riwayat. Silakan coba lagi.');
      setFoodHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function untuk menentukan kategori berdasarkan nama makanan
  // Anda bisa menyesuaikan logic ini sesuai kebutuhan
  const getCategoryFromName = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('salad')) return 'salad';
    if (lowerName.includes('soup') || lowerName.includes('sop')) return 'soup';
    if (lowerName.includes('rice') || lowerName.includes('nasi')) return 'main';
    if (lowerName.includes('cake') || lowerName.includes('dessert')) return 'dessert';
    return 'main'; // default category
  };

  // useEffect untuk fetch data saat komponen pertama kali dimount
  useEffect(() => {
    fetchRiwayat();
  }, []);

  // Filter makanan berdasarkan pencarian dan filter
  const filteredFood = foodHistory.filter(food => {
    const matchesSearch = food.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === '' || food.category === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  // Loading state
  if (loading) {
    return (
      <>
        <Navbar />
        <section className="riwayat-container bg-[#5b7f5d] relative w-full min-h-screen font-sans">
          <div className="flex justify-center items-center min-h-screen px-4 py-8">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>Memuat riwayat...</p>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <section className="riwayat-container bg-[#5b7f5d] relative w-full min-h-screen font-sans">
        <div className="flex justify-center items-center min-h-screen px-4 py-8">
          <div className="riwayat-content">
            {/* Header Section */}
            <div className="riwayat-header">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="riwayat-title">Riwayat</h1>
                  <p className="riwayat-subtitle">
                    Lihat kembali riwayat makanan dan informasi nutrisinya disini!
                  </p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {/* Search and Filter Section */}
            <div className="search-filter-section">
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search"
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="search-icon">
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              
              <select
                className="filter-select"
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
              >
                <option value="">Filter</option>
                <option value="salad">Salad</option>
                <option value="soup">Soup</option>
                <option value="main">Main Course</option>
                <option value="dessert">Dessert</option>
              </select>
            </div>

            {/* Food List Section */}
            <div className="food-list">
              {filteredFood.length > 0 ? (
                filteredFood.map((food) => (
                  <div key={food.id} className="food-item">
                    <div className="food-image-container">
                      <img 
                        src={food.image} 
                        alt={food.name} 
                        className="food-image"
                        onError={(e) => {
                          // Fallback image jika gambar tidak bisa dimuat
                          e.target.src = '/images/placeholder-food.jpg';
                        }}
                      />
                    </div>
                    
                    <div className="food-details">
                      <div className="flex justify-between items-start">
                        <h3 className="food-name">{food.name}</h3>
                      </div>
                      
                      <div className="nutrition-info">
                        <div className="nutrition-row">
                          <div className="nutrition-item">
                            <span className="nutrition-label">Kalori: </span>
                            <span className="nutrition-value">{food.calories}</span>
                          </div>
                        </div>
                        <div className="nutrition-row">
                          <div className="nutrition-item">
                            <span className="nutrition-label">Protein: </span>
                            <span className="nutrition-value">{food.protein}</span>
                          </div>
                        </div>
                        <div className="nutrition-row">
                          <div className="nutrition-item">
                            <span className="nutrition-label">Karbohidrat: </span>
                            <span className="nutrition-value">{food.karbohidrat}</span>
                          </div>
                        </div>
                        <div className="nutrition-row">
                          <div className="nutrition-item">
                            <span className="nutrition-label">Lemak: </span>
                            <span className="nutrition-value">{food.lemak}</span>
                          </div>
                        </div>
                        {food.tanggal && (
                          <span className="text-sm text-center text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            {new Date(food.tanggal).toLocaleDateString('id-ID')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">🍽️</div>
                  <h3>
                    {searchTerm || selectedFilter ? 
                      'Tidak ada hasil yang ditemukan' : 
                      'Tidak ada riwayat makanan'
                    }
                  </h3>
                  <p>
                    {searchTerm || selectedFilter ? 
                      'Coba ubah kata kunci pencarian atau filter' :
                      'Mulai scan makanan untuk melihat riwayat nutrisi Anda'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Riwayat;