# Test Coverage & Results (Playwright)

[![E2E](https://github.com/Arshdeep225615024/SecurePasswordManager/actions/workflows/e2e.yml/badge.svg?branch=main)](https://github.com/Arshdeep225615024/SecurePasswordManager/actions/workflows/e2e.yml)

_Last updated: **REPLACE_WITH_DATE**_

This project uses **Playwright** for E2E tests. CI runs:
- **Mocked job**: fast checks with API/network mocks.
- **Live job** (optional): points to a real URL when provided.

### Latest CI
- **Workflow**: [e2e.yml](https://github.com/Arshdeep225615024/SecurePasswordManager/actions/workflows/e2e.yml)
- **Artifacts** (HTML report, videos, traces): download from the latest run’s **Artifacts** section.

### Test Suites
| Suite / File | Key Scenarios |
|---|---|
| `tests/smoke.spec.js` | Home renders, strength meter reacts |
| `tests/critical.spec.js` | Strength meter weak→strong→very strong • Breach check (mock HIBP path) • Signup form validation & submit |
| `tests/live.smoke.spec.js` | Home loads & `/health` OK (only with live base URL) |

### Run locally
\`\`\`bash
npm run test:e2e
npx playwright show-report
\`\`\`
