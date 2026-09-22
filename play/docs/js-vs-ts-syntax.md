# JavaScript vs TypeScript Syntax — Quick Reference

This project uses TypeScript (`.ts` files with Playwright Test). This doc lists the
syntax differences you'll actually run into, side by side, so you can translate
between the two when reading examples online (most Playwright/Selenium snippets
you'll find are JS) and the `.ts` files in this repo.

## 1. Variable typing

**JavaScript** — no type annotations, type is inferred at runtime.
```js
let title = "Utkarsh";
let count = 5;
let isVisible = true;
```

**TypeScript** — you *can* annotate types; the compiler checks them before runtime.
```ts
let title: string = "Utkarsh";
let count: number = 5;
let isVisible: boolean = true;

// usually you don't need to annotate — TS infers it from the value
let inferred = "Utkarsh"; // inferred as string automatically
```

## 2. Function parameters and return types

**JavaScript**
```js
function login(username, password) {
  return username + password;
}
```

**TypeScript**
```ts
function login(username: string, password: string): string {
  return username + password;
}

// arrow function with types
const login = (username: string, password: string): string => {
  return username + password;
};
```

## 3. Optional and default parameters

**JavaScript**
```js
function search(term, exact) {
  exact = exact || false;
}
```

**TypeScript**
```ts
function search(term: string, exact?: boolean) {
  // exact is `boolean | undefined`
}

function searchWithDefault(term: string, exact: boolean = false) {
  // exact defaults to false, still typed as boolean
}
```

## 4. Interfaces and types (TS-only concept)

JavaScript has no way to describe the "shape" of an object at compile time — you
just build objects and hope you got the keys right.

**JavaScript**
```js
const user = { name: "Utkarsh", email: "utkarsh@example.com" };
```

**TypeScript**
```ts
interface User {
  name: string;
  email: string;
  age?: number; // optional property
}

const user: User = { name: "Utkarsh", email: "utkarsh@example.com" };

// type alias — similar purpose, more flexible (unions, primitives, etc.)
type Role = "admin" | "editor" | "viewer";
let role: Role = "admin";
```

## 5. Classes

Both support ES6 classes, but TypeScript adds access modifiers, typed fields, and
`readonly`.

**JavaScript**
```js
class LoginPage {
  constructor(page) {
    this.page = page;
  }

  async login(username, password) {
    await this.page.fill("#username", username);
  }
}
```

**TypeScript**
```ts
class LoginPage {
  private readonly page: Page; // Playwright's Page type

  constructor(page: Page) {
    this.page = page;
  }

  async login(username: string, password: string): Promise<void> {
    await this.page.fill("#username", username);
  }
}
```

## 6. Generics (TS-only concept)

**JavaScript** has no generics — you lose type safety when writing reusable
helpers.
```js
function getFirst(arr) {
  return arr[0];
}
```

**TypeScript**
```ts
function getFirst<T>(arr: T[]): T {
  return arr[0];
}

const firstName = getFirst<string>(["Alice", "Bob"]); // typed as string
```

## 7. Enums (TS-only concept)

**JavaScript** — simulated with plain objects.
```js
const Environment = { DEV: "dev", STAGING: "staging", PROD: "prod" };
```

**TypeScript**
```ts
enum Environment {
  DEV = "dev",
  STAGING = "staging",
  PROD = "prod",
}

let env: Environment = Environment.STAGING;
```

## 8. Type assertions / casting

**JavaScript** — no casting; you just use the value and hope.
```js
const value = someFunction();
```

**TypeScript**
```ts
const input = document.getElementById("email") as HTMLInputElement;
// or the alternative syntax (not usable in .tsx files):
const input2 = <HTMLInputElement>document.getElementById("email");
```

## 9. Union and nullable types

**JavaScript** — no concept of "nullable"; anything can be `null`/`undefined` and
you only find out at runtime.
```js
function getElementText(locator) {
  // could return string, null, or throw — JS won't warn you
}
```

**TypeScript**
```ts
function getElementText(locator: Locator): Promise<string | null> {
  // caller is forced by the compiler to handle both cases
}

let errorMessage: string | null = null;
```

## 10. Non-null assertion and optional chaining

Optional chaining (`?.`) and nullish coalescing (`??`) exist in **both** modern
JS and TS — they're ES2020 features, not a TS-only concept. What's TS-only is
the non-null assertion operator (`!`).

```ts
// Optional chaining — works in JS and TS
const city = user?.address?.city;

// Nullish coalescing — works in JS and TS
const name = user.name ?? "Guest";

// Non-null assertion — TypeScript ONLY
// Tells the compiler "trust me, this is never null/undefined"
const email = user!.email;
```

## 11. Importing modules

Syntax is identical in both — Playwright Test uses ES module `import`/`export`
regardless of `.js` or `.ts`.

```ts
import { test, expect } from "@playwright/test";
import type { Page, Locator } from "@playwright/test"; // `import type` is TS-only
```

`import type` is a TypeScript-only variant that guarantees the import is erased
at compile time (no runtime cost) — useful when you're only importing something
for its type, like `Page` or `Locator`.

## 12. Compilation step

- **JavaScript**: runs directly in Node.js / the browser. No build step.
- **TypeScript**: must be compiled (or transpiled on the fly) to JavaScript
  before it runs. Playwright Test does this automatically for `.ts` spec files
  via its built-in `ts-node`-like loader — you don't need a separate `tsc`
  build step to run tests, but type errors will still fail the run.

## 13. Quick cheat sheet

| Concept                     | JavaScript                        | TypeScript                                      |
|------------------------------|------------------------------------|--------------------------------------------------|
| File extension               | `.js`                              | `.ts`                                             |
| Type annotations              | Not supported                      | `let x: string`                                   |
| Interfaces / object shapes     | Not supported (plain objects)      | `interface User { ... }`                          |
| Type aliases                  | Not supported                      | `type Role = "admin" \| "viewer"`                 |
| Generics                      | Not supported                      | `function f<T>(x: T): T`                          |
| Enums                          | Simulated with objects             | `enum Environment { DEV, PROD }`                  |
| Access modifiers (class)       | Not supported                      | `private`, `public`, `protected`, `readonly`      |
| Type casting                  | Not supported                      | `value as Type`                                   |
| `import type`                  | Not supported                      | Supported                                         |
| Compile-time error checking    | None — errors surface at runtime    | Caught before running (in editor and at test-run) |
| Optional chaining `?.`          | Supported (ES2020+)                 | Supported                                         |
| Non-null assertion `!`          | Not supported                      | Supported                                         |

## 14. Why this matters for QA/test automation

- Playwright's `Page`, `Locator`, `APIRequestContext`, etc. are all typed. Using
  TypeScript gives you autocomplete for every Playwright method
  (`page.locator(...).click()`, `expect(locator).toBeVisible()`) and catches
  typos in selectors/options before you even run the test.
- If you copy a JS snippet from Stack Overflow or Playwright's own JS docs into
  this repo, it will almost always still work — just add type annotations to
  function parameters if TS complains, and you're done.
