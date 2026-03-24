// CONFIG & DB
let dbBarang = JSON.parse(localStorage.getItem('dbBarang')) || [];
let dbHistory = JSON.parse(localStorage.getItem('dbHistory')) || [];
let keranjang = [];
let filterKategori = 'Semua';
let printerCharacteristic = null; // Untuk Bluetooth

// ==========================================
// KONEKSI PRINTER
// ==========================================

// 1. KONEKSI BLUETOOTH
async function hubungkanBluetooth() {
    try {
        const device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'] 
        });
        const server = await device.gatt.connect();
        const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
        printerCharacteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');
        
        updateStatus("🟢 Bluetooth Terhubung: " + device.name);
        alert("Printer Siap!");
    } catch (e) {
        alert("Bluetooth Gagal: " + e.message);
    }
}

function updateStatus(txt) {
    const el = document.getElementById('conn-status');
    el.innerText = txt;
    el.className = "bg-blue-600 text-white text-[10px] text-center py-1 font-bold";
}

// ==========================================
// CORE LOGIC KASIR
// ==========================================

function openTab(id) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active-tab'));
    document.getElementById(id).classList.add('active');
    document.getElementById('btn-' + id).classList.add('active-tab');
    if(id === 'tab-print') renderEtalase();
    if(id === 'tab-menu') renderMenu();
    if(id === 'tab-history') renderHistory();
}

function renderEtalase() {
    const grid = document.getElementById('grid-etalase');
    const chips = document.getElementById('category-chips');
    grid.innerHTML = '';
    
    let kats = ['Semua', ...new Set(dbBarang.map(b => b.kategori || "Umum"))];
    chips.innerHTML = kats.map(k => `
        <button onclick="setFilter('${k}')" class="px-5 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition ${filterKategori === k ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white dark:bg-slate-700 dark:text-white dark:border-slate-600 text-slate-500'}">
            ${k}
        </button>
    `).join('');

    dbBarang.filter(b => filterKategori === 'Semua' || b.kategori === filterKategori).forEach(b => {
        grid.innerHTML += `
            <div onclick="tambahKeKeranjang(${b.id})" class="bg-white dark:bg-slate-800 p-2 rounded-[1.5rem] border dark:border-slate-700 shadow-sm cursor-pointer hover:shadow-lg active:scale-95 transition">
                <div class="h-24 bg-slate-50 dark:bg-slate-700 rounded-2xl overflow-hidden mb-3">
                    ${b.foto ? `<img src="${b.foto}" class="w-full h-full object-cover">` : ''}
                </div>
                <p class="font-black text-[11px] truncate dark:text-white px-1 uppercase">${b.nama}</p>
                <p class="text-[10px] text-blue-500 font-black px-1 pb-1">Rp ${b.harga.toLocaleString()}</p>
            </div>
        `;
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
            <div class="flex justify-between items-center bg-slate-50 dark:bg-slate-700/50 p-3 rounded-2xl border dark:border-slate-600">
                <div class="flex-1">
                    <p class="font-black text-[10px] dark:text-white uppercase">${item.nama}</p>
                    <p class="text-[9px] text-slate-400 font-bold">@ ${item.harga.toLocaleString()}</p>
                </div>
                <div class="flex items-center gap-3">
                    <button onclick="ubahQty(${idx}, -1)" class="w-7 h-7 bg-white dark:bg-slate-600 rounded-full shadow-sm font-bold">-</button>
                    <span class="font-black text-xs dark:text-white w-4 text-center">${item.qty}</span>
                    <button onclick="ubahQty(${idx}, 1)" class="w-7 h-7 bg-white dark:bg-slate-600 rounded-full shadow-sm font-bold">+</button>
                </div>
            </div>
        `;
    });
    document.getElementById('total-cart').innerText = `Rp ${total.toLocaleString()}`;
}

function ubahQty(i, n) {
    keranjang[i].qty += n;
    if(keranjang[i].qty < 1) keranjang.splice(i, 1);
    renderCart();
}

// ==========================================
// PROSES CETAK (BLUETOOTH & WIFI)
// ==========================================

async function prosesCheckout() {
    if(keranjang.length === 0) return alert("Keranjang masih kosong!");
    
    const ipPrinter = document.getElementById('ip-printer').value;
    const total = keranjang.reduce((a, b) => a + (b.harga * b.qty), 0);
    const tgl = new Date();
    const waktuStr = `${tgl.toLocaleDateString('id-ID')} ${tgl.getHours()}:${tgl.getMinutes()}`;

    // 1. GENERATE ESC/POS DATA
    let encoder = new EscPosEncoder();
    let result = encoder
        .initialize()
        .align('center')
        .bold(true).line('MILKY WAVE').bold(false)
        .line('Salatiga, Indonesia')
        .line('--------------------------------')
        .align('left')
        .line('Waktu: ' + waktuStr)
        .line('--------------------------------');

    keranjang.forEach(item => {
        let line = item.nama + ' x' + item.qty;
        let price = (item.harga * item.qty).toLocaleString();
        let spaces = 32 - line.length - price.length;
        result.line(line + " ".repeat(Math.max(1, spaces)) + price);
    });

    result.line('--------------------------------')
        .bold(true)
        .line('TOTAL' + " ".repeat(32 - 5 - total.toLocaleString().length) + total.toLocaleString())
        .bold(false)
        .align('center')
        .line('\nTerima Kasih\nSelamat Menikmati!\n\n\n\n');

    const byteData = result.encode();

    // 2. KIRIM KE PRINTER
    try {
        // Opsi A: WiFi (Jika IP diisi)
        if (ipPrinter && ipPrinter.length > 7) {
            await fetch(`http://${ipPrinter}:9100`, { method: 'POST', mode: 'no-cors', body: byteData });
        } 
        // Opsi B: Bluetooth
        else if (printerCharacteristic) {
            for (let i = 0; i < byteData.length; i += 20) {
                await printerCharacteristic.writeValue(byteData.slice(i, i + 20));
            }
        } 
        else {
            alert("Printer tidak terdeteksi! Nota hanya disimpan di riwayat.");
            window.print(); // Fallback ke sistem browser
        }

        // Simpan & Reset
        dbHistory.push({ waktu: waktuStr, total: total, items: [...keranjang] });
        localStorage.setItem('dbHistory', JSON.stringify(dbHistory));
        keranjang = [];
        renderCart();
        alert("Nota Berhasil!");
    } catch (e) {
        alert("Gagal Cetak: " + e.message);
    }
}

// ==========================================
// MANAGEMENT MENU & HISTORY
// ==========================================

function simpanBarang() {
    const nama = document.getElementById('inp-nama').value;
    const harga = parseInt(document.getElementById('inp-harga').value);
    const kategori = document.getElementById('inp-kategori').value || "Umum";
    const fotoFile = document.getElementById('inp-foto').files[0];
    const idEdit = document.getElementById('edit-id').value;

    if(!nama || !harga) return alert("Lengkapi data produk!");

    const action = (img) => {
        const itemData = { id: idEdit ? parseInt(idEdit) : Date.now(), nama, harga, kategori, foto: img };
        if(idEdit) {
            const idx = dbBarang.findIndex(b => b.id === parseInt(idEdit));
            dbBarang[idx] = itemData;
        } else {
            dbBarang.push(itemData);
        }
        localStorage.setItem('dbBarang', JSON.stringify(dbBarang));
        resetFormMenu(); renderMenu();
    };

    if(fotoFile) {
        const r = new FileReader(); r.onload = (e) => action(e.target.result); r.readAsDataURL(fotoFile);
    } else {
        action(idEdit ? dbBarang.find(b => b.id == idEdit).foto : null);
    }
}

function renderMenu() {
    const container = document.getElementById('menu-grouped-list');
    container.innerHTML = '';
    const grouped = dbBarang.reduce((acc, item) => {
        const k = item.kategori || "Umum";
        if(!acc[k]) acc[k] = []; acc[k].push(item); return acc;
    }, {});

    for(const kat in grouped) {
        let html = `<div class="bg-white dark:bg-slate-800 rounded-3xl border dark:border-slate-700 overflow-hidden shadow-sm">
            <div class="bg-slate-50 dark:bg-slate-700 px-5 py-3 font-black text-[10px] text-blue-600 uppercase tracking-widest">${kat}</div>
            <div class="divide-y dark:divide-slate-700">`;
        grouped[kat].forEach(item => {
            html += `<div class="flex justify-between items-center p-4">
                <div class="flex items-center gap-4">
                    <span class="font-black dark:text-white text-xs uppercase">${item.nama}</span>
                    <span class="text-[10px] text-slate-400 font-bold">Rp ${item.harga.toLocaleString()}</span>
                </div>
                <div class="flex gap-4">
                    <button onclick="prepareEditMenu(${item.id})" class="text-amber-500">✏️</button>
                    <button onclick="hapusMenu(${item.id})" class="text-red-500">🗑️</button>
                </div>
            </div>`;
        });
        container.innerHTML += html + `</div></div>`;
    }
}

function prepareEditMenu(id) {
    const item = dbBarang.find(b => b.id === id);
    document.getElementById('edit-id').value = item.id;
    document.getElementById('inp-nama').value = item.nama;
    document.getElementById('inp-harga').value = item.harga;
    document.getElementById('inp-kategori').value = item.kategori;
    document.getElementById('btn-simpan').innerText = "UPDATE PRODUK";
    document.getElementById('btn-batal').classList.remove('hidden');
    window.scrollTo({top: 0, behavior: 'smooth'});
}

function resetFormMenu() {
    document.getElementById('edit-id').value = '';
    document.getElementById('inp-nama').value = '';
    document.getElementById('inp-harga').value = '';
    document.getElementById('btn-simpan').innerText = "SIMPAN";
    document.getElementById('btn-batal').classList.add('hidden');
}

function hapusMenu(id) { if(confirm("Hapus produk?")) { dbBarang = dbBarang.filter(b => b.id !== id); localStorage.setItem('dbBarang', JSON.stringify(dbBarang)); renderMenu(); } }

function renderHistory() {
    const list = document.getElementById('history-list'); list.innerHTML = '';
    dbHistory.slice().reverse().forEach((h, idx) => {
        const idAsli = dbHistory.length - 1 - idx;
        list.innerHTML += `<div onclick="bukaModal(${idAsli})" class="bg-white dark:bg-slate-800 p-5 rounded-2xl border dark:border-slate-700 flex justify-between items-center cursor-pointer shadow-sm active:scale-95 transition">
            <div class="flex flex-col">
                <span class="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">${h.waktu}</span>
                <span class="text-[10px] font-black dark:text-white">${h.items.length} ITEM TERJUAL</span>
            </div>
            <span class="font-black text-green-600 text-sm">Rp ${h.total.toLocaleString()}</span>
        </div>`;
    });
}

function bukaModal(idx) {
    const h = dbHistory[idx];
    document.getElementById('modal-body').innerHTML = h.items.map(i => `
        <div class="flex justify-between uppercase">
            <span>${i.nama} x${i.qty}</span>
            <span>${(i.harga*i.qty).toLocaleString()}</span>
        </div>
    `).join('');
    document.getElementById('modal-total').innerText = `Rp ${h.total.toLocaleString()}`;
    document.getElementById('modal-history').classList.replace('hidden', 'flex');
}
function tutupModal() { document.getElementById('modal-history').classList.replace('flex', 'hidden'); }
function resetHistory() { if(confirm("Hapus semua history?")) { dbHistory = []; localStorage.setItem('dbHistory', JSON.stringify(dbHistory)); renderHistory(); } }

function gantiTema(t) {
    const b = document.getElementById('appBody');
    if(t === 'dark') b.classList.add('dark'); else b.classList.remove('dark');
    localStorage.setItem('theme', t);
}

// SIMPAN IP OTOMATIS
document.getElementById('ip-printer').value = localStorage.getItem('ip-printer') || "";
document.getElementById('ip-printer').onchange = (e) => localStorage.setItem('ip-printer', e.target.value);

// INIT
if(localStorage.getItem('theme') === 'dark') gantiTema('dark');
renderEtalase();
