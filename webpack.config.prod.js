const path = require("path");
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  mode: "production",
  entry: "./src/index.js", 
  output: {
    path:path.resolve(__dirname, "server-pro", "public"), // string (default)
    filename: 'main.js'
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'dist', to: '.' }
      ]
    })
  ]
};
