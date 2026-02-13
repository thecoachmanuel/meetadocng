import React, { useState } from "react";
import { User } from "lucide-react";

export function Avatar({ src, alt = "", size = 32 }) {
  const [error, setError] = useState(false);
  const showFallback = !src || error;

  return (
    <div
      className="rounded-full bg-muted border border-emerald-900/20 flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {showFallback ? (
        <User className="text-muted-foreground" style={{ width: size * 0.6, height: size * 0.6 }} />
      ) : (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover rounded-full"
          onError={() => setError(true)}
        />
      )}
    </div>
  );
}
