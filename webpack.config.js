const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const path = require('path');

module.exports = {
	...defaultConfig,
	entry: {
		index: path.resolve(process.cwd(), 'blocks', 'index.js'),
		frontend: path.resolve(process.cwd(), 'src', 'app', 'index.ts')
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js', '.jsx']
	},
	module: {
		...defaultConfig.module,
		rules: [
			...defaultConfig.module.rules.map(rule => {
				if (rule.test && rule.test.toString().includes('scss')) {
					return {
						...rule,
						use: rule.use.map(use => {
							if (use.loader && use.loader.includes('sass-loader')) {
								return {
									...use,
									options: {
										...use.options,
										api: 'modern-compiler'
									}
								};
							}
							return use;
						})
					};
				}
				return rule;
			})
		]
	},
	externals: {
		...defaultConfig.externals,
		'react-big-calendar': 'window.BigCalendar',
		'moment': 'window.moment'
	}
};