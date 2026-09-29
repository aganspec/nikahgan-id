const express = require('express');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Inisialisasi Supabase menggunakan Environment Variables dari Vercel
// Kode ini otomatis membersihkan spasi atau tanda garis miring (/) di akhir URL
const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseUrl = rawUrl.replace(/\/\$/, '').trim(); 

const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabaseKey = rawKey.trim();

const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware dasar untuk membaca data form & JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Melayani berkas statis dari folder utama
app.use(express.static(__dirname));

// RUTE HALAMAN UTAMA (Menampilkan Form Pendaftaran)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 1. RUTE PENDAFTARAN (Menyimpan data ke tabel 'users' & 'weddings')
app.post('/register', async (req, res) => {
    try {
        const { nama, email, whatsapp, password } = req.body;

        // Validasi input kosong
        if (!nama || !email || !whatsapp || !password) {
            return res.status(400).json({ success: false, message: "Semua kolom pendaftaran wajib diisi!" });
        }

        // Membuat nama slug otomatis untuk URL undangan (Contoh: "Tes Admin" -> "tes-admin")
        const slug = nama.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-\$)+/g, '');

        // A. MASUKKAN DATA KE TABEL 'users'
        const { data: newUser, error: userError } = await supabase
            .from('users')
            .insert([
                { name: nama, email: email, whatsapp: whatsapp, password: password, package_type: 'free' }
            ])
            .select()
            .single();

        if (userError) {
            // Cek jika email sudah terdaftar (Error code 23505 adalah Unique Violation di PostgreSQL)
            if (userError.code === '23505') {
                return res.status(400).json({ success: false, message: "Email ini sudah terdaftar! Gunakan email lain." });
            }
            throw userError;
        }

        // B. MASUKKAN DATA AWAL KE TABEL 'weddings'
        const { error: weddingError } = await supabase
            .from('weddings')
            .insert([
                {
                    user_id: newUser.id,
                    slug: slug,
                    mempelai_pria: nama,
                    mempelai_wanita: "Pasangan",
                    tanggal_acara: new Date().toISOString().split('T')[0], // Mengambil format YYYY-MM-DD yang benar
                    background_tema: "default"
                }
            ]);

        if (weddingError) throw weddingError;

        // Jika semua proses berhasil
        return res.status(200).json({
            success: true,
            message: "Pendaftaran akun berhasil!",
            slug: slug
        });

    } catch (err) {
        // Mencetak log kesalahan mendalam di dashboard Vercel Anda agar tidak blank
        console.error("Detail Eror pada /register:", err.message || err);
        return res.status(500).json({ 
            success: false, 
            message: err.message || "Terjadi kesalahan internal server." 
        });
    }
});

// Menjalankan server lokal (jika tidak dijalankan di Vercel)
app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});
