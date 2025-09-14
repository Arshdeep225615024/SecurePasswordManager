const passwordInput = document.getElementById("password");
const strengthText = document.getElementById("strengthText");
const strengthMeter = document.getElementById("strengthMeter");
const checkBtn = document.getElementById("checkBtn");
const breachResult = document.getElementById("breachResult");

console.log("main.js working")

// Password Strength Checker (basic regex + entropy)
passwordInput.addEventListener("input", () => {
  const pwd = passwordInput.value;
  let score = 0;

  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  let strength = "Weak";
  let width = "25%";
  let color = "red";

  if (score === 2) {
    strength = "Medium";
    width = "50%";
    color = "orange";
  } else if (score === 3) {
    strength = "Strong";
    width = "75%";
    color = "blue";
  } else if (score === 4) {
    strength = "Very Strong";
    width = "100%";
    color = "green";
  }

  strengthText.textContent = strength;

  // dynamically update strength bar
  strengthMeter.innerHTML = `<div style="height:100%; width:${width}; background:${color}; border-radius:6px;"></div>`;
});

// Breach Check (calls backend API)
checkBtn.addEventListener("click", async () => {
  const pwd = passwordInput.value;
  if (!pwd) {
    breachResult.textContent = "⚠️ Please enter a password.";
    return;
  }

  try {
    const res = await fetch("/api/check-breach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd }),
      });
    const data = await res.json();

    if (data.breached) {
      breachResult.textContent = `❌ Oh no! This password was found in ${data.count} breaches.`;
      breachResult.style.color = "red";
    } else {
      breachResult.textContent = "✅ Good news! This password was not found in any breaches.";
      breachResult.style.color = "green";
    }
  } catch (err) {
    breachResult.textContent = "⚠️ Error checking password breach.";
    breachResult.style.color = "orange";
  }
});

// Strong password generator
function generateStrongPassword(length = 12) {
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+{}[]<>?";
  
    const allChars = upper + lower + numbers + symbols;
  
    let password = "";
    password += upper[Math.floor(Math.random() * upper.length)];
    password += lower[Math.floor(Math.random() * lower.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
  
    // fill remaining chars
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
  
    // shuffle to avoid predictable order
    password = password.split("").sort(() => 0.5 - Math.random()).join("");
    return password;
  }
  
  const suggestBtn = document.getElementById("suggestBtn");
  const suggestionDiv = document.getElementById("suggestion");
  
  suggestBtn.addEventListener("click", () => {
    const strongPwd = generateStrongPassword(14);
    suggestionDiv.textContent = `🔑 Suggested password: ${strongPwd}`;
    suggestionDiv.style.color = "blue";
  });
  