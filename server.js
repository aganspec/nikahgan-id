const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware wajib untuk membaca data form (RSVP) & JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 🛠️ DATA SIMULASI (Bisa dihubungkan ke Database nantinya)
const database = {
    weddings: [
        {
            id: 1,
            slug: 'budi-ani',
            bride: 'Ani Wijaya',
            groom: 'Budi Santoso',
            date: '2026-12-25T09:00:00',
            maps_url: 'https://google.com'
        }
    ],
    rsvps: [] // Menampung ucapan masuk secara real-time
};

// 1. ROUTING UTAMA: Menangkap URL slug dinamis beserta parameter nama tamu (?to=...)
app.get('/:slug', (req, res) => {
    const currentSlug = req.params.slug;
    
    // Menangkap nama tamu dari parameter URL ?to=NamaTamu (jika tidak ada, kosongkan)
    const guestName = req.query.to || ''; 
    
    // Cari data pengantin berdasarkan slug di URL
    const weddingData = database.weddings.find(w => w.slug === currentSlug);

    // Jika slug tidak terdaftar di database
    if (!weddingData) {
        return res.status(404).send('<h1>Maaf, halaman undangan nikahgan.id tidak ditemukan.</h1>');
    }

    // Ambil daftar ucapan khusus untuk ID pernikahan ini
    const currentRsvps = database.rsvps.filter(r => r.wedding_id === weddingData.id);

    // Baca file template utama undangan.html
    const templatePath = path.join(__dirname, 'views', 'undangan.html');
    
    try {
        let htmlContent = fs.readFileSync(templatePath, 'utf8');

        // Ganti placeholder di HTML dengan data riil dari database dan parameter URL
        htmlContent = htmlContent
            .replace(/{{MEMPELAI_PRIA}}/g, weddingData.groom)
            .replace(/{{MEMPELAI_WANITA}}/g, weddingData.bride)
            .replace(/{{TANGGAL_PERNIKAHAN}}/g, weddingData.date)
            .replace(/{{MAPS_URL}}/g, weddingData.maps_url)
            .replace(/{{WEDDING_ID}}/g, weddingData.id)
            .replace(/{{NAMA_TAMU_OTOMATIS}}/g, guestName) // Memasukkan nama tamu otomatis ke form
            .replace(/{{DAFTAR_UCAPAN}}/g, currentRsvps.map(r => `<li><b>${r.name}</b> (${r.status}): <br> "${r.message}"</li>`).join(''));

        // Kirim halaman web yang sudah dinamis ke browser tamu
        res.send(htmlContent);
    } catch (err) {
        res.status(500).send('Folder views atau file undangan.html belum dibuat.');
    }
});

// 2. ROUTING RSVP: Menerima kiriman form ucapan dari tamu
app.post('/api/rsvp', (req, res) => {
    const { wedding_id, name, status, message } = req.body;
    
    // Simpan data ucapan masuk
    database.rsvps.push({
        wedding_id: parseInt(wedding_id),
        name,
        status,
        message
    });

    // Cari kembali data slug agar halaman otomatis ter-refresh dengan ucapan baru
    const wedding = database.weddings.find(w => w.id === parseInt(wedding_id));
    res.redirect(`/${wedding.slug}`);
});
// 3. ROUTING REGISTER: Menangani Pendaftaran Akun Pengantin Baru
app.post('/api/register', (req, res) => {
    const { nama, email, whatsapp, password } = req.body;

    // Validasi sederhana untuk memastikan data terisi semua
    if (!nama || !email || !whatsapp || !password) {
        return res.status(400).json({ success: false, message: "Semua kolom pendaftaran wajib diisi!" });
    }

    // SIMULASI: Menyimpan akun pengantin baru (Nanti bisa dihubungkan ke tabel Supabase Anda)
    console.log("Menerima pendaftaran akun baru:", { nama, email, whatsapp });

    // Kirim respons sukses ke halaman utama agar browser bisa mengalihkan halaman
    return res.status(200).json({ 
        success: true, 
        message: "Pendaftaran akun berhasil! Selamat datang di Nikahgan.id." 
    });
});

app.listen(PORT, () => {
    console.log(`Server nikahgan.id aktif di port ${PORT}`);
});
