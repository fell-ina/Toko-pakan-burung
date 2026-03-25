// FUNGSI TAMPILKAN RIWAYAT (Biar gak putih polos)
function renderHistory() {
    const list = document.getElementById('history-list');
    const data = JSON.parse(localStorage.getItem('dbHistory')) || [];
    
    if (data.length === 0) {
        list.innerHTML = '<div class="text-center py-20 text-slate-400">Belum ada riwayat.</div>';
        return;
    }

    list.innerHTML = data.slice().reverse().map(h => `
        <div class="bg-white dark:bg-slate-800 p-4 rounded-2xl border dark:border-slate-700 mb-3 shadow-sm">
            <div class="flex justify-between items-center border-b dark:border-slate-700 pb-2 mb-2">
                <span class="text-[10px] font-bold text-blue-600">${h.waktu}</span>
                <span class="text-xs font-black dark:text-white uppercase">Rp ${h.total.toLocaleString()}</span>
            </div>
            <div class="space-y-1">
                ${h.items.map(i => `<div class="flex justify-between text-[10px] dark:text-slate-300"><span>${i.nama} x${i.qty}</span><span>${(i.harga*i.qty).toLocaleString()}</span></div>`).join('')}
            </div>
        </div>
    `).join('');
}

// FUNGSI CETAK TEKS (Anti Kode Sampah)
function prosesCheckout() {
    if (keranjang.length === 0) return alert("Keranjang kosong!");

    const total = keranjang.reduce((a, b) => a + (b.harga * b.qty), 0);
    const waktu = new Date().toLocaleString('id-ID');

    // Simpan ke Riwayat DULU
    const history = JSON.parse(localStorage.getItem('dbHistory')) || [];
    history.push({ waktu, total, items: [...keranjang] });
    localStorage.setItem('dbHistory', JSON.stringify(history));

    // FORMAT TEKS MURNI: Pasti terbaca printer
    let teksNota = "TEKS:";
    teksNota += "\n   KEMBANG ARUM   \n";
    teksNota += "    Salatiga      \n";
    teksNota += "------------------\n";
    
    keranjang.forEach(i => {
        teksNota += i.nama.toUpperCase().substring(0, 18) + "\n";
        teksNota += i.qty + "x" + i.harga.toLocaleString() + " =" + (i.harga * i.qty).toLocaleString() + "\n";
    });
    
    teksNota += "------------------\n";
    teksNota += "TOTAL: Rp" + total.toLocaleString() + "\n";
    teksNota += "------------------\n\n\n";

    // Kirim perintah TEKS ke RawBT
    window.location.href = "rawbt:" + encodeURIComponent(teksNota);

    // Update Tampilan
    keranjang = [];
    renderCart();
    renderHistory(); // Supaya tab riwayat langsung muncul isinya
}
