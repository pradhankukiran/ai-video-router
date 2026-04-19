import { defineConfig } from "vite";
import motionCanvas from "@revideo/vite-plugin";

export default defineConfig({
  plugins: [motionCanvas()],
  server: {
    host: "127.0.0.1",
  },
});
