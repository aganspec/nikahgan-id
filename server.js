// Tambahkan library Xendit di bagian paling atas server.js
const Xendit = require('xendit-node');
const x = new Xendit({ secretKey: 'YOUR_XENDIT_SECRET_KEY' }); // Masukkan Secret Key dari Dasbor Xendit
const { Invoice } = x;
const invoiceSpecificOptions = {};

// ENDPOINT BARU: MEMBUAT INVOICE OTOMATIS
app.post('/api/create-invoice', async (req, res) => {
    try {
        const { amount, packageName, slug, email } = req.body;
        const externalId = `invoice-nikahgan-${Date.now()}`;

        // 1. Tarik ID pernikahan dari Supabase berdasarkan slug undangan konsumen
        const { data: wedding } = await supabase
            .from('weddings')
            .select('id')
            .eq('slug', slug)
            .single();

        if (!wedding) return res.status(404).json({ error: 'Data undangan tidak ditemukan' });

        // 2. Buat objek data invoice resmi untuk dikirimkan ke server Xendit
        const invoiceInstance = new Invoice(invoiceSpecificOptions);
        const xenditInvoice = await invoiceInstance.createInvoice({
            externalID: externalId,
            amount: amount,
            description: `Aktivasi Paket ${packageName} - Nikahgan.id`,
            invoiceDuration: 86400, // Invoice aktif selama 24 jam
            customer: { email: email },
            successRedirectURL: `https://nikahgan.id{slug}` // Diarahkan ke web Anda jika sukses
        });

        // 3. Catat transaksi ke tabel 'transactions' Supabase dengan status 'PENDING'
        await supabase
            .from('transactions')
            .insert([{
                wedding_id: wedding.id,
                external_id: externalId,
                amount: amount,
                status: 'PENDING'
            }]);

        // 4. Kembalikan URL pembayaran Xendit ke website front-end
        return res.status(200).json({ invoice_url: xenditInvoice.invoice_url });

    } catch (err) {
        console.error('Gagal Create Invoice:', err.message);
        return res.status(500).json({ error: err.message });
    }
});
