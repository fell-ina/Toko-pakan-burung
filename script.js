let dbBarang = JSON.parse(localStorage.getItem('dbBarang')) || [];
let dbHistory = JSON.parse(localStorage.getItem('dbHistory')) || [];
let keranjang = [];
let filterKategori = 'Semua';

// --- TEMA ---
function gantiTema(mode) {
    const body = document.getElementById('appBody');
    mode === 'dark' ? body.classList.add('dark') : body.classList.remove('dark');
    localStorage.setItem('theme', mode);
}
if (localStorage.getItem('theme') === 'dark') gantiTema('dark');

// --- NAVIGASI ---
function openTab(id) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('text-blue-600', 'border-blue-600');
        b.classList.add('text-slate-400', 'border-transparent');
    });
    document.getElementById(id).classList.add('active');
    document.getElementById('btn-' + id).classList.add('text-blue-600', 'border-blue-600');
    
    if(id === 'tab-print') renderEtalase();
    if(id === 'tab-menu') renderMenu();
    if(id === 'tab-history') renderHistory();
}

// --- KASIR & FILTER ---
function renderEtalase() {
    const grid = document.getElementById('grid-etalase');
    const chips = document.getElementById('category-chips');
    const search = document.getElementById('search-kasir').value.toLowerCase();
    
    // Render Chips Kategori
    const kats = ['Semua', ...new Set(dbBarang.map(b => b.kategori || "Umum"))];
    chips.innerHTML = kats.map(k => `
        <button onclick="setFilter('${k}')" class="px-4 py-2 rounded-full border text-[10px] font-bold whitespace-nowrap ${filterKategori === k ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-700 dark:text-white'}">
            ${k.toUpperCase()}
        </button>
    `).join('');

    // Filter Produk
    const filtered = dbBarang.filter(b => {
        const matchesKat = filterKategori === 'Semua' || b.kategori === filterKategori;
        const matchesSearch = b.nama.toLowerCase().includes(search);
        return matchesKat && matchesSearch;
    });

    grid.innerHTML = filtered.map(b => `
        <div onclick="tambahKeKeranjang(${b.id})" class="bg-white dark:bg-slate-800 p-2 rounded-2xl border dark:border-slate-700 shadow-sm cursor-pointer active:scale-95 transition">
            <div class="h-24 bg-slate-100 dark:bg-slate-700 rounded-xl overflow-hidden mb-2">
                ${b.foto ? `<img src="${b.foto}" class="w-full h-full object-cover">` : ''}
            </div>
            <p class="font-bold text-[10px] truncate dark:text-white uppercase">${b.nama}</p>
            <p class="text-[9px] text-blue-500 font-black">Rp ${b.harga.toLocaleString()}</p>
        </div>`).join('');
}

function setFilter(k) { filterKategori = k; renderEtalase(); }

function tambahKeKeranjang(id) {
    const item = dbBarang.find(b => b.id === id);
    const ada = keranjang.find(k => k.id === id);
    ada ? ada.qty++ : keranjang.push({ ...item, qty: 1 });
    renderCart();
}

function renderCart() {
    const list = document.getElementById('cart-items');
    let total = 0;
    list.innerHTML = keranjang.map((item, idx) => {
        total += (item.harga * item.qty);
        return `<div class="flex justify-between text-[10px] dark:text-white border-b dark:border-slate-700 pb-2 items-center">
            <span class="flex-1">${item.nama.toUpperCase()} (x${item.qty})</span>
            <span class="mr-3 font-bold">${(item.harga * item.qty).toLocaleString()}</span>
            <button onclick="hapusKeranjang(${idx})" class="text-red-500">✕</button>
        </div>`;
    }).join('');
    document.getElementById('total-cart').innerText = `Rp ${total.toLocaleString()}`;
}

function hapusKeranjang(idx) { keranjang.splice(idx, 1); renderCart(); }

// --- PRODUK (SEARCH, EDIT, DELETE) ---
function renderMenu() {
    const list = document.getElementById('menu-list');
    const search = document.getElementById('search-produk').value.toLowerCase();
    
    const filtered = dbBarang.filter(b => b.nama.toLowerCase().includes(search));

    list.innerHTML = filtered.map(i => `
        <div class="flex justify-between bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 items-center">
            <div>
                <p class="font-bold dark:text-white text-xs uppercase">${i.nama}</p>
                <p class="text-[9px] text-blue-500 font-bold">Rp ${i.harga.toLocaleString()} | ${i.kategori || 'Umum'}</p>
            </div>
            <div class="flex gap-4">
                <button onclick="prepareEdit(${i.id})" class="text-amber-500 text-sm">✏️</button>
                <button onclick="hapusMenu(${i.id})" class="text-red-500 text-sm">🗑️</button>
            </div>
        </div>`).join('');
}

function simpanBarang() {
    const nama = document.getElementById('inp-nama').value;
    const harga = parseInt(document.getElementById('inp-harga').value);
    const kategori = document.getElementById('inp-kategori').value || "Umum";
    const fotoFile = document.getElementById('inp-foto').files[0];
    const idEdit = document.getElementById('edit-id').value;

    if(!nama || !harga) return alert("Lengkapi data!");

    const action = (img) => {
        const itemData = { id: idEdit ? parseInt(idEdit) : Date.now(), nama, harga, kategori, foto: img };
        if(idEdit) {
            const idx = dbBarang.findIndex(b => b.id == idEdit);
            dbBarang[idx] = itemData;
        } else {
            dbBarang.push(itemData);
        }
        localStorage.setItem('dbBarang', JSON.stringify(dbBarang));
        resetFormMenu(); renderMenu(); renderEtalase();
    };

    if(fotoFile) {
        const r = new FileReader(); r.onload = (e) => action(e.target.result); r.readAsDataURL(fotoFile);
    } else {
        action(idEdit ? dbBarang.find(b => b.id == idEdit).foto : null);
    }
}

function prepareEdit(id) {
    const item = dbBarang.find(b => b.id === id);
    document.getElementById('edit-id').value = item.id;
    document.getElementById('inp-nama').value = item.nama;
    document.getElementById('inp-harga').value = item.harga;
    document.getElementById('inp-kategori').value = item.kategori;
    document.getElementById('btn-simpan').innerText = "UPDATE PRODUK";
    document.getElementById('btn-batal').classList.remove('hidden');
    window.scrollTo(0, 0);
}

function resetFormMenu() {
    document.getElementById('edit-id').value = '';
    document.getElementById('inp-nama').value = '';
    document.getElementById('inp-harga').value = '';
    document.getElementById('inp-kategori').value = '';
    document.getElementById('btn-simpan').innerText = "SIMPAN PRODUK";
    document.getElementById('btn-batal').classList.add('hidden');
}

function hapusMenu(id) {
    if(confirm("Hapus produk ini?")) {
        dbBarang = dbBarang.filter(b => b.id !== id);
        localStorage.setItem('dbBarang', JSON.stringify(dbBarang));
        renderMenu(); renderEtalase();
    }
}

// --- CETAK NOTA (RAWBT COMPATIBLE) ---
function prosesCheckout() {
    if(keranjang.length === 0) return;
    const total = keranjang.reduce((a, b) => a + (b.harga * b.qty), 0);
    const notaHTML = `
        <html><head><style>
            body { width: 48mm; font-family: monospace; font-size: 9pt; padding: 0; margin: 0; }
            center { text-align: center; }
            .flex { display: flex; justify-content: space-between; }
        </style></head><body>
            <center><strong>MILKY WAVE</strong><br>Salatiga<br>--------------------------</center>
            ${keranjang.map(i => `<div class="flex"><span>${i.nama.substring(0,15)} x${i.qty}</span><span>${(i.harga*i.qty).toLocaleString()}</span></div>`).join('')}
            --------------------------
            <div class="flex" style="font-weight:bold"><span>TOTAL</span><span>Rp ${total.toLocaleString()}</span></div>
            <center><br>Terima Kasih!<br><br><br></center>
        </body></html>`;

    const iframe = document.createElement('iframe');
    iframe.id = 'print-frame';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow.document;
    doc.open(); doc.write(notaHTML); doc.close();

    setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        dbHistory.push({ waktu: new Date().toLocaleString(), total });
        localStorage.setItem('dbHistory', JSON.stringify(dbHistory));
        keranjang = []; renderCart();
        setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 500);
}

function renderHistory() {
    document.getElementById('history-list').innerHTML = dbHistory.slice().reverse().map(h => `
        <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 flex justify-between">
            <span class="text-[10px] dark:text-white font-bold">${h.waktu}</span>
            <span class="text-blue-500 font-bold text-xs">Rp ${h.total.toLocaleString()}</span>
        </div>`).join('');
}

renderEtalase();
