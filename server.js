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
// RUTE PENERIMA PENDAFTARAN STATIS (Agar Frontend Tidak Eror JSON)
app.post('/register', (req, res) => {
    const { nama } = req.body;
    
    // Membuat nama slug otomatis dari input nama (Contoh: "Tes admin" -> "tes-admin")
    const slug = nama ? nama.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : 'undangan';
    
    // Mengirimkan balasan format JSON murni yang valid agar frontend sukses membaca data
    return res.status(200).json({
        success: true,
        message: "Pendaftaran sukses secara statis!",
        slug: slug
    });
});

// RUTE HALAMAN UNDANGAN DINAMIS (Membaca file undangan.html fisik Anda)
app.get('/:slug', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'undangan.html'));
});

// Jalankan Server
app.listen(PORT, () => {
    console.log(`Server aktif pada port ${PORT}`);
});
