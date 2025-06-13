const express = require('express');
const router = express.Router();
const { db } = require('../db');

// GET /api/users/:id → Ambil data pengguna berdasarkan ID
router.get('/:id', (req, res) => {
  const userId = req.params.id;
   
  // Validasi ID
  if (!userId || isNaN(userId)) {
    return res.status(400).json({ error: 'ID pengguna tidak valid.' });
  }
 
  // 🔥 UBAH DARI 'id' MENJADI 'user_id'
  const sql = 'SELECT * FROM users WHERE user_id = ?';
   
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('❌ Gagal mengambil data pengguna:', err);
      return res.status(500).json({ error: 'Gagal mengambil data pengguna.' });
    }
 
    if (results.length === 0) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    }
 
    res.status(200).json({
      message: '✅ Data pengguna berhasil diambil.',
      user: results[0]
    });
  });
});

// GET /api/users → Ambil semua data pengguna
router.get('/', (req, res) => {
  // 🔥 UBAH DARI 'id' MENJADI 'user_id'
  const sql = 'SELECT * FROM users ORDER BY user_id DESC';
   
  db.query(sql, (err, results) => {
    if (err) {
      console.error('❌ Gagal mengambil data pengguna:', err);
      return res.status(500).json({ error: 'Gagal mengambil data pengguna.' });
    }
 
    res.status(200).json({
      message: '✅ Data pengguna berhasil diambil.',
      users: results,
      total: results.length
    });
  });
});

// POST /api/users → Simpan data pengguna (ini sudah benar)
router.post('/', (req, res) => {
  const {
    jenis_kelamin,
    usia,
    tinggi_badan,
    berat_badan,
    aktivitas,
    porsi_makan
  } = req.body;
 
  if (
    !jenis_kelamin || !usia || !tinggi_badan ||
    !berat_badan || !aktivitas || !porsi_makan
  ) {
    return res.status(400).json({ error: 'Semua field wajib diisi.' });
  }
 
  const sql = `
    INSERT INTO users 
    (jenis_kelamin, usia, tinggi_badan, berat_badan, aktivitas, porsi_makan)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
 
  const values = [
    jenis_kelamin,
    usia,
    tinggi_badan,
    berat_badan,
    aktivitas,
    porsi_makan
  ];
 
  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('❌ Gagal menyimpan data pengguna:', err);
      return res.status(500).json({ error: 'Gagal menyimpan data pengguna.' });
    }
 
    res.status(201).json({
      message: '✅ Data pengguna berhasil disimpan.',
      user_id: result.insertId
    });
  });
});

module.exports = router;