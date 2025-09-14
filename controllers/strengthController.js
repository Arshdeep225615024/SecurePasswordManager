const checkStrength = (req, res) => {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: "Password is required" });
  
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
  
    let strength = "Weak";
    if (score === 2) strength = "Medium";
    else if (score === 3) strength = "Strong";
    else if (score === 4) strength = "Very Strong";
  
    res.json({ strength, score });
  };
  
  module.exports = { checkStrength };