import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // When no Firebase env vars are provided, swap real firebase modules for
  // lightweight stubs so the built bundle doesn't pull in storage APIs that
  // are blocked in sandboxed previews.
  const useStubs = !env.VITE_FIREBASE_API_KEY || !env.VITE_FIREBASE_PROJECT_ID;
  const stubBase = path.resolve(import.meta.dirname, "client", "src", "lib", "firebase-stubs");

  return {
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      ...(useStubs
        ? {
            "firebase/app": path.join(stubBase, "app.ts"),
            "firebase/auth": path.join(stubBase, "auth.ts"),
            "firebase/firestore": path.join(stubBase, "firestore.ts"),
            "firebase/storage": path.join(stubBase, "storage.ts"),
          }
        : {}),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  base: "./",
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  };
});
