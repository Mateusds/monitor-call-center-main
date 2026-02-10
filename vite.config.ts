import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ command, mode }) => ({
  base: "/monitor-call-center-main/",
  define: {
    "process.env.NODE_ENV": JSON.stringify(command === "serve" ? "development" : "production"),
  },
  server: {
    host: "::",
    port: 8080,

    allowedHosts: [
      "monitor-call-center-smile-saude.onrender.com",
      "8080-im0dqmjoyfiailjvnajv5-70a4a36b.us1.manus.computer"
    ],

    hmr: {
      protocol: "wss",
      host: "monitor-call-center-smile-saude.onrender.com",
      clientPort: 443,
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
