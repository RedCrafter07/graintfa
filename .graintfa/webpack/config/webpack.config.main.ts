import { Configuration } from 'webpack';
import { EsbuildPlugin } from 'esbuild-loader';
import RestartPlugin from '../plugins/RestartPlugin';

export default {
	entry: {
		index: './src/main/index.ts',
		preload: './src/main/preload.ts',
	},
	target: 'electron-main',
	output: {
		path: __dirname + '/../../../dist/main',
		filename: '[name].js',
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: 'esbuild-loader',
			},
		],
	},
	plugins: [new EsbuildPlugin({ minify: true }), new RestartPlugin()],
	resolve: {
		extensions: ['.ts', '.js'],
	},
} as Configuration;
