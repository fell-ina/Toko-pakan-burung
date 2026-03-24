let dbBarang = JSON.parse(localStorage.getItem('dbBarang')) || [];
let dbHistory = JSON.parse(localStorage.getItem('dbHistory')) || [];
let keranjang = [];
let filterKategori = 'Semua';

// ==========================================
// TEMA (FIXED)
// ==========================================
function gantiTema(mode) {
    const body = document.getElementById('appBody');
    if (mode === 'dark') {
        body.classList.add('dark');
    } else {
        body.classList.remove('dark');
    }
    localStorage.setItem('theme', mode);
}

// Jalankan tema saat load pertama kali
if (localStorage.getItem('theme') === 'dark') gantiTema('dark');

// ==========================================
// NAVIGASI
// ==========================================
function openTab(id) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('text-blue-600', 'border-blue-600');
        b.classList.add('text-slate-400', 'border-transparent');
    });
    
    document.getElementById(id).classList.add('active');
    const activeBtn = document.getElementById('btn-' + id);
    activeBtn.classList.remove('text-slate-400', 'border-transparent');
    activeBtn.classList.add('text-blue-600', 'border-blue-600');

    if(id === 'tab-print') renderEtalase();
    if(id === 'tab-menu') renderMenu();
    if(id === 'tab-history') renderHistory();
}

// ==========================================
// KASIR LOGIC
// ==========================================
function renderEtalase() {
    const grid = document.getElementById('grid-etalase');
    const chips = document.getElementById('category-chips');
    grid.innerHTML = '';
    
    let kats = ['Semua', ...new Set(dbBarang.map(b => b.kategori || "Umum"))];
    chips.innerHTML = kats.map(k => `
        <button onclick="setFilter('${k}')" class="px-5 py-2 rounded-xl border text-[10px] font-bold uppercase transition ${filterKategori === k ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-700 dark:text-white dark:border-slate-600 text-slate-500'}">
            ${k}
        </button>
    `).join('');

    dbBarang.filter(b => filterKategori === 'Semua' || b.kategori === filterKategori).forEach(b => {
        grid.innerHTML += `
            <div onclick="tambahKeKeranjang(${b.id})" class="bg-white dark:bg-slate-800 p-2 rounded-2xl border dark:border-slate-700 shadow-sm cursor-pointer hover:shadow-md active:scale-95 transition">
                <div class="h-20 bg-slate-50 dark:bg-slate-700 rounded-xl overflow-hidden mb-2">
                    ${b.foto ? `<img src="${b.foto}" class="w-full h-full object-cover">` : ''}
                </div>
                <p class="font-black text-[10px] truncate dark:text-white uppercase px-1">${b.nama}</p>
                <p class="text-[9px] text-blue-500 font-black px-1">Rp ${b.harga.toLocaleString()}</p>
            </div>`;
    });
}

function setFilter(k) { filterKategori = k; renderEtalase(); }

function tambahKeKeranjang(id) {
    const item = dbBarang.find(b => b.id === id);
    const ada = keranjang.find(k => k.id === id);
    if(ada) ada.qty++; else keranjang.push({ ...item, qty: 1 });
    renderCart();
}

function renderCart() {
    const list = document.getElementById('cart-items');
    let total = 0;
    list.innerHTML = '';
    keranjang.forEach((item, idx) => {
        total += (item.harga * item.qty);
        list.innerHTML += `
            <div class="flex justify-between items-center bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl border dark:border-slate-600">
                <div class="flex-1">
                    <p class="font-black text-[10px] dark:text-white uppercase">${item.nama}</p>
                    <p class="text-[9px] text-slate-400 font-bold">Rp ${(item.harga * item.qty).toLocaleString()}</p>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="ubahQty(${idx}, -1)" class="w-6 h-6 bg-white dark:bg-slate-600 rounded-full shadow-sm text-xs">-</button>
                    <span class="font-black text-xs dark:text-white w-4 text-center">${item.qty}</span>
                    <button onclick="ubahQty(${idx}, 1)" class="w-6 h-6 bg-white dark:bg-slate-600 rounded-full shadow-sm text-xs">+</button>
                </div>
            </div>`;
    });
    document.getElementById('total-cart').innerText = `Rp ${total.toLocaleString()}`;
}

function ubahQty(i, n) {
    keranjang[i].qty += n;
    if(keranjang[i].qty < 1) keranjang.splice(i, 1);
    renderCart();
}

// ==========================================
// PROSES CETAK RAWBT (FIXED)
// ==========================================
function prosesCheckout() {
    if(keranjang.length === 0) return alert("Keranjang kosong!");
    
    const total = keranjang.reduce((a, b) => a + (b.harga * b.qty), 0);
    const isiNota = document.getElementById('isi-nota');
    const totalNota = document.getElementById('total-nota');
    
    // Isi Area Cetak Tersembunyi
    isiNota.innerHTML = keranjang.map(i => `
        <div style="display:flex; justify-content:space-between; margin-bottom: 2px;">
            <span style="flex:1;">${i.nama.toUpperCase().substring(0, 16)} x${i.qty}</span>
            <span>${(i.harga*i.qty).toLocaleString()}</span>
        </div>
    `).join('');
    
    totalNota.innerHTML = `
        <div style="display:flex; justify-content:space-between;">
            <span>TOTAL AKHIR</span>
            <span>Rp ${total.toLocaleString()}</span>
        </div>`;

    // Simpan ke Riwayat
    dbHistory.push({ waktu: new Date().toLocaleString(), total: total, items: [...keranjang] });
    localStorage.setItem('dbHistory', JSON.stringify(dbHistory));

    // Jalankan Print (RawBT akan otomatis menangkap ini)
    window.print();
    
    // Reset Kasir
    keranjang = [];
    renderCart();
}

// ==========================================
// MENU & RIWAYAT
// ==========================================
function simpanBarang() {
    const nama = document.getElementById('inp-nama').value;
    const harga = parseInt(document.getElementById('inp-harga').value);
    const kategori = document.getElementById('inp-kategori').value || "Umum";
    const fotoFile = document.getElementById('inp-foto').files[0];
    const idEdit = document.getElementById('edit-id').value;

    if(!nama || !harga) return alert("Isi data produk!");

    const save = (img) => {
        const data = { id: idEdit ? parseInt(idEdit) : Date.now(), nama, harga, kategori, foto: img };
        if(idEdit) dbBarang[dbBarang.findIndex(b => b.id == idEdit)] = data;
        else dbBarang.push(data);
        localStorage.setItem('dbBarang', JSON.stringify(dbBarang));
        resetFormMenu(); renderMenu();
        alert("Produk Berhasil Disimpan!");
    };

    if(fotoFile) {
        const r = new FileReader(); r.onload = (e) => save(e.target.result); r.readAsDataURL(fotoFile);
    } else {
        save(idEdit ? dbBarang.find(b => b.id == idEdit).foto : null);
    }
}

function renderMenu() {
    const container = document.getElementById('menu-grouped-list');
    container.innerHTML = dbBarang.map(i => `
        <div class="flex justify-between bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 items-center">
            <div class="flex flex-col">
                <span class="font-bold dark:text-white text-xs uppercase">${i.nama}</span>
                <span class="text-[9px] text-slate-400 font-bold">Rp ${i.harga.toLocaleString()}</span>
            </div>
            <div class="flex gap-4">
                <button onclick="prepareEditMenu(${i.id})" class="text-amber-500">✏️</button>
                <button onclick="hapusMenu(${i.id})" class="text-red-500">🗑️</button>
            </div>
        </div>`).join('');
}

function prepareEditMenu(id) {
    const item = dbBarang.find(b => b.id === id);
    document.getElementById('edit-id').value = item.id;
    document.getElementById('inp-nama').value = item.nama;
    document.getElementById('inp-harga').value = item.harga;
    document.getElementById('inp-kategori').value = item.kategori;
    document.getElementById('btn-simpan').innerText = "UPDATE";
    document.getElementById('btn-batal').classList.remove('hidden');
    window.scrollTo({top: 0, behavior: 'smooth'});
}

function resetFormMenu() {
    document.getElementById('edit-id').value = ''; document.getElementById('inp-nama').value = '';
    document.getElementById('inp-harga').value = ''; document.getElementById('btn-simpan').innerText = "SIMPAN";
    document.getElementById('btn-batal').classList.add('hidden');
}

function hapusMenu(id) { if(confirm("Hapus produk?")) { dbBarang = dbBarang.filter(b => b.id !== id); localStorage.setItem('dbBarang', JSON.stringify(dbBarang)); renderMenu(); } }

function renderHistory() {
    const list = document.getElementById('history-list');
    list.innerHTML = dbHistory.slice().reverse().map(h => `
        <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 flex justify-between items-center">
            <span class="text-[9px] dark:text-white font-bold">${h.waktu}</span>
            <span class="text-blue-500 font-black text-xs">Rp ${h.total.toLocaleString()}</span>
        </div>`).join('');
}

// Inisialisasi awal
renderEtalase();
