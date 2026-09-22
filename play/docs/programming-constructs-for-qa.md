# Programming Constructs for Web Test Automation (QA / Playwright + TypeScript)

A reference of common programming constructs and the idiomatic way to use each
one when writing web UI/API tests with Playwright + TypeScript. Each section
shows the construct plus a realistic QA use case.

---

## 1. Conditionals (`if` / `else` / ternary)

Used to branch test behavior based on page state, environment, or data.

```ts
import { test, expect } from '@playwright/test';

test('conditional banner check', async ({ page }) => {
  await page.goto('https://aiquality.in');

  const banner = page.locator('.cookie-banner');
  if (await banner.isVisible()) {
    await banner.getByRole('button', { name: 'Accept' }).click();
  }

  // ternary for environment-based data
  const baseUrl = process.env.ENV === 'staging'
    ? 'https://staging.aiquality.in'
    : 'https://aiquality.in';
});
```

**QA tip:** Avoid over-using conditionals inside tests — a test with many
branches is usually a sign it should be split into separate test cases. Use
conditionals mainly for environment differences and optional UI elements
(cookie banners, feature flags).

---

## 2. Loops (`for`, `for...of`, `while`)

Used to iterate over test data sets, table rows, or lists of elements.

```ts
test('validate each nav link', async ({ page }) => {
  await page.goto('https://aiquality.in');

  const links = await page.locator('nav a').all();
  for (const link of links) {
    await expect(link).toHaveAttribute('href', /.+/);
  }
});

// Data-driven loop — the most common QA pattern
const users = [
  { username: 'admin', expected: 'Admin Dashboard' },
  { username: 'guest', expected: 'Guest Home' },
];

for (const { username, expected } of users) {
  test(`login as ${username}`, async ({ page }) => {
    await page.goto('/login');
    await page.fill('#username', username);
    await page.click('#submit');
    await expect(page.locator('h1')).toHaveText(expected);
  });
}
```

**QA tip:** Generating tests in a `for` loop at the top level (like the
data-driven example) creates one named test per data row in the Playwright
report — much more useful than looping *inside* a single test, which hides
failures for individual data rows.

---

## 3. Functions and Page Object methods

Wrap reusable steps into functions so tests stay readable.

```ts
// utils/loginHelper.ts
import { Page } from '@playwright/test';

export async function loginAs(page: Page, username: string, password: string): Promise<void> {
  await page.fill('#username', username);
  await page.fill('#password', password);
  await page.click('#submit');
}
```

```ts
// tests/login.spec.ts
import { test, expect } from '@playwright/test';
import { loginAs } from '../utils/loginHelper';

test('valid login redirects to dashboard', async ({ page }) => {
  await page.goto('/login');
  await loginAs(page, 'admin', 'password123');
  await expect(page).toHaveURL(/dashboard/);
});
```

---

## 4. Async / await and Promises

Nearly every Playwright API call returns a `Promise`. `await` is what makes
tests wait for actions and assertions instead of racing ahead.

```ts
test('async actions', async ({ page }) => {
  await page.goto('https://aiquality.in');   // waits for navigation
  await page.click('#menu');                 // waits for click to complete
  const text = await page.textContent('h1'); // waits for and returns text
});

// Running independent async operations in parallel
test('parallel waits', async ({ page, context }) => {
  const [popup] = await Promise.all([
    context.waitForEvent('page'),   // start waiting BEFORE the action
    page.click('#open-new-tab'),    // action that triggers the popup
  ]);
  await popup.waitForLoadState();
});
```

**QA tip:** Forgetting `await` is the #1 cause of flaky Playwright tests — the
test moves on before the browser action finishes. ESLint's
`@typescript-eslint/no-floating-promises` rule catches this.

---

## 5. Try / Catch / Finally (error handling)

Used for negative testing, cleanup, and handling elements that may or may not
appear.

```ts
test('handle optional error dialog', async ({ page }) => {
  await page.goto('/checkout');

  try {
    await page.click('#pay-now');
    await page.waitForSelector('.error-dialog', { timeout: 3000 });
    const message = await page.textContent('.error-dialog');
    expect(message).toContain('Payment declined');
  } catch (error) {
    // no error dialog appeared — that's the expected happy path
    await expect(page.locator('.success-banner')).toBeVisible();
  } finally {
    // always runs — good place for cleanup that must not be skipped
    await page.screenshot({ path: 'checkout-result.png' });
  }
});
```

**QA tip:** Prefer Playwright's built-in auto-waiting/retrying assertions
(`expect(locator).toBeVisible()`) over `try/catch` where possible — they're
less flaky than manually racing timeouts.

---

## 6. Switch statements

Useful when a test needs to branch across more than 2–3 known states (e.g.,
role-based navigation, multi-environment config).

```ts
function getBaseUrl(env: string): string {
  switch (env) {
    case 'dev':
      return 'https://dev.aiquality.in';
    case 'staging':
      return 'https://staging.aiquality.in';
    case 'prod':
      return 'https://aiquality.in';
    default:
      throw new Error(`Unknown environment: ${env}`);
  }
}
```

---

## 7. Arrays and array methods (`map`, `filter`, `find`, `every`, `some`)

Used constantly for validating lists of elements — search results, table rows,
dropdown options.

```ts
test('product list filtering', async ({ page }) => {
  await page.goto('/products');

  const prices = await page.locator('.product .price').allTextContents();
  const numericPrices = prices.map(p => parseFloat(p.replace('$', '')));

  // every price should be positive
  expect(numericPrices.every(price => price > 0)).toBeTruthy();

  // at least one product should be on sale
  const onSale = numericPrices.some(price => price < 10);
  expect(onSale).toBeTruthy();

  // filter out-of-stock items
  const inStockNames = (await page.locator('.product').all())
    .filter(async (el) => !(await el.locator('.out-of-stock').isVisible()));
});
```

---

## 8. Objects, destructuring, and spread

Used for fixtures, test data, and Playwright's own fixture pattern
(`{ page }`, `{ page, context }`).

```ts
// destructuring Playwright fixtures — you already use this in every test
test('example', async ({ page, request, context }) => { /* ... */ });

// destructuring test data
const testUser = { name: 'Utkarsh', email: 'utkarsh@example.com', role: 'admin' };
const { name, email } = testUser;

// spread — building variations of a base payload for API tests
const baseUser = { name: 'Utkarsh', role: 'viewer' };
const adminUser = { ...baseUser, role: 'admin' }; // override just one field
```

---

## 9. Regular expressions

Used heavily in assertions where exact text match is too brittle.

```ts
await expect(page).toHaveTitle(/Utkarsh/i);           // case-insensitive
await expect(page).toHaveURL(/\/dashboard(\?.*)?$/);   // allow query params
await expect(page.locator('.price')).toHaveText(/^\$\d+\.\d{2}$/); // format check
```

---

## 10. Custom fixtures (Playwright-specific construct)

Extends the base `test` object to inject reusable setup/teardown (e.g., an
authenticated page) without repeating login logic in every test.

```ts
// fixtures.ts
import { test as base, Page } from '@playwright/test';

type MyFixtures = {
  loggedInPage: Page;
};

export const test = base.extend<MyFixtures>({
  loggedInPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'password123');
    await page.click('#submit');
    await use(page);          // hand control to the test
    // any code here runs as teardown after the test finishes
  },
});
```

```ts
// tests/dashboard.spec.ts
import { test } from '../fixtures';
import { expect } from '@playwright/test';

test('dashboard loads for logged-in user', async ({ loggedInPage }) => {
  await expect(loggedInPage.locator('h1')).toHaveText('Dashboard');
});
```

---

## 11. `test.beforeEach` / `test.afterEach` (setup & teardown)

The non-fixture way to share setup across tests in a file.

```ts
test.describe('cart flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cart');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      await page.screenshot({ path: `failure-${testInfo.title}.png` });
    }
  });

  test('empty cart shows message', async ({ page }) => {
    await expect(page.locator('.empty-cart')).toBeVisible();
  });
});
```

---

## 12. Retry / polling loops (handling flakiness explicitly)

Playwright auto-retries assertions, but sometimes you need to poll a custom
condition (e.g., waiting on an API response count, a value in `localStorage`).

```ts
import { expect } from '@playwright/test';

await expect.poll(async () => {
  const count = await page.locator('.notification').count();
  return count;
}, { timeout: 10_000, message: 'waiting for notification to appear' }).toBeGreaterThan(0);
```

---

## 13. Environment variables and configuration constructs

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    baseURL: process.env.BASE_URL ?? 'https://aiquality.in',
    trace: 'on-first-retry',
  },
});
```

```ts
// in a test
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error('API_KEY env var is required for this test');
}
```

---

## 14. API testing constructs (`request` fixture)

```ts
test('API returns valid user', async ({ request }) => {
  const response = await request.get('/api/users/1');
  expect(response.ok()).toBeTruthy();

  const body = await response.json();
  expect(body).toMatchObject({ id: 1, name: expect.any(String) });
});
```

---

## 15. Soft assertions (continue test after a failed check)

```ts
test('multiple independent checks', async ({ page }) => {
  await page.goto('/profile');

  await expect.soft(page.locator('h1')).toHaveText('My Profile');
  await expect.soft(page.locator('.email')).toBeVisible();
  await expect.soft(page.locator('.avatar')).toBeVisible();
  // test keeps running and reports ALL soft-assertion failures at the end,
  // instead of stopping at the first one
});
```

---

## 16. Quick reference — which construct to reach for

| Situation                                               | Construct                          |
|-----------------------------------------------------------|-------------------------------------|
| Same test logic, different data                            | `for...of` loop generating tests    |
| Optional UI element (banner, popup)                        | `if` + `isVisible()`                |
| Reusable multi-step action (login, add to cart)             | Function or Page Object method       |
| Any Playwright API call                                    | `async`/`await`                     |
| Element might or might not throw                            | `try`/`catch`/`finally`             |
| 3+ known branches (roles, environments)                     | `switch`                            |
| Validate a list of elements/values                          | `map` / `filter` / `every` / `some` |
| Flexible text/URL/title matching                            | Regular expressions                  |
| Shared authenticated state across tests                      | Custom fixture                       |
| Shared setup/teardown per test file                          | `beforeEach` / `afterEach`          |
| Waiting on a non-DOM condition (counter, storage value)       | `expect.poll`                        |
| Config that differs per environment                          | `process.env` + `playwright.config.ts` |
| Backend/API validation                                       | `request` fixture                    |
| Want to see ALL failures in one run, not just the first        | `expect.soft`                        |
