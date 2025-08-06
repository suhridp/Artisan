// server/server.js
// ----------------- Load env FIRST -----------------
require("dotenv").config();

// ----------------- Core deps -----------------
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const rateLimit = require("express-rate-limit");

// ----------------- App & Config -----------------
const app = express();
const IS_PROD = process.env.NODE_ENV === "production";
const PORT = Number(process.env.PORT || 4000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const JWT_SECRET = process.env.JWT_SECRET || "change-this-in-prod";
const MONGO_URL = process.env.MONGO_URL || process.env.MONGODB_URI;

if (!MONGO_URL) {
  console.error("❌ Missing MONGO_URL (or MONGODB_URI) in .env");
  process.exit(1);
}

// ----------------- Models -----------------
const User = require("./models/User.js");
const Product = require("./models/Product.js");
const Order = require("./models/Order.js"); // must support cart fields (see checklist)

// ----------------- Trust proxy (for HTTPS cookies behind LB) -----------------
app.set("trust proxy", 1);

// ----------------- Global Middlewares (order matters) -----------------
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "img-src": ["'self'", "data:", "https:", "blob:"],
        "script-src": [
          "'self'",
          "'unsafe-inline'",
          "https://checkout.razorpay.com",
        ],
        "frame-src": [
          "'self'",
          "https://api.razorpay.com",
          "https://*.razorpay.com",
        ],
      },
    },
  })
);
app.use(compression());
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // server-to-server/CLI
      const allow = new Set([
        CLIENT_ORIGIN,
        // add prod domains:
        "https://www.yourdomain.com",
      ]);
      return allow.has(origin)
        ? cb(null, true)
        : cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(morgan(IS_PROD ? "combined" : "dev"));
app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());

// ----------------- Rate limits -----------------
app.use("/login", rateLimit({ windowMs: 15 * 60 * 1000, max: 30 }));
app.use("/register", rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));
app.use("/orders", rateLimit({ windowMs: 60 * 1000, max: 60 }));
app.use("/checkout", rateLimit({ windowMs: 60 * 1000, max: 30 }));

// ----------------- Auth Helpers -----------------
const bcryptSalt = bcrypt.genSaltSync(10);

function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  jwt.verify(token, JWT_SECRET, {}, (err, userData) => {
    if (err) return res.status(401).json({ error: "Invalid token" });
    req.user = userData; // { id, email }
    next();
  });
}

async function requireAdmin(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  jwt.verify(token, JWT_SECRET, {}, async (err, userData) => {
    if (err) return res.status(401).json({ error: "Invalid token" });
    const user = await User.findById(userData.id).lean();
    if (!user || user.role !== "admin")
      return res.status(403).json({ error: "Forbidden" });
    req.user = { id: String(user._id), role: user.role, email: user.email };
    next();
  });
}

// ----------------- Cloudinary -----------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || undefined,
  api_key: process.env.CLOUDINARY_API_KEY || undefined,
  api_secret: process.env.CLOUDINARY_API_SECRET || undefined,
});
const upload = multer({ storage: multer.memoryStorage() });

function uploadBufferToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (err, result) => {
        if (err) return reject(err);
        resolve({ public_id: result.public_id, url: result.secure_url });
      }
    );
    stream.end(buffer);
  });
}

// ----------------- Razorpay -----------------
const razor = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

// ----------------- Health -----------------
app.get("/health", async (_req, res) => {
  const db = mongoose.connection.readyState === 1 ? "up" : "down";
  res.json({ ok: true, db, time: new Date().toISOString() });
});

// ----------------- Auth Routes -----------------
app.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return res
        .status(400)
        .json({ error: "Provide name, email, and password" });
    }
    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing)
      return res.status(409).json({ error: "Email already registered" });

    const userDoc = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: bcrypt.hashSync(password, bcryptSalt),
    });
    res.json(userDoc);
  } catch (e) {
    next(e);
  }
});

app.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({ error: "Provide email and password" });
    }
    const userDoc = await User.findOne({ email: email.trim().toLowerCase() });
    if (!userDoc) return res.status(404).json({ error: "User not found" });

    const passOk = bcrypt.compareSync(password, userDoc.password);
    if (!passOk) return res.status(422).json({ error: "Incorrect password" });

    jwt.sign(
      { email: userDoc.email, id: userDoc._id },
      JWT_SECRET,
      { expiresIn: "7d" },
      (err, token) => {
        if (err) return next(err);
        res
          .cookie("token", token, {
            httpOnly: true,
            sameSite: IS_PROD ? "None" : "Lax",
            secure: IS_PROD,
            path: "/",
            maxAge: 1000 * 60 * 60 * 24 * 7,
          })
          .json(userDoc);
      }
    );
  } catch (e) {
    next(e);
  }
});

app.get("/profile", async (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.json(null);
  jwt.verify(token, JWT_SECRET, {}, async (err, userData) => {
    if (err) return res.status(401).json({ error: "Invalid token" });
    const { name, email, _id, role } = await User.findById(userData.id).lean();
    res.json({ name, email, _id, role });
  });
});

app.post("/logout", (_req, res) => {
  res
    .cookie("token", "", {
      httpOnly: true,
      sameSite: IS_PROD ? "None" : "Lax",
      secure: IS_PROD,
      expires: new Date(0),
    })
    .json(true);
});

// ----------------- Uploads (Cloudinary) -----------------
app.post("/upload-by-link", requireAuth, async (req, res, next) => {
  try {
    const { link } = req.body || {};
    if (!link) return res.status(400).json({ error: "link is required" });
    const result = await cloudinary.uploader.upload(link, {
      folder: process.env.CLOUDINARY_FOLDER || "artisan/products",
    });
    res.json([{ public_id: result.public_id, url: result.secure_url }]);
  } catch (e) {
    next(e);
  }
});

app.post(
  "/upload",
  requireAuth,
  upload.array("photos", 12),
  async (req, res, next) => {
    try {
      const folder = process.env.CLOUDINARY_FOLDER || "artisan/products";
      const uploads = [];
      for (const file of req.files) {
        const img = await uploadBufferToCloudinary(file.buffer, folder);
        uploads.push(img);
      }
      res.json(uploads);
    } catch (e) {
      next(e);
    }
  }
);

// ----------------- Products -----------------
app.post("/products", requireAuth, async (req, res, next) => {
  try {
    const {
      title,
      owneraddress,
      addedPhotos,
      description,
      perks,
      catagory,
      stock,
      price,
      district,
      artistdes,
      history,
    } = req.body || {};

    if (!title?.trim() || !owneraddress?.trim())
      return res.status(400).json({ error: "Title and address are required" });
    if (Number(price) < 0 || Number(stock) < 0)
      return res.status(400).json({ error: "Price/stock must be >= 0" });

    const productDoc = await Product.create({
      owner: req.user.id,
      title: title.trim(),
      owneraddress: owneraddress.trim(),
      photos: addedPhotos || [],
      description: (description || "").trim(),
      perks: Array.isArray(perks) ? perks : [],
      catagory,
      stock: Number(stock) || 0,
      price: Number(price) || 0,
      district: (district || "").trim(),
      artistdes: (artistdes || "").trim(),
      history: (history || "").trim(),
    });
    res.json(productDoc);
  } catch (e) {
    next(e);
  }
});

app.put("/products", requireAuth, async (req, res, next) => {
  try {
    const {
      id,
      title,
      owneraddress,
      addedPhotos,
      description,
      perks,
      catagory,
      stock,
      price,
      district,
      artistdes,
      history,
    } = req.body || {};
    const doc = await Product.findById(id);
    if (!doc) return res.status(404).json({ error: "Product not found" });
    if (String(doc.owner) !== String(req.user.id))
      return res.status(403).json({ error: "Forbidden" });

    doc.set({
      title: (title || "").trim(),
      owneraddress: (owneraddress || "").trim(),
      photos: addedPhotos || [],
      description: (description || "").trim(),
      perks: Array.isArray(perks) ? perks : [],
      catagory,
      stock: Number(stock) || 0,
      price: Number(price) || 0,
      district: (district || "").trim(),
      artistdes: (artistdes || "").trim(),
      history: (history || "").trim(),
    });
    await doc.save();
    res.json("ok");
  } catch (e) {
    next(e);
  }
});

app.get("/products", async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 24, 1), 60);

    const { q, catagory, district, price_min, price_max, sort } = req.query;
    const filter = {};

    if (q) filter.$text = { $search: q };
    if (catagory) {
      const cats = Array.isArray(catagory) ? catagory : [catagory];
      filter.catagory = { $in: cats };
    }
    if (district) filter.district = new RegExp(`^${district}$`, "i");

    if (price_min || price_max) {
      filter.price = {};
      if (price_min) filter.price.$gte = Number(price_min);
      if (price_max) filter.price.$lte = Number(price_max);
    }

    let sortSpec = { _id: -1 };
    if (sort === "price_asc") sortSpec = { price: 1, _id: -1 };
    if (sort === "price_desc") sortSpec = { price: -1, _id: -1 };
    if (sort === "newest") sortSpec = { _id: -1 };

    const total = await Product.countDocuments(filter);
    const items = await Product.find(filter)
      .sort(sortSpec)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({ items, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (e) {
    next(e);
  }
});

app.get("/products/:id", async (req, res, next) => {
  try {
    const doc = await Product.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (e) {
    next(e);
  }
});

app.get("/user-products", requireAuth, async (req, res, next) => {
  try {
    const items = await Product.find({ owner: req.user.id }).sort({ _id: -1 });
    res.json(items);
  } catch (e) {
    next(e);
  }
});

// ----------------- Legacy simple search (optional) -----------------
app.get("/search", async (req, res, next) => {
  try {
    const { title, catagory } = req.query || {};
    const query = {};
    if (title) query.title = title;
    if (catagory) query.catagory = catagory;
    const p1 = await Product.find(query).sort({ _id: -1 });
    res.status(200).json({ p1 });
  } catch (e) {
    next(e);
  }
});

// ----------------- Cart helpers -----------------
async function buildOrderFromCartItems(items = []) {
  const productIds = items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds } }).lean();

  const productMap = new Map(products.map((p) => [String(p._id), p]));
  const orderItems = [];
  let total = 0;

  for (const it of items) {
    const p = productMap.get(String(it.productId));
    if (!p) throw new Error("Product not found");
    const qty = Math.max(Number(it.qty) || 0, 0);
    if (qty <= 0) throw new Error("Invalid quantity");
    if (p.stock < qty) throw new Error(`Insufficient stock for ${p.title}`);

    const price = Number(p.price || 0);
    const subtotal = price * qty;
    total += subtotal;

    orderItems.push({
      product: p._id,
      title: p.title,
      price,
      qty,
      subtotal,
      photo: p.photos?.[0]?.url || p.photos?.[0] || "",
    });
  }
  return { items: orderItems, amount: total };
}

// ----------------- Legacy "quick order" (non-gateway) -----------------
app.post("/orders", requireAuth, async (req, res, next) => {
  try {
    const { product, home_address, contact_no, items, price } = req.body || {};
    if (
      !product ||
      !home_address?.trim() ||
      !contact_no?.trim() ||
      !Number(items)
    ) {
      return res
        .status(400)
        .json({ error: "Product, address, contact and items are required" });
    }
    if (Number(items) <= 0)
      return res.status(400).json({ error: "Items must be >= 1" });

    const doc = await Order.create({
      product,
      user: req.user.id,
      home_address: home_address.trim(),
      contact_no: contact_no.trim(),
      items: Number(items),
      price: Number(price) || 0,
    });
    res.json(doc);
  } catch (e) {
    next(e);
  }
});

app.get("/orders", requireAuth, async (req, res, next) => {
  try {
    const docs = await Order.find({ user: req.user.id }).sort({ _id: -1 });
    res.json(docs);
  } catch (e) {
    next(e);
  }
});

// ----------------- Razorpay Checkout (Cart) -----------------
app.post("/checkout/razorpay", requireAuth, async (req, res, next) => {
  try {
    const { cartItems, home_address, contact_no } = req.body || {};
    if (
      !Array.isArray(cartItems) ||
      !home_address?.trim() ||
      !contact_no?.trim()
    ) {
      return res
        .status(400)
        .json({ error: "cartItems, home_address and contact_no are required" });
    }

    const { items, amount } = await buildOrderFromCartItems(cartItems);

    const orderDoc = await Order.create({
      user: req.user.id,
      items,
      amount,
      home_address: home_address.trim(),
      contact_no: contact_no.trim(),
      status: "pending",
      provider: "razorpay",
    });

    const rzpOrder = await razor.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: String(orderDoc._id),
      notes: { userId: String(req.user.id) },
    });

    orderDoc.razorpayOrderId = rzpOrder.id;
    await orderDoc.save();

    res.json({
      key: process.env.RAZORPAY_KEY_ID,
      orderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      orderDbId: orderDoc._id,
    });
  } catch (e) {
    next(e);
  }
});

app.post("/payments/verify", requireAuth, async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body || {};
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing payment fields" });
    }

    const orderDoc = await Order.findOne({
      razorpayOrderId: razorpay_order_id,
    });
    if (!orderDoc) return res.status(404).json({ error: "Order not found" });
    if (String(orderDoc.user) !== String(req.user.id))
      return res.status(403).json({ error: "Forbidden" });
    if (orderDoc.status === "paid") return res.json({ ok: true });

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      orderDoc.status = "failed";
      await orderDoc.save();
      return res.status(400).json({ error: "Invalid signature" });
    }

    orderDoc.status = "paid";
    orderDoc.razorpayPaymentId = razorpay_payment_id;
    orderDoc.razorpaySignature = razorpay_signature;
    await orderDoc.save();

    // decrement stock
    const bulkOps = orderDoc.items.map((it) => ({
      updateOne: {
        filter: { _id: it.product, stock: { $gte: it.qty } },
        update: { $inc: { stock: -it.qty } },
      },
    }));
    if (bulkOps.length) await Product.bulkWrite(bulkOps, { ordered: false });

    res.json({ ok: true, orderId: orderDoc._id });
  } catch (e) {
    next(e);
  }
});

// ----------------- Admin -----------------
app.get("/admin/products", requireAdmin, async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 100);
    const total = await Product.countDocuments({});
    const items = await Product.find({})
      .sort({ _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    res.json({ items, page, pages: Math.ceil(total / limit), total });
  } catch (e) {
    next(e);
  }
});

app.patch("/admin/products/:id", requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};
    const doc = await Product.findByIdAndUpdate(id, updates, { new: true });
    res.json(doc);
  } catch (e) {
    next(e);
  }
});

app.get("/admin/orders", requireAdmin, async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 100);
    const total = await Order.countDocuments({});
    const items = await Order.find({})
      .populate("user", "name email")
      .populate("items.product", "title")
      .sort({ _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    res.json({ items, page, pages: Math.ceil(total / limit), total });
  } catch (e) {
    next(e);
  }
});

app.patch("/admin/orders/:id/status", requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!["pending", "paid", "failed", "cancelled"].includes(status))
      return res.status(400).json({ error: "Invalid status" });
    const doc = await Order.findByIdAndUpdate(id, { status }, { new: true });
    res.json(doc);
  } catch (e) {
    next(e);
  }
});

// ----------------- Static serving in production -----------------
if (IS_PROD) {
  const path = require("path");
  const clientBuildPath = path.join(__dirname, "../client/dist");
  app.use(express.static(clientBuildPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
}

// ----------------- Error Handler (last) -----------------
app.use((err, req, res, _next) => {
  console.error("🔥 Error:", err);
  res.status(500).json({ error: err?.message || "Internal Server Error" });
});

// ----------------- Start server AFTER DB connects -----------------
(async () => {
  try {
    await mongoose.connect(MONGO_URL, { serverSelectionTimeoutMS: 7000 });
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () =>
      console.log(`🚀 Server listening on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
})();
// PUT /products/:id/photos  body: { photos: [{ public_id, url }] }
app.put("/products/:id/photos", async (req, res) => {
  const { id } = req.params;
  const { photos } = req.body;
  const updated = await Product.findByIdAndUpdate(
    id,
    { photos, updatedAt: new Date() },
    { new: true }
  );
  res.json(updated);
});
app.post("/upload", upload.array("photos", 10), async (req, res) => {
  // If using Cloudinary/S3: upload each file and collect { public_id, url }
  // For local storage: map to { public_id: file.filename, url: `${BASE}/uploads/${file.filename}` }
  const out = req.files.map((f) => ({
    public_id: f.filename,
    url: `${process.env.BASE_URL || "http://localhost:4000"}/uploads/${
      f.filename
    }`,
  }));
  res.json(out);
});