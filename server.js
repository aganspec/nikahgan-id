const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware dasar untuk membaca form
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Melayani berkas statis dari folder utama
app.use(express.static(__dirname));

// RUTE HALAMAN UTAMA (Menampilkan Form Pendaftaran Asli Anda)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// RUTE HALAMAN UNDANGAN DINAMIS (Membaca file undangan.html fisik Anda)
app.get('/:slug', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'undangan.html'));
});

// Jalankan Server
app.listen(PORT, () => {
    console.log(`Server aktif pada port ${PORT}`);
});
