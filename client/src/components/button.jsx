export default function Button({
  as: Tag = "button",
  variant = "solid",
  className = "",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center px-5 py-2.5 text-sm rounded transition";
  const variants = {
    solid: "bg-ink text-white hover:bg-ink/90",
    ghost: "bg-transparent text-ink hover:bg-ink/5",
    outline: "border border-stroke text-ink hover:bg-white",
  };
  return (
    <Tag className={`${base} ${variants[variant]} ${className}`} {...props} />
  );
}
