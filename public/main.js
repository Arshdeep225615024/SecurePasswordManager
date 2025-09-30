// public/main.js
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
  setTimeout(() => t.classList.remove("toast--show"), 2200);
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
  out += upper[Math.floor(Math.random() * upper.length)];
  out += lower[Math.floor(Math.random() * lower.length)];
  out += digits[Math.floor(Math.random() * digits.length)];
  if (symbols) out += syms[Math.floor(Math.random() * syms.length)];
  while (out.length < length) out += pool[Math.floor(Math.random() * pool.length)];
  return out.split("").sort(() => Math.random() - 0.5).join("");
}

// ---------- HIBP API (frontend fallback) ----------
async function checkHIBP(pw) {
  try {
    const sha1 = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(pw));
    const hex = Array.from(new Uint8Array(sha1)).map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
    const prefix = hex.slice(0, 5);
    const suffix = hex.slice(5);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!res.ok) throw new Error("HIBP error");
    const text = await res.text();
    const lines = text.split("\n");
    const match = lines.find(line => line.startsWith(suffix));
    if (!match) return { pwned: false, count: 0 };
    const count = parseInt(match.split(":")[1].trim(), 10);
    return { pwned: true, count };
  } catch (_e) {
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
  if (!el) return;
  if (loading) {
    el.dataset.oldText = el.textContent;
    el.textContent = text;
    el.disabled = true;
  } else {
    el.textContent = el.dataset.oldText || "Submit";
    el.disabled = false;
  }
}

// ---------- Socket.IO client ----------
let socket = null;
function initSocketForUser() {
  try {
    socket = io(); // served from /socket.io/socket.io.js
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user && user.id) {
      socket.on("connect", () => {
        socket.emit("registerUser", user.id);
      });
    }

    socket.on("breachAlert", (payload) => {
      // payload: { appName, username, pwnedCount, passwordId }
      toast(`⚠️ Breach alert: ${payload.appName} (${payload.username})`);
      // highlight item in vault if present:
      const el = document.querySelector(`#pw-${payload.passwordId}`);
      if (el) {
        el.textContent = payload.pwnedCount > 0 ? `⚠ Breached (${payload.pwnedCount})` : "OK";
        el.classList.add("password-alert");
        setTimeout(() => el.classList.remove("password-alert"), 5000);
      }
    });
  } catch (err) {
    console.warn("Socket init failed:", err);
  }
}

// ---------- Password Vault ----------
async function loadPasswords() {
  const list = $("#passwordList");
  if (!list) return;

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user && user.id;
  if (!userId) {
    list.innerHTML = "<li>Please log in to see saved passwords.</li>";
    return;
  }

  try {
    const res = await fetch(`/api/passwords?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      list.innerHTML = `<li>Error: ${err.error || res.statusText}</li>`;
      return;
    }
    const data = await res.json();
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
          <button class="copyBtn" data-id="${pw.id}" data-password="${pw.password}">📋</button>
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
        if (!span) return;
        if (span.textContent === "••••••••") {
          span.textContent = btn.dataset.password;
          btn.textContent = "🙈";
        } else {
          span.textContent = "••••••••";
          btn.textContent = "👁️";
        }
      });
    });

    // copy handlers
    document.querySelectorAll(".copyBtn").forEach(btn => {
      btn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(btn.dataset.password);
          toast("Password copied to clipboard");
        } catch {
          toast("Copy failed");
        }
      });
    });

    // delete handlers
    document.querySelectorAll(".deleteBtn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        if (!confirm("Delete this password?")) return;
        try {
          const user = JSON.parse(localStorage.getItem("user") || "{}");
          const tokenless = await fetch(`/api/passwords/${id}`, {
            method: "DELETE"
          });
          if (!tokenless.ok) {
            const j = await tokenless.json().catch(()=>({}));
            toast("Delete failed: " + (j.error || tokenless.statusText));
            return;
          }
          toast("Deleted");
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
  const appInput = $("#appName");
  const checkBtn = $("#checkBtn");
  const suggestBtn = $("#suggestBtn");
  const copyBtn = $("#copyBtn");
  const resetBtn = $("#resetBtn");
  const visibilityBtn = $("#toggleVisibility");
  const saveBtn = $("#savePasswordBtn");

  // live strength
  let debounce;
  if (pwInput) {
    pwInput.addEventListener("input", () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => applyStrengthUI(evaluateStrength(pwInput.value)), 90);
    });
  }

  // toggle visibility
  if (visibilityBtn && pwInput) {
    visibilityBtn.addEventListener("click", () => {
      const isPw = pwInput.type === "password";
      pwInput.type = isPw ? "text" : "password";
      visibilityBtn.setAttribute("aria-label", isPw ? "Hide password" : "Show password");
    });
  }

  // theme toggle (if present)
  const themeBtn = $("#themeToggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      document.documentElement.classList.toggle("theme-dark");
    });
  }

  // suggest
  if (suggestBtn) {
    suggestBtn.addEventListener("click", () => {
      const suggestion = generatePassword({ length: 16, symbols: true });
      $("#suggestion").textContent = `Suggested: ${suggestion}`;
      toast("Generated a strong password");
    });
  }

  // copy
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      const text = (pwInput && pwInput.value) || ($("#suggestion").textContent.replace(/^Suggested:\s*/, "") || "");
      if (!text) return toast("Nothing to copy");
      await navigator.clipboard.writeText(text);
      toast("Copied to clipboard");
    });
  }

  // reset
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      applyStrengthUI({ score: 0, label: "—", tips: [] });
      $("#breachResult").textContent = "";
      $("#suggestion").textContent = "";
    });
  }

  // check breach
  if (checkBtn) {
    checkBtn.addEventListener("click", async () => {
      const pw = pwInput && pwInput.value;
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
  }

  // save password (sends userId)
  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      const appName = ($("#appName").value || "").trim();
      const username = ($("#username").value || "").trim();
      const password = ($("#password").value || "").trim();

      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = user && user.id;
      if (!userId) return toast("Please log in first");

      if (!appName || !username || !password) return toast("App, username and password are required");

      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(username)) {
        return toast("Please enter a valid email address");
      }

      const { score } = evaluateStrength(password);
      if (score < 2) return toast("Password too weak to save");

      setLoading(saveBtn, true, "Saving…");

      try {
        const res = await fetch("/api/save-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appName, username, password, userId })
        });

        const data = await res.json().catch(()=>({}));
        if (!res.ok) {
          return toast(`Save failed: ${(data && (data.error || data.message)) || res.statusText}`);
        }
        toast(`✅ Saved for ${data.appName || appName}`);
        loadPasswords();
      } catch (err) {
        console.error(err);
        toast("Network error while saving");
      } finally {
        setLoading(saveBtn, false);
      }
    });
  }

  // navbar update if logged in
  const nav = $(".nav__actions");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (user && user.id && nav) {
    nav.innerHTML = `<span>👤 ${user.fullName || user.email}</span> <button id="logoutBtn" class="btn btn--outline">Logout</button>`;
    $("#logoutBtn").addEventListener("click", () => {
      localStorage.clear();
      location.href = "/login";
    });
  }

  // init socket and load vault
  initSocketForUser();
  loadPasswords();

  // initial strength UI
  applyStrengthUI({ score: 0, label: "—", tips: [] });
}

document.addEventListener("DOMContentLoaded", init);
