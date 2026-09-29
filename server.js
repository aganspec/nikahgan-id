const express = require('express');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js'); // 1. Mengimpor Supabase Client

const app = express();
const PORT = process.env.PORT || 3000;

// 2. Inisialisasi Supabase menggunakan variabel lingkungan dari Vercel
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware wajib untuk membaca data form (RSVP) & JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ROUTE HALAMAN UTAMA: Menyajikan file index.html saat pertama kali web dibuka
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// // 1. ROUTING REGISTER: Menangani Pendaftaran Akun Pengantin Baru
app.post('/register', async (req, res) => {
    const { nama, email, whatsapp, password } = req.body;

    // Validasi sederhana untuk memastikan data terisi semua
    if (!nama || !email || !whatsapp || !password) {
        return res.status(400).json({ success: false, message: "Semua kolom pendaftaran wajib diisi!" });
    }

    try {
        // Membuat nama slug otomatis secara aman (Contoh: "Tes Admin" -> "tes-admin")
        const slug = nama.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-\$)+/g, '');

        // Menyimpan data pengantin baru langsung ke tabel 'weddings' di Supabase
        const { data, error } = await supabase
            .from('weddings')
            .insert([
                { name: nama, email: email, whatsapp: whatsapp, password: password, slug: slug }
            ])
            .select()
            .single();

        if (error) {
            // Menangani error jika email atau slug sudah terdaftar (karena aturan Unique)
            if (error.code === '23505') {
                return res.status(400).json({ success: false, message: "Nama pengantin atau email sudah terdaftar!" });
            }
            throw error;
        }

        // Kirim respons sukses ke halaman utama agar browser bisa mengalihkan halaman
        return res.status(200).json({
            success: true,
            message: "Pendaftaran akun berhasil! Selamat datang di Nikahgan.id.",
            slug: slug // Mengirimkan data slug kembali ke frontend untuk proses redirect
        });

    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// // 2. ROUTING UTAMA: Mengtangkap URL slug dinamis beserta parameter nama tamu
app.get('/:slug', async (req, res) => {
    const currentSlug = req.params.slug;

    // Menangkap nama tamu dari parameter URL ?to=NamaTamu (jika tidak ada, kosongkan)
    const guestName = req.query.to || "";

    try {
        // Cari data pengantin berdasarkan slug di database Supabase
        const { data: weddingData, error } = await supabase
            .from('weddings')
            .select('*')
            .eq('slug', currentSlug)
            .single();

        // Jika slug tidak terdaftar atau terjadi error pencarian di database
        if (error || !weddingData) {
            return res.status(404).send('<h1>Maaf, halaman undangan nikahgan.id tidak ditemukan.</h1>');
        }

        
// KODE PERBAIKAN (Gantikan ke Baris 85-90):
const templatePath = path.join(__dirname, 'views', 'undangan.html');

if (!fs.existsSync(templatePath)) {
    return res.status(500).send('<h1>Error: File template undangan.html tidak ditemukan di folder views.</h1>');
}

        let htmlContent = fs.readFileSync(templatePath, 'utf8');

        // Mengganti placeholder teks di dalam HTML dengan data riil dari database dan URL
        // Silakan sesuaikan teks penanda (seperti {{nama_pengantin}} atau {{nama_tamu}}) dengan isi file Undangan.html Anda
        htmlContent = htmlContent.replace(/{{nama_pengantin}}/g, weddingData.name);
        htmlContent = htmlContent.replace(/{{nama_tamu}}/g, guestName);

        // Kirimkan halaman HTML yang sudah dimodifikasi secara dinamis ke browser tamu
        return res.send(htmlContent);

    } catch (err) {
        return res.status(500).send('Server Error');
    }
});

// Menjalankan server lokal
app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});
