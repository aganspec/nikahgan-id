const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Melayani file statis dari folder utama
app.use(express.static(__dirname));

// ROUTE HALAMAN UTAMA
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ROUTE MENAMPILKAN HALAMAN UNDANGAN STATIS
app.get('/:slug', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'undangan.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

