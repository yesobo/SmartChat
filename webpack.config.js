const path = require("path");

module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  devServer: {
    contentBase: path.join(__dirname, "dist"),
    compress: true,
    port: 9000,
    host: '0.0.0.0',
    disableHostCheck: true,
    proxy: {
      "/getToken": "http://localhost:8080", //"/getToken": "http://casa.sanguino.io:443",
    },
  },
};
