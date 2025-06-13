import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Form.css';
import { postData } from '../utils/api'; // Import the API utility

function Form() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    jenis_kelamin: '',
    usia: '',
    tinggi_badan: '',
    berat_badan: '',
    aktivitas: '',
    porsi_makan: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.jenis_kelamin) newErrors.jenis_kelamin = 'Jenis kelamin harus dipilih';
    if (!formData.usia || formData.usia < 1 || formData.usia > 120) newErrors.usia = 'Usia harus antara 1-120 tahun';
    if (!formData.tinggi_badan || formData.tinggi_badan < 50 || formData.tinggi_badan > 250) newErrors.tinggi_badan = 'Tinggi badan harus antara 50-250 cm';
    if (!formData.berat_badan || formData.berat_badan < 10 || formData.berat_badan > 500) newErrors.berat_badan = 'Berat badan harus antara 10-500 kg';
    if (!formData.aktivitas) newErrors.aktivitas = 'Aktivitas harus dipilih';
    if (!formData.porsi_makan || formData.porsi_makan < 1 || formData.porsi_makan > 10) newErrors.porsi_makan = 'Porsi makan harus antara 1-10 porsi';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data to send
      const dataToSend = {
        jenis_kelamin: formData.jenis_kelamin,
        usia: parseInt(formData.usia),
        tinggi_badan: parseFloat(formData.tinggi_badan),
        berat_badan: parseFloat(formData.berat_badan),
        aktivitas: formData.aktivitas,
        porsi_makan: parseInt(formData.porsi_makan)
      };

      // Use the API utility to send data
      const result = await postData('/api/users', dataToSend);
      
      // Extract user ID from response
      const userId = result.id || result.data?.id || result.user?.id || result.user?.user_id || result.user_id;
      
      if (!userId) {
        console.log('Response dari server:', result);
        throw new Error('ID tidak diterima dari server');
      }
      
      // Store user data in memory (no localStorage in production)
      const completeUserData = {
        id: userId,
        ...dataToSend
      };
      
      // For development purposes, you might want to store in localStorage
      // Remove these lines in production or use a state management solution
      if (import.meta.env.VITE_NODE_ENV !== 'production') {
        localStorage.setItem('user_id', userId.toString());
        localStorage.setItem('user_data', JSON.stringify(completeUserData));
      }
      
      // Show success message
      alert(`Data berhasil disimpan! User ID: ${userId}`);

      // Reset form data
      setFormData({
        jenis_kelamin: '',
        usia: '',
        tinggi_badan: '',
        berat_badan: '',
        aktivitas: '',
        porsi_makan: '',
      });

      // Navigate to Beranda page
      navigate('/beranda');

    } catch (error) {
      console.error('Error submitting form:', error);
      
      // Show user-friendly error message
      let errorMessage = 'Terjadi kesalahan saat mengirim data.';
      
      if (error.message.includes('timeout')) {
        errorMessage = 'Koneksi timeout. Silakan coba lagi.';
      } else if (error.message.includes('Network')) {
        errorMessage = 'Masalah koneksi jaringan. Periksa koneksi internet Anda.';
      } else if (error.status === 400) {
        errorMessage = 'Data yang dikirim tidak valid. Periksa kembali form Anda.';
      } else if (error.status === 500) {
        errorMessage = 'Terjadi kesalahan pada server. Silakan coba lagi nanti.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const ChevronDownIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );

  return (
    <section className="form-container relative w-full min-h-screen font-sans">
      <div className="flex justify-center items-center min-h-screen px-4 py-8">
        <div className="form-card bg-white/40 backdrop-blur-xl shadow-lg p-8 rounded-2xl w-full max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Form Data User</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Jenis Kelamin */}
              <div className="relative">
                <label className="block mb-1 font-medium text-gray-700">Jenis Kelamin</label>
                <div className="relative">
                  <select
                    name="jenis_kelamin"
                    value={formData.jenis_kelamin}
                    onChange={handleChange}
                    className={`form-select w-full p-3 rounded-lg bg-white/60 backdrop-blur border border-gray-300 focus:outline-none focus:border-[#5b7f5d] transition text-gray-800 appearance-none cursor-pointer ${
                      errors.jenis_kelamin ? 'error border-red-400 focus:border-red-400' : ''
                    }`}
                  >
                    <option value="">Pilih jenis kelamin</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">
                    <ChevronDownIcon />
                  </div>
                </div>
                {errors.jenis_kelamin && (
                  <p className="mt-2 text-sm text-red-600">{errors.jenis_kelamin}</p>
                )}
              </div>

              {/* Usia */}
              <div className="relative">
                <label className="block mb-1 font-medium text-gray-700">Usia (tahun)</label>
                <input
                  type="number"
                  name="usia"
                  value={formData.usia}
                  onChange={handleChange}
                  placeholder="Masukkan usia"
                  min="1"
                  max="120"
                  className={`form-input w-full p-3 rounded-lg bg-white/60 backdrop-blur border border-gray-300 focus:outline-none focus:border-[#5b7f5d] transition text-gray-800 placeholder-gray-400 ${
                    errors.usia ? 'error border-red-400 focus:border-red-400' : ''
                  }`}
                />
                {errors.usia && (
                  <p className="mt-2 text-sm text-red-600">{errors.usia}</p>
                )}
              </div>

              {/* Tinggi Badan */}
              <div className="relative">
                <label className="block mb-1 font-medium text-gray-700">Tinggi Badan (cm)</label>
                <input
                  type="number"
                  name="tinggi_badan"
                  value={formData.tinggi_badan}
                  onChange={handleChange}
                  placeholder="Masukkan tinggi badan"
                  min="50"
                  max="250"
                  step="0.1"
                  className={`form-input w-full p-3 rounded-lg bg-white/60 backdrop-blur border border-gray-300 focus:outline-none focus:border-[#5b7f5d] transition text-gray-800 placeholder-gray-400 ${
                    errors.tinggi_badan ? 'error border-red-400 focus:border-red-400' : ''
                  }`}
                />
                {errors.tinggi_badan && (
                  <p className="mt-2 text-sm text-red-600">{errors.tinggi_badan}</p>
                )}
              </div>

              {/* Berat Badan */}
              <div className="relative">
                <label className="block mb-1 font-medium text-gray-700">Berat Badan (kg)</label>
                <input
                  type="number"
                  name="berat_badan"
                  value={formData.berat_badan}
                  onChange={handleChange}
                  placeholder="Masukkan berat badan"
                  min="10"
                  max="500"
                  step="0.1"
                  className={`form-input w-full p-3 rounded-lg bg-white/60 backdrop-blur border border-gray-300 focus:outline-none focus:border-[#5b7f5d] transition text-gray-800 placeholder-gray-400 ${
                    errors.berat_badan ? 'error border-red-400 focus:border-red-400' : ''
                  }`}
                />
                {errors.berat_badan && (
                  <p className="mt-2 text-sm text-red-600">{errors.berat_badan}</p>
                )}
              </div>

              {/* Aktivitas */}
              <div className="relative">
                <label className="block mb-1 font-medium text-gray-700">Aktivitas</label>
                <div className="relative">
                  <select
                    name="aktivitas"
                    value={formData.aktivitas}
                    onChange={handleChange}
                    className={`form-select w-full p-3 rounded-lg bg-white/60 backdrop-blur border border-gray-300 focus:outline-none focus:border-[#5b7f5d] transition text-gray-800 appearance-none cursor-pointer ${
                      errors.aktivitas ? 'error border-red-400 focus:border-red-400' : ''
                    }`}
                  >
                    <option value="">Pilih tingkat aktivitas</option>
                    <option value="ringan">Ringan</option>
                    <option value="sedang">Sedang</option>
                    <option value="berat">Berat</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">
                    <ChevronDownIcon />
                  </div>
                </div>
                {errors.aktivitas && (
                  <p className="mt-2 text-sm text-red-600">{errors.aktivitas}</p>
                )}
              </div>

              {/* Porsi Makan */}
              <div className="relative">
                <label className="block mb-1 font-medium text-gray-700">Porsi Makan (porsi/hari)</label>
                <input
                  type="number"
                  name="porsi_makan"
                  value={formData.porsi_makan}
                  onChange={handleChange}
                  placeholder="Jumlah porsi makan"
                  min="1"
                  max="10"
                  className={`form-input w-full p-3 rounded-lg bg-white/60 backdrop-blur border border-gray-300 focus:outline-none focus:border-[#5b7f5d] transition text-gray-800 placeholder-gray-400 ${
                    errors.porsi_makan ? 'error border-red-400 focus:border-red-400' : ''
                  }`}
                />
                {errors.porsi_makan && (
                  <p className="mt-2 text-sm text-red-600">{errors.porsi_makan}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`form-button mt-8 w-full bg-[#5b7f5d] hover:bg-[#4a6b4c] text-white py-3 rounded-lg font-semibold transition ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Mengirim...' : 'Kirim Data'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default Form;