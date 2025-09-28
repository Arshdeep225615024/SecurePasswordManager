const crypto = require("crypto");

const algorithm = "aes-256-gcm"; // authenticated encryption
const secretKey = crypto
  .createHash("sha256")
  .update(process.env.ENCRYPTION_SECRET || "default_secret")
  .digest(); // must be 32 bytes

function encryptPassword(password) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);

  let encrypted = cipher.update(password, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  return {
    iv: iv.toString("hex"),
    content: encrypted,
    tag: authTag,
  };
}

function decryptPassword(encryptedObj) {
  const { iv, content, tag } = encryptedObj;

  const decipher = crypto.createDecipheriv(
    algorithm,
    secretKey,
    Buffer.from(iv, "hex")
  );
  decipher.setAuthTag(Buffer.from(tag, "hex"));

  let decrypted = decipher.update(content, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

module.exports = { encryptPassword, decryptPassword };
