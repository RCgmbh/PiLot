var PiLot = PiLot || {};
PiLot.Model = PiLot.Model || {};

PiLot.Model.Tools = (function () {



	/**
	 * Helper for downloading tiles for a certain source. It will keep track
	 * of already downloaded tiles and some stats. Needs a tileSource when
	 * created.
	 * @param {PiLot.Model.Tools.TileSource} pTileSource
	 */
	var TilesDownloadHelper = function (pTileSource) {
		this.tileSource = pTileSource;
		this.requestedTiles = null;			/// a Map of Maps of Arrays (zoom, x, y) storing for which tiles downloaded has started
		this.pendingRequestsCount = 0;		/// the number of pending requests
		this.completedRequestsCount = 0;	/// the number of completed requests (including failed ones)
		this.pendingRequestsBytes = 0;		/// the total amount of bytes being requested
		this.completedRequestBytes = 0;		/// the total amount of bytes successfully saved to the API
		this.observers = null;				/// observers for 
		this.initialize();
	};

	TilesDownloadHelper.prototype = {

		/// initializes what needs to be initialized
		initialize: function () {
			this.requestedTiles = new Map();
			this.observers = RC.Utils.initializeObservers(['updateStats']);
		},

		/// accessors
		getPendingRequestsCount: function () { return this.pendingRequestsCount; },
		getCompletedRequestsCount: function () { return this.completedRequestsCount; },
		getPendingRequestsBytes: function () { return this.pendingRequestsBytes; },
		getCompletedRequestsBytes: function () { return this.completedRequestBytes; },

		/// calls all observers that registered for pEvent. Passes this
		/// and pArg as parameters.
		notifyObservers: function (pEvent, pArg) {
			RC.Utils.notifyObservers(this, this.observers, pEvent, pArg);
		},

		/// registers an observer which will be called when pEvent happens
		on: function (pEvent, pCallback) {
			RC.Utils.addObserver(this.observers, pEvent, pCallback);
		},

		/// triggers the download from the online source and local saving
		/// of a tile, including all zoom levels from pMinZoom to pMaxZoom
		saveTile: function (pTile, pLowerZooms, pHigherZooms, pForceDownload) {
			var originalZoom = pTile.coords.z;
			var minZoom = pLowerZooms > 0 ? Math.max(this.tileSource.getMinZoom(), originalZoom - pLowerZooms) : originalZoom;
			var maxZoom = pHigherZooms > 0 ? Math.min(this.tileSource.getMaxZoom(), originalZoom + pHigherZooms) : originalZoom;
			var zoom = minZoom;
			var factor, x, y, url;
			while (zoom <= maxZoom) {
				factor = Math.pow(2, zoom - originalZoom);
				for (var i = 0; i < factor; i++) {
					x = Math.floor(pTile.coords.x * factor + i);
					for (var j = 0; j < factor; j++) {
						y = Math.floor(pTile.coords.y * factor + j);
						if (!this.wasTileRequested(zoom, x, y)) {
							this.rememberTileRequested(zoom, x, y);
							this.updateStats(0, 0, 1, 0);
							url = this.tileSource.getOnlineUrl().replace('{z}', zoom)
								.replace('{x}', x)
								.replace('{y}', y)
								.replace('{s}', pTile.target.options.subdomains[Math.floor(Math.random() * pTile.target.options.subdomains.length)]);
							PiLot.log(`trying to save tile for ${this.tileSource.getName()}, z: ${zoom}, x: ${x}, y: ${y} with url ${url}`, 2);
							if (pForceDownload) {
								this.getImage(url, x, y, zoom);
							} else {
								this.checkLocalTile(x, y, zoom, this.updateStats.bind(this, 0, 0, 0, 1), this.getImage.bind(this, url, x, y, zoom));
							}
						} else {
							PiLot.log(`file has been requested before`, 2);
						}
					}
				}
				zoom++;
			}
		},

		/// checks whether a tile exists locally. calls pOnSuccess with true or false,
		/// true if the tile exists
		checkLocalTile: function (pX, pY, pZ, pOnExists, pOnNotExists) {
			let url = this.tileSource.getLocalUrl().replace('{z}', pZ)
				.replace('{x}', pX)
				.replace('{y}', pY);
			fetch(url, { method: 'head' }).then(function (response) {
				if (response.ok) {
					pOnExists();
				} else {
					pOnNotExists();
				}
			})
		},

		/// gets the image as array buffer, converts it into a byte array, and calls putFile
		/// with the byte array. Could probably be simplified.
		getImage: async function (pUrl, pX, pY, pZ) {
			if ((pZ >= this.tileSource.getMinZoom()) && (pZ <= this.tileSource.getMaxZoom())) {
				const options = { method: "GET", cache: "force-cache" };
				const response = await fetch(pUrl, options);
				const arrayBuffer = await response.arrayBuffer();
				const byteArray = new Uint8Array(arrayBuffer);
				this.updateStats(byteArray.length, 0, 0, 0);
				this.putFile(byteArray, pX, pY, pZ);
			} else {
				this.updateStats(0, 0, 0, 1);
			}
		},

		/// puts a file to the API, which will save it locally
		putFile: function (pByteArray, pX, pY, pZ) {
			const apiUrl = `/Tiles/${this.tileSource.getName()}/${pZ}/${pX}/${pY}`;
			PiLot.Utils.Common.putToServerAsync(apiUrl, Array.from(pByteArray)).then(function (result) {
				if (result.ok) {
					this.updateStats(0, pByteArray.length, 0, 1);
				} else {
					PiLot.log(`error uploading tile to ${apiUrl}`, 0);
				}
			}.bind(this));
		},

		/// updates the stats about pending and recieved bytes/items
		updateStats: function (pBytesRequested, pBytesRecieved, pImagesRequested, pImagesRecieved) {
			this.pendingRequestsBytes += pBytesRequested;
			this.pendingRequestsBytes -= pBytesRecieved;
			this.completedRequestBytes += pBytesRecieved;
			this.pendingRequestsCount += pImagesRequested;
			this.pendingRequestsCount -= pImagesRecieved;
			this.completedRequestsCount += pImagesRecieved;
			this.notifyObservers('updateStats', null);
		},

		/// remembers that a certain tile has been requested, avoiding to request
		/// the same tile multiple times
		rememberTileRequested: function (pZ, pX, pY) {
			var zMap = this.requestedTiles.get(pZ);
			if (typeof zMap === 'undefined') {
				zMap = new Map();
				this.requestedTiles.set(pZ, zMap);
			}
			var xArray = zMap.get(pX);
			if (typeof xArray === 'undefined') {
				xArray = new Array();
				zMap.set(pX, xArray);
			}
			if (xArray.indexOf(pY) < 0) {
				xArray.push(pY);
			}
		},

		/// returns whether a certain tile has already been requested
		wasTileRequested: function (pZ, pX, pY) {
			var result = false;
			var zMap = this.requestedTiles.get(pZ);
			if (typeof zMap !== 'undefined') {
				var xArray = zMap.get(pX);
				if (Array.isArray(xArray)) {
					result = xArray.indexOf(pY) >= 0;
				}
			}
			return result;
		}
	};

	

	return {
		TilesDownloadHelper: TilesDownloadHelper
	};

})();