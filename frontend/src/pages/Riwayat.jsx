import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from "../components/Navbar";
import { getData } from "../utils/api";
import "../styles/Riwayat.css";

const Riwayat = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('');
  const [foodHistory, setFoodHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Constants
  const MAX_RETRY_ATTEMPTS = 3;
  const RETRY_DELAY = 1000; // 1 second

  // Helper function untuk menentukan kategori berdasarkan nama makanan
  const getCategoryFromName = useCallback((name) => {
    if (!name) return 'main';
    
    const lowerName = name.toLowerCase().trim();
    const categoryMap = {
      'salad': ['salad', 'sayur', 'lettuce', 'spinach'],
      'soup': ['soup', 'sop', 'kuah', 'broth'],
      'main': ['rice', 'nasi', 'chicken', 'ayam', 'beef', 'sapi', 'fish', 'ikan'],
      'dessert': ['cake', 'dessert', 'sweet', 'manis', 'ice cream', 'pudding']
    };

    for (const [category, keywords] of Object.entries(categoryMap)) {
      if (keywords.some(keyword => lowerName.includes(keyword))) {
        return category;
      }
    }
    return 'main'; // default category
  }, []);

  // Ambil user_id dengan validation
  const getUserId = useCallback(() => {
    try {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        console.warn('User ID not found in localStorage, using default');
        return '1'; // default untuk testing
      }
      return userId;
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return '1'; // fallback
    }
  }, []);

  // Transform data dengan validation
  const transformApiData = useCallback((data) => {
    if (!Array.isArray(data)) {
      console.warn('Invalid data format received from API');
      return [];
    }

    return data.map(item => {
      // Validate required fields
      if (!item.id || !item.name) {
        console.warn('Invalid item data:', item);
        return null;
      }

      return {
        id: item.id,
        name: item.name,
        image: item.image || '/images/placeholder-food.jpg',
        calories: `${parseFloat(item.calories || 0).toFixed(0)} kkal`,
        protein: `${parseFloat(item.protein || 0).toFixed(1)} g`,
        lemak: `${parseFloat(item.fat || 0).toFixed(1)} g`,
        karbohidrat: `${parseFloat(item.carbs || 0).toFixed(1)} g`,
        category: getCategoryFromName(item.name),
        tanggal: item.tanggal || item.created_at || new Date().toISOString()
      };
    }).filter(Boolean); // Remove null items
  }, [getCategoryFromName]);

  // Fetch data riwayat dengan retry mechanism
  const fetchRiwayat = useCallback(async (isRetry = false) => {
    try {
      if (!isRetry) {
        setLoading(true);
        setError(null);
        setRetryCount(0);
      }

      const userId = getUserId();
      
      console.log('=== FETCHING RIWAYAT ===');
      console.log('User ID:', userId);
      console.log('Retry attempt:', retryCount);
      
      const endpoint = `/api/riwayat/${userId}`;
      console.log('API Endpoint:', endpoint);
      
      // Menggunakan getData dari api.js dengan custom error handling
      const data = await getData(endpoint);
      console.log('Raw API data:', data);
      
      // Handle empty response atau error response
      if (!data) {
        console.log('No data returned from API');
        setFoodHistory([]);
        setError(null);
        return;
      }
      
      // Handle error response dari server
      if (data.error) {
        if (data.error.includes('404') || data.message?.includes('not found')) {
          console.log('No history found');
          setFoodHistory([]);
          setError(null);
          return;
        } else {
          throw new Error(data.error || data.message || 'Unknown server error');
        }
      }
      
      const transformedData = transformApiData(data);
      console.log('Transformed data:', transformedData);
      
      setFoodHistory(transformedData);
      setError(null);
      setRetryCount(0);
      
    } catch (err) {
      console.error('=== ERROR FETCHING RIWAYAT ===');
      console.error('Error details:', err);
      
      // Check if it's a network error or server error that should be retried
      const isRetryableError = (
        err.message.includes('fetch') ||
        err.message.includes('Network') ||
        err.message.includes('Server error') ||
        err.message.includes('500') ||
        err.message.includes('502') ||
        err.message.includes('503') ||
        err.message.includes('504')
      );
      
      if (retryCount < MAX_RETRY_ATTEMPTS && isRetryableError) {
        // Retry untuk network/server errors
        console.log(`Retrying... attempt ${retryCount + 1}`);
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          fetchRiwayat(true);
        }, RETRY_DELAY * (retryCount + 1)); // Exponential backoff
        return;
      } else {
        // Final error - no more retries
        if (err.message.includes('fetch') || err.message.includes('Network')) {
          setError('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
        } else if (err.message.includes('404') || err.message.includes('not found')) {
          setFoodHistory([]);
          setError(null);
        } else {
          setError('Gagal mengambil data riwayat. Silakan coba lagi nanti.');
        }
      }
      
      if (!err.message.includes('404')) {
        setFoodHistory([]);
      }
    } finally {
      if (!isRetry || retryCount >= MAX_RETRY_ATTEMPTS) {
        setLoading(false);
      }
    }
  }, [getUserId, transformApiData, retryCount]);

  // Filter makanan dengan memoization untuk performance
  const filteredFood = useMemo(() => {
    return foodHistory.filter(food => {
      const matchesSearch = searchTerm === '' || 
        food.name.toLowerCase().includes(searchTerm.toLowerCase().trim());
      const matchesFilter = selectedFilter === '' || food.category === selectedFilter;
      return matchesSearch && matchesFilter;
    });
  }, [foodHistory, searchTerm, selectedFilter]);

  // useEffect untuk fetch data saat komponen pertama kali dimount
  useEffect(() => {
    fetchRiwayat();
  }, []); // Empty dependency array karena fetchRiwayat sudah di-memoize

  // Debounced search untuk performance
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Search logic sudah ada di useMemo filteredFood
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Handle image error
  const handleImageError = useCallback((e) => {
    if (e.target.src !== '/images/placeholder-food.jpg') {
      e.target.src = '/images/placeholder-food.jpg';
    }
  }, []);

  // Format tanggal dengan error handling
  const formatDate = useCallback((dateString) => {
    try {
      if (!dateString) return '';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  }, []);

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
              {retryCount > 0 && (
                <p className="text-sm mt-2">Mencoba kembali... ({retryCount}/{MAX_RETRY_ATTEMPTS})</p>
              )}
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
                {/* Refresh Button */}
                <button
                  onClick={() => fetchRiwayat()}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2"
                  disabled={loading}
                >
                  <svg 
                    className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center justify-between">
                <div>
                  <strong>Error:</strong> {error}
                </div>
                <button 
                  onClick={() => fetchRiwayat()}
                  className="ml-4 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
                  disabled={loading}
                >
                  Coba Lagi
                </button>
              </div>
            )}

            {/* Search and Filter Section */}
            <div className="search-filter-section">
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Cari makanan..."
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  maxLength={100}
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
                <option value="">Semua Kategori</option>
                <option value="salad">Salad</option>
                <option value="soup">Soup</option>
                <option value="main">Main Course</option>
                <option value="dessert">Dessert</option>
              </select>
            </div>

            {/* Results Info */}
            {(searchTerm || selectedFilter) && (
              <div className="mb-4 text-white text-sm">
                Menampilkan {filteredFood.length} dari {foodHistory.length} item
                {searchTerm && ` untuk "${searchTerm}"`}
                {selectedFilter && ` dalam kategori "${selectedFilter}"`}
              </div>
            )}

            {/* Food List Section */}
            <div className="food-list">
              {filteredFood.length > 0 ? (
                filteredFood.map((food) => (
                  <div key={`${food.id}-${food.tanggal}`} className="food-item">
                    <div className="food-image-container">
                      <img 
                        src={food.image} 
                        alt={food.name}
                        className="food-image"
                        onError={handleImageError}
                        loading="lazy"
                      />
                    </div>
                    
                    <div className="food-details">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="food-name">{food.name}</h3>
                        {food.tanggal && (
                          <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded ml-2 whitespace-nowrap">
                            {formatDate(food.tanggal)}
                          </span>
                        )}
                      </div>
                      
                      <div className="nutrition-info">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="nutrition-item">
                            <span className="nutrition-label">Kalori: </span>
                            <span className="nutrition-value">{food.calories}</span>
                          </div>
                          <div className="nutrition-item">
                            <span className="nutrition-label">Protein: </span>
                            <span className="nutrition-value">{food.protein}</span>
                          </div>
                          <div className="nutrition-item">
                            <span className="nutrition-label">Karbohidrat: </span>
                            <span className="nutrition-value">{food.karbohidrat}</span>
                          </div>
                          <div className="nutrition-item">
                            <span className="nutrition-label">Lemak: </span>
                            <span className="nutrition-value">{food.lemak}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">
                    {searchTerm || selectedFilter ? '🔍' : '🍽️'}
                  </div>
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
                  {(searchTerm || selectedFilter) && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedFilter('');
                      }}
                      className="mt-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-all duration-200"
                    >
                      Reset Filter
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Footer Info */}
            {foodHistory.length > 0 && (
              <div className="mt-6 text-center text-white text-sm opacity-75">
                Total {foodHistory.length} item dalam riwayat
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default Riwayat;