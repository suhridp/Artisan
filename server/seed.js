// server/seed.js
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Product = require("./models/Product");

const MONGO_URL = process.env.MONGO_URL;
if (!MONGO_URL) {
  console.error("Missing MONGO_URL in .env");
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(MONGO_URL, { serverSelectionTimeoutMS: 5000 });
    console.log("Connected to MongoDB for seeding");

    // 1) Create (or reuse) a demo user
    const email = "demo@example.com";
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: "Demo User",
        email,
        password: bcrypt.hashSync("secret123", bcrypt.genSaltSync(10)),
      });
      console.log("Created user:", user.email);
    } else {
      console.log("Using existing user:", user.email);
    }

    // 2) Seed a couple of products
    const products = [
      {
        owner: user._id,
        title: "Handwoven Pashmina Scarf",
        owneraddress: "Srinagar, Jammu & Kashmir",
        photos: [], // add uploaded filenames later if you want images
        description: "Luxurious, soft, and crafted by artisans.",
        perks: ["100% Authentic", "Unique Design"],
        catagory: "Textile",
        history: "Traditional craft from Kashmir.",
        artistdes: "Family of weavers across generations.",
        district: "Srinagar",
        stock: 5,
        price: 149.99,
      },
      {
        owner: user._id,
        title: "Paper Mache Vase",
        owneraddress: "Budgam, Jammu & Kashmir",
        photos: [],
        description: "Hand-painted floral patterns.",
        perks: ["Unique Design"],
        catagory: "Decor",
        history: "Paper mache art heritage.",
        artistdes: "Local artisan collective.",
        district: "Budgam",
        stock: 12,
        price: 59.0,
      },
    ];

    await Product.insertMany(products);
    console.log("Seeded products:", products.length);

    await mongoose.disconnect();
    console.log("Done.");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
