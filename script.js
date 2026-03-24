let dbBarang = JSON.parse(localStorage.getItem('dbBarang')) || [];
let dbHistory = JSON.parse(localStorage.getItem('dbHistory')) || [];
let keranjang = [];
let filterKategori = 'Semua';
let printerCharacteristic = null;

// ==========================================
// KONEKSI BLUETOOTH
// ==========================================
async function hubungkanBluetooth() {
    try {
        const device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'] 
        });
        const server = await device.gatt.connect();
        const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
        printerCharacteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');
        
        const statusEl = document.getElementById('conn-status');
        statusEl.innerText = "🟢 Bluetooth Terhubung: " + device.name;
        statusEl.className = "bg-blue-600 text-white text-[10px] text-center py-1 font-bold";
        alert("Printer " + device.name + " Terhubung!");
    } catch (e) {
        alert("Gagal konek: " + e.message);
    }
}

// ==========================================
// KASIR LOGIC
// ==========================================
function openTab(id) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.py-4').forEach(b => {
        b.classList.remove('text-blue-600', 'border-blue-600');
        b.classList.add('text-slate-400', 'border-transparent');
    });
    document.getElementById(id).classList.add('active');
    document.getElementById('btn-' + id).classList.remove('text-slate-400', 'border-transparent');
    document.getElementById('btn-' + id).classList.add('text-blue-600', 'border-blue-600');
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
        <button onclick="setFilter('${k}')" class="px-5 py-2 rounded-xl border text-[10px] font-bold uppercase transition ${filterKategori === k ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white dark:bg-slate-700 dark:text-white dark:border-slate-600 text-slate-500'}">
            ${k}
        </button>
    `).join('');

    dbBarang.filter(b => filterKategori === 'Semua' || b.kategori === filterKategori).forEach(b => {
        grid.innerHTML += `
            <div onclick="tambahKeKeranjang(${b.id})" class="bg-white dark:bg-slate-800 p-2 rounded-[1.5rem] border dark:border-slate-700 shadow-sm cursor-pointer hover:shadow-lg active:scale-95 transition">
                <div class="h-24 bg-slate-50 dark:bg-slate-700 rounded-2xl overflow-hidden mb-3">
                    ${b.foto ? `<img src="${b.foto}" class="w-full h-full object-cover">` : ''}
                </div>
                <p class="font-black text-[10px] truncate dark:text-white px-1 uppercase">${b.nama}</p>
                <p class="text-[9px] text-blue-500 font-black px-1 pb-1">Rp ${b.harga.toLocaleString()}</p>
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
                    <p class="text-[9px] text-slate-400 font-bold">x ${item.qty}</p>
                </div>
                <div class="flex items-center gap-3">
                    <button onclick="ubahQty(${idx}, -1)" class="w-7 h-7 bg-white dark:bg-slate-600 rounded-full shadow-sm font-bold text-xs">-</button>
                    <span class="font-black text-xs dark:text-white w-4 text-center">${item.qty}</span>
                    <button onclick="ubahQty(${idx}, 1)" class="w-7 h-7 bg-white dark:bg-slate-600 rounded-full shadow-sm font-bold text-xs">+</button>
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
// CHUNKING & DELAY PRINT (KHUSUS RPP02N)
// ==========================================
async function prosesCheckout() {
    if(keranjang.length === 0) return alert("Keranjang kosong!");
    
    const total = keranjang.reduce((a, b) => a + (b.harga * b.qty), 0);
    const tgl = new Date();
    const waktuStr = `${tgl.toLocaleDateString('id-ID')} ${tgl.getHours()}:${tgl.getMinutes()}`;

    // Buat Data ESC/POS
    let encoder = new EscPosEncoder();
    let result = encoder
        .initialize()
        .align('center')
        .bold(true).line('MILKY WAVE').bold(false)
        .line('Salatiga, Indonesia')
        .line('--------------------------------')
        .align('left')
        .line('Tgl: ' + waktuStr);

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
        .line('\nTerima Kasih!\n\n\n\n');

    const dataCetak = result.encode();

    if (printerCharacteristic) {
        try {
            const chunk = 20; // Ukuran paket data (byte)
            for (let i = 0; i < dataCetak.length; i += chunk) {
                await printerCharacteristic.writeValue(dataCetak.slice(i, i + chunk));
                // JEDA 50ms agar printer tidak macet
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            // Simpan riwayat
            dbHistory.push({ waktu: waktuStr, total: total, items: [...keranjang] });
            localStorage.setItem('dbHistory', JSON.stringify(dbHistory));
            keranjang = [];
            renderCart();
            alert("Cetak Selesai!");
        } catch (e) {
            alert("Gagal mencetak. Hubungkan ulang printer di tab Setup.");
        }
    } else {
        alert("Printer belum terhubung!");
        openTab('tab-profil');
    }
}

// ==========================================
// MENU & HISTORY (SAMA)
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
    };
    if(fotoFile) { const r = new FileReader(); r.onload = (e) => save(e.target.result); r.readAsDataURL(fotoFile); }
    else save(idEdit ? dbBarang.find(b => b.id == idEdit).foto : null);
}

function renderMenu() {
    const container = document.getElementById('menu-grouped-list');
    container.innerHTML = '';
    const grouped = dbBarang.reduce((acc, item) => {
        const k = item.kategori || "Umum";
        if(!acc[k]) acc[k] = []; acc[k].push(item); return acc;
    }, {});
    for(const k in grouped) {
        let h = `<div class="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 overflow-hidden"><div class="bg-slate-50 dark:bg-slate-700 px-4 py-2 text-[9px] font-black text-blue-600 uppercase tracking-widest">${k}</div><div class="divide-y dark:divide-slate-700">`;
        grouped[k].forEach(i => {
            h += `<div class="flex justify-between p-4 items-center">
                <span class="font-bold text-xs dark:text-white uppercase">${i.nama}</span>
                <div class="flex gap-4"><button onclick="prepareEditMenu(${i.id})" class="text-amber-500">✏️</button><button onclick="hapusMenu(${i.id})" class="text-red-500">🗑️</button></div>
            </div>`;
        });
        container.innerHTML += h + `</div></div>`;
    }
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

function hapusMenu(id) { if(confirm("Hapus?")) { dbBarang = dbBarang.filter(b => b.id !== id); localStorage.setItem('dbBarang', JSON.stringify(dbBarang)); renderMenu(); } }

function renderHistory() {
    const list = document.getElementById('history-list'); list.innerHTML = '';
    dbHistory.slice().reverse().forEach((h, idx) => {
        const idAsli = dbHistory.length - 1 - idx;
        list.innerHTML += `<div onclick="bukaModal(${idAsli})" class="bg-white dark:bg-slate-800 p-4 rounded-2xl border dark:border-slate-700 flex justify-between items-center cursor-pointer active:scale-95 transition">
            <span class="text-[9px] dark:text-white uppercase font-bold">${h.waktu}</span>
            <span class="font-black text-green-600 text-xs">Rp ${h.total.toLocaleString()}</span>
        </div>`;
    });
}

function bukaModal(idx) {
    const h = dbHistory[idx];
    document.getElementById('modal-body').innerHTML = h.items.map(i => `<div class="flex justify-between"><span>${i.nama} x${i.qty}</span><span>${(i.harga*i.qty).toLocaleString()}</span></div>`).join('');
    document.getElementById('modal-total').innerText = `Rp ${h.total.toLocaleString()}`;
    document.getElementById('modal-history').classList.replace('hidden', 'flex');
}
function tutupModal() { document.getElementById('modal-history').classList.replace('flex', 'hidden'); }
function resetHistory() { if(confirm("Hapus semua?")) { dbHistory = []; localStorage.setItem('dbHistory', JSON.stringify(dbHistory)); renderHistory(); } }
function gantiTema(t) {
    if(t === 'dark') document.getElementById('appBody').classList.add('dark');
    else document.getElementById('appBody').classList.remove('dark');
    localStorage.setItem('theme', t);
}
if(localStorage.getItem('theme') === 'dark') gantiTema('dark');
renderEtalase();
