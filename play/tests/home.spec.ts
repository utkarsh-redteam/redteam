import {test, expect} from '@playwright/test';
test("Open home page",async({page})=>{
await page.goto("https://aiquality.in");
await expect(page).toHaveTitle(/Utkarsh/i);

})
