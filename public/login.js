// Toast function
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.className = "toast show";
  setTimeout(() => toast.className = "toast", 3000);
}

// Toggle password visibility
const toggleLoginPassword = document.getElementById("toggleLoginPassword");
if (toggleLoginPassword) {
  toggleLoginPassword.addEventListener("click", () => {
    const pw = document.getElementById("loginPassword");
    pw.type = pw.type === "password" ? "text" : "password";
  });
}

// Example: show toast on login error
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    // You’ll replace this with actual auth later
    const email = document.getElementById("loginEmail").value;
    const pw = document.getElementById("loginPassword").value;
    if (!email || !pw) {
      showToast("Please fill in all fields.");
    } else {
      showToast("Logging in… (demo mode)");
      // Call backend API here
    }
  });
}
