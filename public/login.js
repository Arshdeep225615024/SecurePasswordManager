const $ = (s) => document.querySelector(s);
const toast = (msg) => { const t=$("#toast"); t.textContent=msg; t.classList.add("toast--show"); setTimeout(()=>t.classList.remove("toast--show"),2000); };

document.addEventListener("DOMContentLoaded", () => {
  const form = $("#loginForm");
  const email = $("#email");
  const password = $("#password");
  const errorEl = $("#loginError");

  $("#togglePw").addEventListener("click", () => {
    password.type = password.type === "password" ? "text" : "password";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.value.trim(), password: password.value })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        toast(`Welcome, ${data.user.fullName}!`);
        setTimeout(()=>window.location.href="/",1200);
      } else {
        errorEl.textContent = data.error || "Login failed"; errorEl.style.display="block";
      }
    } catch {
      errorEl.textContent = "Network error"; errorEl.style.display="block";
    }
  });
});
