import { babel } from "@rollup/plugin-babel";

const config = {
  input: "src/index.js",
  output: {
    dir: "dist/es",
    format: "es",
  },
  external: [
    /^react($|\/)/, /^react-dom($|\/)/, "mirador", /^@mui\//, /^@emotion\//,
    "redux", "react-redux", "react-i18next", "prop-types",
  ],
  plugins: [babel({ babelHelpers: "bundled" })],
};

export default config;
