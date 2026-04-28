import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
		VitePWA({
			registerType: "autoUpdate",
			includeAssets: ["favicon.svg", "offline.html"],
			manifest: {
				name: "Energiza CRM Demo",
				short_name: "Energiza CRM",
				description:
					"CRM vertical para asesorias energeticas e instalaciones solares",
				theme_color: "#059669",
				background_color: "#f8fafc",
				display: "standalone",
				start_url: "/dashboard",
				icons: [
					{
						src: "/pwa-icon.svg",
						sizes: "192x192",
						type: "image/svg+xml",
					},
					{
						src: "/pwa-icon.svg",
						sizes: "512x512",
						type: "image/svg+xml",
					},
				],
			},
			workbox: {
				navigateFallback: "/offline.html",
				globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
				runtimeCaching: [
					{
						urlPattern: ({ url }) => url.hostname.includes("supabase.co"),
						handler: "NetworkOnly",
						options: {
							cacheName: "supabase-private-network-only",
						},
					},
				],
			},
		}),
	],
	resolve: {
		alias: {
			"~": path.resolve(__dirname, "./src"),
		},
	},
});
