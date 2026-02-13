"use client";

import { usePathname, useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";

export default function AvatarToggleLink({ src, alt, size = 36, className = "" }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleClick = (event) => {
    event.preventDefault();
    if (pathname === "/account") {
      router.back();
      return;
    }
    router.push("/account");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
      aria-label="Account"
    >
      <Avatar src={src} alt={alt} size={size} />
    </button>
  );
}
