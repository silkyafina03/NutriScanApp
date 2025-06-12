import { Routes, Route } from 'react-router-dom'
import './App.css'
import Beranda from './pages/Beranda'
import Scan from './pages/Scan'
import Profil from './pages/Profil'
import EditProfil from './pages/Edit-Profil'
import Form from './pages/Form'
import Riwayat from './pages/Riwayat'
import KaloriHarian from './pages/Kalori-Harian'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Form />} />
      <Route path="/beranda" element={<Beranda />} />
      <Route path="/Scan" element={<Scan />} />
      <Route path="/Form" element={<Form />} />
      <Route path="/Profil" element={<Profil />} />
      <Route path="/Edit-Profil" element={<EditProfil />} />
      <Route path="/Riwayat" element={<Riwayat />} />
      <Route path="/Kalori-Harian" element={<KaloriHarian />} />
    </Routes>
  )
}

export default App