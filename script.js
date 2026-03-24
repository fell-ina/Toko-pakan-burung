// ==========================================
// DATABASE LOKAL (LocalStorage)
// ==========================================
let dbBarang = JSON.parse(localStorage.getItem('dbBarang')) || [];
let dbHistory = JSON.parse(localStorage.getItem('dbHistory')) || [];
let keranjang = [];
let filterKategori = 'Semua';

// ==========================================
// NAVIGASI TAB
// ==========================================
function openTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active-tab'));
    
    document.getElementById(tabId).classList.add('active');
    document.getElementById('btn-' + tabId).classList.add('active-tab');

    // Refresh data setiap pindah tab
    if(tabId === 'tab-print') renderEtalase();
    if(tabId === 'tab-menu') renderTableMenu();
    if(tabId === 'tab-history') renderHistory();
}

// ==========================================
// MANAJEMEN ITEM (TAB MENU)
// ==========================================

// Simpan Barang Baru
function addItem() {
    const nama = document.getElementById('inp-nama').value;
    const harga = parseInt(document.getElementById('inp-harga').value);
    const satuan = document.getElementById('inp-satuan').value;
    const kategori = document.getElementById('inp-kategori').value.trim() || "Tanpa Kategori";
    const fotoFile = document.getElementById('inp-foto').files[0];

    if(!nama || !harga) return alert("Nama dan Harga wajib diisi!");

    const simpanProses = (imgData) => {
        dbBarang.push({ id: Date.now(), nama, harga, satuan, kategori, foto: imgData });
        localStorage.setItem('dbBarang', JSON.stringify(dbBarang));
        alert("Barang berhasil ditambahkan!");
        resetForm();
        renderTableMenu();
    };

    if(fotoFile) {
        const reader = new FileReader();
        reader.onload = (e) => simpanProses(e.target.result);
        reader.readAsDataURL(fotoFile);
    } else {
        simpanProses(null);
    }
}

// Render Menu dengan Grouping Kategori
function renderTableMenu() {
    const container = document.getElementById('menu-grouped-list');
    const datalist = document.getElementById('list-kat');
    container.innerHTML = '';
    datalist.innerHTML = '';

    if (dbBarang.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-10">Belum ada barang di etalase.</p>';
        return;
    }

    // Update Datalist Kategori
    let uniqueKats = [...new Set(dbBarang.map(b => b.kategori))];
    uniqueKats.forEach(k => datalist.innerHTML += `<option value="${k}">`);

    // Grouping
    const grouped = dbBarang.reduce((acc, item) => {
        const kat = item.kategori || "Tanpa Kategori";
        if (!acc[kat]) acc[kat] = [];
        acc[kat].push(item);
        return acc;
    }, {});

    for (const kategori in grouped) {
        let section = `
            <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden mb-6">
                <div class="bg-gray-50 dark:bg-slate-700 px-4 py-2 border-b dark:border-slate-600 flex justify-between">
                    <span class="font-bold text-blue-600 dark:text-blue-400 uppercase text-xs tracking-wider">${kategori}</span>
                    <span class="text-xs text-gray-400">${grouped[kategori].length} Item</span>
                </div>
                <table class="w-full text-left text-sm">
                    <tbody class="divide-y divide-gray-100 dark:divide-slate-700">
        `;

        grouped[kategori].forEach(item => {
            section += `
                <tr class="hover:bg-gray-50 dark:hover:bg-slate-700 transition">
                    <td class="p-4 flex items-center gap-3">
                        ${item.foto ? `<img src="${item.foto}" class="w-10 h-10 rounded-md object-cover">` : `<div class="w-10 h-10 bg-gray-100 dark:bg-slate-600 rounded-md flex items-center justify-center text-[8px] text-gray-400">No Img</div>`}
                        <span class="font-semibold dark:text-white">${item.nama}</span>
                    </td>
                    <td class="p-4 text-blue-600 font-bold">Rp ${item.harga.toLocaleString()}/${item.satuan}</td>
                    <td class="p-4 text-right space-x-2">
                        <button onclick="prepareEdit(${item.id})" class="text-amber-500 hover:bg-amber-50 p-2 rounded">✏️</button>
                        <button onclick="hapusItemById(${item.id})" class="text-red-500 hover:bg-red-50 p-2 rounded">🗑️</button>
                    </td>
                </tr>
            `;
        });
        section += `</tbody></table></div>`;
        container.innerHTML += section;
    }
}

// Persiapan Edit
function prepareEdit(id) {
    const item = dbBarang.find(b => b.id === id);
    if (!item) return;

    document.getElementById('edit-id').value = item.id;
    document.getElementById('inp-nama').value = item.nama;
    document.getElementById('inp-harga').value = item.harga;
    document.getElementById('inp-satuan').value = item.satuan;
    document.getElementById('inp-kategori').value = item.kategori === "Tanpa Kategori" ? "" : item.kategori;

    document.getElementById('form-title').innerText = "Mode Edit: " + item.nama;
    const btnSimpan = document.getElementById('btn-simpan');
    btnSimpan.innerText = "UPDATE DATA";
    btnSimpan.style.backgroundColor = "#f59e0b"; // Amber
    btnSimpan.onclick = updateItem;
    document.getElementById('btn-batal').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Proses Update
function updateItem() {
    const id = parseInt(document.getElementById('edit-id').value);
    const itemIdx = dbBarang.findIndex(b => b.id === id);
    const fotoFile = document.getElementById('inp-foto').files[0];

    const simpanUpdate = (imgData) => {
        dbBarang[itemIdx] = {
            ...dbBarang[itemIdx],
            nama: document.getElementById('inp-nama').value,
            harga: parseInt(document.getElementById('inp-harga').value),
            satuan: document.getElementById('inp-satuan').value,
            kategori: document.getElementById('inp-kategori').value || "Tanpa Kategori",
            foto: imgData || dbBarang[itemIdx].foto
        };
        localStorage.setItem('dbBarang', JSON.stringify(dbBarang));
        alert("Data diperbarui!");
        resetForm();
        renderTableMenu();
    };

    if(fotoFile) {
        const reader = new FileReader();
        reader.onload = (e) => simpanUpdate(e.target.result);
        reader.readAsDataURL(fotoFile);
    } else {
        simpanUpdate(null);
    }
}

function hapusItemById(id) {
    if(confirm("Hapus item ini dari etalase?")) {
        dbBarang = dbBarang.filter(b => b.id !== id);
        localStorage.setItem('dbBarang', JSON.stringify(dbBarang));
        renderTableMenu();
    }
}

function resetForm() {
    document.getElementById('edit-id').value = '';
    document.getElementById('inp-nama').value = '';
    document.getElementById('inp-harga').value = '';
    document.getElementById('inp-kategori').value = '';
    document.getElementById('inp-foto').value = '';
    document.getElementById('form-title').innerText = "Tambah Item Baru";
    const btnSimpan = document.getElementById('btn-simpan');
    btnSimpan.innerText = "SIMPAN BARANG";
    btnSimpan.style.backgroundColor = "#10b981"; // Green
    btnSimpan.onclick = addItem;
    document.getElementById('btn-batal').classList.add('hidden');
}

// ==========================================
// TRANSAKSI & KASIR (TAB PRINT)
// ==========================================

function renderEtalase() {
    const grid = document.getElementById('grid-etalase');
    const chips = document.getElementById('category-chips');
    grid.innerHTML = '';
    
    // Render Chips
    let kats = ['Semua', ...new Set(dbBarang.map(b => b.kategori))];
    chips.innerHTML = kats.map(k => `
        <button onclick="setFilter('${k}')" class="px-4 py-1 rounded-full border whitespace-nowrap transition ${filterKategori === k ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 dark:bg-slate-700 dark:text-gray-300'}">
            ${k}
        </button>
    `).join('');

    // Render Items
    dbBarang.filter(b => filterKategori === 'Semua' || b.kategori === filterKategori).forEach(b => {
        grid.innerHTML += `
            <div onclick="tambahKeKeranjang(${b.id})" class="bg-white dark:bg-slate-800 p-2 rounded-xl border border-gray-100 dark:border-slate-700 cursor-pointer hover:shadow-md transition active:scale-95">
                <div class="h-24 bg-gray-50 dark:bg-slate-700 rounded-lg overflow-hidden mb-2">
                    ${b.foto ? `<img src="${b.foto}" class="w-full h-full object-cover">` : ''}
                </div>
                <p class="font-bold text-xs truncate dark:text-white">${b.nama}</p>
                <p class="text-[10px] text-blue-500 font-bold uppercase">Rp ${b.harga.toLocaleString()}/${b.satuan}</p>
            </div>
        `;
    });
}

function setFilter(k) {
    filterKategori = k;
    renderEtalase();
}

function tambahKeKeranjang(id) {
    const barang = dbBarang.find(b => b.id === id);
    const ada = keranjang.find(k => k.id === id);
    if(ada) ada.qty += 1;
    else keranjang.push({ ...barang, qty: 1 });
    renderCart();
}

function renderCart() {
    const list = document.getElementById('cart-items');
    let total = 0;
    list.innerHTML = '';
    keranjang.forEach((item, index) => {
        total += (item.harga * item.qty);
        list.innerHTML += `
            <div class="flex justify-between items-center text-sm p-2 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <div class="flex-1">
                    <p class="font-bold dark:text-white">${item.nama}</p>
                    <p class="text-[10px] text-gray-500">@ ${item.harga.toLocaleString()}</p>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="ubahQty(${index}, -1)" class="w-6 h-6 bg-white dark:bg-slate-600 rounded shadow text-xs">-</button>
                    <span class="font-bold w-4 text-center dark:text-white">${item.qty}</span>
                    <button onclick="ubahQty(${index}, 1)" class="w-6 h-6 bg-white dark:bg-slate-600 rounded shadow text-xs">+</button>
                </div>
            </div>
        `;
    });
    document.getElementById('total-cart').innerText = `Rp ${total.toLocaleString()}`;
}

function ubahQty(idx, n) {
    keranjang[idx].qty += n;
    if(keranjang[idx].qty < 1) keranjang.splice(idx, 1);
    renderCart();
}

function checkout() {
    if(keranjang.length === 0) return alert("Keranjang kosong!");
    const total = keranjang.reduce((a, b) => a + (b.harga * b.qty), 0);
    const tgl = new Date();
    const waktuStr = `${tgl.toLocaleDateString('id-ID')} ${tgl.getHours()}:${tgl.getMinutes()}`;

    // Nota
    let notaHtml = '';
    keranjang.forEach(i => {
        notaHtml += `<div style="display:flex; justify-content:space-between; font-size:11px"><span>${i.nama} x${i.qty}</span><span>${(i.harga*i.qty).toLocaleString()}</span></div>`;
    });
    document.getElementById('nota-items-list').innerHTML = notaHtml;
    document.getElementById('nota-total-price').innerHTML = `<span>TOTAL</span><span>Rp ${total.toLocaleString()}</span>`;

    // Simpan History
    dbHistory.push({ waktu: waktuStr, total: total, items: [...keranjang] });
    localStorage.setItem('dbHistory', JSON.stringify(dbHistory));

    window.print();
    keranjang = [];
    renderCart();
}

// ==========================================
// HISTORY & POPUP (TAB HISTORY)
// ==========================================

function renderHistory() {
    const container = document.getElementById('history-detail-list');
    container.innerHTML = '';
    if(dbHistory.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-10">Belum ada riwayat.</p>';
        return;
    }

    dbHistory.slice().reverse().forEach((h, index) => {
        const idxAsli = dbHistory.length - 1 - index;
        container.innerHTML += `
            <div onclick="showDetailHistory(${idxAsli})" class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 flex justify-between items-center cursor-pointer hover:border-blue-500 transition shadow-sm">
                <div>
                    <p class="text-[10px] text-blue-500 font-bold">${h.waktu}</p>
                    <p class="font-bold dark:text-white text-sm">${h.items.length} Jenis Barang</p>
                </div>
                <p class="text-green-600 font-black">Rp ${h.total.toLocaleString()}</p>
            </div>
        `;
    });
}

function showDetailHistory(index) {
    const data = dbHistory[index];
    const container = document.getElementById('modal-content-detail');
    const totalElt = document.getElementById('modal-total-akhir');
    const modal = document.getElementById('modal-history');

    let html = `<p class="text-xs text-gray-400 mb-2">Waktu Transaksi: ${data.waktu}</p>`;
    data.items.forEach(item => {
        html += `
            <div class="flex justify-between items-center border-b dark:border-slate-700 py-2">
                <div class="flex-1">
                    <p class="font-bold text-sm dark:text-white">${item.nama}</p>
                    <p class="text-[10px] text-gray-500">Rp ${item.harga.toLocaleString()} x ${item.qty} ${item.satuan}</p>
                </div>
                <p class="font-bold text-sm dark:text-white">Rp ${(item.harga * item.qty).toLocaleString()}</p>
            </div>
        `;
    });

    container.innerHTML = html;
    totalElt.innerText = `Rp ${data.total.toLocaleString()}`;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeModal() {
    const modal = document.getElementById('modal-history');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function clearHistory() {
    if(confirm("Hapus semua riwayat permanen?")) {
        dbHistory = [];
        localStorage.setItem('dbHistory', JSON.stringify(dbHistory));
        renderHistory();
    }
}

// ==========================================
// PENGATURAN TEMA & LOAD AWAL
// ==========================================

function setTheme(mode) {
    const body = document.getElementById('appBody');
    if(mode === 'dark') body.classList.add('dark');
    else body.classList.remove('dark');
    localStorage.setItem('theme', mode);
}

// Event klik di luar modal untuk tutup
window.onclick = (e) => { if(e.target.id === 'modal-history') closeModal(); };

// Inisialisasi Data
if(localStorage.getItem('theme') === 'dark') setTheme('dark');
renderEtalase();