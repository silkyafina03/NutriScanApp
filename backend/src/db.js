const mysql = require('mysql2');
require('dotenv').config(); // Tambahkan ini di baris awal

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  timezone: '+07:00'
});

// Fungsi untuk inisialisasi database
const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.connect((err) => {
      if (err) {
        console.error('❌ Gagal terhubung ke MySQL:', err.message);
        reject(err);
        return;
      }
      console.log('✅ Terhubung ke MySQL');
      
      // Buat database jika belum ada
      db.query('CREATE DATABASE IF NOT EXISTS nutriscan', (err) => {
        if (err) {
          console.error('❌ Gagal membuat database:', err.message);
          reject(err);
          return;
        }
        console.log('✅ Database `nutriscan` dibuat atau sudah ada');
        
        // Pilih database yang baru dibuat
        db.changeUser({ database: 'nutriscan' }, (err) => {
          if (err) {
            console.error('❌ Gagal memilih database:', err.message);
            reject(err);
            return;
          }
          
          // Buat tabel `users`
          const usersTable = `
            CREATE TABLE IF NOT EXISTS users (
              user_id INT AUTO_INCREMENT PRIMARY KEY,
              jenis_kelamin ENUM('Laki-laki', 'Perempuan'),
              usia INT(3),
              tinggi_badan FLOAT,
              berat_badan FLOAT,
              aktivitas ENUM('ringan', 'sedang', 'berat'),
              porsi_makan INT(2)
            )
          `;
          
          db.query(usersTable, (err) => {
            if (err) {
              console.error('❌ Gagal membuat tabel `users`:', err.message);
              reject(err);
              return;
            }
            console.log('✅ Tabel `users` berhasil dibuat');
            
            // Buat tabel `profil`
            const profilTable = `
              CREATE TABLE IF NOT EXISTS profil (
                id_profil INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                nama VARCHAR(150),
                foto LONGTEXT,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
              )
            `;
            
            db.query(profilTable, (err) => {
              if (err) {
                console.error('❌ Gagal membuat tabel `profil`:', err.message);
                reject(err);
                return;
              }
              console.log('✅ Tabel `profil` berhasil dibuat');
              
              // PERBAIKAN: Ubah struktur tabel riwayat
              const riwayatTable = `
                CREATE TABLE IF NOT EXISTS riwayat (
                  id_riwayat INT AUTO_INCREMENT PRIMARY KEY,
                  user_id INT,
                  image LONGTEXT,
                  name VARCHAR(150),
                  calories DECIMAL(8,2),
                  protein DECIMAL(8,2),
                  carbs DECIMAL(8,2),
                  fat DECIMAL(8,2),
                  tanggal DATETIME DEFAULT CURRENT_TIMESTAMP,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
                )
              `;
              
              db.query(riwayatTable, (err) => {
                if (err) {
                  console.error('❌ Gagal membuat tabel `riwayat`:', err.message);
                  reject(err);
                  return;
                }
                console.log('✅ Tabel `riwayat` berhasil dibuat');
                
                resolve(db);
              });
            });
          });
        });
      });
    });
  });
};

// Export koneksi dan fungsi inisialisasi
module.exports = {
  db,
  initializeDatabase
};