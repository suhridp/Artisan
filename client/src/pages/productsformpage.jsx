// src/pages/productsformpage.jsx
import PhotosUploader from "../photosuploader.jsx";
import Perks from "../perkslabel.jsx";
import Catagory from "../catagorylabel.jsx";
import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import AccountNav from "../accountnav.jsx";
import api from "../lib/api";

export default function ProductsFormPage() {
  const { id } = useParams();

  const [title, setTitle] = useState("");
  const [owneraddress, setOwnerAddress] = useState("");
  const [addedPhotos, setAddedPhotos] = useState([]);
  const [description, setDescription] = useState("");
  const [perks, setPerks] = useState([]);
  const [catagory, setCatagory] = useState("");
  const [stock, setStock] = useState(0);
  const [history, setHistory] = useState("");
  const [artistdes, setArtistdes] = useState("");
  const [district, setDistrict] = useState("");
  const [price, setPrice] = useState(100);

  const [redirect, setRedirect] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load existing product for edit
  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        if (!active) return;
        setTitle(data.title || "");
        setOwnerAddress(data.owneraddress || "");
        setAddedPhotos(data.photos || []);
        setDescription(data.description || "");
        setPerks(Array.isArray(data.perks) ? data.perks : []);
        setCatagory(data.catagory || "");
        setStock(Number(data.stock) || 0);
        setArtistdes(data.artistdes || "");
        setDistrict(data.district || "");
        setHistory(data.history || "");
        setPrice(Number(data.price) || 0);
      } catch (e) {
        if (active) setError("Failed to load this product.");
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  function validate() {
    if (!title.trim()) return "Please provide a title.";
    if (!owneraddress.trim()) return "Please provide the store address.";
    if (Number.isNaN(Number(price)) || Number(price) < 0)
      return "Please provide a valid price.";
    if (Number.isNaN(Number(stock)) || Number(stock) < 0)
      return "Please provide a valid stock.";
    return "";
  }

  async function addNewProduct(e) {
    e.preventDefault();
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    setSaving(true);
    setError("");

    const productData = {
      title: title.trim(),
      owneraddress: owneraddress.trim(),
      addedPhotos,
      description: description.trim(),
      perks,
      catagory,
      price: Number(price),
      stock: Number(stock),
      district: district.trim(),
      history: history.trim(),
      artistdes: artistdes.trim(),
    };

    try {
      if (id) {
        await api.put("/products", { id, ...productData });
      } else {
        await api.post("/products", productData);
      }
      setRedirect(true);
    } catch (e) {
      setError(
        e?.response?.data?.error ||
          "Could not save the product. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  if (redirect) return <Navigate to="/account/products" />;

  return (
    <section className="space-y-8">
      <div className="border-b border-neutral-200 pb-2">
        <AccountNav />
      </div>

      <header className="space-y-2">
        <h1 className="font-serif text-3xl tracking-tight text-neutral-900">
          {id ? "Edit product" : "New product"}
        </h1>
        <p className="text-neutral-600">
          Provide concise, accurate details. Keep imagery natural and well lit.
        </p>
      </header>

      <form onSubmit={addNewProduct} className="space-y-8">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Essentials */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm space-y-5">
          <div>
            <label
              className="mb-1 block text-sm font-medium text-neutral-700"
              htmlFor="title"
            >
              Title
            </label>
            <input
              id="title"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Handwoven Pashmina Scarf"
              required
            />
            <p className="mt-1 text-xs text-neutral-500">
              Keep it specific and honest.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                className="mb-1 block text-sm font-medium text-neutral-700"
                htmlFor="owneraddress"
              >
                Address of store
              </label>
              <input
                id="owneraddress"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                type="text"
                value={owneraddress}
                onChange={(e) => setOwnerAddress(e.target.value)}
                placeholder="Srinagar, Jammu & Kashmir"
                required
              />
            </div>

            <div>
              <label
                className="mb-1 block text-sm font-medium text-neutral-700"
                htmlFor="district"
              >
                District
              </label>
              <input
                id="district"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g., Budgam"
              />
            </div>
          </div>
        </div>

        {/* Photos */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm space-y-3">
          <h2 className="font-serif text-xl tracking-tight text-neutral-900">
            Photos
          </h2>
          <p className="text-sm text-neutral-600">
            Show the piece clearly. First photo becomes the cover.
          </p>
          <PhotosUploader addedPhotos={addedPhotos} onChange={setAddedPhotos} />
        </div>

        {/* Text details */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm space-y-5">
          <div>
            <label
              className="mb-1 block text-sm font-medium text-neutral-700"
              htmlFor="description"
            >
              Description
            </label>
            <textarea
              id="description"
              className="w-full min-h-[120px] rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Material, size, finish, care…"
            />
          </div>

          <div>
            <label
              className="mb-1 block text-sm font-medium text-neutral-700"
              htmlFor="history"
            >
              History of product
            </label>
            <textarea
              id="history"
              className="w-full min-h-[100px] rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
              value={history}
              onChange={(e) => setHistory(e.target.value)}
              placeholder="Craft lineage, origin story, techniques…"
            />
          </div>

          <div>
            <label
              className="mb-1 block text-sm font-medium text-neutral-700"
              htmlFor="artistdes"
            >
              Artist description
            </label>
            <textarea
              id="artistdes"
              className="w-full min-h-[100px] rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
              value={artistdes}
              onChange={(e) => setArtistdes(e.target.value)}
              placeholder="Who made it and how they work…"
            />
          </div>
        </div>

        {/* Perks & Category */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm space-y-6">
          <Perks selected={perks} onChange={setPerks} />
          <Catagory selected={catagory} onChange={setCatagory} />
        </div>

        {/* Pricing & Inventory */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-serif text-xl tracking-tight text-neutral-900">
            Pricing & Inventory
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                className="mb-1 block text-sm font-medium text-neutral-700"
                htmlFor="stock"
              >
                Stock
              </label>
              <input
                id="stock"
                type="number"
                min={0}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </div>

            <div>
              <label
                className="mb-1 block text-sm font-medium text-neutral-700"
                htmlFor="price"
              >
                Price (₹)
              </label>
              <input
                id="price"
                type="number"
                min={0}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save product"}
          </button>
        </div>
      </form>
    </section>
  );
}
