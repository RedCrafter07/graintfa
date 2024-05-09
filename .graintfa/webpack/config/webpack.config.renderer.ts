import { Configuration } from 'webpack';
import HTMLWebpackPlugin from 'html-webpack-plugin';

export default {
	entry: './src/renderer/index.tsx',
	target: ['web', 'electron-renderer'],

	output: {
		path: __dirname + '/../../../dist/renderer',
		filename: 'index.js',
	},

	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'esbuild-loader',
			},
			{
				test: /\.css$/,
				use: [
					{ loader: 'style-loader' },
					{ loader: 'css-loader' },
					{ loader: 'postcss-loader' },
				],
			},
		],
	},

	resolve: {
		extensions: ['.tsx', '.ts', '.js', '.css'],
	},

	plugins: [
		new HTMLWebpackPlugin({
			template: './src/renderer/index.html',
		}),
	],
} as Configuration;
