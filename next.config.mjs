/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "img.clerk.com",
			},
			{
				protocol: "https",
				hostname: "fvneejbbugpsgyezslxd.supabase.co",
				pathname: "/storage/v1/object/public/site/**",
			},
		],
	},
};

export default nextConfig;
