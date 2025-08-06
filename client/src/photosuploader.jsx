// src/PhotosUploader.jsx
import { useState, useRef, useMemo, useCallback } from "react";
import api from "./lib/api";

export default function PhotosUploader({ addedPhotos = [], onChange }) {
  const [photoLink, setPhotoLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Normalize for rendering (supports either strings or objects during migration)
  const items = useMemo(
    () =>
      (addedPhotos || []).map((p) =>
        typeof p === "string" ? { id: p, url: srcFromFilename(p) } : p
      ),
    [addedPhotos]
  );

  const isMain = useCallback(
    (p) => {
      if (!addedPhotos?.length) return false;
      const first = addedPhotos[0];
      const a = typeof first === "string" ? srcFromFilename(first) : first.url;
      const b = typeof p === "string" ? srcFromFilename(p) : p.url;
      return a === b;
    },
    [addedPhotos]
  );

  function srcFromFilename(name) {
    const base = import.meta.env.VITE_API_URL || "http://localhost:4000";
    return `${base}/uploads/${name}`;
  }

  function toOutputShape(list) {
    // If input came in as strings, return strings; else return objects.
    const wasStrings = (addedPhotos || [])[0]
      ? typeof (addedPhotos || [])[0] === "string"
      : false;
    if (wasStrings) {
      return list.map((p) => (typeof p === "string" ? p : p.id || p.url));
    }
    return list;
  }

  async function addPhotoByLink(e) {
    e.preventDefault();
    const link = photoLink.trim();
    if (!link) return;

    // Optional basic URL check
    try {
      new URL(link);
    } catch {
      return alert("Please paste a valid image URL.");
    }

    setIsLoading(true);
    try {
      // Expecting API to return [{ id, url }]
      const { data } = await api.post("/upload-by-link", { link });
      onChange(toOutputShape([...(items || []), ...data]));
      setPhotoLink("");
    } catch (err) {
      console.error(err);
      alert("Could not add photo by link.");
    } finally {
      setIsLoading(false);
    }
  }

  async function uploadPhoto(e) {
    const files = e.target.files;
    if (!files?.length) return;

    // Optional: guard types/sizes
    // for (const f of files) if (!f.type.startsWith("image/")) return alert("Only images allowed.");

    const form = new FormData();
    for (const f of files) form.append("photos", f);

    setIsLoading(true);
    try {
      // Expecting API to return [{ id, url }]
      const { data } = await api.post("/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange(toOutputShape([...(items || []), ...data]));
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error(err);
      alert("Upload failed.");
    } finally {
      setIsLoading(false);
    }
  }

  function removePhoto(e, photo) {
    e.preventDefault();
    const url = typeof photo === "string" ? srcFromFilename(photo) : photo.url;
    const next = items.filter((p) => p.url !== url);
    onChange(toOutputShape(next));
  }

  function selectAsMainPhoto(e, photo) {
    e.preventDefault();
    const url = typeof photo === "string" ? srcFromFilename(photo) : photo.url;
    const main = items.find((p) => p.url === url);
    const rest = items.filter((p) => p.url !== url);
    onChange(toOutputShape([main, ...rest]));
  }

  return (
    <>
      <div className="flex">
        <input
          className="w-full rounded-2xl border px-3 py-2"
          type="url"
          value={photoLink}
          onChange={(e) => setPhotoLink(e.target.value)}
          placeholder="Paste image URL (https://...)"
          aria-label="Image URL"
        />
        <button
          onClick={addPhotoByLink}
          disabled={isLoading}
          className="mx-2 w-auto rounded-2xl bg-neutral-900 px-3 py-2 text-white disabled:opacity-60"
          title="Add by link"
        >
          {isLoading ? "Adding…" : "Add"}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 md:grid-cols-4 lg:grid-cols-6">
        {items.map((ph) => (
          <div className="relative flex h-32" key={ph.id || ph.url}>
            <img
              className="w-full rounded-2xl object-cover"
              src={ph.url}
              alt="Uploaded"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={(e) => removePhoto(e, ph)}
              className="absolute bottom-1 right-1 rounded-2xl bg-black/60 p-2 text-white"
              title="Remove"
              aria-label="Remove photo"
            >
              {/* trash icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9M5 7h14M9 7V4h6v3m-7 0h8m-9 0h10M6 7l1 13h10l1-13"
                />
              </svg>
            </button>

            <button
              onClick={(e) => selectAsMainPhoto(e, ph)}
              className="absolute bottom-1 left-1 rounded-2xl bg-black/60 p-2 text-white"
              title="Set as main photo"
              aria-label="Set as main photo"
            >
              {isMain(ph) ? (
                // filled star
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                // outline star
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.48 3.5l2.125 5.11a.56.56 0 00.475.345l5.518.442a.56.56 0 01.321.988l-4.204 3.602a.56.56 0 00-.182.557l1.285 5.385a.56.56 0 01-.84.61l-4.725-2.885a.56.56 0 00-.586 0L6.982 20.54a.56.56 0 01-.84-.61l1.285-5.386a.56.56 0 00-.182-.557L2.74 11.0a.56.56 0 01.321-.988l5.518-.442a.56.56 0 00.475-.345L11.48 3.5z"
                  />
                </svg>
              )}
            </button>
          </div>
        ))}

        <label
          className="flex h-32 cursor-pointer items-center justify-center gap-2 rounded-2xl border p-8 text-2xl text-gray-600"
          title="Upload images"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={uploadPhoto}
          />
          {/* plus icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-8 w-8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 16.875H21m-7.5 0V21M3 7.5h6a3 3 0 003-3V3M3 7.5V6A3 3 0 016 3h1.5M3 7.5l4.5 4.5M21 7.5h-3A3 3 0 0015 10.5V12"
            />
          </svg>
          {isLoading ? "Uploading…" : "Upload"}
        </label>
      </div>
    </>
  );
}
