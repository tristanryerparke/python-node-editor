import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { reactInspectorPlugin } from "vite-plugin-react-inspector";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    reactInspectorPlugin(), // Must be BEFORE react() to inject data-insp-path attributes
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
