const express = require('express');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Inisialisasi Supabase menggunakan Environment Variables dari Vercel
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware dasar untuk membaca data form & JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Melayani berkas statis dari folder utama
app.use(express.static(__dirname));

// RUTE HALAMAN UTAMA (Menampilkan Form Pendaftaran Anda)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 1. RUTE PENDAFTARAN (Menyimpan data otomatis ke tabel users & weddings di Supabase)
app.post('/register', async (req, res) => {
    const { nama, email, whatsapp, password } = req.body;

    if (!nama || !email || !whatsapp || !password) {
        return res.status(400).json({ success: false, message: "Semua kolom pendaftaran wajib diisi!" });
    }

    try {
        // Membuat nama slug otomatis (Contoh: "Tes Admin" -> "tes-admin")
        const slug = nama.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-\$)+/g, '');

        // MASUKKAN DATA KE TABEL 'users'
        const { data: newUser, error: userError } = await supabase
            .from('users')
            .insert([
                { name: nama, email: email, whatsapp: whatsapp, password: password, package_type: 'free' }
            ])
            .select()
            .single();

        if (userError) {
            if (userError.code === '23505') {
                return res.status(400).json({ success: false, message: "Email ini sudah terdaftar! Gunakan email lain." });
            }
            throw userError;
        }

        // MASUKKAN DATA DATA AWAL KE TABEL 'weddings'
        const { error: weddingError } = await supabase
            .from('weddings')
            .insert([
                { 
                    user_id: newUser.id, 
                    slug: slug, 
                    mempelai_pria: nama, 
                    mempelai_wanita: "Pasangan", 
                    tanggal_acara: new Date().toISOString().split('T')[0], // Tanggal format YYYY-MM-DD
                    background_tema: "default"
                }
            ]);

        if (weddingError) throw weddingError;

        return res.status(200).json({
            success: true,
            message: "Pendaftaran akun berhasil!",
            slug: slug
        });

    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// 2. RUTE HALAMAN UNDANGAN DINAMIS (Mengambil data nyata dari Supabase)
app.get('/:slug', async (req, res) => {
    const currentSlug = req.params.slug;
    const guestName = req.query.to || "Tamu Undangan";

    try {
        // Ambil data dari tabel weddings berdasarkan slug
        const { data: weddingData, error } = await supabase
            .from('weddings')
            .select('*')
            .eq('slug', currentSlug)
            .single();

        // Jika data tidak ditemukan di database Supabase
        if (error || !weddingData) {
            return res.status(404).send('<h1>Maaf, halaman undangan nikahgan.id tidak ditemukan.</h1>');
        }

        // Membaca berkas undangan.html secara aman dari folder views
        const templatePath = path.join(__dirname, 'views', 'undangan.html');
        
        if (!fs.existsSync(templatePath)) {
            return res.status(500).send('<h1>Error: Berkas template undangan.html tidak ditemukan di folder views.</h1>');
        }

        let htmlContent = fs.readFileSync(templatePath, 'utf8');

        // MENGGANTI PLACEHOLDER HTML MENJADI TEKS NYATA DARI DATABASE
        htmlContent = htmlContent.replace(/{{MEMPELAI_PRIA}}/g, weddingData.mempelai_pria);
        htmlContent = htmlContent.replace(/{{MEMPELAI_WANITA}}/g, weddingData.mempelai_wanita);
        htmlContent = htmlContent.replace(/{{NAMA_TAMU_OTOMATIS}}/g, guestName);

        return res.send(htmlContent);

    } catch (err) {
        return res.status(500).send(`<h1>Terjadi kesalahan server: ${err.message}</h1>`);
    }
});

// Jalankan Server
app.listen(PORT, () => {
    console.log(`Server aktif pada port ${PORT}`);
});
            
