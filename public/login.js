// Lightweight utilities
const $ = (s) => document.querySelector(s);
const toast = (msg) => {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("toast--show");
  setTimeout(() => t.classList.remove("toast--show"), 2000);
};

document.addEventListener("DOMContentLoaded", () => {
  const form = $("#loginForm");
  const email = $("#email");
  const password = $("#password");
  const submit = $("#loginSubmit");
  const errorEl = $("#loginError");

  // Password visibility toggle
  $("#togglePw").addEventListener("click", () => {
    password.type = password.type === "password" ? "text" : "password";
  });

  // Form validation
  function validate() {
    errorEl.style.display = "none";
    errorEl.textContent = "";

    const emailOK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value);
    const passwordOK = password.value.trim().length >= 1;

    let errorMsg = "";

    if (!emailOK) errorMsg = "Please enter a valid email address.";
    else if (!passwordOK) errorMsg = "Please enter your password.";

    if (errorMsg) {
      errorEl.textContent = errorMsg;
      errorEl.style.display = "block";
    }

    submit.disabled = Boolean(errorMsg);
    return !errorMsg;
  }

  // Live validation
  email.addEventListener("input", validate);
  password.addEventListener("input", validate);

  // Set loading state
  function setLoading(isLoading) {
    submit.disabled = isLoading;
    submit.textContent = isLoading ? "Logging in..." : "Log in";
  }

  // Form submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email.value.trim(),
          password: password.value
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Login successful
        toast(`Welcome back, ${data.user.fullName}!`);
        
        // Store user info in localStorage (you can replace this with proper session management later)
        localStorage.setItem("user", JSON.stringify(data.user));
        
        // Redirect to main app or dashboard
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
        
      } else {
        // Login failed
        errorEl.textContent = data.error || "Login failed. Please try again.";
        errorEl.style.display = "block";
      }

    } catch (error) {
      console.error("Login error:", error);
      errorEl.textContent = "Network error. Please check your connection and try again.";
      errorEl.style.display = "block";
    } finally {
      setLoading(false);
    }
  });

  // Initial validation
  validate();
});