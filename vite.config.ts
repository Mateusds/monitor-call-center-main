import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ command, mode }) => ({
  base: mode === "production" ? "/monitor-call-center-main/" : "/",

  define: {
    "process.env.NODE_ENV": JSON.stringify(command === "serve" ? "development" : "production"),
  },
  server: {
    host: "0.0.0.0",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));