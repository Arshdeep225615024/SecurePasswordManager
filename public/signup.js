// Lightweight utilities
const $ = (s) => document.querySelector(s);
const toast = (msg) => {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("toast--show");
  setTimeout(() => t.classList.remove("toast--show"), 1600);
};

// Simple strength evaluator (same scale as main page)
function evaluateStrength(pw) {
  if (!pw) return { score: 0, label: "—", tips: ["Enter a password to begin."] };
  const len = pw.length, lower = /[a-z]/.test(pw), upper = /[A-Z]/.test(pw),
        digit = /\d/.test(pw), sym = /[^A-Za-z0-9]/.test(pw),
        common = /(password|qwerty|12345|letmein|welcome|admin)/i.test(pw),
        repeat = /(.)\1{2,}/.test(pw);
  let score = 0;
  if (len >= 8) score++;
  if (len >= 12) score++;
  if (lower && upper) score++;
  if (digit) score++;
  if (sym) score++;
  if (common) score -= 2;
  if (repeat) score -= 1;
  score = Math.max(0, Math.min(4, score));
  const labels = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
  const tips = [];
  if (len < 12) tips.push("Use 12+ characters.");
  if (!upper || !lower) tips.push("Mix upper & lower case.");
  if (!digit) tips.push("Add a number.");
  if (!sym) tips.push("Add a symbol.");
  if (common) tips.push("Avoid common words.");
  if (repeat) tips.push("Avoid repeated characters.");
  return { score, label: labels[score], tips };
}

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

document.addEventListener("DOMContentLoaded", () => {
  const form = $("#signupForm");
  const fullName = $("#fullName");
  const email = $("#email");
  const pw = $("#password");
  const confirmPw = $("#confirmPassword");
  const terms = $("#terms");
  const submit = $("#signupSubmit");

  // live strength
  let debounce;
  pw.addEventListener("input", () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => applyStrengthUI(evaluateStrength(pw.value)), 90);
    validate();
  });

  confirmPw.addEventListener("input", validate);
  fullName.addEventListener("input", validate);
  email.addEventListener("input", validate);
  terms.addEventListener("change", validate);

  // visibility toggles
  $("#togglePw").addEventListener("click", () => {
    pw.type = pw.type === "password" ? "text" : "password";
  });
  $("#toggleConfirm").addEventListener("click", () => {
    confirmPw.type = confirmPw.type === "password" ? "text" : "password";
  });

  function validate() {
  const errorEl = $("#signupError");
  errorEl.style.display = "none";
  errorEl.textContent = "";

  const nameOK = fullName.value.trim().length >= 2;
  const emailOK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value);
  const matchOK = pw.value && confirmPw.value && pw.value === confirmPw.value;
  const strength = evaluateStrength(pw.value);
  const strongEnough = strength.score >= 2; // Fair or above
  const termsOK = terms.checked;

  let errorMsg = "";

  if (!nameOK) errorMsg = "Please enter your full name.";
  else if (!emailOK) errorMsg = "Please enter a valid email address.";
  else if (!pw.value) errorMsg = "Password cannot be blank.";
  else if (!strongEnough) errorMsg = "Password is too weak. Make it longer or add numbers/symbols.";
  else if (!matchOK) errorMsg = "Passwords do not match.";
  else if (!termsOK) errorMsg = "You must agree to the terms before continuing.";

  if (errorMsg) {
    errorEl.textContent = errorMsg;
    errorEl.style.display = "block";
  }

  submit.disabled = Boolean(errorMsg);
  return !errorMsg;
}


  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validate()) return toast("Please complete the form correctly.");
    // Stubbed “create user” — replace with a real POST later
    // Example when you’re ready:
    // await fetch("/api/signup", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ fullName: fullName.value, email: email.value, password: pw.value }) });
    toast("Account created (stub). You can now log in.");
    form.reset();
    applyStrengthUI({ score: 0, label: "—", tips: [] });
  });

  // initial render
  applyStrengthUI({ score: 0, label: "—", tips: [] });
});
