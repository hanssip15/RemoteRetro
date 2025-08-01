import { test, expect } from '@playwright/test';

test.describe('Siklus Hidup Retrospektif - E2E Lengkap', () => {

  test('seharusnya menjalankan siklus retro lengkap dari pembuatan hingga selesai', async ({ page }) => {
    // Variabel untuk memastikan judul retro unik setiap kali tes berjalan
    const retroTitle = `E2E Test - Retro Sprint ${new Date().getTime()}`;

    await test.step('Langkah 1: Navigasi dan Membuat Retrospective Baru', async () => {
      await page.goto("https://retro-sprint.vercel.app/");
      await page.getByRole("button", { name: "Dashboard" }).click();
      await page.getByRole("button", { name: "New Retro" }).click();

      await page.getByLabel('Retrospective Title').fill(retroTitle);
      await page.getByRole("button", { name: "Select Start/Stop/Continue" }).click();
      await page.getByRole("button", { name: "Create Retrospective" }).click();

      // VALIDASI: Pastikan retro berhasil dibuat dan kita berada di halaman yang benar
      await expect(page.getByRole('heading', { name: retroTitle })).toBeVisible({ timeout: 10000 });
    });

    await test.step('Langkah 2: Memulai Retro dan Fase Ideation', async () => {
      await page.getByRole("button", { name: "Start Retro" }).click();
      await page.getByRole("button", { name: "Start Retrospective" }).click();
      await page.getByRole("button", { name: "Got it!" }).click();
      await page.getByRole("button", { name: "Begin Ideation Phase →" }).click();
      await page.getByRole("button", { name: "Yes" }).click();
      await page.getByRole("button", { name: "Got it!" }).click();

      // Tambahkan beberapa ide
      const idea1 = "Tingkatkan cakupan tes unit";
      const idea2 = "Adakan sesi sharing mingguan";
      const idea3 = "Tingkatkan bounding tim";

      const startColumn = page.getByTestId('retro-column-start');

      await page.getByPlaceholder('Ex. we have a linter!').fill(idea1);
      await page.getByPlaceholder('Ex. we have a linter!').press('Enter');
      
      await page.getByPlaceholder('Ex. we have a linter!').fill(idea2);
      await page.getByPlaceholder('Ex. we have a linter!').press('Enter');

      await page.getByPlaceholder('Ex. we have a linter!').fill(idea3);
      await page.getByPlaceholder('Ex. we have a linter!').press('Enter');

      // VALIDASI: Pastikan ide-ide tersebut muncul di papan
      await test.step('VALIDASI: Memastikan kartu ide muncul di papan', async () => {
        // Definisikan ide-ide yang baru saja kita buat
        const ideasToCheck = [
          "Tingkatkan cakupan tes unit",
          "Adakan sesi sharing mingguan",
          "Tingkatkan bounding tim"
        ];
      
        // Loop melalui setiap ide dan pastikan 'kartu'-nya terlihat
        for (const ideaText of ideasToCheck) {
          // Cari sebuah <div> yang di dalamnya memiliki teks ide yang kita cari.
          // Ini secara efektif menargetkan 'kartu' dari ide tersebut.
          const cardLocator = page.locator('div').filter({ has: page.getByText(ideaText) });
      
          // Validasi bahwa kartu tersebut (locator pertama yang cocok) terlihat.
          await expect(cardLocator.first()).toBeVisible();
        }
      });
    });

    await test.step('Langkah 3: Fase Grouping dan Labelling', async () => {
      await page.getByRole("button", { name: "Grouping →" }).click();
      await page.getByRole("button", { name: "Yes" }).click();
      await page.getByRole("button", { name: "Got it!" }).click();
      
      await page.getByRole("button", { name: "Next: Labelling →" }).click();
      await page.getByRole("button", { name: "Yes" }).click();
      await page.getByRole("button", { name: "Got it!" }).click();
      
      // Beri nama pada grup yang belum berlabel
      const groupLabel = "Peningkatan Kualitas";
      // Gunakan locator yang lebih spesifik untuk textbox yang akan diisi
      const firstGroupTextbox = page.getByRole('textbox', { name: 'unlabeled' }).first();

      await firstGroupTextbox.fill(groupLabel);
      await firstGroupTextbox.press('Enter');

      // VALIDASI: Pastikan label grup baru muncul
      await expect(firstGroupTextbox).toHaveValue(groupLabel);
    });

    await test.step('Langkah 4: Fase Voting', async () => {
      await page.getByRole("button", { name: "Next: Voting →" }).click();
      await page.getByRole("button", { name: "Yes" }).click();
      await page.getByRole("button", { name: "Got it!" }).click();
    
      const groupLabel = "Peningkatan Kualitas";
    
      // 1. Cari 'kartu' div utama yang berisi teks label
      const groupCard = page.locator('div.border').filter({
        has: page.getByText(groupLabel)
      });
    
      // 2. Di dalam 'kartu' itu, cari tombol '+'
      const voteButton = groupCard.getByRole('button', { name: '+' });
      
      await voteButton.click();
      await voteButton.click();
    
      // --- PERBAIKAN VALIDASI DI SINI ---
      // Cari span yang merupakan "saudara" (sibling) langsung setelah tombol '+'
      // Ini adalah cara yang paling akurat berdasarkan HTML Anda.
      const voteCount = voteButton.locator('+ span');
      
      await expect(voteCount).toHaveText('2');
    });

    await test.step('Langkah 5: Fase Action Items', async () => {
      await page.getByRole("button", { name: "Action Items →" }).click();
      await page.getByRole("button", { name: "Yes" }).click();
      await page.getByRole("button", { name: "Got it!" }).click();

      const actionItemText = "Buat rencana peningkatan test coverage di Q4";
      await page.getByPlaceholder('Ex. automate the linting').fill(actionItemText);
      await page.getByPlaceholder('Ex. automate the linting').press('Enter');
      
      // VALIDASI: Pastikan action item muncul di daftar
      await expect(page.getByText(actionItemText)).toBeVisible();
    });

    await test.step('Langkah 6: Menyelesaikan Retro dan Verifikasi di Dashboard', async () => {
      await page.getByRole("button", { name: "Next: Final →" }).click();
      await page.getByRole("button", { name: "Yes" }).click();
      await page.getByRole("button", { name: "Got it!" }).click();
    
      await page.getByRole("button", { name: "Dashboard →" }).click();
    
      await expect(page).toHaveURL(/.*dashboard/);
    
      // --- PERBAIKAN VALIDASI AKHIR DI SINI ---
      const retroCard = page.locator('div.border')
        .filter({
          // Pastikan ia memiliki heading yang benar
          has: page.getByRole('heading', { name: retroTitle }),
          // DAN pastikan ia BUKAN kontainer besar yang juga punya teks "Recent Retrospectives"
          hasNot: page.getByText('Recent Retrospectives')
        });
    
      // 1. Pastikan kartu retro yang spesifik itu terlihat.
      await expect(retroCard).toBeVisible();
    
      // 2. Di dalam kartu itu, pastikan terdapat teks status "Completed".
      await expect(retroCard.getByText('Completed')).toBeVisible();
    });
  });
});