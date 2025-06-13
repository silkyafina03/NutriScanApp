const express = require('express');
const router = express.Router();
const { db } = require('../db');

// GET profil berdasarkan user_id
router.get('/:user_id', (req, res) => {
  const { user_id } = req.params;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id wajib diisi.' });
  }

  const sql = 'SELECT * FROM profil WHERE user_id = ?';
  db.query(sql, [user_id], (err, result) => {
    if (err) {
      console.error('❌ Gagal mengambil profil:', err);
      return res.status(500).json({ error: 'Gagal mengambil data profil.' });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: 'Profil tidak ditemukan.' });
    }

    res.status(200).json(result[0]);
  });
});

// Simpan data profil (1 profil untuk 1 user saja)
// Simpan data profil (1 profil untuk 1 user saja)
router.post('/', (req, res) => {
  console.log('=== RAW REQUEST HEADERS ===');
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Content-Length:', req.headers['content-length']);
  
  console.log('=== RAW REQUEST BODY ===');
  console.log('req.body:', req.body);
  console.log('req.body type:', typeof req.body);
  console.log('req.body keys:', Object.keys(req.body || {}));
  console.log('req.body stringified:', JSON.stringify(req.body));
  
  // Coba akses langsung
  console.log('=== DIRECT ACCESS TEST ===');
  console.log('req.body.user_id:', req.body.user_id);
  console.log('req.body.nama:', req.body.nama);
  console.log('req.body.foto exists:', !!req.body.foto);
  
  const { user_id, nama, foto } = req.body;

  console.log('=== EXTRACTED VALUES ===');
  console.log('user_id:', user_id, '(type:', typeof user_id, ')');
  console.log('nama:', nama, '(type:', typeof nama, ')');
  console.log('foto:', foto ? 'present (length: ' + foto.length + ')' : 'missing', '(type:', typeof foto, ')');

  // Validasi yang lebih spesifik
  if (!user_id || user_id === '' || user_id === 'undefined' || user_id === 'null') {
    console.log('❌ user_id validation failed:', user_id);
    return res.status(400).json({ error: 'user_id wajib diisi dan tidak boleh kosong.' });
  }
  
  if (!nama || nama.trim() === '' || nama === 'undefined' || nama === 'null') {
    console.log('❌ nama validation failed:', nama);
    return res.status(400).json({ error: 'nama wajib diisi dan tidak boleh kosong.' });
  }
  
  if (!foto || foto === '' || foto === 'undefined' || foto === 'null') {
    console.log('❌ foto validation failed:', foto ? 'exists but invalid' : 'missing');
    return res.status(400).json({ error: 'foto wajib diisi dan tidak boleh kosong.' });
  }

  // Cek apakah user ini sudah punya profil
  const checkSql = 'SELECT * FROM profil WHERE user_id = ?';
  db.query(checkSql, [user_id], (err, result) => {
    if (err) {
      console.error('❌ Gagal mengecek profil:', err);
      return res.status(500).json({ error: 'Gagal memeriksa profil user.' });
    }

    if (result.length > 0) {
      return res.status(409).json({ error: 'User ini sudah memiliki profil.' });
    }

    // Simpan profil baru
    const insertSql = `
      INSERT INTO profil (user_id, nama, foto)
      VALUES (?, ?, ?)
    `;
    const values = [user_id, nama.trim(), foto];

    console.log('=== ABOUT TO INSERT ===');
    console.log('SQL:', insertSql);
    console.log('Values:', [user_id, 'nama_length:' + nama.trim().length, 'foto_length:' + foto.length]);

    db.query(insertSql, values, (err, result) => {
      if (err) {
        console.error('❌ Gagal menyimpan data profil:', err);
        return res.status(500).json({ error: 'Gagal menyimpan data profil.' });
      }

      console.log('✅ Insert berhasil, insertId:', result.insertId);
      res.status(201).json({
        message: '✅ Data profil berhasil disimpan.',
        id_profil: result.insertId
      });
    });
  });
});

// UPDATE profil yang sudah ada
router.put('/:user_id', (req, res) => {
  const { user_id } = req.params;
  const { nama, foto } = req.body;

  console.log('Update data:', { 
    user_id: user_id ? 'present' : 'missing', 
    nama: nama ? 'present' : 'missing', 
    foto: foto ? 'present (length: ' + foto.length + ')' : 'missing' 
  });

  if (!user_id) {
    return res.status(400).json({ error: 'user_id wajib diisi.' });
  }
  
  if (!nama || nama.trim() === '') {
    return res.status(400).json({ error: 'nama wajib diisi.' });
  }
  
  if (!foto) {
    return res.status(400).json({ error: 'foto wajib diisi.' });
  }

  // Update profil yang sudah ada
  const updateSql = `
    UPDATE profil 
    SET nama = ?, foto = ?
    WHERE user_id = ?
  `;
  const values = [nama.trim(), foto, user_id];

  db.query(updateSql, values, (err, result) => {
    if (err) {
      console.error('❌ Gagal mengupdate profil:', err);
      return res.status(500).json({ error: 'Gagal mengupdate data profil.' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Profil tidak ditemukan untuk diupdate.' });
    }

    res.status(200).json({
      message: '✅ Data profil berhasil diperbarui.'
    });
  });
});

module.exports = router;