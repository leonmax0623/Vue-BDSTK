const webpack = require('webpack')

module.exports = {
  	productionSourceMap: false,
	devServer: {
		clientLogLevel: 'error',
		http2: false,
		https: false,
		proxy: {
			'/api': {
				target: 'http://91.237.189.1:6060'
			},
			'/token': {
				target: 'http://91.237.189.1:6060',
				pathRewrite: { '^/api': '' },
			},
		},
	},
  transpileDependencies: [
  ],
  configureWebpack: {
	plugins: [
		new webpack.ProvidePlugin({
		  $: 'jquery',
		  jquery: 'jquery',
		  'window.jQuery': 'jquery',
		  jQuery: 'jquery'
		})
	  ]
  }
}