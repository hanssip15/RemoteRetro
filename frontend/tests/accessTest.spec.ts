import { test, expect, chromium } from '@playwright/test';

test.describe('Tes Hak Akses Fasilitator', () => {

  test('seharusnya bisa memindahkan peran fasilitator ke peserta lain', async () => {
    // Setup: Siapkan dua browser terpisah untuk dua pengguna
    const facilitatorBrowser = await chromium.launch();
    const participantBrowser = await chromium.launch();
    const facilitatorContext = await facilitatorBrowser.newContext();
    const participantContext = await participantBrowser.newContext();
    const facilitatorPage = await facilitatorContext.newPage();
    const participantPage = await participantContext.newPage();

    const retroURL = 'https://retro-sprint.vercel.app/retro/id-sesi-anda'; // URL sesi retro

    await test.step('Langkah 1: Verifikasi Kondisi Awal', async () => {
      // Kedua pengguna bergabung ke sesi
      await facilitatorPage.goto(retroURL);
      await participantPage.goto(retroURL);

      // Asumsi avatar peserta B memiliki id atau data-testid unik
      const participantAvatarOnFacilitatorPage = facilitatorPage.getByTestId('participant-card-userB');
      const facilitatorAvatarOnParticipantPage = participantPage.getByTestId('participant-card-userA');

      // Validasi dari sisi Fasilitator A
      await expect(participantAvatarOnFacilitatorPage.getByRole('button', { name: 'Jadikan Fasilitator' })).toBeVisible();
      
      // Validasi dari sisi Peserta B
      await expect(facilitatorAvatarOnParticipantPage.getByRole('button', { name: 'Jadikan Fasilitator' })).not.toBeVisible();
    });

    await test.step('Langkah 2: Proses Perpindahan Peran', async () => {
      // Fasilitator A mengklik tombol
      await facilitatorPage.getByTestId('participant-card-userB').getByRole('button', { name: 'Jadikan Fasilitator' }).click();

      // Fasilitator A memvalidasi dan mengonfirmasi modal
      await expect(facilitatorPage.getByText('Anda yakin ingin menjadikan')).toBeVisible();
      await facilitatorPage.getByRole('button', { name: 'Ya' }).click();
    });

    await test.step('Langkah 3: Verifikasi Kondisi Akhir', async () => {
      // Peserta B (sekarang fasilitator baru) memvalidasi modal notifikasi
      await expect(participantPage.getByText('Anda sekarang adalah fasilitator baru!')).toBeVisible();
      await participantPage.getByRole('button', { name: 'Mengerti' }).click();

      // Validasi akhir dari kedua sisi
      const oldFacilitatorAvatar = participantPage.getByTestId('participant-card-userA');
      const newFacilitatorAvatar = facilitatorPage.getByTestId('participant-card-userB');

      await expect(oldFacilitatorAvatar.getByRole('button', { name: 'Jadikan Fasilitator' })).toBeVisible();
      await expect(newFacilitatorAvatar.getByRole('button', { name: 'Jadikan Fasilitator' })).not.toBeVisible();
    });

    // Cleanup: Tutup kedua browser
    await facilitatorBrowser.close();
    await participantBrowser.close();
  });
});