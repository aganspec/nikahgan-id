const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// FIX: Kasih path yang bener, jangan pakai __dirname langsung ngawur
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// Fix invalid path error
app.use((req, res, next) => {
  try {
    decodeURIComponent(req.path);
    next();
  } catch (e) {
    console.log('Invalid path blocked:', req.path);
    return res.redirect('/');
  }
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/daftar', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/daftar', (req, res) => {
  const { nama, email, wa } = req.body;
  console.log('Daftar:', nama, email, wa);
  // Sementara simpen sukses dulu, Supabase nanti pas Verified Lynk
  return res.json({ success: true, message: 'Akun berhasil dibuat!' });
});

// Catch all - FIX Invalid path
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`nikahgan.id jalan di ${PORT}`);
});

module.exports = app;
