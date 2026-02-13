"use client";
import React, { useState } from "react";
import { User } from "lucide-react";
import Image from "next/image";

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
        <Image
          src={src}
          alt={alt}
          width={size}
          height={size}
          className="w-full h-full object-cover rounded-full"
          onError={() => setError(true)}
          unoptimized
        />
      )}
    </div>
  );
}
