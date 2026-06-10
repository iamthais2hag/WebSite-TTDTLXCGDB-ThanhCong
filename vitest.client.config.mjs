import { fileURLToPath } from "node:url";

export default {
  root: fileURLToPath(new URL("./client/", import.meta.url)),
  test: {
    environment: "node",
    exclude: [
      "node_modules/**",
      "dist/**",
      "coverage/**",
      ".git/**",
      "public/uploads/students/**",
    ],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
};
