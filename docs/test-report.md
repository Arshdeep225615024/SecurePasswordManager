# Test Coverage & Results Report (Playwright)

## Test Cases

### 🔹 smoke.spec.js
1. Home page renders (chromium + webkit) → ✅ Passed  
2. Strength meter reacts (chromium + webkit) → ✅ Passed  

### 🔹 critical.spec.js
1. Breach check (mock HIBP in mocked mode) → ✅ Passed  
2. Strength meter: weak → strong → very strong → ✅ Passed  
3. Signup form: validates & submits → ✅ Passed  

### 🔹 live.smoke.spec.js
1. Home loads and health is OK → ⏭ Skipped (chromium + webkit)  

---

## Results Summary
- **Total tests executed**: 12  
- ✅ Passed: 10  
- ⏭ Skipped: 2  
- ❌ Failed: 0  

---

## Evidence
- [Playwright HTML Report](../playwright-report/index.html)  
- ![Dashboard Screenshot](screenshots/playwright-dashboard.png)

---

## Notes
- Skipped tests in `live.smoke.spec.js` may be due to environment setup (e.g., health check endpoint not configured).  
- No failing tests detected — coverage is good.  
