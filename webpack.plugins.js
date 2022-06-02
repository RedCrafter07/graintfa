const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

const assets = ['assets'];
const copyPlugins = assets.map((asset) => {
	return new CopyWebpackPlugin({
		patterns: [
			{
				from: path.resolve(__dirname, 'src', asset),
				to: asset,
			},
		],
	});
});

module.exports = [new ForkTsCheckerWebpackPlugin(), ...copyPlugins];
