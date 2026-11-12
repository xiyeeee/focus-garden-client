import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
const apiTarget = "http://127.0.0.1:8080";
export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: apiTarget,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyRequest, request) => {
            // 仅对开发服务器的同源请求对齐上游 Origin，兼容 localhost/127.0.0.1。
            if (request.headers.origin === `http://${request.headers.host}`) {
              proxyRequest.setHeader("Origin", apiTarget);
            }
          });
        },
      },
    },
  },
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
