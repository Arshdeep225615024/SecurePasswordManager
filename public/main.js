// ---------- Utilities ----------
const $ = (sel) => document.querySelector(sel);

const toast = (msg) => {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("toast--show");
  setTimeout(() => t.classList.remove("toast--show"), 1800);
};

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

// ---------- Strength evaluation (lightweight heuristic) ----------
function evaluateStrength(pw) {
  if (!pw) return { score: 0, label: "Empty", tips: ["Enter a password to begin."] };

  const len = pw.length;
  const hasLower = /[a-z]/.test(pw);
  const hasUpper = /[A-Z]/.test(pw);
  const hasDigit = /\d/.test(pw);
  const hasSymbol = /[^A-Za-z0-9]/.test(pw);
  const commonPatterns = /(password|qwerty|12345|letmein|welcome|admin)/i.test(pw);
  const repeated = /(.)\1{2,}/.test(pw);

  let score = 0;
  if (len >= 8) score++;
  if (len >= 12) score++;
  if (hasLower && hasUpper) score++;
  if (hasDigit) score++;
  if (hasSymbol) score++;
  if (commonPatterns) score -= 2;
  if (repeated) score -= 1;

  score = clamp(score, 0, 4);

  const labels = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
  const tips = [];

  if (len < 12) tips.push("Use 12+ characters.");
  if (!hasUpper || !hasLower) tips.push("Mix UPPER + lower case.");
  if (!hasDigit) tips.push("Add a number.");
  if (!hasSymbol) tips.push("Add a symbol.");
  if (commonPatterns) tips.push("Avoid common words (e.g., 'password').");
  if (repeated) tips.push("Avoid repeated characters.");

  return { score, label: labels[score], tips };
}

// ---------- Password generator ----------
function generatePassword({ length = 16, symbols = true } = {}) {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const syms = "!@#$%^&*()-_=+[]{};:,.?";
  const pool = upper + lower + digits + (symbols ? syms : "");
  let out = "";
  // ensure complexity
  out += upper[Math.floor(Math.random() * upper.length)];
  out += lower[Math.floor(Math.random() * lower.length)];
  out += digits[Math.floor(Math.random() * digits.length)];
  if (symbols) out += syms[Math.floor(Math.random() * syms.length)];
  while (out.length < length) out += pool[Math.floor(Math.random() * pool.length)];
  // shuffle
  return out.split("").sort(() => Math.random() - 0.5).join("");
}

// ---------- HIBP range API (optional) ----------
async function checkHIBP(pw) {
  // k-anonymity: send only SHA1 prefix (first 5 chars)
  const sha1 = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(pw));
  const hex = Array.from(new Uint8Array(sha1)).map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  const prefix = hex.slice(0, 5);
  const suffix = hex.slice(5);

  try {
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!res.ok) throw new Error("HIBP error");
    const text = await res.text();
    const lines = text.split("\n");
    const match = lines.find(line => line.startsWith(suffix));
    if (!match) return { pwned: false, count: 0 };
    const count = parseInt(match.split(":")[1].trim(), 10);
    return { pwned: true, count };
  } catch (_e) {
    // Fallback: let backend handle breach checks at /api/breach
    return { pwned: null, count: 0 };
  }
}

// ---------- UI wiring ----------
const state = {
  themeDark: false,
};

function applyStrengthUI({ score, label, tips }) {
  const meter = $("#strengthMeter");
  const fill = $("#strengthFill");
  const text = $("#strengthText");
  const tipsEl = $("#tips");

  const perc = (score / 4) * 100;
  fill.style.width = `${perc}%`;
  meter.setAttribute("aria-valuenow", String(score));
  text.textContent = label;

  tipsEl.innerHTML = "";
  tips.slice(0, 3).forEach(t => {
    const li = document.createElement("li");
    li.textContent = t;
    tipsEl.appendChild(li);
  });
}

function setLoading(el, loading) {
  if (loading) {
    el.dataset.oldText = el.textContent;
    el.textContent = "Checking…";
    el.disabled = true;
  } else {
    el.textContent = el.dataset.oldText || "Check Breach";
    el.disabled = false;
  }
}

function toggleTheme() {
  state.themeDark = !state.themeDark;
  document.documentElement.classList.toggle("theme-dark", state.themeDark);
  const btn = $("#themeToggle");
  btn.setAttribute("aria-pressed", state.themeDark ? "true" : "false");
}

function init() {
  const pwInput = $("#password");
  const appInput = $("#appName");
  const checkBtn = $("#checkBtn");
  const suggestBtn = $("#suggestBtn");
  const copyBtn = $("#copyBtn");
  const resetBtn = $("#resetBtn");
  const visibilityBtn = $("#toggleVisibility");
  const userInput = $("#username");
  const saveBtn = $("#savePasswordBtn");


  // live strength
  let debounce;
  pwInput.addEventListener("input", () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => applyStrengthUI(evaluateStrength(pwInput.value)), 90);
  });

  // show/hide password
  visibilityBtn.addEventListener("click", () => {
    const isPw = pwInput.type === "password";
    pwInput.type = isPw ? "text" : "password";
    visibilityBtn.setAttribute("aria-label", isPw ? "Hide password" : "Show password");
    visibilityBtn.title = isPw ? "Hide password" : "Show password";
  });

  // theme toggle
  $("#themeToggle").addEventListener("click", toggleTheme);

  // suggest strong password
  suggestBtn.addEventListener("click", () => {
    const suggestion = generatePassword({ length: 16, symbols: true });
    $("#suggestion").textContent = `Suggested: ${suggestion}`;
    toast("Generated a strong password");
  });

  // copy current or suggested
  copyBtn.addEventListener("click", async () => {
    const text = pwInput.value || ($("#suggestion").textContent.replace(/^Suggested:\s*/, "") || "");
    if (!text) return toast("Nothing to copy");
    await navigator.clipboard.writeText(text);
    toast("Copied to clipboard");
  });

  // reset form
  resetBtn.addEventListener("click", () => {
    applyStrengthUI({ score: 0, label: "—", tips: [] });
    $("#breachResult").textContent = "";
    $("#suggestion").textContent = "";
  });

  // check breach
  checkBtn.addEventListener("click", async () => {
    const pw = pwInput.value;
    if (!pw) return toast("Enter a password first");
    setLoading(checkBtn, true);

    const hibp = await checkHIBP(pw);
    if (hibp.pwned === true) {
      $("#breachResult").innerHTML = `⚠️ Found in <b>${hibp.count.toLocaleString()}</b> breaches (HIBP). Consider changing it.`;
    } else if (hibp.pwned === false) {
      $("#breachResult").textContent = "✅ No matches found in HIBP range dataset.";
    } else {
      // fallback to backend API if front-end HIBP failed or blocked by CORS
      try {
        const app = appInput.value || "unspecified";
        const res = await fetch(`/api/breach?app=${encodeURIComponent(app)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
        const data = await res.json();
        if (data && typeof data.pwnedCount === "number") {
          $("#breachResult").innerHTML = data.pwnedCount > 0
            ? `⚠️ Found in <b>${data.pwnedCount.toLocaleString()}</b> breaches.`
            : "✅ No matches found.";
        } else {
          $("#breachResult").textContent = "ℹ️ Breach check unavailable.";
        }
      } catch {
        $("#breachResult").textContent = "ℹ️ Breach check unavailable.";
      }
    }

    setLoading(checkBtn, false);
  });

  // initial render
  applyStrengthUI({ score: 0, label: "—", tips: [] });

  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      const appName = ($("#appName").value || "").trim();
      const username = ($("#username").value || "").trim();
      const password = ($("#password").value || "").trim();

      if (!appName || !username || !password) {
        return toast("App, username and password are required");
      }

      // Optional: block very weak passwords (score < 2)
      const { score } = evaluateStrength(password);
      if (score < 2) return toast("Password too weak to save (aim Fair+)");

      // simple loading state
      const prev = saveBtn.textContent;
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving…";

      try {
        const res = await fetch("/api/passwords", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appName, username, password })
        });

        // try to read JSON to surface backend messages
        let data = null;
        try { data = await res.json(); } catch { }

        if (!res.ok) {
          const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
          console.error("Save failed:", msg);
          return toast(`Save failed: ${msg}`);
        }

        toast(`✅ Saved for ${data.appName || appName}`);
        // optional clears:
        // $("#password").value = "";
        // $("#appName").value = ""; $("#username").value = "";
      } catch (err) {
        console.error(err);
        toast("Network error while saving");
      } finally {
        saveBtn.textContent = prev;
        saveBtn.disabled = false;
      }
    });
  }


}

document.addEventListener("DOMContentLoaded", init);

document.addEventListener("DOMContentLoaded", () => {
  const login = document.getElementById("loginBtn");
  const signup = document.getElementById("signupBtn");

  const say = (msg) => {
    const t = document.querySelector("#toast") || (() => {
      const d = document.createElement("div");
      d.id = "toast";
      d.className = "toast";
      document.body.appendChild(d);
      return d;
    })();
    t.textContent = msg;
    t.classList.add("toast--show");
    setTimeout(() => t.classList.remove("toast--show"), 1600);
  };

  if (login) login.addEventListener("click", () => say("Log in clicked"));
  if (signup) signup.addEventListener("click", () => say("Sign up clicked"));
});


