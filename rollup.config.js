import terser from "@rollup/plugin-terser";
import replace from "@rollup/plugin-replace";
import pkg from "./package.json" assert { type: "json" };

const mode = process.env.NODE_ENV;
const isProd = mode === "production";
const isDev = mode === "development";
export default {
  input: "src/index.js",

  output: [
    {
      format: "umd",
      name: "hton",
      dir: "dist",
    },
    {
      format: "umd",
      name: "hton",
      dir: "docs/lib",
    },
  ],
  plugins: [
    replace({
      __DEV__: JSON.stringify(isDev),
      __PROD__: JSON.stringify(isProd),
      __VERSION__: JSON.stringify(pkg.version),
    }),
    isProd && terser(),
  ].filter(Boolean),

  treeshake: "smallest",
};
