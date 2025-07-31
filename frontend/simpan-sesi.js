// Impor dan konfigurasikan dotenv di baris paling atas
require('dotenv').config();

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// --- Ambil Konfigurasi dari .env ---
const LOGIN_URL = process.env.VITE_API_URL;
const STATE_FILE_PATH = process.env.STATE_FILE_PATH;
// -------------------------------------

// Validasi: Pastikan variabel dari .env berhasil dimuat
if (!LOGIN_URL || !STATE_FILE_PATH) {
  console.error("Error: Pastikan LOGIN_URL dan STATE_FILE_PATH sudah diatur di file .env");
  process.exit(1); // Keluar dari skrip jika ada error
}

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log(`Membuka halaman: ${LOGIN_URL}`);
  await page.goto(LOGIN_URL);

  console.log('================================================================');
  console.log('SILAKAN LOGIN SECARA MANUAL DI JENDELA BROWSER YANG MUNCUL.');
  console.log('Setelah login berhasil, kembali ke terminal dan tekan ENTER.');
  console.log('================================================================');

  await new Promise(resolve => process.stdin.once('data', resolve));

  await context.storageState({ path: STATE_FILE_PATH });

  console.log(`\nSesi berhasil disimpan ke dalam file: ${STATE_FILE_PATH}`);
  await browser.close();
})();