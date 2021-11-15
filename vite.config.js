const path = require("path");
const { defineConfig } = require("vite");

module.exports = defineConfig({
  build: {
    minify: true,
    outDir: "dist",
    sourcemap: false,
    lib: {
      name: "shirkhan-alphabet-input-adapter",
      entry: path.resolve(__dirname, "src/index.ts"),
      fileName: (format) => `shirkhan-alphabet-input-adapter.${format}.js`,
    },
    rollupOptions: {},
  },
});
