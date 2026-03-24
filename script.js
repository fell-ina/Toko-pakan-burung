// VARIABEL GLOBAL
let dbBarang = JSON.parse(localStorage.getItem('dbBarang')) || [];
let dbHistory = JSON.parse(localStorage.getItem('dbHistory')) || [];
let keranjang = [];
let filterKategori = 'Semua';
let printerCharacteristic = null; // Koneksi Bluetooth

// ==========================================
// KONEKSI BLUETOOTH (WEB API)
// ==========================================

async function hubungkanBluetooth() {
    try {
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
            optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
        });
        const server = await device.gatt.connect();
        const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
        printerCharacteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');
        
        document.getElementById('bt-status').innerText = "✅ PRINTER TERHUBUNG: " + device.name;
        document.getElementById('bt-status').className = "bg-green-100 text-green-800 text-[10px] text-center py-1 font-bold";
        alert("Printer " + device.name + " siap digunakan!");
    } catch (e) {
        alert("Gagal konek Bluetooth: " + e.message);
    }
}

// ==========================================
// KASIR & PRINT LOGIC
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
    
    let kats = ['Semua', ...new Set(dbBarang.map(b => b.kategori))];
    chips.innerHTML = kats.map(k => `
        <button onclick="setFilter('${k}')" class="px-4 py-1.5 rounded-full border text-xs whitespace-nowrap transition ${filterKategori === k ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-700 dark:text-white dark:border-slate-600 text-slate-600'}">
            ${k}
        </button>
    `).join('');

    dbBarang.filter(b => filterKategori === 'Semua' || b.kategori === filterKategori).forEach(b => {
        grid.innerHTML += `
            <div onclick="tambahKeKeranjang(${b.id})" class="bg-white dark:bg-slate-800 p-2 rounded-2xl border dark:border-slate-700 shadow-sm cursor-pointer hover:shadow-md active:scale-95 transition">
                <div class="h-24 bg-slate-50 dark:bg-slate-700 rounded-xl overflow-hidden mb-2">
                    ${b.foto ? `<img src="${b.foto}" class="w-full h-full object-cover">` : ''}
                </div>
                <p class="font-bold text-xs truncate dark:text-white">${b.nama}</p>
                <p class="text-[10px] text-blue-500 font-bold">Rp ${b.harga.toLocaleString()}</p>
            </div>
        `;
    });
}

function setFilter(k) { filterKategori = k; renderEtalase(); }

function tambahKeKeranjang(id) {
    const item = dbBarang.find(b => b.id === id);
    const ada = keranjang.find(k => k.id === id);
    if(ada) ada.qty++;
    else keranjang.push({ ...item, qty: 1 });
    renderCart();
}

function renderCart() {
    const list = document.getElementById('cart-items');
    let total = 0;
    list.innerHTML = '';
    keranjang.forEach((item, idx) => {
        total += (item.harga * item.qty);
        list.innerHTML += `
            <div class="flex justify-between items-center bg-slate-50 dark:bg-slate-700 p-2.5 rounded-xl border dark:border-slate-600">
                <div class="flex-1">
                    <p class="font-bold text-xs dark:text-white">${item.nama}</p>
                    <p class="text-[9px] text-slate-400">Rp ${item.harga.toLocaleString()} x ${item.qty}</p>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="ubahQty(${idx}, -1)" class="w-6 h-6 bg-white dark:bg-slate-600 rounded-lg shadow text-xs">-</button>
                    <span class="font-bold text-xs dark:text-white w-4 text-center">${item.qty}</span>
                    <button onclick="ubahQty(${idx}, 1)" class="w-6 h-6 bg-white dark:bg-slate-600 rounded-lg shadow text-xs">+</button>
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

// FUNGSI PRINT UTAMA
async function prosesCheckout() {
    if(keranjang.length === 0) return alert("Keranjang kosong!");
    
    const total = keranjang.reduce((a, b) => a + (b.harga * b.qty), 0);
    const tgl = new Date();
    const waktuStr = `${tgl.toLocaleDateString('id-ID')} ${tgl.getHours()}:${tgl.getMinutes()}`;

    // 1. SIMPAN KE HISTORY
    dbHistory.push({ waktu: waktuStr, total: total, items: [...keranjang] });
    localStorage.setItem('dbHistory', JSON.stringify(dbHistory));

    // 2. CEK KONEKSI BLUETOOTH
    if (!printerCharacteristic) {
        alert("Printer belum konek! Klik Setting -> Hubungkan Bluetooth. Nota hanya disimpan di history.");
        return;
    }

    // 3. ENCODE UNTUK PRINTER (TEKS SAJA TANPA FOTO)
    try {
        let encoder = new EscPosEncoder();
        let result = encoder
            .initialize()
            .align('center')
            .bold(true)
            .line('MILKY WAVE')
            .bold(false)
            .line('Salatiga, Jawa Tengah')
            .line('--------------------------------')
            .align('left')
            .line('Tgl: ' + waktuStr);

        keranjang.forEach(item => {
            // Kalkulasi spasi agar rapi rata kanan
            let line = item.nama + ' x' + item.qty;
            let price = (item.harga * item.qty).toLocaleString();
            let spaces = 32 - line.length - price.length;
            result.line(line + " ".repeat(Math.max(1, spaces)) + price);
        });

        result.line('--------------------------------')
            .bold(true)
            .line('TOTAL: ' + " ".repeat(32 - 7 - total.toLocaleString().length) + total.toLocaleString())
            .bold(false)
            .align('center')
            .line('\nTerima Kasih\n\n\n\n'); // Spasi agar kertas keluar

        const data = result.encode();
        
        // Kirim data per 20 byte (aturan bluetooth)
        for (let i = 0; i < data.length; i += 20) {
            await printerCharacteristic.writeValue(data.slice(i, i + 20));
        }

        alert("Nota Berhasil Dicetak!");
        keranjang = [];
        renderCart();
    } catch (e) {
        console.error(e);
        alert("Gagal cetak Bluetooth. Pastikan printer nyala.");
    }
}

// ==========================================
// MENU & HISTORY (SIMPLIFIED)
// ==========================================

function simpanBarang() {
    const nama = document.getElementById('inp-nama').value;
    const harga = parseInt(document.getElementById('inp-harga').value);
    const satuan = document.getElementById('inp-satuan').value;
    const kategori = document.getElementById('inp-kategori').value || "Umum";
    const fotoFile = document.getElementById('inp-foto').files[0];
    const idEdit = document.getElementById('edit-id').value;

    if(!nama || !harga) return alert("Isi data barang!");

    const action = (img) => {
        const itemData = { id: idEdit ? parseInt(idEdit) : Date.now(), nama, harga, satuan, kategori, foto: img };
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
        let html = `<div class="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 overflow-hidden shadow-sm">
            <div class="bg-slate-50 dark:bg-slate-700 px-4 py-2 font-bold text-xs text-blue-600 uppercase">${kat}</div>
            <div class="divide-y dark:divide-slate-700">`;
        grouped[kat].forEach(item => {
            html += `<div class="flex justify-between items-center p-4">
                <div class="flex items-center gap-3">
                    <span class="font-bold dark:text-white text-sm">${item.nama}</span>
                    <span class="text-[10px] text-slate-400">Rp ${item.harga.toLocaleString()}</span>
                </div>
                <div class="flex gap-2">
                    <button onclick="prepareEditMenu(${item.id})" class="text-amber-500 text-sm">✏️</button>
                    <button onclick="hapusMenu(${item.id})" class="text-red-500 text-sm">🗑️</button>
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
    document.getElementById('btn-simpan').innerText = "UPDATE";
    document.getElementById('btn-batal').classList.remove('hidden');
    window.scrollTo(0,0);
}

function resetFormMenu() {
    document.getElementById('edit-id').value = '';
    document.getElementById('inp-nama').value = '';
    document.getElementById('inp-harga').value = '';
    document.getElementById('btn-simpan').innerText = "SIMPAN";
    document.getElementById('btn-batal').classList.add('hidden');
}

function hapusMenu(id) { if(confirm("Hapus item?")) { dbBarang = dbBarang.filter(b => b.id !== id); localStorage.setItem('dbBarang', JSON.stringify(dbBarang)); renderMenu(); } }

function renderHistory() {
    const list = document.getElementById('history-list'); list.innerHTML = '';
    dbHistory.slice().reverse().forEach((h, idx) => {
        const idAsli = dbHistory.length - 1 - idx;
        list.innerHTML += `<div onclick="bukaModal(${idAsli})" class="bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 flex justify-between cursor-pointer">
            <span class="text-xs dark:text-white">${h.waktu}</span>
            <span class="font-bold text-green-600">Rp ${h.total.toLocaleString()}</span>
        </div>`;
    });
}

function bukaModal(idx) {
    const h = dbHistory[idx];
    document.getElementById('modal-body').innerHTML = h.items.map(i => `<div>${i.nama} x ${i.qty} = Rp ${(i.harga*i.qty).toLocaleString()}</div>`).join('');
    document.getElementById('modal-total').innerText = `Rp ${h.total.toLocaleString()}`;
    document.getElementById('modal-history').classList.replace('hidden', 'flex');
}
function tutupModal() { document.getElementById('modal-history').classList.replace('flex', 'hidden'); }
function resetHistory() { if(confirm("Hapus semua?")) { dbHistory = []; localStorage.setItem('dbHistory', JSON.stringify(dbHistory)); renderHistory(); } }

function gantiTema(t) {
    const b = document.getElementById('appBody');
    if(t === 'dark') b.classList.add('dark'); else b.classList.remove('dark');
    localStorage.setItem('theme', t);
}

// START
if(localStorage.getItem('theme') === 'dark') gantiTema('dark');
renderEtalase();
