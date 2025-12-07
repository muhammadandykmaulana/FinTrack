/**
 * FinTrack Mobile Logic
 * Menggunakan Konsep Vanilla JS Modern
 */

// =========================================
// 1. DATA STRUCTURES & STATE MANAGEMENT
// =========================================
const STORAGE_KEY = 'fintrack_data_v1';
let state = {
	activity: 'splash',      
	tab: 'home',             
	username: '',            
	transactionType: 'pengeluaran', 
	editingId: null,         
	
	transactions: [
		{ id: 1, desc: 'Beli Pulsa', amount: 50000, type: 'pengeluaran', date: '2025-12-01', category: 'Lainnya' },
		{ id: 2, desc: 'Gaji Freelance', amount: 2500000, type: 'pemasukan', date: '2025-12-02', category: 'Income' }
	],
	
	wallets: [
		{ id: 1, name: 'Tunai', balance: 500000, color: 'bg-emerald-500' },
		{ id: 2, name: 'BCA Syariah', balance: 2500000, color: 'bg-blue-600' }
	],

	searchQuery: ''
};
// =========================================
// 2. LOCAL STORAGE HELPERS
// =========================================

function loadData() {
	const rawData = localStorage.getItem(STORAGE_KEY);
	if (rawData) {

		try {
			const parsedData = JSON.parse(rawData);
			// Update state dengan data dari storage
			state.transactions = parsedData.transactions || state.transactions;
			state.wallets = parsedData.wallets || state.wallets;
			state.username = parsedData.username || ''; // Retrieve username status
			console.log('Data loaded from LocalStorage');
		} catch (e) {
			console.error('Error parsing data from LocalStorage', e);
		}
	}
}

function saveData() {
	const dataToSave = {
		transactions: state.transactions,
		wallets: state.wallets,
		username: state.username
	};

	localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
	console.log('Data saved to LocalStorage');
}

// =========================================
// 3. INITIALIZATION & LIFECYCLE
// =========================================

document.addEventListener('DOMContentLoaded', () => {
	// 1. Load data dari LocalStorage saat aplikasi mulai
	loadData();
	
	// 2. Logic Check Login Status
	// Jika username sudah ada di storage, langsung ke Dashboard (Skip Splash & Login)

	if (state.username) {
		const displayUser = document.getElementById('display-username');
		if(displayUser) displayUser.innerText = state.username;
		
		// Langsung ke dashboard
		navigateTo('dashboard');
		renderTransactions();
		renderWallets();
		calculateTotal();

	} else {

		// Jika belum login, Timer Splash Screen (Pindah ke login setelah 3 detik)
		setTimeout(() => {
			navigateTo('login');
		}, 3000);
	}
	
	// Set nilai default input tanggal ke hari ini
	const dateInput = document.getElementById('inp-date');
	if(dateInput) dateInput.valueAsDate = new Date();

	// Render kategori radio button
	renderCategories();

	// Setup Event Listener untuk Form Login
	const loginForm = document.getElementById('login-form');
	if (loginForm) {
		loginForm.addEventListener('submit', handleLogin);
	}
});

// =========================================
// 4. NAVIGATION FUNCTIONS
// =========================================

function navigateTo(activityId) {
	// Hilangkan class 'active' dari semua activity
	document.querySelectorAll('.activity').forEach(el => {
		el.classList.remove('active');
	});
	
	// Tambahkan class 'active' ke target yang diinginkan
	const target = document.getElementById(`activity-${activityId}`);
	if (target) {
		target.classList.add('active');
		state.activity = activityId;
	}

	if (activityId === 'login') {
		const form = document.getElementById('login-form');
		if(form) form.reset();
	}
}

function switchTab(tabName) {
	state.tab = tabName;
	
	document.getElementById('fragment-home').classList.add('hidden');
	document.getElementById('fragment-wallet').classList.add('hidden');
	document.getElementById(`fragment-${tabName}`).classList.remove('hidden');

	// Update Nav Buttons (Mobile)
	const homeBtn = document.getElementById('nav-home');
	const walletBtn = document.getElementById('nav-wallet');
	
	// Update Nav Buttons (Desktop)
	const deskHomeBtn = document.getElementById('desk-nav-home');
	const deskWalletBtn = document.getElementById('desk-nav-wallet');

	const activeClass = "text-primary";
	const inactiveClass = "text-gray-400";

	// Helper untuk update class
	const updateBtnStyle = (btn, isActive) => {
		if(!btn) return;
		if (isActive) {
			btn.classList.remove(inactiveClass);
			btn.classList.add(activeClass);
		} else {
			btn.classList.remove(activeClass);
			btn.classList.add(inactiveClass);
		}
	};

	// Helper Desktop
	const updateDeskBtnStyle = (btn, isActive) => {
		if(!btn) return;
		if(isActive) {
			btn.className = "px-4 py-2 rounded-lg text-sm font-bold bg-white text-primary shadow-sm hover:bg-gray-100 transition";
		} else {
			btn.className = "px-4 py-2 rounded-lg text-sm font-bold text-emerald-100 hover:bg-emerald-700 transition";
		}
	}

	if (tabName === 'home') {
		updateBtnStyle(homeBtn, true);
		updateBtnStyle(walletBtn, false);
		updateDeskBtnStyle(deskHomeBtn, true);
		updateDeskBtnStyle(deskWalletBtn, false);
		renderTransactions();
	} else {
		updateBtnStyle(walletBtn, true);
		updateBtnStyle(homeBtn, false);
		updateDeskBtnStyle(deskWalletBtn, true);
		updateDeskBtnStyle(deskHomeBtn, false);
		renderWallets();
	}
}

// =========================================
// 5. AUTHENTICATION LOGIC
// =========================================

function handleLogin(e) {
	e.preventDefault(); 
	const user = document.getElementById('login-username').value;
	const pass = document.getElementById('login-password').value;

	// Simple Auth Check
	if (user === 'melbukae' && pass === 'okelah1234') {
		state.username = user;
		const displayUser = document.getElementById('display-username');
		if(displayUser) displayUser.innerText = user;
		saveData();
		navigateTo('dashboard');
		renderTransactions();
		renderWallets();
		calculateTotal();
	} else {
		alert('Username atau Password Salah!');
	}
}


function handleLogout() {
	// Hapus sesi username
	state.username = '';
	saveData();
	// Kembali ke login
	navigateTo('login');
}

function handleReset() {
	const email = document.getElementById('forgot-email').value;
	
	if(email) {
		alert(`Link reset sudah dikirim email`);
		navigateTo('login');
	} else {
		alert('Harap isi email!');
	}
}
// =========================================
// 6. TRANSACTION LOGIC (CRUD)
// =========================================

function setTransactionType(type) {
	state.transactionType = type;
	const btnIn = document.getElementById('btn-type-in');
	const btnOut = document.getElementById('btn-type-out');

	if (type === 'pemasukan') {
		btnIn.className = "flex-1 py-2.5 rounded-lg text-sm font-bold transition bg-primary text-white shadow-md";
		btnOut.className = "flex-1 py-2.5 rounded-lg text-sm font-bold transition text-gray-500 hover:bg-gray-100";
	} else {
		btnOut.className = "flex-1 py-2.5 rounded-lg text-sm font-bold transition bg-red-500 text-white shadow-md";
		btnIn.className = "flex-1 py-2.5 rounded-lg text-sm font-bold transition text-gray-500 hover:bg-gray-100";
	}
}

function renderCategories() {
	const categories = ['Makan', 'Transport', 'Belanja', 'Income (Gaji, Investasi, dll)', 'Akomodasi', 'Lainnya'];
	const container = document.getElementById('radio-group-category');
	if(!container) return;
	
	container.innerHTML = categories.map(cat => `
		<label class="cursor-pointer">
			<input type="radio" name="category" value="${cat}" class="peer sr-only" ${cat === 'Makan' ? 'checked' : ''}>
			<div class="px-3 py-1 rounded-full border border-gray-200 text-xs text-gray-500 peer-checked:bg-primary peer-checked:text-white peer-checked:border-primary transition font-medium">
				${cat}
			</div>
		</label>
	`).join('');
}

function saveTransaction() {
	const desc = document.getElementById('inp-desc').value;
	const amount = document.getElementById('inp-amount').value;
	const date = document.getElementById('inp-date').value;
	const categoryEl = document.querySelector('input[name="category"]:checked');
	const category = categoryEl ? categoryEl.value : 'Lainnya';

	if (!desc || !amount) {
		alert("Deskripsi dan Jumlah wajib diisi!");
		return;
	}

	const payload = {
		id: state.editingId || Date.now(),
		desc,
		amount: parseInt(amount),
		type: state.transactionType,
		date,
		category
	};

	if (state.editingId) {
		state.transactions = state.transactions.map(t => t.id === state.editingId ? payload : t);
		alert("Transaksi Diupdate!");
	} else {
		state.transactions.unshift(payload);
		alert("Transaksi Disimpan!");
	}
	saveData();
	resetForm();
	renderTransactions();
	calculateTotal();
}

function resetForm() {
	state.editingId = null;
	document.getElementById('inp-desc').value = '';
	document.getElementById('inp-amount').value = '';
	
	document.getElementById('form-title').innerText = 'Transaksi Baru';
	document.getElementById('btn-save-text').innerText = 'Simpan Transaksi';
	
	document.getElementById('cancel-edit-btn').classList.add('hidden');
	
	setTransactionType('pengeluaran');
}

function editTransaction(id) {
	const item = state.transactions.find(t => t.id === id);
	if (!item) return;

	state.editingId = id;
	
	document.getElementById('inp-desc').value = item.desc;
	document.getElementById('inp-amount').value = item.amount;
	document.getElementById('inp-date').value = item.date;
	setTransactionType(item.type);
	
	document.getElementById('form-title').innerText = 'Edit Transaksi';
	document.getElementById('btn-save-text').innerText = 'Update Data';
	document.getElementById('cancel-edit-btn').classList.remove('hidden');

	document.getElementById('fragment-container').scrollTop = 0;
}

function deleteTransaction(id) {
	if (confirm('Hapus data ini?')) {
		state.transactions = state.transactions.filter(t => t.id !== id);
		saveData();
		renderTransactions();
		calculateTotal();
	}
}

function handleSearch() {
	state.searchQuery = document.getElementById('inp-search').value.toLowerCase();
	renderTransactions();
}

function renderTransactions() {
	const list = document.getElementById('transaction-list');
	if(!list) return;
	
	const filtered = state.transactions.filter(t => 
		t.desc.toLowerCase().includes(state.searchQuery) || 
		t.category.toLowerCase().includes(state.searchQuery)
	);

	if (filtered.length === 0) {
		list.innerHTML = '<p class="text-center text-gray-400 text-sm mt-4">Tidak ada data ditemukan.</p>';
		return;
	}

	list.innerHTML = filtered.map(t => {
		const isIncome = t.type === 'pemasukan';
		
		const color = isIncome ? 'text-emerald-600' : 'text-red-500';
		const sign = isIncome ? '+' : '-';
		const border = isIncome ? 'border-l-emerald-500' : 'border-l-red-500';

		return `
		<div class="bg-white p-3 rounded-lg border-l-4 shadow-sm text-sm relative group ${border} hover:shadow-md transition">
			<div class="flex justify-between items-start pr-14">
				<div>
					<span class="font-bold text-gray-800 block">${t.desc}</span>
					<span class="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded mr-1">${t.category}</span>
					<span class="text-xs text-gray-400">${t.date}</span>
				</div>
				<span class="font-mono font-bold ${color}">${sign} Rp ${t.amount.toLocaleString()}</span>
			</div>
			<div class="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
				<button onclick="editTransaction(${t.id})" class="text-orange-400 hover:text-orange-600">
					<i class="fa-solid fa-pen"></i>
				</button>
				<button onclick="deleteTransaction(${t.id})" class="text-red-400 hover:text-red-600">
					<i class="fa-solid fa-trash"></i>
				</button>
			</div>
		</div>`;
	}).join('');
}

// =========================================
// 7. CRU WALLET LOGIC
// =========================================

function toggleWalletForm() {
	const form = document.getElementById('wallet-form');
	form.classList.toggle('hidden');
}

function saveWallet() {
	const name = document.getElementById('wallet-name').value;
	const balance = document.getElementById('wallet-balance').value;
	
	if (!name || !balance) return;

	let color = 'bg-gray-500';
	const lower = name.toLowerCase();
	if(lower.includes('dana')) color = 'bg-blue-500';
	if(lower.includes('linkaja')) color = 'bg-red-500';
	if(lower.includes('shopee')) color = 'bg-orange-500';
	if(lower.includes('ovo')) color = 'bg-purple-600';
	if(lower.includes('gopay')) color = 'bg-sky-500';

	state.wallets.push({ id: Date.now(), name, balance: parseInt(balance), color });
	saveData();
	document.getElementById('wallet-name').value = '';
	document.getElementById('wallet-balance').value = '';
	toggleWalletForm();
	renderWallets();
	calculateTotal();
}

function renderWallets() {
	const container = document.getElementById('wallet-list');
	if(!container) return;

	container.innerHTML = state.wallets.map(w => `
		<div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-full ${w.color} flex items-center justify-center text-white shadow">
					<i class="fa-solid fa-wallet"></i>
				</div>
				<div>
					<h4 class="font-bold text-gray-700 text-sm">${w.name}</h4>
					<p class="text-xs text-gray-400">Terhubung</p>
				</div>
			</div>
			<div class="text-right">
				<span class="block text-xs text-gray-400">Saldo</span>
				<span class="font-mono font-bold text-gray-700">Rp ${w.balance.toLocaleString()}</span>
			</div>
		</div>
	`).join('');
}

// =========================================
// 8. UTILITY FUNCTIONS
// =========================================

function calculateTotal() {
	const walletTotal = state.wallets.reduce((acc, curr) => acc + curr.balance, 0);
	const trxTotal = state.transactions.reduce((acc, curr) => {
		return curr.type === 'pemasukan' ? acc + curr.amount : acc - curr.amount;
	}, 0);
	
	const grandTotal = walletTotal + trxTotal; 
	
	const el = document.getElementById('total-balance');
	if(el) el.innerText = `Rp ${grandTotal.toLocaleString()}`;
}