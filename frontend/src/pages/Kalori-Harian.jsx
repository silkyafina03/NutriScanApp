import React, { useState, useEffect } from 'react';
import { Utensils, Target, TrendingUp, Clock, LayoutGrid, AlertCircle } from 'lucide-react';
import { getData } from '../utils/api';

function KaloriHarian() {
  const [userProfile, setUserProfile] = useState(null);
  const [userData, setUserData] = useState({
    targetKalori: 2000,
    kaloriTerkonsumsi: 0,
    makananDimakan: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    // Get current date in Indonesia timezone
    const now = new Date();
    const indonesiaDate = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
    return indonesiaDate.toISOString().split('T')[0];
  });

  // Helper function untuk mendapatkan user_id
  const getUserId = () => {
    return localStorage.getItem('user_id') || '1'; // default user_id = 1 untuk testing
  };

  // Debug logging helper
  const debugLog = (message, data = null) => {
    if (import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true') {
      console.log(`[KaloriHarian] ${message}`, data);
    }
  };

  // Fungsi untuk fetch data user dari API - Enhanced error handling
  const fetchUserData = async () => {
    try {
      setLoading(true);
      debugLog('Fetching user data...');
      
      const data = await getData('/api/users');
      debugLog('Data from API:', data);
      
      // API mengembalikan { message, total, users: [] }
      const user = data.users && data.users.length > 0 ? data.users[0] : null;
      
      if (user) {
        setUserProfile({
          user_id: user.id || user.user_id,
          jenis_kelamin: user.jenis_kelamin,
          usia: user.usia,
          tinggi_badan: user.tinggi_badan,
          berat_badan: user.berat_badan,
          aktivitas: user.aktivitas,
          porsi_makan: user.porsi_makan
        });
        debugLog('User profile set:', user);
      } else {
        throw new Error('No user data found');
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Gagal memuat data pengguna. Menggunakan data default.');
      
      // Fallback ke data default jika API gagal
      setUserProfile({
        user_id: getUserId(),
        jenis_kelamin: 'Laki-laki',
        usia: 25,
        tinggi_badan: 170,
        berat_badan: 70,
        aktivitas: 'sedang',
        porsi_makan: 3
      });
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk fetch data riwayat makanan berdasarkan tanggal
  const fetchRiwayatMakanan = async (userId, tanggal) => {
    try {
      debugLog(`Fetching riwayat for user ${userId} on date ${tanggal}`);
      
      const riwayatData = await getData(`/api/riwayat/${userId}`);
      debugLog('Riwayat data received:', riwayatData);
      
      // Pastikan riwayatData adalah array
      const dataArray = Array.isArray(riwayatData) ? riwayatData : [];
      
      if (dataArray.length === 0) {
        debugLog('Empty riwayat data');
        setUserData(prev => ({
          ...prev,
          makananDimakan: [],
          kaloriTerkonsumsi: 0
        }));
        return [];
      }
      
      // Filter data berdasarkan tanggal yang dipilih
      const makananHariIni = dataArray
        .filter(item => {
          if (!item.tanggal) return false;
          
          // Handle different possible date formats
          let itemDate;
          if (item.tanggal.includes('T')) {
            // Format: 2024-06-11T10:30:00.000Z
            itemDate = item.tanggal.split('T')[0];
          } else {
            // Format: 2024-06-11
            itemDate = item.tanggal;
          }
          
          debugLog('Comparing dates:', {
            itemDate,
            targetDate: tanggal,
            match: itemDate === tanggal
          });
          
          return itemDate === tanggal;
        })
        .map(item => {
          // Handle waktu extraction safely
          let waktu = '00:00';
          let hour = 12; // default untuk kategori
          
          if (item.tanggal && item.tanggal.includes('T')) {
            // Jika ada timestamp lengkap
            try {
              const dateObj = new Date(item.tanggal);
              waktu = dateObj.toLocaleTimeString('id-ID', { 
                hour: '2-digit', 
                minute: '2-digit',
                timeZone: 'Asia/Jakarta'
              });
              hour = dateObj.getHours();
            } catch (e) {
              console.error('Error parsing date:', e);
            }
          } else if (item.waktu) {
            // Jika ada field waktu terpisah
            waktu = item.waktu;
            try {
              hour = parseInt(item.waktu.split(':')[0]);
            } catch (e) {
              console.error('Error parsing time:', e);
            }
          }
          
          return {
            nama: item.name || 'Makanan tidak diketahui',
            kalori: parseInt(item.calories) || 0,
            waktu: waktu,
            kategori: getKategoriFromTime(hour),
            protein: item.protein || 0,
            carbs: item.carbs || 0,
            fat: item.fat || 0
          };
        });

      // Hitung total kalori terkonsumsi
      const totalKalori = makananHariIni.reduce((total, makanan) => total + makanan.kalori, 0);

      debugLog('Processed makanan:', makananHariIni);
      debugLog('Total kalori calculated:', totalKalori);

      setUserData(prev => ({
        ...prev,
        makananDimakan: makananHariIni,
        kaloriTerkonsumsi: totalKalori
      }));

      return makananHariIni;
    } catch (err) {
      console.error('Error fetching riwayat makanan:', err);
      
      // Handle specific API errors
      if (err.status === 404) {
        // Jika tidak ada riwayat, set data kosong
        debugLog('No history found for user (404)');
        setUserData(prev => ({
          ...prev,
          makananDimakan: [],
          kaloriTerkonsumsi: 0
        }));
        return [];
      }
      
      setError('Gagal memuat data riwayat makanan.');
      
      // Set data kosong jika gagal
      setUserData(prev => ({
        ...prev,
        makananDimakan: [],
        kaloriTerkonsumsi: 0
      }));
      
      return [];
    }
  };

  // Fungsi untuk menentukan kategori berdasarkan jam
  const getKategoriFromTime = (hour) => {
    if (hour >= 5 && hour < 10) return 'Sarapan';
    if (hour >= 10 && hour < 15) return 'Makan Siang';
    if (hour >= 15 && hour < 18) return 'Snack';
    if (hour >= 18 && hour < 22) return 'Makan Malam';
    return 'Minuman';
  };

  // Fetch data saat component mount
  useEffect(() => {
    debugLog('Component mounted, fetching user data...');
    fetchUserData();
  }, []);

  // Fetch riwayat makanan saat userProfile atau selectedDate berubah
  useEffect(() => {
    // Gunakan userId dari localStorage atau userProfile
    const userId = userProfile?.user_id || getUserId();
    
    if (userId) {
      debugLog('Fetching riwayat for userId:', userId, 'date:', selectedDate);
      fetchRiwayatMakanan(userId, selectedDate);
    }
  }, [userProfile, selectedDate]);

  // Fungsi untuk menghitung BMR (Basal Metabolic Rate)
  const calculateBMR = (profile) => {
    if (!profile) return 0;
    
    const { jenis_kelamin, usia, tinggi_badan, berat_badan } = profile;
    
    if (jenis_kelamin === 'Laki-laki') {
      // Rumus Harris-Benedict untuk laki-laki
      return 88.362 + (13.397 * berat_badan) + (4.799 * tinggi_badan) - (5.677 * usia);
    } else {
      // Rumus Harris-Benedict untuk perempuan
      return 447.593 + (9.247 * berat_badan) + (3.098 * tinggi_badan) - (4.330 * usia);
    }
  };

  // Fungsi untuk menghitung Total Daily Energy Expenditure (TDEE)
  const calculateTDEE = (profile) => {
    if (!profile) return 2000; // default value
    
    const bmr = calculateBMR(profile);
    const { aktivitas, porsi_makan } = profile;
    
    // Faktor aktivitas
    const activityFactors = {
      'ringan': 1.375,    // Sedikit/tidak berolahraga
      'sedang': 1.55,     // Olahraga ringan/olahraga 1-3 hari/minggu
      'berat': 1.725      // Olahraga sedang/olahraga 3-5 hari/minggu
    };
    
    let tdee = bmr * (activityFactors[aktivitas] || 1.55);
    
    // Penyesuaian berdasarkan porsi makan
    const porsiMultiplier = {
      1: 0.8,   // Makan sedikit
      2: 0.9,   // Makan normal-sedikit
      3: 1.0,   // Makan normal
      4: 1.1,   // Makan agak banyak
      5: 1.2    // Makan banyak
    };
    
    tdee *= (porsiMultiplier[porsi_makan] || 1.0);
    
    return Math.round(tdee);
  };

  // Hitung target kalori berdasarkan profil pengguna (selalu fresh setiap hari)
  useEffect(() => {
    if (userProfile) {
      const targetKalori = calculateTDEE(userProfile);
      debugLog('Calculated target kalori:', targetKalori);
      setUserData(prev => ({
        ...prev,
        targetKalori
      }));
    }
  }, [userProfile]);

  // Status kesehatan berdasarkan BMI
  const calculateBMI = () => {
    if (!userProfile || !userProfile.tinggi_badan || !userProfile.berat_badan) return '0.0';
    
    const { tinggi_badan, berat_badan } = userProfile;
    const tinggiM = tinggi_badan / 100;
    const bmi = berat_badan / (tinggiM * tinggiM);
    
    return isNaN(bmi) ? '0.0' : bmi.toFixed(1);
  };

  const getBMIStatus = () => {
    const bmi = parseFloat(calculateBMI());
    if (bmi < 18.5) return { status: 'Berat badan kurang', color: 'text-blue-600' };
    if (bmi < 25) return { status: 'Berat badan ideal', color: 'text-green-600' };
    if (bmi < 30) return { status: 'Berat badan berlebih', color: 'text-yellow-600' };
    return { status: 'Kegemukan/Obesitas', color: 'text-red-600' };
  };

  // Fungsi untuk handle perubahan tanggal
  const handleDateChange = (event) => {
    debugLog('Date changed to:', event.target.value);
    setSelectedDate(event.target.value);
  };

  const persentaseKalori = userData.targetKalori > 0 ? Math.min((userData.kaloriTerkonsumsi / userData.targetKalori) * 100, 100) : 0;
  const sisaKalori = userData.targetKalori - userData.kaloriTerkonsumsi;
  const circumference = 2 * Math.PI * 80; // radius 80
  const strokeDashoffset = circumference - (persentaseKalori / 100) * circumference;
  const bmiInfo = getBMIStatus();

  const getKategoriColor = (kategori) => {
    const colors = {
      'Sarapan': 'bg-orange-100 text-orange-800',
      'Makan Siang': 'bg-blue-100 text-blue-800',
      'Makan Malam': 'bg-purple-100 text-purple-800',
      'Snack': 'bg-green-100 text-green-800',
      'Minuman': 'bg-yellow-100 text-yellow-800'
    };
    return colors[kategori] || 'bg-gray-100 text-gray-800';
  };

  // Fungsi untuk mendapatkan kalori per kategori
  const getKaloriPerKategori = (kategori) => {
    return userData.makananDimakan
      .filter(makanan => makanan.kategori === kategori)
      .reduce((total, makanan) => total + makanan.kalori, 0);
  };

  // Fungsi untuk refresh data
  const refreshData = async () => {
    debugLog('Refreshing data...');
    setLoading(true);
    await fetchUserData();
    
    // Gunakan userId yang tepat untuk refresh
    const userId = userProfile?.user_id || getUserId();
    if (userId) {
      await fetchRiwayatMakanan(userId, selectedDate);
    }
    setLoading(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-[#f3fdf3] w-full min-h-screen font-sans px-4 py-8 flex flex-col items-center justify-center">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-8 border border-white/20 max-w-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Memuat Data</h2>
            <p className="text-gray-600">Mengambil informasi profil Anda...</p>
          </div>
        </div>
      </div>
    );
  }

  // Check if today is selected
  const isToday = (() => {
    const now = new Date();
    const indonesiaDate = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
    const todayString = indonesiaDate.toISOString().split('T')[0];
    return selectedDate === todayString;
  })();

  return (
    <div className="bg-[#f3fdf3] w-full min-h-screen font-sans px-4 py-8 flex flex-col items-center justify-center bg-veggie-pattern bg-repeat">
      <div className="max-w-6xl mx-auto mb-15">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-900 mb-2">Kalori Harian</h1>
          <p className="text-gray-700">Pantau asupan kalori harian Anda</p>
          
          {/* Environment Info (only in development) */}
          {import.meta.env.VITE_NODE_ENV !== 'production' && (
            <div className="mt-2 text-xs text-gray-500">
              {import.meta.env.VITE_APP_NAME} v{import.meta.env.VITE_APP_VERSION} | {import.meta.env.VITE_NODE_ENV}
            </div>
          )}
          
          {/* Date Selector */}
          <div className="mt-4 mb-4">
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            {!isToday && (
              <p className="text-sm text-gray-600 mt-2">
                Menampilkan data untuk {new Date(selectedDate).toLocaleDateString('id-ID')}
              </p>
            )}
          </div>
          
          {/* Error Notice */}
          {error && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2 max-w-lg mx-auto">
              <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
              <span className="text-sm text-yellow-800">{error}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sebelah Kiri - Lingkaran Kalori */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-8 border border-white/20">
            <div className="flex flex-col items-center">
              <div className="relative mb-8">
                <svg className="transform -rotate-90 w-50 h-50">
                  {/* Background circle */}
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="#e5e7eb"
                    strokeWidth="12"
                    fill="none"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="#5b7f5d"
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={isNaN(strokeDashoffset) ? circumference : strokeDashoffset}
                    className="transition-all duration-1000 ease-in-out"
                  />
                </svg>
                
                {/* Text di tengah lingkaran */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-3xl font-bold text-gray-900">
                    {userData.kaloriTerkonsumsi}
                  </div>
                  <div className="text-sm text-gray-700">dari {userData.targetKalori}</div>
                  <div className="text-xs text-gray-600 mt-1">kalori</div>
                </div>
              </div>
              
              {/* Progress Info */}
              <div className="text-center mb-6">
                <div className="text-2xl font-semibold text-gray-900 mb-1">
                  {Math.round(persentaseKalori)}%
                </div>
                <div className="text-gray-700">Target Tercapai</div>
              </div>
              
              {/* Status Cards */}
              <div className="grid grid-cols-2 gap-4 w-full mb-4">
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <Target className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">Target</div>
                  <div className="font-semibold text-green-700">{userData.targetKalori}</div>
                </div>
                
                <div className={`rounded-xl p-4 text-center ${sisaKalori > 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
                  <TrendingUp className={`w-6 h-6 mx-auto mb-2 ${sisaKalori > 0 ? 'text-blue-600' : 'text-red-600'}`} />
                  <div className="text-sm text-gray-600">Sisa</div>
                  <div className={`font-semibold ${sisaKalori > 0 ? 'text-blue-700' : 'text-red-700'}`}>
                    {sisaKalori > 0 ? sisaKalori : 0}
                  </div>
                </div>
              </div>

              {/* Info BMI */}
              <div className="bg-orange-50 rounded-xl p-4 w-full text-center mb-4">
                <div className="text-sm text-gray-600">BMI Anda</div>
                <div className={`font-semibold ${bmiInfo.color}`}>
                  {calculateBMI()} - {bmiInfo.status}
                </div>
              </div>
              
              {/* Refresh Button */}
              <div className="mb-4 w-full">
                <button 
                  onClick={refreshData}
                  disabled={loading}
                  className="w-full bg-gray-100 text-gray-700 font-medium py-2 px-4 rounded-lg hover:bg-gray-200 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Memuat...' : 'Refresh Data'}
                </button>
              </div>
              
              {/* Button Beranda */}
              <div className="mt-2 pt-6 border-t border-gray-200 w-full px-4">
                <button 
                  onClick={() => window.location.href = '/beranda'}
                  className="w-full bg-[#5b7f5d] text-white font-semibold py-4 px-8 rounded-xl hover:bg-[#4a6b4d] transition-all duration-200 flex items-center justify-center gap-2 min-w-full shadow-lg"
                >
                  <LayoutGrid className="w-5 h-5" />
                  Beranda
                </button>
              </div>
            </div>
          </div>

          {/* Sebelah Kanan - Informasi Makanan */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-8 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {isToday ? 'Makanan Hari Ini' : `Makanan ${new Date(selectedDate).toLocaleDateString('id-ID')}`}
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Utensils className="w-4 h-4" />
                <span>{userData.makananDimakan.length} item</span>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3 mb-10">
              <div className="bg-orange-50 rounded-lg p-6 text-center">
                <div className="text-xs text-orange-600 mb-1">Sarapan</div>
                <div className="font-semibold text-orange-800">{getKaloriPerKategori('Sarapan')} kal</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-6 text-center">
                <div className="text-xs text-blue-600 mb-1">Makan Siang</div>
                <div className="font-semibold text-blue-800">{getKaloriPerKategori('Makan Siang')} kal</div>
              </div>
              <div className="bg-green-50 rounded-lg p-6 text-center">
                <div className="text-xs text-green-600 mb-1">Snack & Lainnya</div>
                <div className="font-semibold text-green-800">
                  {getKaloriPerKategori('Snack') + getKaloriPerKategori('Minuman') + getKaloriPerKategori('Makan Malam')} kal
                </div>
              </div>
            </div>

            {/* Daftar Makanan */}
            <div className="space-y-5 max-h-98 overflow-y-auto">
              {userData.makananDimakan.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Utensils className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Belum ada makanan yang tercatat</p>
                  <p className="text-sm">
                    {isToday ? 'Scan makanan untuk mulai mencatat' : 'Tidak ada data untuk tanggal ini'}
                  </p>
                </div>
              ) : (
                userData.makananDimakan.map((makanan, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50/80 backdrop-blur-sm rounded-xl hover:bg-gray-100/80 transition-colors border border-white/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                        <Utensils className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{makanan.nama}</div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-3 h-3" />
                          <span>{makanan.waktu}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{makanan.kalori} kal</div>
                      <div className={`text-xs px-2 py-1 rounded-full ${getKategoriColor(makanan.kategori)}`}>
                        {makanan.kategori}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Tombol Scan Makanan - Hanya tampil jika hari ini */}
            {isToday && (
              <div className="mt-2 pt-6 border-t border-gray-200 w-full px-4">
                <button 
                  onClick={() => window.location.href = '/scan'}
                  className="w-full bg-[#5b7f5d] text-white font-semibold py-4 px-8 rounded-xl hover:bg-[#4a6b4d] transition-all duration-200 flex items-center justify-center gap-2 min-w-full shadow-lg"
                >
                  <Utensils className="w-5 h-5" />
                  Scan Makanan
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default KaloriHarian;