import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      // MapboxDraw internally imports "mapbox-gl"
      // This makes it actually use "maplibre-gl" at runtime
      "mapbox-gl": "maplibre-gl",
    },
  },
  server: {
    host: true, // Allow access from network
    port: 3000, // Change the port number here
    allowedHosts: ["localhost", ".econet.com"], // Replace with your domain
    // open: true, // Open in browser
    strictPort: true, // Exit if port is in use
  },
});
