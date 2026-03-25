// 1. DATA UTAMA
let keranjang = [];

// 2. FUNGSI RENDER KERANJANG (Tampilan di Tab Kasir)
function renderCart() {
    const cartItems = document.getElementById('cart-items');
    const totalHarga = document.getElementById('total-harga');
    let total = 0;

    cartItems.innerHTML = keranjang.map((item, index) => {
        total += item.harga * item.qty;
        return `
            <div class="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-3 rounded-xl mb-2 border dark:border-slate-700">
                <div>
                    <p class="font-bold text-sm dark:text-white">${item.nama}</p>
                    <p class="text-xs text-slate-500">${item.qty} x Rp ${item.harga.toLocaleString()}</p>
                </div>
                <button onclick="hapusItem(${index})" class="text-red-500 hover:bg-red-50 p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        `;
    }).join('');

    totalHarga.innerText = `Rp ${total.toLocaleString()}`;
}

// 3. TAMBAH KE KERANJANG
function addToCart(nama, harga) {
    const ada = keranjang.find(item => item.nama === nama);
    if (ada) {
        ada.qty++;
    } else {
        keranjang.push({ nama, harga, qty: 1 });
    }
    renderCart();
}

// 4. HAPUS DARI KERANJANG
function hapusItem(index) {
    keranjang.splice(index, 1);
    renderCart();
}

// 5. FUNGSI CETAK & SIMPAN RIWAYAT (SOLUSI ERROR PRINTER)
function prosesCheckout() {
    if (keranjang.length === 0) {
        alert("Keranjang masih kosong, Felix!");
        return;
    }

    const total = keranjang.reduce((a, b) => a + (b.harga * b.qty), 0);
    const waktu = new Date().toLocaleString('id-ID');

    // --- STEP A: SIMPAN KE LOCALSTORAGE (HISTORY) ---
    const transaksiBaru = {
        waktu: waktu,
        total: total,
        items: [...keranjang]
    };

    // Ambil data lama, tambah yang baru, simpan lagi
    const historyLama = JSON.parse(localStorage.getItem('dbHistory')) || [];
    historyLama.push(transaksiBaru);
    localStorage.setItem('dbHistory', JSON.stringify(historyLama));

    // --- STEP B: KIRIM FORMAT TEKS KE RAWBT (ANTI-ERROR) ---
    // Menggunakan awalan TEKS: agar printer thermal mengenali sebagai tulisan
    let teksNota = "TEKS:";
    teksNota += "\n   KEMBANG ARUM   \n";
    teksNota += "    Salatiga      \n";
    teksNota += "------------------\n";
    
    keranjang.forEach(i => {
        let namaShort = i.nama.toUpperCase().substring(0, 18);
        teksNota += `${namaShort}\n`;
        teksNota += `${i.qty} x ${i.harga.toLocaleString()} = ${(i.harga * i.qty).toLocaleString()}\n`;
    });
    
    teksNota += "------------------\n";
    teksNota += `TOTAL: Rp ${total.toLocaleString()}\n`;
    teksNota += "------------------\n";
    teksNota += "  Terima Kasih!   \n\n\n";

    // Kirim ke aplikasi RawBT
    window.location.href = "rawbt:" + encodeURIComponent(teksNota);

    // --- STEP C: RESET & UPDATE TAMPILAN ---
    keranjang = [];
    renderCart();
    renderHistory(); // Langsung update tab riwayat
    alert("Transaksi Berhasil & Nota Dikirim!");
}

// 6. FUNGSI TAMPILKAN RIWAYAT (FIX TAB PUTIH)
function renderHistory() {
    const historyList = document.getElementById('history-list');
    const data = JSON.parse(localStorage.getItem('dbHistory')) || [];
    
    if (data.length === 0) {
        historyList.innerHTML = `
            <div class="text-center py-20">
                <p class="text-slate-400">Belum ada riwayat penjualan.</p>
            </div>`;
        return;
    }

    // Tampilkan data dari yang terbaru (reverse)
    historyList.innerHTML = data.slice().reverse().map(h => `
        <div class="bg-white dark:bg-slate-800 p-4 rounded-2xl border dark:border-slate-700 mb-3 shadow-sm">
            <div class="flex justify-between items-center border-b dark:border-slate-700 pb-2 mb-2">
                <span class="text-[10px] font-bold text-blue-600">${h.waktu}</span>
                <span class="text-xs font-black dark:text-white">Rp ${h.total.toLocaleString()}</span>
            </div>
            <div class="space-y-1">
                ${h.items.map(i => `
                    <div class="flex justify-between text-[10px] dark:text-slate-400">
                        <span>${i.nama} x${i.qty}</span>
                        <span>${(i.harga * i.qty).toLocaleString()}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// 7. LOAD RIWAYAT SAAT APLIKASI DIBUKA
document.addEventListener('DOMContentLoaded', () => {
    renderHistory();
});
