import React from "react";

export function Avatar({ src, alt = "", size = 32 }) {
  return (
    <div
      className="rounded-full overflow-hidden bg-muted border border-emerald-900/20"
      style={{ width: size, height: size }}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full" />
      )}
    </div>
  );
}

