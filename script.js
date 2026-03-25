// Database sederhana di HP
let daftarProduk = JSON.parse(localStorage.getItem('dbProduk')) || [];
let keranjang = [];

// 1. FUNGSI PRODUK (TAMBAH & HAPUS)
function tambahProdukBaru() {
    const nama = document.getElementById('p-nama').value;
    const harga = parseInt(document.getElementById('p-harga').value);

    if (nama && harga) {
        daftarProduk.push({ id: Date.now(), nama, harga });
        localStorage.setItem('dbProduk', JSON.stringify(daftarProduk));
        alert("Produk berhasil disimpan!");
        document.getElementById('p-nama').value = '';
        document.getElementById('p-harga').value = '';
        renderSemua();
    } else {
        alert("Isi nama dan harga dulu, Lix!");
    }
}

function hapusProduk(id) {
    if (confirm("Hapus produk ini?")) {
        daftarProduk = daftarProduk.filter(p => p.id !== id);
        localStorage.setItem('dbProduk', JSON.stringify(daftarProduk));
        renderSemua();
    }
}

// 2. FUNGSI SEARCH (KASIR & PRODUK)
function filterProduk(target) {
    const keyword = document.getElementById('search-' + target).value.toLowerCase();
    renderSemua(keyword);
}

// 3. RENDER TAMPILAN
function renderSemua(filter = "") {
    const listKasir = document.getElementById('produk-list');
    const listMaster = document.getElementById('master-produk-list');
    
    listKasir.innerHTML = "";
    listMaster.innerHTML = "";

    daftarProduk.forEach(p => {
        if (p.nama.toLowerCase().includes(filter)) {
            // Tampilan di Kasir
            listKasir.innerHTML += `
                <div onclick="keKeranjang(${p.id})" class="bg-white p-4 rounded-2xl border shadow-sm active:scale-95 transition">
                    <div class="font-bold text-slate-800">${p.nama}</div>
                    <div class="text-blue-600 font-bold text-xs">Rp ${p.harga.toLocaleString()}</div>
                </div>`;
            
            // Tampilan di Tab Produk (untuk Edit/Hapus)
            listMaster.innerHTML += `
                <div class="flex justify-between items-center bg-slate-50 p-3 rounded-xl mb-2">
                    <span>${p.nama} (Rp ${p.harga.toLocaleString()})</span>
                    <button onclick="hapusProduk(${p.id})" class="text-red-500 font-bold">Hapus</button>
                </div>`;
        }
    });
    renderHistory();
}

// 4. PROSES CHECKOUT & RIWAYAT (FIXED)
function prosesCheckout() {
    if (keranjang.length === 0) return;

    const total = keranjang.reduce((a, b) => a + (b.harga * b.qty), 0);
    const waktu = new Date().toLocaleString('id-ID');

    // SIMPAN KE RIWAYAT
    const history = JSON.parse(localStorage.getItem('dbHistory')) || [];
    history.push({ waktu, total, items: [...keranjang] });
    localStorage.setItem('dbHistory', JSON.stringify(history));

    // FORMAT TEKS UNTUK PRINT (Sesuai foto 9d236dde)
    let teksNota = "TEKS:\n   KEMBANG ARUM   \n    Salatiga      \n------------------\n";
    keranjang.forEach(i => {
        teksNota += `${i.nama.toUpperCase().substring(0, 15)}\n${i.qty}x${i.harga.toLocaleString()} = ${(i.harga*i.qty).toLocaleString()}\n`;
    });
    teksNota += `------------------\nTOTAL: Rp ${total.toLocaleString()}\n------------------\n\n\n`;

    window.location.href = "rawbt:" + encodeURIComponent(teksNota);

    keranjang = [];
    renderCart();
    renderHistory();
}

function renderHistory() {
    const list = document.getElementById('history-list');
    const data = JSON.parse(localStorage.getItem('dbHistory')) || [];
    
    if (data.length === 0) {
        list.innerHTML = '<div class="text-center py-20 text-slate-400">Belum ada transaksi.</div>';
        return;
    }

    list.innerHTML = data.slice().reverse().map(h => `
        <div class="bg-white p-4 rounded-2xl border mb-3 shadow-sm">
            <div class="flex justify-between border-b pb-2 mb-2 text-[10px] font-bold">
                <span>${h.waktu}</span>
                <span class="text-blue-600">Rp ${h.total.toLocaleString()}</span>
            </div>
            ${h.items.map(i => `<div class="text-[10px] text-slate-500">${i.nama} x${i.qty}</div>`).join('')}
        </div>
    `).join('');
}

// Jalankan saat pertama buka
renderSemua();
