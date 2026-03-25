// 1. DATA & STATE UTAMA
let keranjang = [];

// 2. FUNGSI NAVIGASI TAB (Agar tombol bawah bisa diklik)
function switchTab(tabName) {
    // Sembunyikan semua halaman
    const pages = ['kasir', 'produk', 'riwayat', 'setup'];
    pages.forEach(page => {
        const el = document.getElementById('halaman-' + page);
        if (el) el.classList.add('hidden');
    });

    // Tampilkan halaman yang dipilih
    const activePage = document.getElementById('halaman-' + tabName);
    if (activePage) activePage.classList.remove('hidden');

    // Update warna tombol navigasi (opsional)
    console.log("Pindah ke tab: " + tabName);

    // Jika buka tab riwayat, refresh datanya
    if (tabName === 'riwayat') {
        renderHistory();
    }
}

// 3. FUNGSI KERANJANG & KASIR
function addToCart(nama, harga) {
    const ada = keranjang.find(item => item.nama === nama);
    if (ada) {
        ada.qty++;
    } else {
        keranjang.push({ nama, harga, qty: 1 });
    }
    renderCart();
}

function hapusItem(index) {
    keranjang.splice(index, 1);
    renderCart();
}

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
                <button onclick="hapusItem(${index})" class="text-red-500 p-2">
                    Hapus
                </button>
            </div>
        `;
    }).join('');

    totalHarga.innerText = `Rp ${total.toLocaleString()}`;
}

// 4. FUNGSI CETAK NOTA (MODE TEKS ANTI-ERROR)
function prosesCheckout() {
    if (keranjang.length === 0) return alert("Keranjang kosong!");

    const total = keranjang.reduce((a, b) => a + (b.harga * b.qty), 0);
    const waktu = new Date().toLocaleString('id-ID');

    // Simpan ke Riwayat (LocalStorage)
    const history = JSON.parse(localStorage.getItem('dbHistory')) || [];
    history.push({ waktu, total, items: [...keranjang] });
    localStorage.setItem('dbHistory', JSON.stringify(history));

    // Format TEKS MURNI untuk RawBT
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

    // Kirim ke RawBT via URL Scheme
    window.location.href = "rawbt:" + encodeURIComponent(teksNota);

    // Reset Kasir
    keranjang = [];
    renderCart();
    alert("Transaksi Berhasil!");
}

// 5. FUNGSI RENDER RIWAYAT (Agar tab riwayat tidak putih polos)
function renderHistory() {
    const list = document.getElementById('history-list');
    const data = JSON.parse(localStorage.getItem('dbHistory')) || [];
    
    if (data.length === 0) {
        list.innerHTML = '<div class="text-center py-20 text-slate-400">Belum ada riwayat penjualan.</div>';
        return;
    }

    list.innerHTML = data.slice().reverse().map(h => `
        <div class="bg-white dark:bg-slate-800 p-4 rounded-2xl border dark:border-slate-700 mb-3 shadow-sm">
            <div class="flex justify-between items-center border-b dark:border-slate-700 pb-2 mb-2">
                <span class="text-[10px] font-bold text-blue-600">${h.waktu}</span>
                <span class="text-xs font-black dark:text-white uppercase">Rp ${h.total.toLocaleString()}</span>
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

// 6. INISIALISASI SAAT STARTUP
document.addEventListener('DOMContentLoaded', () => {
    switchTab('kasir'); // Set halaman awal
    renderHistory();
});
