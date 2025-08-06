const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    public_id: String,
    url: String,
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title: String,
    owneraddress: String,
    // now array of image objects; still allow strings from old data
    photos: [mongoose.Schema.Types.Mixed],
    description: String,
    perks: [String],
    catagory: [String], // or String if you stayed single-select
    history: String,
    artistdes: String,
    district: String,
    stock: Number,
    price: Number,
  },
  { timestamps: true }
);

// helpful indexes for search/filter (see section C)
productSchema.index({ title: "text", description: "text" });
productSchema.index({ price: 1, catagory: 1, district: 1 });

module.exports = mongoose.model("Product", productSchema);
