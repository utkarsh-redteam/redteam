import {test, expect} from '@playwright/test';
test("Open home page", async ({ page }) => {
  await page.goto("https://aiquality.in");

  const actualTitle = await page.title();
  const expected = "Utkarsh";

  console.log(`Expected: ${expected}`);
  console.log(`Actual:   ${actualTitle}`);
  await page.pause();
    await page.getByRole('link', { name: 'get in touch' }).click();
  await page.getByRole('link', { name: '// email xlautomation8@gmail.' }).click();
  await expect(page).toHaveTitle(/Utkarsh/i);
    await page.getByRole('link', { name: '.experience' }).click();
  await page.getByRole('link', { name: '.skills' }).click();
  await page.getByRole('link', { name: '.projects' }).click();
  await page.getByText('about experience skills').click();
  await page.getByRole('link', { name: '.education' }).click();
});
