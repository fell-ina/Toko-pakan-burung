let dbBarang = JSON.parse(localStorage.getItem('dbBarang')) || [];
let dbHistory = JSON.parse(localStorage.getItem('dbHistory')) || [];
let keranjang = [];
let filterKategori = 'Semua';

// --- LOGIKA TEMA ---
function gantiTema(mode) {
    const body = document.getElementById('appBody');
    if (mode === 'dark') {
        body.classList.add('dark');
    } else {
        body.classList.remove('dark');
    }
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

// --- KASIR ---
function renderEtalase() {
    const grid = document.getElementById('grid-etalase');
    grid.innerHTML = '';
    dbBarang.forEach(b => {
        grid.innerHTML += `
            <div onclick="tambahKeKeranjang(${b.id})" class="bg-white dark:bg-slate-800 p-2 rounded-2xl border dark:border-slate-700 shadow-sm cursor-pointer active:scale-95 transition">
                <div class="h-20 bg-slate-100 dark:bg-slate-700 rounded-xl overflow-hidden mb-2">
                    ${b.foto ? `<img src="${b.foto}" class="w-full h-full object-cover">` : ''}
                </div>
                <p class="font-bold text-[10px] truncate dark:text-white uppercase px-1">${b.nama}</p>
                <p class="text-[9px] text-blue-500 font-black px-1">Rp ${b.harga.toLocaleString()}</p>
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
            <span>${item.nama.toUpperCase()} x${item.qty}</span>
            <div class="flex gap-2">
                <span>${(item.harga * item.qty).toLocaleString()}</span>
                <button onclick="hapusItem(${idx})" class="text-red-500 font-bold">✕</button>
            </div>
        </div>`;
    });
    document.getElementById('total-cart').innerText = `Rp ${total.toLocaleString()}`;
}

function hapusItem(idx) { keranjang.splice(idx, 1); renderCart(); }

// --- SISTEM CETAK RAWBT (TEKNIK IFRAME) ---
function prosesCheckout() {
    if(keranjang.length === 0) return alert("Keranjang kosong!");
    
    const total = keranjang.reduce((a, b) => a + (b.harga * b.qty), 0);
    const tgl = new Date().toLocaleString('id-ID');

    // Buat konten HTML Nota
    const notaHTML = `
        <html>
        <head>
            <style>
                body { width: 48mm; font-family: monospace; padding: 0; margin: 0; font-size: 9pt; color: #000; }
                center { text-align: center; }
                .line { border-top: 1px dashed #000; margin: 5px 0; }
                .flex { display: flex; justify-content: space-between; }
            </style>
        </head>
        <body>
            <center>
                <strong style="font-size: 12pt;">MILKY WAVE</strong><br>
                Salatiga, Jawa Tengah<br>
                ${tgl}
            </center>
            <div class="line"></div>
            ${keranjang.map(i => `
                <div class="flex">
                    <span>${i.nama.toUpperCase().substring(0, 15)} x${i.qty}</span>
                    <span>${(i.harga * i.qty).toLocaleString()}</span>
                </div>
            `).join('')}
            <div class="line"></div>
            <div class="flex" style="font-weight: bold;">
                <span>TOTAL</span>
                <span>Rp ${total.toLocaleString()}</span>
            </div>
            <center>
                <br>Terima Kasih!<br>Selamat Menikmati<br>IG: @milkywave.id<br><br><br>
            </center>
        </body>
        </html>
    `;

    // Kirim ke Iframe tersembunyi untuk diprint
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '100%';
    iframe.style.bottom = '100%';
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(notaHTML);
    doc.close();

    setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        
        // Simpan riwayat & Reset
        dbHistory.push({ waktu: tgl, total: total });
        localStorage.setItem('dbHistory', JSON.stringify(dbHistory));
        keranjang = [];
        renderCart();
        
        // Hapus iframe setelah print selesai
        setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 500);
}

// --- PRODUK & RIWAYAT ---
function simpanBarang() {
    const nama = document.getElementById('inp-nama').value;
    const harga = parseInt(document.getElementById('inp-harga').value);
    const kat = document.getElementById('inp-kategori').value || "Umum";
    const foto = document.getElementById('inp-foto').files[0];
    
    const save = (img) => {
        dbBarang.push({ id: Date.now(), nama, harga, kategori: kat, foto: img });
        localStorage.setItem('dbBarang', JSON.stringify(dbBarang));
        alert("Berhasil!"); location.reload();
    };

    if(foto) {
        const r = new FileReader(); r.onload = (e) => save(e.target.result); r.readAsDataURL(foto);
    } else save(null);
}

function renderMenu() {
    const container = document.getElementById('menu-grouped-list');
    container.innerHTML = dbBarang.map(i => `
        <div class="flex justify-between bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 items-center">
            <span class="font-bold dark:text-white text-xs">${i.nama.toUpperCase()}</span>
            <button onclick="hapusMenu(${i.id})" class="text-red-500">🗑️</button>
        </div>`).join('');
}

function hapusMenu(id) { 
    dbBarang = dbBarang.filter(b => b.id !== id); 
    localStorage.setItem('dbBarang', JSON.stringify(dbBarang)); renderMenu(); 
}

function renderHistory() {
    const list = document.getElementById('history-list');
    list.innerHTML = dbHistory.slice().reverse().map(h => `
        <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 flex justify-between">
            <span class="text-[9px] dark:text-white font-bold">${h.waktu}</span>
            <span class="text-blue-500 font-bold text-xs">Rp ${h.total.toLocaleString()}</span>
        </div>`).join('');
}

renderEtalase();
