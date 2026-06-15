import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import type { UserConfig } from "vitest/config";

export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
		VitePWA({
			registerType: "autoUpdate",
			includeAssets: ["favicon.svg"],
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
				navigateFallback: "/index.html",
				globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
			},
		}),
	],
	resolve: {
		alias: {
			"~": path.resolve(__dirname, "./src"),
		},
	},
	test: {
		environment: "jsdom",
		env: {
			VITE_SUPABASE_URL: "http://localhost:54321",
			VITE_SUPABASE_ANON_KEY: "test-anon-key",
		},
	} satisfies UserConfig["test"],
	server: {
		headers: {
			"X-Content-Type-Options": "nosniff",
			"X-Frame-Options": "DENY",
			"Referrer-Policy": "strict-origin-when-cross-origin",
			"Permissions-Policy": "camera=(), microphone=(), geolocation=(self)",
		},
	},
});
