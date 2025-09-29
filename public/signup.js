const $ = (s)=>document.querySelector(s);
const toast=(msg)=>{const t=$("#toast");t.textContent=msg;t.classList.add("toast--show");setTimeout(()=>t.classList.remove("toast--show"),2000);};

document.addEventListener("DOMContentLoaded", () => {
  const form=$("#signupForm"), fullName=$("#fullName"), email=$("#email"), pw=$("#password"), confirmPw=$("#confirmPassword"), terms=$("#terms"), submit=$("#signupSubmit"), errorEl=$("#signupError");

  function validate(){
    let ok = fullName.value.trim().length>=2 && /^[^@]+@[^@]+\.[^@]+$/.test(email.value) && pw.value===confirmPw.value && terms.checked;
    submit.disabled=!ok; return ok;
  }

  form.addEventListener("input", validate);

  form.addEventListener("submit", async (e)=>{
    e.preventDefault(); if(!validate()) return;
    try {
      const res=await fetch("/api/signup",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fullName:fullName.value,email:email.value,password:pw.value})});
      const data=await res.json();
      if(res.ok){
        localStorage.setItem("token",data.token);
        localStorage.setItem("user",JSON.stringify(data.user));
        toast("Signup successful ✅"); setTimeout(()=>window.location.href="/",1200);
      } else { errorEl.textContent=data.error||"Signup failed"; errorEl.style.display="block"; }
    } catch { errorEl.textContent="Network error"; errorEl.style.display="block"; }
  });
});
