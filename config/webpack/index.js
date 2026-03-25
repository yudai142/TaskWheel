const path = require('path')
const { config } = require('@shakapacker/core')

const moduleConfig = config

// Custom configuration
moduleConfig.entry = {
  application: path.resolve(__dirname, 'app', 'javascript', 'packs', 'application.js'),
  index: path.resolve(__dirname, 'app', 'javascript', 'packs', 'index.jsx'),
}

// Babel loader configuration for React
moduleConfig.module.rules.push({
  test: /\.(jsx|js)$/,
  include: path.resolve(__dirname, 'app', 'javascript'),
  exclude: /node_modules/,
  use: {
    loader: 'babel-loader',
    options: {
      presets: [
        '@babel/preset-env',
        '@babel/preset-react',
      ],
    },
  },
})

module.exports = moduleConfig
