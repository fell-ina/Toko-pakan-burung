let daftarProduk = JSON.parse(localStorage.getItem('db_produk')) || [];
let keranjang = [];

// 1. PINDAH TAB
function switchTab(tabId) {
    document.querySelectorAll('main').forEach(m => m.classList.add('hidden'));
    document.getElementById('tab-' + tabId).classList.remove('hidden');
    
    // Update warna icon nav
    document.querySelectorAll('nav button').forEach(btn => btn.classList.replace('text-blue-600', 'text-slate-400'));
    event.currentTarget.classList.replace('text-slate-400', 'text-blue-600');
}

// 2. KELOLA PRODUK (CRUD)
function tambahProdukBaru() {
    const nama = document.getElementById('p-nama').value;
    const harga = parseInt(document.getElementById('p-harga').value);

    if (nama && harga) {
        daftarProduk.push({ id: Date.now(), nama, harga });
        localStorage.setItem('db_produk', JSON.stringify(daftarProduk));
        document.getElementById('p-nama').value = '';
        document.getElementById('p-harga').value = '';
        renderAll();
        alert("Sip! Produk sudah masuk katalog.");
    }
}

function hapusProduk(id) {
    if (confirm("Hapus produk ini dari katalog?")) {
        daftarProduk = daftarProduk.filter(p => p.id !== id);
        localStorage.setItem('db_produk', JSON.stringify(daftarProduk));
        renderAll();
    }
}

// 3. SEARCH BAR (KASIR & PRODUK)
function filterProduk(target) {
    const keyword = document.getElementById('search-' + target).value.toLowerCase();
    renderAll(keyword);
}

// 4. LOGIKA KASIR
function keKeranjang(id) {
    const produk = daftarProduk.find(p => p.id === id);
    const ada = keranjang.find(item => item.id === id);
    if (ada) { ada.qty++; } else { keranjang.push({...produk, qty: 1}); }
    renderCart();
}

function renderCart() {
    const drawer = document.getElementById('cart-drawer');
    const itemsEl = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');

    if (keranjang.length > 0) {
        drawer.classList.remove('hidden');
        itemsEl.innerHTML = keranjang.map(i => `<div>${i.nama} x${i.qty} = ${(i.harga*i.qty).toLocaleString()}</div>`).join('');
        const total = keranjang.reduce((a, b) => a + (b.harga * b.qty), 0);
        totalEl.innerText = total.toLocaleString();
    } else {
        drawer.classList.add('hidden');
    }
}

// 5. PROSES CETAK & SIMPAN RIWAYAT
function prosesCheckout() {
    const total = keranjang.reduce((a, b) => a + (b.harga * b.qty), 0);
    const waktu = new Date().toLocaleString('id-ID');

    // Simpan ke Riwayat
    const history = JSON.parse(localStorage.getItem('db_history')) || [];
    history.push({ waktu, total, items: [...keranjang] });
    localStorage.setItem('db_history', JSON.stringify(history));

    // Format Nota (Mode Teks agar rapi di RPP02N)
    let teks = "TEKS:\n   KEMBANG ARUM   \n    Salatiga      \n------------------\n";
    keranjang.forEach(i => {
        teks += `${i.nama.toUpperCase().substring(0,15)}\n${i.qty}x${i.harga.toLocaleString()} = ${(i.harga*i.qty).toLocaleString()}\n`;
    });
    teks += `------------------\nTOTAL: Rp ${total.toLocaleString()}\n------------------\n\n\n`;

    window.location.href = "rawbt:" + encodeURIComponent(teks);

    keranjang = [];
    renderCart();
    renderHistory();
}

// 6. RENDER SEMUA
function renderAll(filter = "") {
    const listKasir = document.getElementById('produk-list');
    const listMaster = document.getElementById('master-produk-list');
    listKasir.innerHTML = "";
    listMaster.innerHTML = "";

    daftarProduk.forEach(p => {
        if (p.nama.toLowerCase().includes(filter)) {
            listKasir.innerHTML += `
                <div onclick="keKeranjang(${p.id})" class="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 active:scale-95 transition">
                    <div class="font-bold text-sm">${p.nama}</div>
                    <div class="text-blue-600 font-black text-xs">Rp ${p.harga.toLocaleString()}</div>
                </div>`;
            
            listMaster.innerHTML += `
                <div class="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm">
                    <div><div class="font-bold">${p.nama}</div><div class="text-xs text-slate-400">Rp ${p.harga.toLocaleString()}</div></div>
                    <button onclick="hapusProduk(${p.id})" class="text-red-500 font-bold text-xs px-3 py-1">HAPUS</button>
                </div>`;
        }
    });
}

function renderHistory() {
    const list = document.getElementById('history-list');
    const data = JSON.parse(localStorage.getItem('db_history')) || [];
    if (data.length === 0) { list.innerHTML = '<p class="text-center py-10 text-slate-400">Belum ada riwayat.</p>'; return; }

    list.innerHTML = data.slice().reverse().map(h => `
        <div class="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-blue-500">
            <div class="flex justify-between font-black text-xs mb-1"><span>${h.waktu}</span><span class="text-blue-600">Rp ${h.total.toLocaleString()}</span></div>
            <div class="text-[10px] text-slate-500">${h.items.map(i => `${i.nama} x${i.qty}`).join(', ')}</div>
        </div>
    `).join('');
}

function hapusSemuaRiwayat() { if(confirm("Hapus semua riwayat transaksi?")) { localStorage.removeItem('db_history'); renderHistory(); } }

// Jalankan awal
renderAll();
renderHistory();
