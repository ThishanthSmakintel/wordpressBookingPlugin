const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const path = require('path');

module.exports = {
	...defaultConfig,
	entry: {
		index: path.resolve(process.cwd(), 'blocks', 'index.js'),
		frontend: path.resolve(process.cwd(), 'src', 'frontend.tsx'),
		amelia: path.resolve(process.cwd(), 'src', 'amelia-frontend.tsx')
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js', '.jsx']
	},
	externals: {
		...defaultConfig.externals,
		'react-big-calendar': 'window.BigCalendar',
		'moment': 'window.moment'
	}
};