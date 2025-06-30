const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    popup: path.resolve(__dirname, 'src', 'popup.tsx'),
    problems: path.resolve(__dirname, 'src', 'problems.tsx'),
    options: path.resolve(__dirname, 'src', 'options.tsx'),
    'notion-test': path.resolve(__dirname, 'src', 'notion-test.tsx'),
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'public', 'popup.html'),
      filename: 'popup.html',
      chunks: ['popup'],
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'public', 'problems.html'),
      filename: 'problems.html',
      chunks: ['problems'],
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'public', 'options.html'),
      filename: 'options.html',
      chunks: ['options'],
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'public', 'notion-test.html'),
      filename: 'notion-test.html',
      chunks: ['notion-test'],
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'manifest.json'),
          to: path.resolve(__dirname, 'dist'),
        },
      ],
    }),
  ],
};