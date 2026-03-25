let dbBarang = JSON.parse(localStorage.getItem('dbBarang')) || [];
let dbHistory = JSON.parse(localStorage.getItem('dbHistory')) || [];
let keranjang = [];

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

function renderEtalase() {
    const grid = document.getElementById('grid-etalase');
    const search = document.getElementById('search-kasir').value.toLowerCase();
    grid.innerHTML = dbBarang.filter(b => b.nama.toLowerCase().includes(search)).map(b => `
        <div onclick="tambahKeKeranjang(${b.id})" class="bg-white dark:bg-slate-800 p-2 rounded-2xl border dark:border-slate-700 shadow-sm cursor-pointer active:scale-95 transition">
            <p class="font-bold text-[10px] truncate dark:text-white uppercase">${b.nama}</p>
            <p class="text-[9px] text-blue-500 font-black">Rp ${b.harga.toLocaleString()}</p>
        </div>`).join('');
}

function tambahKeKeranjang(id) {
    const item = dbBarang.find(b => b.id === id);
    const ada = keranjang.find(k => k.id === id);
    ada ? ada.qty++ : keranjang.push({ ...item, qty: 1 });
    renderCart();
}

function renderCart() {
    let total = 0;
    document.getElementById('cart-items').innerHTML = keranjang.map((item, idx) => {
        total += (item.harga * item.qty);
        return `<div class="flex justify-between text-[10px] dark:text-white border-b dark:border-slate-700 pb-2">
            <span>${item.nama.toUpperCase()} (x${item.qty})</span>
            <button onclick="keranjang.splice(${idx},1);renderCart()" class="text-red-500">✕</button>
        </div>`;
    }).join('');
    document.getElementById('total-cart').innerText = `Rp ${total.toLocaleString()}`;
}

function renderMenu() {
    document.getElementById('menu-list').innerHTML = dbBarang.map(i => `
        <div class="flex justify-between bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700">
            <div><p class="font-bold dark:text-white text-xs uppercase">${i.nama}</p><p class="text-[9px] text-blue-500">Rp ${i.harga.toLocaleString()}</p></div>
            <button onclick="dbBarang=dbBarang.filter(b=>b.id!==${i.id});localStorage.setItem('dbBarang',JSON.stringify(dbBarang));renderMenu()" class="text-red-500">🗑️</button>
        </div>`).join('');
}

function simpanBarang() {
    const nama = document.getElementById('inp-nama').value;
    const harga = parseInt(document.getElementById('inp-harga').value);
    if(!nama || !harga) return alert("Isi data!");
    dbBarang.push({ id: Date.now(), nama, harga, kategori: document.getElementById('inp-kategori').value });
    localStorage.setItem('dbBarang', JSON.stringify(dbBarang));
    document.getElementById('inp-nama').value=''; document.getElementById('inp-harga').value='';
    renderMenu();
}

function renderHistory() {
    document.getElementById('history-list').innerHTML = dbHistory.slice().reverse().map(h => `
        <div class="bg-white dark:bg-slate-800 p-4 rounded-2xl border dark:border-slate-700 shadow-sm">
            <div class="flex justify-between items-center border-b dark:border-slate-700 pb-2 mb-2">
                <span class="text-[9px] text-blue-600 font-black">${h.waktu}</span>
                <span class="text-xs font-black dark:text-white uppercase">TOTAL: Rp ${h.total.toLocaleString()}</span>
            </div>
            <div class="space-y-1">
                ${h.items.map(i => `<div class="flex justify-between text-[10px] dark:text-slate-300"><span>${i.nama} x${i.qty}</span><span>Rp ${(i.harga*i.qty).toLocaleString()}</span></div>`).join('')}
            </div>
        </div>`).join('');
}

// --- FUNGSI CETAK GILA (DIRECT TO RAWBT) ---
async function prosesCheckout() {
    if(keranjang.length === 0) return;
    const total = keranjang.reduce((a, b) => a + (b.harga * b.qty), 0);
    const waktu = new Date().toLocaleString('id-ID');

    // 1. Siapkan HTML Nota di elemen tersembunyi
    const cap = document.getElementById('nota-capture');
    cap.innerHTML = `
        <div style="text-align:center;">
            <b style="font-size:16px;">TOKO PAKAN BURUNG<br>KEMBANG ARUM</b><br>
            <small>Salatiga - ${waktu}</small><br>
            ------------------------------------------
        </div>
        <div style="font-size:14px; margin-top:10px;">
            ${keranjang.map(i => `
                <div style="display:flex; justify-content:space-between;">
                    <span>${i.nama.toUpperCase()} x${i.qty}</span>
                    <span>${(i.harga*i.qty).toLocaleString()}</span>
                </div>
            `).join('')}
        </div>
        ------------------------------------------
        <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:16px;">
            <span>TOTAL</span>
            <span>Rp ${total.toLocaleString()}</span>
        </div>
        <div style="text-align:center; margin-top:20px;">Terima Kasih!</div>
    `;

    // 2. Ubah HTML jadi Gambar (Base64)
    const canvas = await html2canvas(cap);
    const imgData = canvas.toDataURL("image/png").replace(/^data:image\/(png|jpg);base64,/, "");

    // 3. Tembak langsung ke link protocol RawBT
    window.location.href = "rawbt:base64," + imgData;

    // 4. Simpan ke Riwayat
    dbHistory.push({ waktu, total, items: [...keranjang] });
    localStorage.setItem('dbHistory', JSON.stringify(dbHistory));
    keranjang = []; renderCart();
}

renderEtalase();
