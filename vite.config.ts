import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import path from "path";

export default defineConfig({
	root: path.resolve(__dirname, "src/renderer"),
	base: "./",
	server: {
		port: 5173,
	},
	build: {
		outDir: path.resolve(__dirname, "transpile/renderer"),
		emptyOutDir: true,
		rollupOptions: {
			input: path.resolve(__dirname, "src/renderer/index.html"),
		},
	},
	plugins: [react(), svgr()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "src/renderer"),
			"@component": path.resolve(__dirname, "src/renderer/components"),
			"@hook": path.resolve(__dirname, "src/renderer/hooks"),
			"@state": path.resolve(__dirname, "src/renderer/state"),
			"@icon": path.resolve(__dirname, "src/renderer/icons"),

			"@enum": path.resolve(__dirname, "src/shared/enum"),
			"@interface": path.resolve(__dirname, "src/shared/interface"),
			"@type": path.resolve(__dirname, "src/shared/type"),
			"@util": path.resolve(__dirname, "src/shared/util"),
			"@const": path.resolve(__dirname, "src/shared/constant"),
			"@shared": path.resolve(__dirname, "src/shared"),
		},
	},
});
