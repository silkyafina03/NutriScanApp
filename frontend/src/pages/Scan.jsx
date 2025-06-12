import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../styles/Scan.css';
import { predictFood, preloadModel, isModelLoaded } from '../utils/modelloader'; 

function Scan() {
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [currentStream, setCurrentStream] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false); // Tambahan: status apakah sudah disimpan
  const navigate = useNavigate();

  // Load ML model saat komponen mount
  useEffect(() => {
  const initializeModel = async () => {
    try {
      setIsLoading(true);
      await preloadModel(); // Gunakan fungsi dari modelLoader
      setModelLoaded(true);
      console.log('Model berhasil dimuat');
    } catch (error) {
      console.error('Gagal memuat model:', error);
      setError('Gagal memuat model AI. Silakan coba lagi nanti.');
      setModelLoaded(false);
    } finally {
      setIsLoading(false);
    }
  };

  initializeModel();
}, []);

  // Database makanan dengan nutrisi lengkap
  const getCurrentUserId = () => {
    const userId = localStorage.getItem('user_id');
    if (userId) return userId;

    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    if (userData.id) return userData.id;

    return null; // Atau throw error kalau tidak ada
  };

  // Fungsi untuk menyimpan ke database riwayat
  const saveToHistory = async (scanData) => {
    try {
      setIsSaving(true);
      
      const userId = getCurrentUserId();
      if (!userId) {
        throw new Error('User ID tidak ditemukan. Silakan login kembali.');
      }

      const historyData = {
        user_id: userId,
        image: scanData.image,
        name: scanData.name,
        calories: scanData.calories,
        protein: scanData.protein,
        carbs: scanData.carbs,
        fat: scanData.fat,
        tanggal: new Date().toISOString().split('T')[0] // Format YYYY-MM-DD
      };

      console.log('Mengirim data ke riwayat:', historyData);

      const response = await fetch('http://localhost:5000/api/riwayat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(historyData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal menyimpan ke riwayat');
      }

      console.log('✅ Berhasil disimpan ke riwayat:', result);
      
      // Tampilkan notifikasi sukses
      showNotification('✅ Hasil scan berhasil disimpan ke riwayat!', 'success');
      
      // Set status tersimpan
      setIsSaved(true);
      
      return result;

    } catch (error) {
      console.error('❌ Error menyimpan ke riwayat:', error);
      showNotification(`❌ Gagal menyimpan ke riwayat: ${error.message}`, 'error');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Fungsi untuk menampilkan notifikasi
  const showNotification = (message, type = 'success') => {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? '#10b981' : '#ef4444';
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${bgColor};
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      font-weight: 500;
      max-width: 90%;
      text-align: center;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 4000);
  };

  // Buka kamera langsung
  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setScanResult(null);
      setShowCamera(true);
      setIsSaved(false); // Reset status penyimpanan
      
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      if (!videoRef.current) {
        throw new Error('Video element not available');
      }

      videoRef.current.srcObject = stream;
      
      videoRef.current.onloadedmetadata = () => {
        if (videoRef.current) {
          videoRef.current.play();
          setIsLoading(false);
        }
      };
      
      setCurrentStream(stream);

    } catch (err) {
      console.error('Camera error:', err);
      setError('Tidak bisa mengakses kamera. Pastikan memberikan izin kamera.');
      setIsLoading(false);
      setShowCamera(false);
    }
  };

  // Ambil foto dari kamera
  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setPreviewImage(imageData);
    setIsSaved(false); // Reset status penyimpanan

    stopCamera();
  };

  // Stop kamera
  const stopCamera = () => {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
      setCurrentStream(null);
    }
    setShowCamera(false);
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File terlalu besar. Maksimal 5MB.');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setError('File harus berupa gambar.');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImage(reader.result);
        setScanResult(null);
        setError(null);
        setIsSaved(false); // Reset status penyimpanan
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper function untuk mengkonversi image ke format yang dibutuhkan model
  // Process image dengan ML model - TIDAK OTOMATIS SIMPAN
  const processImage = async () => {
    if (!previewImage) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      let foodResult;
      
      if (modelLoaded && isModelLoaded()) {
        try {
          // Buat image element untuk model
          const img = new Image();
          img.src = previewImage;
          
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });
          
          // Prediksi menggunakan model loader
          const prediction = await predictFood(img);
          
          console.log('Hasil prediksi ML:', prediction);
          
          // Siapkan hasil untuk ditampilkan
          foodResult = {
            name: prediction.predictedClass.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            description: `Makanan ${prediction.predictedClass} yang terdeteksi dengan AI`,
            calories: prediction.nutrition.calories,
            protein: prediction.nutrition.proteins,
            carbs: prediction.nutrition.carbohydrate,
            fat: prediction.nutrition.fat,
            confidence: prediction.confidence,
            detectionMethod: 'AI Model',
            emoji: getFoodEmoji(prediction.predictedClass),
            allPredictions: prediction.allPredictions,
            originalClass: prediction.predictedClass
          };
          
        } catch (mlError) {
          console.error('Error ML prediction:', mlError);
          setError('Gagal menganalisis gambar dengan AI. Silakan coba lagi.');
          setIsLoading(false);
          return;
        }
      } else {
        setError('Model AI belum siap. Silakan tunggu atau refresh halaman.');
        setIsLoading(false);
        return;
      }
      
      // Set scan result dengan format yang sesuai untuk database
      const scanResultData = {
        ...foodResult,
        image: previewImage,
        timestamp: new Date().toLocaleString('id-ID'),
        // Pastikan nilai numerik untuk database
        calories: typeof foodResult.calories === 'number' ? foodResult.calories : 0,
        protein: typeof foodResult.protein === 'number' ? foodResult.protein : 0,
        carbs: typeof foodResult.carbs === 'number' ? foodResult.carbs : 0,
        fat: typeof foodResult.fat === 'number' ? foodResult.fat : 0,
      };
      
      setScanResult(scanResultData);
      setIsLoading(false);
      
    } catch (error) {
      console.error('Process image error:', error);
      setError('Gagal menganalisis gambar. Silakan coba lagi.');
      setIsLoading(false);
    }
  };

  // Reset
  const resetScan = () => {
    setPreviewImage(null);
    setScanResult(null);
    setError(null);
    setIsSaved(false); // Reset status penyimpanan
    stopCamera();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Save result - fungsi utama untuk menyimpan
  const saveResult = async () => {
    if (!scanResult) return;
    
    try {
      // Simpan ke localStorage sebagai backup
      const savedScans = JSON.parse(localStorage.getItem('foodScans') || '[]');
      savedScans.push({
        ...scanResult,
        id: Date.now()
      });
      localStorage.setItem('foodScans', JSON.stringify(savedScans));
      
      // Simpan ke database
      await saveToHistory(scanResult);
      
    } catch (error) {
      console.error('Error saving result:', error);
    }
  };

  const getFoodEmoji = (className) => {
    const emojiMap = {
      'sate': '🍢',
      'rawon': '🍲',
      'nasi_goreng': '🍛',
      'soto': '🍲',
      'bakso': '🍲',
      'rendang': '🍖',
      'gado_gado': '🥗',
      'gudeg': '🍛',
      'pempek': '🍤',
      'bebek_betutu': '🦆'
    };
    
    return emojiMap[className] || '🍽️';
  };

  return (
    <>
      <Navbar />
      <section className="bg-[#f3fdf3] w-full min-h-screen font-sans px-4 py-8 flex flex-col items-center justify-center bg-veggie-pattern bg-repeat">
        <div className="bg-white bg-opacity-90 px-6 py-4 rounded-lg shadow text-center mb-6">
          <h2 className="text-green-800 text-2xl font-semibold">Scan Sekarang</h2>
          <p className="text-gray-600 text-sm mt-1">
            Ambil foto makanan untuk analisis nutrisi! 
            
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 max-w-md relative">
            <span className="block sm:inline">{error}</span>
            <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
              <span className="text-red-500 text-xl">&times;</span>
            </button>
          </div>
        )}

        {/* Loading */}
        {(isLoading || isSaving) && (
          <div className="flex flex-col items-center justify-center mb-4 p-4 bg-white bg-opacity-90 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-2"></div>
            <span className="text-green-600 font-medium">
              {isSaving ? 'Menyimpan ke riwayat...' :
               !modelLoaded && !previewImage ? 'Memuat model AI...' :
               previewImage ? (modelLoaded ? 'Menganalisis dengan AI...' : 'Menganalisis gambar...') : 
               'Membuka kamera...'}
            </span>
          </div>
        )}

        {/* Camera View */}
        {showCamera && !previewImage && (
          <div className="w-full max-w-md flex flex-col items-center gap-4 mb-6">
            <div className="relative bg-black rounded-lg overflow-hidden shadow-lg">
              <video 
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-lg"
                style={{ 
                  transform: 'scaleX(-1)',
                  width: '100%',
                  height: '300px',
                  objectFit: 'cover'
                }}
              />
            </div>
            <div className="button-group">
              <button onClick={takePhoto} className="scan-button" disabled={isSaving}>
                📸 Ambil Foto
              </button>
              <button onClick={stopCamera} className="cancel-button" disabled={isSaving}>
                ❌ Tutup Kamera
              </button>
            </div>
          </div>
        )}

        {/* Main buttons */}
        {!showCamera && !previewImage && !isLoading && !scanResult && (
          <div className="flex flex-col md:flex-row gap-6">
            <button onClick={startCamera} className="icon-button" disabled={isSaving}>
              <img src="/images/camera.png" alt="Kamera" className="w-22 h-22 mb-2" />
              Buka Kamera
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="icon-button" disabled={isSaving}>
              <img src="/images/upload.png" alt="Upload" className="w-20 h-20 mb-2" />
              Upload Gambar
            </button>
          </div>
        )}

        {/* File input */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          disabled={isSaving}
        />

        {/* Canvas for capture */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Preview result */}
        {previewImage && !isLoading && !scanResult && (
          <div className="w-full max-w-md flex flex-col items-center gap-4 mt-6">
            <div className="relative">
              <img 
                src={previewImage} 
                alt="Hasil foto" 
                className="rounded-lg shadow-lg w-full max-w-sm border-4 border-green-200"
              />
            </div>
            <div className="button-group">
              <button onClick={processImage} className="scan-button" disabled={isSaving}>
                {modelLoaded ? 'Scan dengan AI' : 'Scan Makanan'}
              </button>
              <button onClick={resetScan} className="cancel-button" disabled={isSaving}>
                Foto Lagi
              </button>
            </div>
          </div>
        )}

        {/* Scan Result Display */}
        {scanResult && (
          <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-6 mt-6">
            <div className="text-center mb-10">
              <h3 className="text-2xl font-bold text-green-800 flex items-center justify-center gap-2">
                {scanResult.emoji} {scanResult.name}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Image */}
              <div>
                <img 
                  src={scanResult.image} 
                  alt={scanResult.name}
                  className="w-full rounded-lg shadow-md"
                />
              </div>

              {/* Nutrition Info */}
              <div>
                <div><p className="text-center text-gray-600 mb-6">Tanggal: {scanResult.timestamp}</p></div>
                <div className="bg-green-50 rounded-lg p-4 mb-4">
                  <h4 className="font-bold  text-xl text-center text-green-900 mb-5">Informasi Nutrisi</h4>
                  <div className="grid grid-cols-1 gap-3 text-m mb-3">
                    <div>
                      <span className="text-black-900">Kalori: </span>
                      <span className="font-medium ml-17">{scanResult.calories} kcal</span>
                    </div>
                    <div>
                      <span className="text-black-900">Protein:</span>
                      <span className="font-medium ml-16">{scanResult.protein}g</span>
                    </div>
                    <div>
                      <span className="text-black-900">Karbohidrat:</span>
                      <span className="font-medium ml-8">{scanResult.carbs}g</span>
                    </div>
                    <div>
                      <span className="text-black-900">Lemak:</span>
                      <span className="font-medium ml-17">{scanResult.fat}g</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status penyimpanan - DIUBAH */}
            <div className="text-center mb-8">
              {isSaved ? (
                <p className="text-sm text-green-600">
                  Hasil scan telah disimpan ke riwayat
                </p>
              ) : (
                <p className="text-sm text-orange-600">
                  
                </p>
              )}
            </div>

            {/* Action Buttons - DIUBAH */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
              <button 
                onClick={saveResult} 
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                  isSaved 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
                disabled={isSaving || isSaved}
              >
                {isSaving ? 'Menyimpan...' : 
                 isSaved ? 'Sudah Disimpan' : 
                 'Simpan ke Riwayat'}
              </button>
              <button 
                onClick={resetScan} 
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                disabled={isSaving}
              >
                Scan Lagi
              </button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}

export default Scan;