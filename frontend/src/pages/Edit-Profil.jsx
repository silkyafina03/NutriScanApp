import React, { useState, useEffect } from 'react';
import { Camera, User, Loader2 } from 'lucide-react';
import { getData, postData, putData } from '../utils/api';

export default function AddEditProfile() {
  const [profileData, setProfileData] = useState({
    nama: '',
    foto: null,
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isNewProfile, setIsNewProfile] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    checkExistingProfile();
  }, []);

  const checkExistingProfile = async () => {
    try {
      setInitialLoading(true);
      const userId = localStorage.getItem('user_id') || '1';
      
      if (!userId) {
        setError('User belum login atau user_id tidak ditemukan');
        setInitialLoading(false);
        return;
      }

      const existingProfile = await getData(`/api/profil/${userId}`);
      
      if (existingProfile) {
        console.log('Existing profile found:', existingProfile);
        
        setProfileData({
          nama: existingProfile.nama || '',
          foto: null // Reset foto, user harus upload ulang
        });
        
        // Set preview dari data yang ada (jika ada)
        if (existingProfile.foto) {
          setPhotoPreview(existingProfile.foto);
        }
        
        setIsNewProfile(false);
      }
    } catch (error) {
      console.log('No existing profile found or error occurred:', error.message);
      
      // Jika error 404, berarti profil belum ada
      if (error.status === 404) {
        setIsNewProfile(true);
      } else {
        console.error('Error checking existing profile:', error);
        // Tetap set sebagai new profile jika ada error lain
        setIsNewProfile(true);
      }
    } finally {
      setInitialLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user starts typing
    if (error && name === 'nama' && value.trim()) {
      setError('');
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran file tidak boleh lebih dari 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('File harus berupa gambar');
        return;
      }

      setError('');
      setProfileData((prev) => ({
        ...prev,
        foto: file,
      }));

      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSave = async () => {
    // Validasi nama
    if (!profileData?.nama || !profileData.nama.trim()) {
      setError('Nama tidak boleh kosong');
      return;
    }

    // Validasi foto - wajib untuk profil baru, opsional untuk update
    if (isNewProfile && !profileData.foto) {
      setError('Foto profil wajib diupload untuk profil baru');
      return;
    }

    const userId = localStorage.getItem('user_id') || '1';
    
    if (!userId) {
      setError('User belum login atau user_id tidak ditemukan');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      let base64String = null;
      
      // Convert foto ke base64 jika ada foto baru
      if (profileData.foto) {
        base64String = await convertFileToBase64(profileData.foto);
      }
      
      // Prepare request data
      const requestData = {
        user_id: String(userId),
        nama: String(profileData.nama.trim()),
      };
      
      // Only include foto if there's a new one
      if (base64String) {
        requestData.foto = String(base64String);
      }
      
      let result;
      
      if (isNewProfile) {
        // Create new profile
        result = await postData('/api/profil', requestData);
      } else {
        // Update existing profile
        result = await putData(`/api/profil/${userId}`, requestData);
      }
      
      console.log('Profile operation successful:', result);
      
      // Show success message
      const successMessage = isNewProfile ? 'Profil berhasil dibuat!' : 'Profil berhasil diperbarui!';
      alert(successMessage);
      
      // Redirect to profile page
      if (window.location.pathname.includes('/profil')) {
        window.location.reload();
      } else {
        window.location.href = '/profil';
      }
      
    } catch (error) {
      console.error('Error saving profile:', error);
      
      let errorMessage = 'Terjadi kesalahan saat menyimpan profil';
      
      if (error.status === 400) {
        errorMessage = error.message || 'Data yang dikirim tidak valid';
      } else if (error.status === 401) {
        errorMessage = 'Anda tidak memiliki akses untuk melakukan operasi ini';
      } else if (error.status === 404) {
        errorMessage = 'Profil tidak ditemukan';
      } else if (error.status === 500) {
        errorMessage = 'Terjadi kesalahan server. Silakan coba lagi nanti';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Koneksi timeout. Periksa koneksi internet Anda';
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/profil';
    }
  };

  // Show loading state while checking existing profile
  if (initialLoading) {
    return (
      <div className="form-container relative w-full min-h-screen font-sans bg-gradient-to-br from-blue-50 to-green-50">
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-600" />
            <p className="text-gray-600">Memuat data profil...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="form-container relative w-full min-h-screen font-sans bg-gradient-to-br from-blue-50 to-green-50">
      <div className="flex justify-center items-center min-h-screen px-4 py-8">
        <div className="form-card bg-white/60 backdrop-blur-xl shadow-xl p-8 rounded-3xl w-full max-w-lg border border-white/20">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {isNewProfile ? 'Buat Profil' : 'Edit Profil'}
            </h1>
            <p className="text-gray-600 text-sm">
              {isNewProfile ? 'Lengkapi profil Anda untuk memulai' : 'Perbarui informasi profil Anda'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100/80 backdrop-blur border border-red-300 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="mb-8">
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <div className="w-32 h-32 rounded-full border-4 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-lg" style={{borderColor: '#5b7f5d'}}>
                  {photoPreview ? (
                    <img src={photoPreview} alt="Profile Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-16 h-16 text-gray-400" />
                  )}
                </div>
                <label
                  htmlFor="photo-upload"
                  className="absolute -bottom-1 -right-1 text-white p-3 rounded-full cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                  style={{
                    backgroundColor: '#5b7f5d',
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#4a6b4e'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#5b7f5d'}
                >
                  <Camera className="w-5 h-5" />
                </label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                  disabled={isLoading}
                />
              </div>
              {!isNewProfile && (
                <p className="text-xs text-gray-500 text-center">
                  Upload foto baru jika ingin mengubah foto profil
                </p>
              )}
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-gray-700 font-semibold mb-3">Nama Lengkap</label>
            <input
              type="text"
              name="nama"
              value={profileData.nama}
              onChange={handleInputChange}
              placeholder="Masukkan nama lengkap"
              disabled={isLoading}
              className="w-full px-4 py-4 border border-gray-200 rounded-xl outline-none transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed bg-white/60 backdrop-blur text-gray-800 placeholder-gray-400"
              style={{
                focusRingColor: '#5b7f5d',
              }}
              onFocus={(e) => e.target.style.borderColor = '#5b7f5d'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={isLoading || !profileData?.nama?.trim() || (isNewProfile && !profileData.foto)}
            className="w-full text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center text-lg disabled:cursor-not-allowed"
            style={{
              background: isLoading || !profileData?.nama?.trim() || (isNewProfile && !profileData.foto)
                ? 'linear-gradient(to right, #9ca3af, #9ca3af)' 
                : 'linear-gradient(to right, #5b7f5d, #4a6b4e)',
            }}
            onMouseEnter={(e) => {
              if (!e.target.disabled) {
                e.target.style.background = 'linear-gradient(to right, #4a6b4e, #3f5a42)';
              }
            }}
            onMouseLeave={(e) => {
              if (!e.target.disabled) {
                e.target.style.background = 'linear-gradient(to right, #5b7f5d, #4a6b4e)';
              }
            }}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                {isNewProfile ? 'Membuat...' : 'Menyimpan...'}
              </>
            ) : (
              isNewProfile ? 'Buat Profil' : 'Simpan Perubahan'
            )}
          </button>

          <div className="text-center mt-6">
            <button
              className="text-gray-500 hover:text-gray-700 text-sm transition-colors disabled:opacity-50 font-medium"
              disabled={isLoading}
              onClick={handleBack}
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}