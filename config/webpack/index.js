const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { generateWebpackConfig, merge } = require('shakapacker')

const baseConfig = generateWebpackConfig()

const customConfig = {
  entry: {
    application: path.resolve(__dirname, '..', '..', 'app', 'javascript', 'packs', 'application.js'),
    index: path.resolve(__dirname, '..', '..', 'app', 'javascript', 'packs', 'index.jsx'),
  },
  module: {
    rules: [
      {
        test: /\.(jsx|js)$/,
        include: path.resolve(__dirname, '..', '..', 'app', 'javascript'),
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
        ],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: '[name]-[contenthash].css' }),
  ],
  resolve: {
    extensions: ['.js', '.jsx'],
  },
}

module.exports = merge(baseConfig, customConfig)
