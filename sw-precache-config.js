module.exports = {
	navigateFallback: 'index.html',
	navigateFallbackWhitelist: [/^(?!\/__).*/],
	// stripPrefix: 'build/bundled/',
	staticFileGlobs: [
		// 'build/bundled/src/dougpedia-app/dougpedia-app.js',
		// 'build/bundled/index.html',
		'manifest.json',
		'assets/**/*',
	],
	runtimeCaching: [
		{
			urlPattern: /\/@webcomponents\/webcomponentsjs\//,
			handler: 'fastest'
		}
	]
};