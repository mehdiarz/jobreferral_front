// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// import tailwindcss from "@tailwindcss/vite";
//
// export default defineConfig({
//   base: "./",
//   plugins: [react(), tailwindcss()],
//   server: {
//     proxy: {
//       "/job-referral-api": {
//         target: "https://10.35.23.11",
//         changeOrigin: true,
//         secure: false,
//         rewrite: (path) =>
//           path.replace(/^\/job-referral-api/, "/JobReferral/api"),
//       },
//     },
//   },
// });

// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// import tailwindcss from "@tailwindcss/vite";
//
// export default defineConfig({
//   base: "/JobReferralUI/",
//   plugins: [react(), tailwindcss()],
//   server: {
//     proxy: {
//       "/job-referral-api": {
//         target: "https://10.35.23.11",
//         changeOrigin: true,
//         secure: false,
//         rewrite: (path) =>
//           path.replace(/^\/job-referral-api/, "/JobReferral/api"),
//       },
//     },
//   },
// });

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/JobReferralUI/",
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/job-referral-api": {
        target: "https://10.35.33.176",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/job-referral-api/, "/api"),
      },
    },
  },
});
