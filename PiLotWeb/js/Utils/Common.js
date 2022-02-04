var PiLot = PiLot || {};
PiLot.Utils = PiLot.Utils || {};

PiLot.Utils.Common = {

	/// loads a single user setting from the cache and json-parses it
	loadUserSetting: function (pKey) {
		var json = null;
		var result = null;
		if (typeof (Storage) !== "undefined") {
			json = localStorage.getItem(pKey);
		} else {
			console.log('local storage ist not supported, settings can not be loaded.');
		}
		if ((json !== null) && (json !== 'undefined')) {
			try {
				result = JSON.parse(json);
			}
			catch (error) {
				console.error(error);
			}
		}
		return result;
	},

	/// saves a value, which can be any type of object to the local
	/// storage as json.
	saveUserSetting: function (pKey, pValue) {
		if (typeof (Storage) !== "undefined") {
			localStorage.setItem(pKey, JSON.stringify(pValue));
		} else {
			PiLot.log('no local storage available', 0);
		}
	},

	/// clears the entire local storage
	clearUserSettings: function () {
		if (typeof (Storage) !== "undefined") {
			localStorage.clear();
		} else {
			PiLot.log('no local storage available', 0);
		}
	},

	/**
	 * Tries to read the date in the format yyyyMMdd or as "today" from the querystring "d",
	 * and if done so successfully, returns the date;
	 * @param {PiLot.Model.Common.BoatTime} pBoatTime - the current BoatTime, needed for "today"
	 * */
	parseQsDate: function (pBoatTime) {
		let result = null;
		let qsDate = RC.Utils.getUrlParameter('d');
		if (qsDate !== null) {
			if ((qsDate === 'today') && (pBoatTime !== null)) {
				result = RC.Date.DateOnly.fromObject(pBoatTime.now());
			} else {
				let date = DateTime.fromFormat(qsDate, 'yyyyMMdd');
				if (date !== null && date.isValid) {
					result = RC.Date.DateOnly.fromObject(date);
				}
			}
		}
		return result;
	},

	/**
	 * Adds a date parameter to an url, in a form that it can be parsed by parseQsDate
	 * @param {String} pUrl - The original url without the date query string
	 * @param {RC.Date.DateOnly} pDate - the date to add
	 */
	setQsDate: function (pUrl, pDate) {
		return RC.Utils.setUrlParameter(pUrl, 'd', PiLot.Utils.Common.getQsDateValue(pDate));
	},

	/**
	 * Gets the parameter value to be used for dates in the queryString
	 */
	getQsDateValue: function (pDate) {
		return pDate.toLuxon().toFormat('yyyyMMdd');
	},

	/// converts a relative path into an absolute url on the current host.
	/// use a leading / as in /tiles/xy
	toLocalUrl: function (pRelativePath) {
		return window.location.protocol.concat('//', window.location.hostname, pRelativePath);
	},

	/**
	 * returns an absolute url to a certain PiLot API path. Just pass the part 
	 * after /api/v1, using a leading / as in /Ping. If an absolute url starting
	 * with http: or https: is passed, that very url will be returned
	 */
	
	toApiUrl: function (pApiPath) {
		let path;
		if (!pApiPath.startsWith('http:') && !pApiPath.startsWith('https:')) {
			path = PiLot.Config.apiUrl.concat(pApiPath);
			if (!PiLot.Config.apiUrl.startsWith('http:') && !PiLot.Config.apiUrl.startsWith('https:')) {
				path = PiLot.Utils.Common.toLocalUrl(path);
			}
		} else {
			path = pApiPath;
		}
		return path
	},

	/**
	 * Sends data to the api on the server using PUT, and returns the result as object. This
	 * includes some magic, that is if the data to send is an object which has a function
	 * toServerObject(), that function will be used to json serialize it.
	 * @param {string} pApiPath - the relative Path, as in /Ping
	 * @param {Object} pData - the data as object which will be jsonized, or null
	 * @returns {Object} an object with {data, status}
	 */
	putToServerAsync: async function (pApiPath, pData = null) {
		return await PiLot.Utils.Common.sendToServerAsync(pApiPath, pData, 'PUT', true, true);
	},

	/**
	 * Sends data to the api on the server using POST, and returns the result as object. This
	 * includes some magic, that is if the data to send is an object which has a function
	 * toServerObject(), that function will be used to json serialize it.
	 * @param {string} pApiPath - the relative Path, as in /Ping
	 * @param {Object} pData - the data as object which will be jsonized, or null
	 * @returns {Object} an object with {data, status}
	 */
	postToServerAsync: async function (pApiPath, pData = null) {
		return await PiLot.Utils.Common.sendToServerAsync(pApiPath, pData, 'POST', true, true);
	},

	/**
	 * sends data to the server using the given http method
	 * @param {String} pApiPath - the relative Path, as in /Ping
	 * @param {Object} pData - the data as object which will be jsonized, or null
	 * @param {String} pMethod - the http method, e.g. 'PUT'
	 * @param {Boolean} pLoginOnAuthError - if true (default), a login prompt is shown when recieving an auth error
	 * @param {Boolean} pRetrAfterLogin - if set to true (default is false), the request will be re-sent when the login succeeds
	 * @returns {Object} an object with {data: object, status: http code, ok: Boolean}
	 */
	sendToServerAsync: async function (pApiPath, pData, pMethod, pLoginOnAuthError = true, pRetryAfterLogin = false) {
		let result = { data: null, status: null, ok: false };
		const url = PiLot.Utils.Common.toApiUrl(pApiPath);
		const options = { method: pMethod, credentials: 'same-origin' };
		const replacer = function (key, value) {
			let result;
			if ((value !== null) && (typeof value !== 'undefined') && (typeof value.toServerObject === 'function')) {
				result = value.toServerObject();
			} else {
				result = value;
			}
			return result;
		};
		if (pData !== null) {
			options.headers = { 'Content-Type': 'application/json' };
			options.body = JSON.stringify(pData, replacer);
		}
		const response = await fetch(url, options);
		result.status = response.status;
		result.ok = response.ok;
		if ((response.status === 401) || (response.status == 403)) {
			if (pLoginOnAuthError) {
				const loginForm = PiLot.View.Common.getLoginForm();
				if (pRetryAfterLogin) {
					loginForm.on('loginSuccess', function () {
						PiLot.Utils.Common.sendToServerAsync(pApiPath, pData, pMethod, false, false);
					})
				}
			}
		}
		else if ((response.status === 200) || (result.status === 201) || (result.status === 202)) {
			try {
				const responseType = response.headers.get('Content-Type');
				if (responseType !== null && responseType.indexOf("text/plain") === 0) {
					result.data = await response.text();
				} else {
					result.data = await response.json();
				}
			} catch (ex) {
				PiLot.Utils.Common.log(`Error in sendToServerAsync for url ${pApiPath}: ${ex}`, 0);
			}
		}
		return result;
	},

	/**
	 * Gets data from the server and returns an object or null
	 * @param {string} pApiPath - the relative Path, as in /Ping/1
	 */
	getFromServerAsync: async function (pApiPath) {
		const result = await PiLot.Utils.Common.sendToServerAsync(pApiPath, null, 'GET', true, false);
		return result.data;
	},

	/**
	 * Deletes a resource from the server and returns true, if
	 * the resource was found, and false els
	 * @param {string} pApiPath - the relative Pat, as in /Ping/1
	 */
	deleteFromServerAsync: async function (pApiPath) {
		const url = PiLot.Utils.Common.toApiUrl(pApiPath);
		const response = await fetch(url, { method: 'Delete' });
		return response.ok;
	},

	logLevel: 0, // 0: error, 1: warning, 2: info, 3: debug, 4: trace
	logOutput: 0, // 0: console, 1: logWindow, 2: alert

	/// applies the logLevel and logOutpub from the url, which can be set quickly to debug / logWindow
	/// by using log=1 or can be set individually using the qs keys "logLevel" and "logOut"
	getLogLevel: function () {
		var qsLog = RC.Utils.getUrlParameter('log');
		if (qsLog === '1') {
			PiLot.Utils.Common.logLevel = 3;
			PiLot.Utils.Common.logOutput = 1;
		} else {
			var qsLogLevel = RC.Utils.getUrlParameter('loglevel');
			if (RC.Utils.isNumeric(qsLogLevel)) {
				PiLot.Utils.Common.logLevel = Number(qsLogLevel);
			}
			var qsLogOutput = RC.Utils.getUrlParameter('logout');
			if (RC.Utils.isNumeric(qsLogOutput)) {
				PiLot.Utils.Common.logOutput = Number(qsLogOutput);
			}
		}
	},

	/**
	 * logs a message if the current logLevel is equal or less than pLogLevel
	 * @param {String} pMessage: the message to log
	 * @param {Number} pLogLevel: 0: error - 4: trace
	 * * */
	log: function (pMessage, pLogLevel) {
		if (pLogLevel <= PiLot.Utils.Common.logLevel) {
			switch (PiLot.Utils.Common.logOutput) {
				case 0:
					console.log(pMessage);
					if (PiLot.Utils.Common.logLevel == 4) {
						console.trace();
					}
					break;
				case 1:
					$('#logWindow').html(new Date().toLocaleTimeString().concat(' ', pMessage, '<br/>', $('#logWindow').html()));
					$('#logWindow').show();
					break;
				case 2:
					alert(pMessage);
					break;
			}
		}
	},

	/// converts a distance in meters into a distance in nautical miles
	metersToNauticalMiles: function (pMeters) {
		return pMeters == null ? null : pMeters / 1852;
	},

	/// converts a speed in knots into a speed in meters per second
	knotsToMpS: function (pKnots) {
		return pKnots * 1852 / 3600;
	},

	/// converts a speed in meters per second to knots
	mpsToKnots: function (pMps) {
		return pMps * 3600 / 1852;
	},

	/**
	 * Creates an HTML Element based on a template string, and
	 * makes sure the content of the element is translated.
	 * @param {any} pTemplate
	 */
	createNode: function (pTemplate) {
		const result = RC.Utils.stringToNode(pTemplate);
		PiLot.Utils.Language.applyTexts(result);
		return result;
	},

	/**
	 * Fills a dropdown with data. The data is an array of arrays,
	 * containing key and value. The values will be translated, if
	 * there is a matching text in the current language. Any existing
	 * items will be deleted at first.
	 * @param {HTMLSelectElement} pDropdown - The dropdown control to fill
	 * @param {Array} pData - an array of 2-items arrays, each with value, text
	 * @param {Boolean} pNoTranlsation - Optionally pass false to skip translation
	 */
	fillDropdown: function (pDropdown, pData, pTranlsateTexts = true) {
		pDropdown.clear();
		pData.forEach(function (anItem) {
			let option = document.createElement('option');
			option.value = anItem[0];
			if (pTranlsateTexts) {
				option.innerText = PiLot.Utils.Language.getText(anItem[1]) || anItem[1];
			} else {
				option.innerText = anItem[1];
			}			
			pDropdown.appendChild(option);
		});
	}
};