var PiLot = PiLot || {};

/**
 * This holds values that can differ across different environments, so that
 * only one file needs to be changed.
 * */
PiLot.Config = {

	apiUrl: '/pilotapi/api/v1',			// the relative url of the API

	Nav: {
		GPSObserver : {

			intervalMS: 1000,			// interval to poll gps data, in MS
			calculationRange: 3,		// two records this many seconds apart are used to calculate speed etc. Trade error tolerance vs. actuality
			maxDataAgeSeconds: 150		// if the oldest record is older than this many seconds, we have no current gps data
		}
	},

	System: {
		Admin: {
			services: [],
			servicesUpdateInterval: 60	// interval to update service status, in seconds
		}
	},

	Media: {
		libraryUrl: 'https://gutenberg.org/ebooks/bookshelf/374'
	},

	Language: {
		availableLanguages: ['de', 'en']
	}
};