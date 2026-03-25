let dbBarang = JSON.parse(localStorage.getItem('dbBarang')) || [];
let dbHistory = JSON.parse(localStorage.getItem('dbHistory')) || [];
let keranjang = [];
let filterKategori = 'Semua';

// --- TEMA & NAVIGASI ---
function gantiTema(mode) {
    const body = document.getElementById('appBody');
    mode === 'dark' ? body.classList.add('dark') : body.classList.remove('dark');
    localStorage.setItem('theme', mode);
}
if (localStorage.getItem('theme') === 'dark') gantiTema('dark');

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

// --- KASIR ---
function renderEtalase() {
    const grid = document.getElementById('grid-etalase');
    const chips = document.getElementById('category-chips');
    const search = document.getElementById('search-kasir').value.toLowerCase();
    
    const kats = ['Semua', ...new Set(dbBarang.map(b => b.kategori || "Umum"))];
    chips.innerHTML = kats.map(k => `
        <button onclick="setFilter('${k}')" class="px-4 py-2 rounded-full border text-[10px] font-bold ${filterKategori === k ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-700 dark:text-white'}">
            ${k.toUpperCase()}
        </button>`).join('');

    const filtered = dbBarang.filter(b => (filterKategori === 'Semua' || b.kategori === filterKategori) && b.nama.toLowerCase().includes(search));
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
        return `<div class="flex justify-between text-[10px] dark:text-white border-b dark:border-slate-700 pb-2">
            <span>${item.nama.toUpperCase()} (x${item.qty})</span>
            <button onclick="hapusKeranjang(${idx})" class="text-red-500 font-bold ml-2">✕</button>
        </div>`;
    }).join('');
    document.getElementById('total-cart').innerText = `Rp ${total.toLocaleString()}`;
}
function hapusKeranjang(idx) { keranjang.splice(idx, 1); renderCart(); }

// --- PRODUK ---
function renderMenu() {
    const search = document.getElementById('search-produk').value.toLowerCase();
    document.getElementById('menu-list').innerHTML = dbBarang.filter(b => b.nama.toLowerCase().includes(search)).map(i => `
        <div class="flex justify-between bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 items-center">
            <div class="flex items-center gap-3">
                ${i.foto ? `<img src="${i.foto}" class="w-10 h-10 rounded-lg object-cover">` : `<div class="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg"></div>`}
                <div><p class="font-bold dark:text-white text-xs uppercase">${i.nama}</p><p class="text-[9px] text-blue-500">${i.kategori} | Rp ${i.harga.toLocaleString()}</p></div>
            </div>
            <div class="flex gap-4"><button onclick="prepareEdit(${i.id})" class="text-amber-500">✏️</button><button onclick="hapusMenu(${i.id})" class="text-red-500">🗑️</button></div>
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
        idEdit ? (dbBarang[dbBarang.findIndex(b => b.id == idEdit)] = itemData) : dbBarang.push(itemData);
        localStorage.setItem('dbBarang', JSON.stringify(dbBarang));
        resetFormMenu(); renderMenu();
    };
    fotoFile ? (new FileReader().onload = (e) => action(e.target.result), new FileReader().readAsDataURL(fotoFile)) : action(idEdit ? dbBarang.find(b => b.id == idEdit).foto : null);
}
function prepareEdit(id) {
    const item = dbBarang.find(b => b.id === id);
    document.getElementById('edit-id').value = item.id;
    document.getElementById('inp-nama').value = item.nama;
    document.getElementById('inp-harga').value = item.harga;
    document.getElementById('inp-kategori').value = item.kategori;
    document.getElementById('btn-simpan').innerText = "UPDATE";
    document.getElementById('btn-batal').classList.remove('hidden');
    window.scrollTo(0,0);
}
function resetFormMenu() {
    document.getElementById('edit-id').value = ''; document.getElementById('inp-nama').value = '';
    document.getElementById('inp-harga').value = ''; document.getElementById('inp-kategori').value = '';
    document.getElementById('btn-simpan').innerText = "SIMPAN"; document.getElementById('btn-batal').classList.add('hidden');
}
function hapusMenu(id) { if(confirm("Hapus produk?")) { dbBarang = dbBarang.filter(b => b.id !== id); localStorage.setItem('dbBarang', JSON.stringify(dbBarang)); renderMenu(); renderEtalase(); } }

// --- RIWAYAT (DETAIL PRODUK & JUMLAH) ---
function renderHistory() {
    const historyList = document.getElementById('history-list');
    if (dbHistory.length === 0) {
        historyList.innerHTML = '<p class="text-center text-slate-400 text-xs italic py-10">Belum ada riwayat transaksi.</p>';
        return;
    }

    historyList.innerHTML = dbHistory.slice().reverse().map(h => `
        <div class="bg-white dark:bg-slate-800 p-4 rounded-2xl border dark:border-slate-700 shadow-sm">
            <div class="flex justify-between items-center border-b dark:border-slate-700 pb-2 mb-2">
                <span class="text-[9px] text-blue-600 font-black">${h.waktu}</span>
                <span class="text-xs font-black dark:text-white uppercase">Rp ${h.total.toLocaleString()}</span>
            </div>
            <div class="space-y-1">
                ${h.items.map(i => `
                    <div class="flex justify-between text-[10px] text-slate-600 dark:text-slate-300">
                        <span>${i.nama.toUpperCase()} <span class="text-[8px] opacity-60">(Rp ${i.harga.toLocaleString()} x ${i.qty})</span></span>
                        <span class="font-bold text-slate-800 dark:text-white text-right">Rp ${(i.harga * i.qty).toLocaleString()}</span>
                    </div>
                `).join('')}
            </div>
        </div>`).join('');
}

// --- FUNGSI CETAK (DIPERKUAT UNTUK RAWBT) ---
function prosesCheckout() {
    if(keranjang.length === 0) return alert("Keranjang masih kosong!");
    const total = keranjang.reduce((a, b) => a + (b.harga * b.qty), 0);
    const waktu = new Date().toLocaleString('id-ID');

    // Kita bikin container nota yang SANGAT SEDERHANA agar RawBT tidak bingung
    const notaHTML = `
    <html>
    <head>
        <style>
            @page { margin: 0; }
            body { 
                width: 48mm; 
                margin: 0; 
                padding: 5px; 
                font-family: 'Courier New', Courier, monospace; 
                font-size: 10pt; 
                line-height: 1.2;
            }
            .center { text-align: center; }
            .flex { display: flex; justify-content: space-between; }
            .bold { font-weight: bold; }
            .hr { border-bottom: 1px dashed #000; margin: 5px 0; }
        </style>
    </head>
    <body>
        <div class="center bold">TOKO PAKAN BURUNG<br>KEMBANG ARUM</div>
        <div class="center" style="font-size: 8pt;">Salatiga<br>${waktu}</div>
        <div class="hr"></div>
        ${keranjang.map(i => `
            <div class="flex">
                <span>${i.nama.toUpperCase().substring(0,14)}</span>
                <span>${(i.harga * i.qty).toLocaleString()}</span>
            </div>
            <div style="font-size: 8pt;">${i.qty} x ${i.harga.toLocaleString()}</div>
        `).join('')}
        <div class="hr"></div>
        <div class="flex bold">
            <span>TOTAL</span>
            <span>Rp ${total.toLocaleString()}</span>
        </div>
        <div class="hr"></div>
        <div class="center bold"><br>TERIMA KASIH!</div>
        <div class="center" style="font-size: 8pt;"><br>Versi POS 1.0</div>
        <br><br>
    </body>
    </html>`;

    // Pastikan iframe bersih sebelum membuat yang baru
    const oldFrame = document.getElementById('print-frame');
    if (oldFrame) document.body.removeChild(oldFrame);

    const iframe = document.createElement('iframe');
    iframe.id = 'print-frame';
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(notaHTML);
    doc.close();

    // Tunggu konten dimuat sempurna sebelum perintah print dikirim ke RawBT
    setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        
        // Simpan ke riwayat
        dbHistory.push({ 
            waktu: waktu, 
            total: total, 
            items: keranjang.map(i => ({ nama: i.nama, harga: i.harga, qty: i.qty })) 
        });
        localStorage.setItem('dbHistory', JSON.stringify(dbHistory));
        
        keranjang = []; 
        renderCart();
    }, 800);
}

renderEtalase();
