document.addEventListener('DOMContentLoaded', () => {
    const formRegister = document.getElementById('formRegister');
    if (!formRegister) return;

    formRegister.addEventListener('submit', async function(e) {
        e.preventDefault();

        const nama = document.getElementById('nama').value;
        const email = document.getElementById('email').value;
        const whatsapp = document.getElementById('whatsapp').value;
        const password = document.getElementById('password').value;
        
        const errorDiv = document.getElementById('error-message');
        const btnSubmit = document.getElementById('btnSubmit');

        if (errorDiv) {
            errorDiv.classList.add('hidden');
            errorDiv.innerText = '';
        }
        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.innerText = 'Memproses...';
        }

        try {
            // Menggunakan URL absolut lokal agar Vercel mendeteksi path dengan tepat
            const response = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nama, email, whatsapp, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert(data.message);
                window.location.href = `/dashboard.html?slug=${data.slug}`;
            } else {
                if (errorDiv) {
                    errorDiv.innerText = data.message || 'Pendaftaran gagal.';
                    errorDiv.classList.remove('hidden');
                } else {
                    alert(data.message || 'Pendaftaran gagal.');
                }
            }
        } catch (error) {
            console.error('Error saat submit:', error);
            if (errorDiv) {
                errorDiv.innerText = 'Terjadi kesalahan jaringan atau koneksi server internal.';
                errorDiv.classList.remove('hidden');
            }
        } finally {
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.innerText = 'Buat Akun Sekarang';
            }
        }
    });
});
          
