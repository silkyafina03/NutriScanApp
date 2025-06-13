const express = require('express');
const router = express.Router();
const { db } = require('../db');

// Fungsi untuk mendapatkan waktu Indonesia (WIB)
const getIndonesianDateTime = () => {
  const now = new Date();
  // Konversi ke timezone Indonesia (UTC+7)
  const indonesianTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  return indonesianTime.toISOString().slice(0, 19).replace('T', ' ');
};

// GET riwayat berdasarkan user_id
router.get('/:user_id', (req, res) => {
  const { user_id } = req.params;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id wajib diisi.' });
  }

  const sql = 'SELECT * FROM riwayat WHERE user_id = ? ORDER BY tanggal DESC';
  db.query(sql, [user_id], (err, result) => {
    if (err) {
      console.error('❌ Gagal mengambil riwayat:', err);
      return res.status(500).json({ error: 'Gagal mengambil data riwayat.' });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: 'Riwayat tidak ditemukan.' });
    }

    res.status(200).json(result);
  });
});

// Simpan data riwayat baru
router.post('/', (req, res) => {
  console.log('=== RAW REQUEST HEADERS ===');
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Content-Length:', req.headers['content-length']);
  
  console.log('=== RAW REQUEST BODY ===');
  console.log('req.body:', req.body);
  console.log('req.body type:', typeof req.body);
  console.log('req.body keys:', Object.keys(req.body || {}));
  console.log('req.body stringified:', JSON.stringify(req.body));
  
  const { user_id, image, name, calories, protein, carbs, fat, tanggal } = req.body;

  console.log('=== EXTRACTED VALUES ===');
  console.log('user_id:', user_id, '(type:', typeof user_id, ')');
  console.log('image:', image, '(type:', typeof image, ')');
  console.log('name:', name, '(type:', typeof name, ')');
  console.log('calories:', calories, '(type:', typeof calories, ')');
  console.log('protein:', protein, '(type:', typeof protein, ')');
  console.log('carbs:', carbs, '(type:', typeof carbs, ')');
  console.log('fat:', fat, '(type:', typeof fat, ')');
  console.log('tanggal:', tanggal, '(type:', typeof tanggal, ')');

  // Validasi input
  if (!user_id || user_id === '' || user_id === 'undefined' || user_id === 'null') {
    console.log('❌ user_id validation failed:', user_id);
    return res.status(400).json({ error: 'user_id wajib diisi dan tidak boleh kosong.' });
  }
  
  if (!image || image.trim() === '' || image === 'undefined' || image === 'null') {
    console.log('❌ image validation failed:', image);
    return res.status(400).json({ error: 'image wajib diisi dan tidak boleh kosong.' });
  }

  if (!name || name.trim() === '' || name === 'undefined' || name === 'null') {
    console.log('❌ name validation failed:', name);
    return res.status(400).json({ error: 'name wajib diisi dan tidak boleh kosong.' });
  }

  if (!calories || isNaN(calories)) {
    return res.status(400).json({ error: 'calories wajib diisi dengan nilai numerik.' });
  }

  if (!protein || isNaN(protein)) {
    return res.status(400).json({ error: 'protein wajib diisi dengan nilai numerik.' });
  }

  if (!carbs || isNaN(carbs)) {
    return res.status(400).json({ error: 'carbs wajib diisi dengan nilai numerik.' });
  }

  if (!fat || isNaN(fat)) {
    return res.status(400).json({ error: 'fat wajib diisi dengan nilai numerik.' });
  }

  // PERBAIKAN: Set tanggal dengan waktu Indonesia yang akurat
  let finalDate;
  if (tanggal) {
    // Jika tanggal diberikan, pastikan formatnya benar
    if (tanggal.includes('T') || tanggal.includes(' ')) {
      // Sudah dalam format datetime
      finalDate = tanggal;
    } else {
      // Hanya date, tambahkan waktu saat ini
      const currentTime = new Date().toTimeString().split(' ')[0];
      finalDate = `${tanggal} ${currentTime}`;
    }
  } else {
    // Gunakan waktu Indonesia saat ini
    finalDate = getIndonesianDateTime();
  }

  console.log('=== TANGGAL YANG AKAN DISIMPAN ===');
  console.log('Original tanggal:', tanggal);
  console.log('Final date:', finalDate);
  console.log('Indonesian time now:', getIndonesianDateTime());

  // Simpan riwayat baru
  const insertSql = `
    INSERT INTO riwayat (user_id, image, name, calories, protein, carbs, fat, tanggal)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [user_id, image.trim(), name.trim(), calories, protein, carbs, fat, finalDate];

  console.log('=== ABOUT TO INSERT ===');
  console.log('SQL:', insertSql);
  console.log('Values:', values);

  db.query(insertSql, values, (err, result) => {
    if (err) {
      console.error('❌ Gagal menyimpan data riwayat:', err);
      return res.status(500).json({ error: 'Gagal menyimpan data riwayat.' });
    }

    console.log('✅ Insert berhasil, insertId:', result.insertId);
    console.log('✅ Data tersimpan pada:', finalDate);
    
    res.status(201).json({
      message: '✅ Data riwayat berhasil disimpan.',
      id_riwayat: result.insertId,
      tanggal_tersimpan: finalDate
    });
  });
});

// UPDATE riwayat berdasarkan ID
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { image, name, calories, protein, carbs, fat, tanggal } = req.body;

  console.log('Update data:', { 
    id: id ? 'present' : 'missing',
    image: image ? 'present' : 'missing', 
    name: name ? 'present' : 'missing',
    calories: calories ? 'present' : 'missing',
    protein: protein ? 'present' : 'missing',
    carbs: carbs ? 'present' : 'missing',
    fat: fat ? 'present' : 'missing',
    tanggal: tanggal ? 'present' : 'missing'
  });

  if (!id) {
    return res.status(400).json({ error: 'ID riwayat wajib diisi.' });
  }
  
  if (!image || image.trim() === '') {
    return res.status(400).json({ error: 'image wajib diisi.' });
  }

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'name wajib diisi.' });
  }

  if (!calories || isNaN(calories)) {
    return res.status(400).json({ error: 'calories wajib diisi dengan nilai numerik.' });
  }

  if (!protein || isNaN(protein)) {
    return res.status(400).json({ error: 'protein wajib diisi dengan nilai numerik.' });
  }

  if (!carbs || isNaN(carbs)) {
    return res.status(400).json({ error: 'carbs wajib diisi dengan nilai numerik.' });
  }

  if (!fat || isNaN(fat)) {
    return res.status(400).json({ error: 'fat wajib diisi dengan nilai numerik.' });
  }

  // PERBAIKAN: Handle tanggal untuk update
  const finalDate = tanggal || getIndonesianDateTime();

  // Update riwayat yang sudah ada
  const updateSql = `
    UPDATE riwayat 
    SET image = ?, name = ?, calories = ?, protein = ?, carbs = ?, fat = ?, tanggal = ?
    WHERE id_riwayat = ?
  `;
  const values = [image.trim(), name.trim(), calories, protein, carbs, fat, finalDate, id];

  console.log('=== UPDATE VALUES ===');
  console.log('Final date for update:', finalDate);
  console.log('Values:', values);

  db.query(updateSql, values, (err, result) => {
    if (err) {
      console.error('❌ Gagal mengupdate riwayat:', err);
      return res.status(500).json({ error: 'Gagal mengupdate data riwayat.' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Riwayat tidak ditemukan untuk diupdate.' });
    }

    res.status(200).json({
      message: '✅ Data riwayat berhasil diperbarui.',
      tanggal_update: finalDate
    });
  });
});

// DELETE riwayat berdasarkan ID
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'ID riwayat wajib diisi.' });
  }

  const deleteSql = 'DELETE FROM riwayat WHERE id_riwayat = ?';
  
  db.query(deleteSql, [id], (err, result) => {
    if (err) {
      console.error('❌ Gagal menghapus riwayat:', err);
      return res.status(500).json({ error: 'Gagal menghapus data riwayat.' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Riwayat tidak ditemukan untuk dihapus.' });
    }

    res.status(200).json({
      message: '✅ Data riwayat berhasil dihapus.'
    });
  });
});

module.exports = router;