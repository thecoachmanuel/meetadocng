import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

function createNoopSupabase() {
	return {
		auth: {
			async getUser() {
				return { data: { user: null }, error: new Error("Supabase not configured") };
			},
			async updateUser() {
				throw new Error("Supabase not configured");
			},
		},
	};
}

export const supabaseServer = async () => {
	const cookieStore = await cookies();
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
	if (!url || !anonKey) {
		return createNoopSupabase();
	}
	try {
		return createServerClient(url, anonKey, {
			cookies: {
				get: (name) => cookieStore.get(name)?.value,
				set: (name, value, options) => {
					try {
						cookieStore.set({ name, value, ...options });
					} catch (error) {}
				},
				remove: (name, options) => {
					try {
						cookieStore.set({ name, value: "", ...options });
					} catch (error) {}
				},
			},
		});
	} catch (error) {
		return createNoopSupabase();
	}
};
