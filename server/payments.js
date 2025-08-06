const Razorpay = require("razorpay");
const crypto = require("crypto");

const rzp = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create order in Razorpay
exports.createRazorpayOrder = async function createRazorpayOrder(
  amountInPaise,
  receiptId
) {
  return rzp.orders.create({
    amount: amountInPaise, // paise, so ₹100.00 = 10000
    currency: "INR",
    receipt: receiptId,
    payment_capture: 1,
  });
};

// Verify signature from Razorpay webhook or client
exports.verifySignature = function verifySignature(
  orderId,
  paymentId,
  signature
) {
  const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
  hmac.update(orderId + "|" + paymentId);
  const expectedSignature = hmac.digest("hex");
  return expectedSignature === signature;
};
