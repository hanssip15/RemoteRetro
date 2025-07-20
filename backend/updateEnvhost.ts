// updateEnvHost.ts
import os from 'os';
import fs from 'fs';

const envPath = '.env';
const interfaces = os.networkInterfaces();

let currentIP = '127.0.0.1';
for (const iface of Object.values(interfaces)) {
  if (!iface) continue;
  for (const info of iface) {
    if (info.family === 'IPv4' && !info.internal) {
      currentIP = info.address;
      break;
    }
  }
}

// Baca isi .env
let envContent = fs.readFileSync(envPath, 'utf-8');

// Ganti semua "localhost" dengan IP
envContent = envContent.replace(/localhost/g, currentIP);

// Simpan kembali ke .env
fs.writeFileSync(envPath, envContent, 'utf-8');

console.log(`Semua "localhost" di .env telah diganti dengan ${currentIP}`);
