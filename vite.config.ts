import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
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
	plugins: [react()],
	resolve: {
		alias: {
			"@component": path.resolve(__dirname, "src/renderer/components"),
		},
	},
});
