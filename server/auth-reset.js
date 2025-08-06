const crypto = require("crypto");
const mongoose = require("mongoose");
const { Resend } = require("resend");
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// A tiny collection to store reset tokens
const resetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  token: { type: String, required: true, unique: true, index: true },
  expiresAt: { type: Date, required: true, index: true },
});
const PasswordReset = mongoose.model("PasswordReset", resetSchema);

exports.requestReset = async function requestReset(user, clientBase) {
  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 min
  await PasswordReset.create({ userId: user._id, token, expiresAt });

  const resetUrl = `${clientBase}/reset-password?token=${token}`;
  const subject = "Reset your password";
  const html = `<p>Hello ${user.name || ""},</p>
  <p>Click the link below to reset your password. This link expires in 30 minutes.</p>
  <p><a href="${resetUrl}" target="_blank">${resetUrl}</a></p>`;

  if (resend) {
    await resend.emails.send({
      from: process.env.FROM_EMAIL || "no-reply@yourdomain.com",
      to: user.email,
      subject,
      html,
    });
  }
  // else: add your SMTP logic here
  return true;
};

exports.consumeReset = async function consumeReset(token) {
  const rec = await PasswordReset.findOne({ token });
  if (!rec) throw new Error("Invalid reset token");
  if (rec.expiresAt.getTime() < Date.now()) {
    await rec.deleteOne();
    throw new Error("Expired reset token");
  }
  return rec;
};
