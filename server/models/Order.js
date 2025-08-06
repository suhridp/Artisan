// server/api/models/Order.js
const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  title: String,
  price: Number, // snapshot price
  qty: { type: Number, default: 1 },
  subtotal: Number,
  photo: String, // first image for convenience
});

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },

    // cart snapshot
    items: [orderItemSchema],
    amount: Number, // total INR amount in rupees (not paise)
    currency: { type: String, default: "INR" },

    // shipping/contact
    home_address: { type: String, required: true },
    contact_no: { type: String, required: true },

    // payment state
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "cancelled"],
      default: "pending",
    },
    provider: { type: String, enum: ["razorpay"], default: "razorpay" },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,

    // misc
    notes: Object,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
