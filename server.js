const express = require('express');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Hubungkan ke Supabase menggunakan Environment Variables di Vercel
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// RUTE UTAMA (Menampilkan Halaman Pendaftaran)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 1. RUTE PENDAFTARAN (Menyimpan data ke Supabase)
app.post('/register', async (req, res) => {
    const { nama, email, whatsapp, password } = req.body;

    if (!nama || !email || !whatsapp || !password) {
        return res.status(400).json({ success: false, message: "Semua kolom pendaftaran wajib diisi!" });
    }

    try {
        // Otomatis buat slug (Contoh: "Budi Ani" -> "budi-ani")
        const slug = nama.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-\$)+/g, '');

        const { data, error } = await supabase
            .from('weddings')
            .insert([{ name: nama, email: email, whatsapp: whatsapp, password: password, slug: slug }])
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return res.status(400).json({ success: false, message: "Nama pengantin atau email sudah terdaftar!" });
            }
            throw error;
        }

        return res.status(200).json({
            success: true,
            message: "Pendaftaran sukses!",
            slug: slug
        });

    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// 2. RUTE UNDANGAN DINAMIS (Mengambil data dari Supabase berdasarkan slug)
app.get('/:slug', async (req, res) => {
    const currentSlug = req.params.slug;
    const guestName = req.query.to || "";

    try {
        const { data: weddingData, error } = await supabase
            .from('weddings')
            .select('*')
            .eq('slug', currentSlug)
            .single();

        // Jika data tidak ditemukan di database
        if (error || !weddingData) {
            return res.status(404).send('<h1>Maaf, halaman undangan nikahgan.id tidak ditemukan.</h1>');
        }

        // Tampilan HTML Undangan Langsung dari Memori Server
        let htmlContent = `
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Undangan Pernikahan - Nikahgan.id</title>
            <style>
                body { font-family: sans-serif; background-color: #fcf8f2; color: #4a4a4a; text-align: center; padding: 50px 20px; }
                .card { background: white; max-width: 500px; margin: 0 auto; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
                h1 { color: #b8926a; }
                .guest { margin-top: 30px; font-style: italic; background: #fdfaf6; padding: 15px; border-radius: 10px; display: inline-block; border: 1px dashed #d1b89d; }
            </style>
        </head>
        <body>
            <div class="card">
                <p>Undangan Pernikahan Online</p>
                <h1>${weddingData.name}</h1>
                <p>Akan melangsungkan acara pernikahan.</p>
                ${guestName ? `<div class="guest"><p>Kepada Yth:</p><h3>\${guestName}</h3></div>` : ''}
            </div>
        </body>
        </html>
        `;

        return res.send(htmlContent);

    } catch (err) {
        return res.status(500).send(`<h1>Terjadi kesalahan server: ${err.message}</h1>`);
    }
});

// Jalankan Server Lokasi
app.listen(PORT, () => {
    console.log(`Server aktif pada port ${PORT}`);
});
