// ---------- Utilities ----------
const $ = (sel) => document.querySelector(sel);

const toast = (msg) => {
  const t = $("#toast") || (() => {
    const d = document.createElement("div");
    d.id = "toast";
    d.className = "toast";
    document.body.appendChild(d);
    return d;
  })();
  t.textContent = msg;
  t.classList.add("toast--show");
  setTimeout(() => t.classList.remove("toast--show"), 1800);
};

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

// ---------- Strength evaluation ----------
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
  if (commonPatterns) tips.push("Avoid common words.");
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
  out += upper[Math.floor(Math.random() * upper.length)];
  out += lower[Math.floor(Math.random() * lower.length)];
  out += digits[Math.floor(Math.random() * digits.length)];
  if (symbols) out += syms[Math.floor(Math.random() * syms.length)];
  while (out.length < length) out += pool[Math.floor(Math.random() * pool.length)];
  return out.split("").sort(() => Math.random() - 0.5).join("");
}

// ---------- HIBP API ----------
async function checkHIBP(pw) {
  const sha1 = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(pw));
  const hex = Array.from(new Uint8Array(sha1)).map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  const prefix = hex.slice(0, 5);
  const suffix = hex.slice(5);

  try {
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!res.ok) throw new Error("HIBP error");
    const text = await res.text();
    const match = text.split("\n").find(line => line.startsWith(suffix));
    if (!match) return { pwned: false, count: 0 };
    const count = parseInt(match.split(":")[1].trim(), 10);
    return { pwned: true, count };
  } catch {
    return { pwned: null, count: 0 };
  }
}

// ---------- UI ----------
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

function setLoading(el, loading, text = "Checking…") {
  if (loading) {
    el.dataset.oldText = el.textContent;
    el.textContent = text;
    el.disabled = true;
  } else {
    el.textContent = el.dataset.oldText || "Submit";
    el.disabled = false;
  }
}

// ---------- Password Vault ----------
async function loadPasswords() {
  const list = $("#passwordList");
  if (!list) return;

  const token = localStorage.getItem("token");
  if (!token) {
    list.innerHTML = "<li>Please log in to see saved passwords.</li>";
    return;
  }

  try {
    const res = await fetch("/api/passwords", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Failed to load");

    if (!data.length) {
      list.innerHTML = "<li>No passwords saved yet.</li>";
      return;
    }

    list.innerHTML = "";
    data.forEach(pw => {
      const li = document.createElement("li");
      li.innerHTML = `
        <div>
          <strong>${pw.appName}</strong>
          <small>${pw.username}</small><br>
          <span class="password-hidden" id="pw-${pw.id}">••••••••</span>
        </div>
        <div class="vault-actions">
          <button class="showBtn" data-id="${pw.id}" data-password="${pw.password}">👁️</button>
          <button class="deleteBtn" data-id="${pw.id}">❌</button>
        </div>
      `;
      list.appendChild(li);
    });

    // show/hide handlers
    document.querySelectorAll(".showBtn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const span = $(`#pw-${id}`);
        if (span.textContent === "••••••••") {
          span.textContent = btn.dataset.password;
          btn.textContent = "🙈";
        } else {
          span.textContent = "••••••••";
          btn.textContent = "👁️";
        }
      });
    });

    // delete handlers
    document.querySelectorAll(".deleteBtn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        if (!confirm("Delete this password?")) return;

        try {
          const del = await fetch(`/api/passwords/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (!del.ok) {
            const err = await del.json();
            return toast("Delete failed: " + (err.error || del.statusText));
          }
          toast("Deleted successfully");
          loadPasswords();
        } catch {
          toast("Network error while deleting");
        }
      });
    });
  } catch (err) {
    console.error("Error loading passwords:", err);
    list.innerHTML = "<li>Error loading passwords.</li>";
  }
}

// ---------- Init ----------
function init() {
  const pwInput = $("#password");
  const checkBtn = $("#checkBtn");
  const suggestBtn = $("#suggestBtn");
  const copyBtn = $("#copyBtn");
  const resetBtn = $("#resetBtn");
  const visibilityBtn = $("#toggleVisibility");
  const saveBtn = $("#savePasswordBtn");

  // live strength
  let debounce;
  pwInput.addEventListener("input", () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => applyStrengthUI(evaluateStrength(pwInput.value)), 90);
  });

  // toggle visibility
  visibilityBtn.addEventListener("click", () => {
    const isPw = pwInput.type === "password";
    pwInput.type = isPw ? "text" : "password";
    visibilityBtn.setAttribute("aria-label", isPw ? "Hide password" : "Show password");
  });

  // suggest password
  suggestBtn.addEventListener("click", () => {
    const suggestion = generatePassword({ length: 16, symbols: true });
    $("#suggestion").textContent = `Suggested: ${suggestion}`;
    toast("Generated a strong password");
  });

  // copy password
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

  // breach check
  checkBtn.addEventListener("click", async () => {
    const pw = pwInput.value;
    if (!pw) return toast("Enter a password first");
    setLoading(checkBtn, true, "Checking…");

    const hibp = await checkHIBP(pw);
    if (hibp.pwned === true) {
      $("#breachResult").innerHTML = `⚠️ Found in <b>${hibp.count.toLocaleString()}</b> breaches.`;
    } else if (hibp.pwned === false) {
      $("#breachResult").textContent = "✅ No matches found in HIBP.";
    } else {
      $("#breachResult").textContent = "ℹ️ Breach check unavailable.";
    }

    setLoading(checkBtn, false);
  });

  // save password
  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      const appName = ($("#appName").value || "").trim();
      const username = ($("#username").value || "").trim();
      const password = ($("#password").value || "").trim();
      const token = localStorage.getItem("token");

      if (!token) return toast("Please log in first");
      if (!appName || !username || !password) return toast("App, username and password are required");

      const { score } = evaluateStrength(password);
      if (score < 2) return toast("Password too weak to save");

      setLoading(saveBtn, true, "Saving…");

      try {
        const res = await fetch("/api/save-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ appName, username, password })
        });
        const data = await res.json();

        if (!res.ok) return toast(`Save failed: ${data.error || res.statusText}`);
        toast(`✅ Saved for ${data.appName || appName}`);
        loadPasswords(); // refresh vault
      } catch {
        toast("Network error while saving");
      } finally {
        setLoading(saveBtn, false);
      }
    });
  }

  // navbar update if logged in
  const nav = $(".nav__actions");
  const token = localStorage.getItem("token");
  if (token && nav) {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    nav.innerHTML = `<span>👤 ${user.fullName || user.email}</span> <button id="logoutBtn" class="btn btn--outline">Logout</button>`;
    $("#logoutBtn").addEventListener("click", () => {
      localStorage.clear();
      location.href = "/login";
    });
  }

  // initial render
  applyStrengthUI({ score: 0, label: "—", tips: [] });
  loadPasswords(); // load vault on start
}

document.addEventListener("DOMContentLoaded", init);
