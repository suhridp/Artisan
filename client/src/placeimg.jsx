// src/placeimg.jsx
export default function PlaceImg({ place, index = 0 }) {
  if (!place?.photos?.length) return null;
  const base = import.meta.env.VITE_API_URL || "http://localhost:4000";
  return (
    <img
      className="object-cover"
      src={`${base}/uploads/${place.photos[index]}`}
      alt=""
      loading="lazy"
    />
  );
}
