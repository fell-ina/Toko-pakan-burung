let dbBarang = JSON.parse(localStorage.getItem('dbBarang')) || [];
let dbHistory = JSON.parse(localStorage.getItem('dbHistory')) || [];
let keranjang = [];
let filterKategori = 'Semua';

// --- LOGIKA TEMA (FIXED) ---
function gantiTema(mode) {
    const body = document.getElementById('appBody');
    if (mode === 'dark') {
        body.classList.add('dark');
    } else {
        body.classList.remove('dark');
    }
    localStorage.setItem('theme', mode);
}

// Cek tema saat pertama kali load
if (localStorage.getItem('theme') === 'dark') gantiTema('dark');

// --- NAVIGASI ---
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

// --- KASIR ---
function renderEtalase() {
    const grid = document.getElementById('grid-etalase');
    grid.innerHTML = '';
    dbBarang.forEach(b => {
        grid.innerHTML += `
            <div onclick="tambahKeKeranjang(${b.id})" class="bg-white dark:bg-slate-800 p-2 rounded-2xl border dark:border-slate-700 shadow-sm cursor-pointer active:scale-95">
                <div class="h-20 bg-slate-100 dark:bg-slate-700 rounded-xl overflow-hidden mb-2">
                    ${b.foto ? `<img src="${b.foto}" class="w-full h-full object-cover">` : ''}
                </div>
                <p class="font-bold text-[10px] truncate dark:text-white uppercase">${b.nama}</p>
                <p class="text-[9px] text-blue-500 font-black">Rp ${b.harga.toLocaleString()}</p>
            </div>`;
    });
}

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
        list.innerHTML += `<div class="flex justify-between text-[10px] dark:text-white border-b dark:border-slate-700 pb-2">
            <span>${item.nama} x${item.qty}</span>
            <button onclick="hapusItem(${idx})" class="text-red-500 font-bold">X</button>
        </div>`;
    });
    document.getElementById('total-cart').innerText = `Rp ${total.toLocaleString()}`;
}

function hapusItem(idx) { keranjang.splice(idx, 1); renderCart(); }

// --- PROSES CETAK RAWBT ---
function prosesCheckout() {
    if(keranjang.length === 0) return alert("Keranjang kosong!");
    
    const total = keranjang.reduce((a, b) => a + (b.harga * b.qty), 0);
    const isiNota = document.getElementById('isi-nota');
    const totalNota = document.getElementById('total-nota');
    
    // Isi Area Cetak Tersembunyi
    isiNota.innerHTML = keranjang.map(i => `
        <div style="display:flex; justify-content:space-between">
            <span>${i.nama} x${i.qty}</span>
            <span>${(i.harga*i.qty).toLocaleString()}</span>
        </div>
    `).join('');
    
    totalNota.innerHTML = `
        <div style="display:flex; justify-content:space-between; border-top:1px dashed #000; padding-top:5px">
            <span>TOTAL</span>
            <span>Rp ${total.toLocaleString()}</span>
        </div>`;

    // Simpan Ke Riwayat
    dbHistory.push({ waktu: new Date().toLocaleString(), total: total, items: [...keranjang] });
    localStorage.setItem('dbHistory', JSON.stringify(dbHistory));

    // Jalankan Print (RawBT akan menangkap ini)
    window.print();
    
    // Reset Kasir
    keranjang = [];
    renderCart();
}

// --- PRODUK & RIWAYAT (Minimalis) ---
function simpanBarang() {
    const nama = document.getElementById('inp-nama').value;
    const harga = parseInt(document.getElementById('inp-harga').value);
    const kategori = document.getElementById('inp-kategori').value || "Umum";
    const foto = document.getElementById('inp-foto').files[0];
    
    const save = (img) => {
        dbBarang.push({ id: Date.now(), nama, harga, kategori, foto: img });
        localStorage.setItem('dbBarang', JSON.stringify(dbBarang));
        alert("Produk disimpan!");
        location.reload();
    };

    if(foto) {
        const r = new FileReader(); r.onload = (e) => save(e.target.result); r.readAsDataURL(foto);
    } else { save(null); }
}

function renderMenu() {
    const container = document.getElementById('menu-grouped-list');
    container.innerHTML = dbBarang.map(i => `
        <div class="flex justify-between bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700">
            <span class="font-bold dark:text-white text-xs">${i.nama}</span>
            <button onclick="hapusMenu(${i.id})" class="text-red-500">🗑️</button>
        </div>`).join('');
}

function hapusMenu(id) { 
    dbBarang = dbBarang.filter(b => b.id !== id); 
    localStorage.setItem('dbBarang', JSON.stringify(dbBarang)); 
    renderMenu(); 
}

function renderHistory() {
    const list = document.getElementById('history-list');
    list.innerHTML = dbHistory.slice().reverse().map(h => `
        <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 flex justify-between">
            <span class="text-[9px] dark:text-white font-bold">${h.waktu}</span>
            <span class="text-blue-500 font-bold text-xs">Rp ${h.total.toLocaleString()}</span>
        </div>`).join('');
}

// Start
renderEtalase();
