import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const supabaseServer = async () => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle error or ignore if called during render
          }
        },
        remove: (name, options) => {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            // Handle error or ignore if called during render
          }
        },
      },
    }
  );
};
