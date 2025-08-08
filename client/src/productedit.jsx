// ProductEdit.jsx
import { useEffect, useState } from "react";
import api from "./lib/api";
import PhotosUploader from "./photosuploader";

export default function ProductEdit({ productId }) {
  const [product, setProduct] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await api.get(`/products/${productId}`);
      setProduct(data);
    })();
  }, [productId]);

  if (!product) return null;

  async function save() {
    setSaving(true);
    try {
      await api.put(`/products/${productId}/photos`, {
        photos: product.photos || [],
      });
      // optionally save other fields too
      alert("Photos saved");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Edit Photos – {product.title}</h1>

      <PhotosUploader
        addedPhotos={product.photos || []}
        onChange={(next) => setProduct((p) => ({ ...p, photos: next }))}
      />

      <button
        onClick={save}
        disabled={saving}
        className="rounded-xl bg-indigo-600 px-4 py-2 text-white disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save Photos"}
      </button>
    </div>
  );
}
