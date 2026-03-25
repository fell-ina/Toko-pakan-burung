// --- RIWAYAT KERJA ---
function renderHistory() {
    const historyList = document.getElementById('history-list');
    // Ambil data terbaru dari localStorage
    const savedHistory = JSON.parse(localStorage.getItem('dbHistory')) || [];
    
    if (savedHistory.length === 0) {
        historyList.innerHTML = '<p class="text-center text-slate-400 py-10">Belum ada riwayat.</p>';
        return;
    }

    historyList.innerHTML = savedHistory.slice().reverse().map(h => `
        <div class="bg-white dark:bg-slate-800 p-4 rounded-2xl border dark:border-slate-700 mb-3">
            <div class="flex justify-between border-b dark:border-slate-700 pb-2 mb-2">
                <span class="text-[10px] font-bold text-blue-600">${h.waktu}</span>
                <span class="text-xs font-black dark:text-white">Rp ${h.total.toLocaleString()}</span>
            </div>
            ${h.items.map(i => `
                <div class="flex justify-between text-[10px] dark:text-slate-300">
                    <span>${i.nama} x${i.qty}</span>
                    <span>${(i.harga * i.qty).toLocaleString()}</span>
                </div>
            `).join('')}
        </div>`).join('');
}

// --- FUNGSI CETAK TEKS (LEBIH AMAN & RINGAN) ---
function prosesCheckout() {
    if (keranjang.length === 0) return alert("Keranjang kosong!");

    const total = keranjang.reduce((a, b) => a + (b.harga * b.qty), 0);
    const waktu = new Date().toLocaleString('id-ID');

    // 1. Susun Format Teks Murni (Bukan Gambar)
    let teksNota = "TEKS: \n";
    teksNota += "TOKO PAKAN KEMBANG ARUM\n";
    teksNota += "Salatiga\n";
    teksNota += "Waktu: " + waktu + "\n";
    teksNota += "--------------------------------\n";
    
    keranjang.forEach(i => {
        teksNota += i.nama.toUpperCase().substring(0, 20) + "\n";
        teksNota += i.qty + " x " + i.harga.toLocaleString() + " = " + (i.harga * i.qty).toLocaleString() + "\n";
    });
    
    teksNota += "--------------------------------\n";
    teksNota += "TOTAL: Rp " + total.toLocaleString() + "\n";
    teksNota += "--------------------------------\n";
    teksNota += "Terima Kasih!\n\n\n";

    // 2. Kirim ke RawBT menggunakan Format Teks (Tanpa Base64 Gambar)
    // Jalur ini jauh lebih stabil untuk printer thermal
    window.location.href = "rawbt:" + encodeURIComponent(teksNota);

    // 3. SIMPAN KE RIWAYAT (Pastikan ini jalan)
    const transaksiBaru = {
        waktu: waktu,
        total: total,
        items: [...keranjang]
    };
    
    const historyLama = JSON.parse(localStorage.getItem('dbHistory')) || [];
    historyLama.push(transaksiBaru);
    localStorage.setItem('dbHistory', JSON.stringify(historyLama));

    // 4. Reset
    keranjang = [];
    renderCart();
    alert("Nota dikirim ke printer!");
}
