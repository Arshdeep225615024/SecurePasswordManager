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

// ---------- Strength Evaluation ----------
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

// ---------- Strength meter UI ----------
function applyStrengthUI({ score, label, tips }) {
  const meter = document.querySelector("#strengthMeter");
  const fill  = document.querySelector("#strengthFill");
  const text  = document.querySelector("#strengthText");
  const tipsEl = document.querySelector("#tips");

  if (!meter || !fill || !text || !tipsEl) return; // fail-safe if HTML not present

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

// ---------- Password generator (used by Suggest Strong Password) ----------
function generatePassword({ length = 16, symbols = true } = {}) {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const syms   = "!@#$%^&*()-_=+[]{};:,.?";
  const pool = upper + lower + digits + (symbols ? syms : "");
  let out = "";
  // ensure complexity
  out += upper[Math.floor(Math.random() * upper.length)];
  out += lower[Math.floor(Math.random() * lower.length)];
  out += digits[Math.floor(Math.random() * digits.length)];
  if (symbols) out += syms[Math.floor(Math.random() * syms.length)];
  while (out.length < length) out += pool[Math.floor(Math.random() * pool.length)];
  return out.split("").sort(() => Math.random() - 0.5).join("");
}


// ---------- Refresh Vault ----------
async function refreshVault() {
  const tbody = document.querySelector("#vaultBody");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="4">Loading your saved passwords...</td></tr>`;

  try {
    const res = await fetch("/api/passwords");
    if (!res.ok) throw new Error("GET /api/passwords failed");
    const items = await res.json();

    if (!Array.isArray(items) || items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4">No saved passwords.</td></tr>`;
      return;
    }

    tbody.innerHTML = items.map(p => {
      const pid = p._id || p.id;            // <-- handle both shapes
      const masked = "•".repeat(10);
      return `
        <tr data-row-id="${pid}">
          <td>${p.appName ?? ""}</td>
          <td>${p.username ?? ""}</td>
          <td>${masked}</td>
          <td>
            <button class="show-btn" data-password="${p.password ?? ""}">Show</button>
            <button class="delete-btn" data-id="${pid}">Delete</button>
          </td>
        </tr>
      `;
    }).join("");

    // Event delegation (one listener handles all buttons)
    tbody.onclick = async (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;

      // Show
      if (btn.classList.contains("show-btn")) {
        alert(`Password: ${btn.dataset.password || "(empty)"}`);
        return;
      }

      // Delete
      if (btn.classList.contains("delete-btn")) {
        const id = btn.dataset.id;
        if (!id) { toast("Missing id"); return; }

        try {
          const del = await fetch(`/api/passwords/${encodeURIComponent(id)}`, { method: "DELETE" });
          if (!del.ok) throw new Error(`DELETE failed ${del.status}`);
          toast("Deleted");
          // remove row optimistically (or call refreshVault())
          const row = btn.closest("tr");
          if (row) row.remove();
          if (!tbody.children.length) refreshVault(); // repopulate message if last row
        } catch (err) {
          console.error(err);
          toast("Delete failed");
        }
      }
    };

  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="4">Failed to load passwords.</td></tr>`;
  }
}


// ---------- Init ----------
function init() {
  const pwInput   = $("#password");
  const appInput  = $("#appName");
  const checkBtn  = $("#checkBtn");
  const suggestBtn= $("#suggestBtn");
  const copyBtn   = $("#copyBtn");
  const resetBtn  = $("#resetBtn");
  const userInput = $("#username");
  const saveBtn   = $("#saveBtn");

  // 1) load existing passwords (this attaches its own Show/Delete handlers)
  refreshVault();

  // 2) live strength on typing
  if (pwInput) {
    let debounce;
    pwInput.addEventListener("input", () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        applyStrengthUI(evaluateStrength(pwInput.value));
      }, 90);
    });
    // initial render
    applyStrengthUI(evaluateStrength(pwInput.value || ""));
  }

  // 3) suggest strong password
  if (suggestBtn) {
    suggestBtn.addEventListener("click", () => {
      const suggestion = generatePassword({ length: 16, symbols: true });
      const slot = document.querySelector("#suggestion");
      if (slot) slot.textContent = `Suggested: ${suggestion}`;
      toast("Generated a strong password");
    });
  }

  // 4) copy current or suggested
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      const suggested = (document.querySelector("#suggestion")?.textContent || "")
        .replace(/^Suggested:\s*/, "");
      const text = pwInput?.value || suggested;
      if (!text) return toast("Nothing to copy");
      await navigator.clipboard.writeText(text);
      toast("Copied to clipboard");
    });
  }

  // 5) reset UI
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      applyStrengthUI({ score: 0, label: "—", tips: [] });
      const br = document.querySelector("#breachResult");
      const sg = document.querySelector("#suggestion");
      if (br) br.textContent = "";
      if (sg) sg.textContent = "";
      if (pwInput) pwInput.value = "";
    });
  }

  // 6) save password (only change related to the Save feature)
  if (!saveBtn) {
    console.warn("Save button not found in DOM!");
    return;
  }

  // attach event listener only if button exists
  saveBtn.addEventListener("click", async () => {
    console.log("Save button clicked ✅"); // temporary debug log
    const appName = document.querySelector("#appName")?.value.trim();
    const username = document.querySelector("#username")?.value.trim();
    const password = document.querySelector("#password")?.value.trim();

    if (!appName || !username || !password) {
      toast("All fields are required");
      return;
    }

    const { score } = evaluateStrength(password);
    if (score < 2) {
      toast("Password too weak to save");
      return;
    }

    // Loading state
    const prev = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving…";

    try {
      const res = await fetch("/api/passwords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appName, username, password })
      });

      if (!res.ok) throw new Error(`Save failed: ${res.status}`);

      toast("Password saved successfully!");
      refreshVault();
    } catch (err) {
      console.error("Save error:", err);
      toast("Save failed — check backend console.");
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = prev;
    }
  });
}


// IMPORTANT: close init() before this line
document.addEventListener("DOMContentLoaded", init);
