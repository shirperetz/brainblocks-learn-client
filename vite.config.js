import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The kids learning client runs on its own port (5174) so it can run side by side
// with the existing racing-game client (5173). Both share the Spring Boot API on :8080.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
  },
});
