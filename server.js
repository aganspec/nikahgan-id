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

        
        // --- SOLUSI MUTAKHIR: TANPA MEMBACA FILE FISIK AGAR VERCEL TIDAK CRASH ---
        let htmlContent = `
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Undangan Pernikahan Online</title>
            <style>
                body { font-family: 'Arial', sans-serif; background-color: #fcf8f2; color: #4a4a4a; text-align: center; padding: 50px 20px; }
                .card { background: white; max-width: 500px; margin: 0 auto; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #eaeaea; }
                h1 { color: #b8926a; font-size: 2.5em; margin-bottom: 10px; }
                h2 { color: #5a5a5a; font-size: 1.5em; font-weight: normal; }
                .guest { margin-top: 30px; font-style: italic; background: #fdfaf6; padding: 15px; border-radius: 10px; display: inline-block; border: 1px dashed #d1b89d; }
            </style>
        </head>
        <body>
            <div class="card">
                <p>Maha Suci Allah yang telah menciptakan makhluk-Nya berpasang-pasangan...</p>
                <h1>\${weddingData.name}</h1>
                <p>Akan melangsungkan acara pernikahan mereka.</p>
                
                \${guestName ? \`<div class="guest"><p>Kepada Yth. Bapak/Ibu/Saudara/i:</p><h3>\${guestName}</h3></div>\` : ''}
                
                <p style="margin-top: 40px; font-size: 0.9em; color: #a1a1a1;">Dibuat otomatis oleh Nikahgan.id</p>
            </div>
        </body>
        </html>
        `;

        return res.send(htmlContent);
    

    } catch (err) {
        return res.status(500).send('Server Error');
    }
});

// Menjalankan server lokal
app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});
