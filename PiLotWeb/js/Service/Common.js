var PiLot = PiLot || {};
PiLot.Service = PiLot.Service || {};

PiLot.Service.Common = {

	/**
	 * Helps calling the backen API, making sure that authentication is properly
	 * done and errors are logged.
	 */
	ServiceHelper: {

		observers: null,
		errors: [],

		initialize: function(){
			this.observable = new PiLot.Utils.Common.Observable(['error', 'errorsCleared']);
		},

		/**
		 * Registers an observer for an event of the BoatTimeHelper
		 * @param {String} pEvent - 'error', 'errorsCleared'
		 * @param {Object} pObserver - the observer, used to implement 'off' 
		 * @param {Function} pFunction - the function to call
		 */
		on: function(pEvent, pObserver, pFunction){
			this.observable.addObserver(pEvent, pObserver, pFunction)
		},

		//	this.observable.fire('boatTimeChanged', this.currentBoatTime);
		
		/**
		 * converts a relative path into an absolute url on the current host.
		 * use a leading / as in /tiles/xy
		 * @param {String} pRelativePath - the relative path starting with /
		 * @returns {String} the absolute url (as string)
		 * */ 
		toLocalUrl: function (pRelativePath) {
			return window.location.protocol.concat('//', window.location.hostname, pRelativePath);
		},
		
		/**
		 * returns an absolute or relative url to a certain PiLot API path. Just pass the part 
		 * after /api/v1, using a leading / as in /Ping. If an absolute url starting
		 * with http: or https: is passed, that very url will be returned
		 * @param {String} pApiPath - the controller path, absolute or relative, e.g "/Ping"
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
		 * Tries to ping the server. Throws an error, if the server does not respond
		 * afer a certain time.
		 * @param {Number} pTimeoutMS - The milliseconds to wait before timeout
		 * @returns {Boolean} true, if the server can be reached, else false
		 */
		pingServerAsync: async function (pTimeoutMS) {
			const timeoutPromise = new Promise((resolve, reject) =>
				setTimeout(() => resolve(null), pTimeoutMS)
			);
			const pingPromise = this.getFromServerAsync('/Ping');
			const result = await Promise.race([timeoutPromise, pingPromise]);
			return result === 'OK';
		},

		/**
		 * Sends data to the api on the server using PUT, and returns the result as object. This
		 * includes some magic, that is if the data to send is an object which has a function
		 * toServerObject(), that function will be used to json serialize it.
		 * @param {string} pApiPath - the relative Path, as in /Ping
		 * @param {Object} pData - the data as object which will be jsonized, or null
		 * @param {Boolean} pSendRawData - Set to true, if no jsonifying is wanted (e.g. when sending binary data)
		 * @returns {Object} an object with {data, status}
		 */
		putToServerAsync: async function (pApiPath, pData = null, pSendRawData = false) {
			return await this.sendToServerAsync(pApiPath, pData, 'PUT', true, true, pSendRawData);
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
			return await this.sendToServerAsync(pApiPath, pData, 'POST', true, true);
		},

		/**
		 * Gets data from the server and returns an object or null
		 * @param {string} pApiPath - the relative Path, as in /Ping/1
		 * @returns {Object} the result data
		 */
		getFromServerAsync: async function (pApiPath) {
			const result = await this.sendToServerAsync(pApiPath, null, 'GET', true, false);
			return result.data;
		},

		/**
		 * sends data to the server using the given http method
		 * @param {String} pApiPath - the relative Path, as in /Ping
		 * @param {Object} pData - the data as object which will be jsonized, or null
		 * @param {String} pMethod - the http method, e.g. 'PUT'
		 * @param {Boolean} pLoginOnAuthError - if true (default), a login prompt is shown when recieving an auth error
		 * @param {Boolean} pRetrAfterLogin - if set to true (default is false), the request will be re-sent when the login succeeds
		 * @param {Boolean} pSendRawData - Set to true, if no jsonifying is wanted (e.g. when sending binary data)
		 * @return {Object} an object with {data: object, status: http code, ok: Boolean}
		 */
		sendToServerAsync: async function (pApiPath, pData, pMethod, pLoginOnAuthError = true, pRetryAfterLogin = false, pSendRawData = false) {
			let result = { data: null, status: null, ok: false };
			const url = this.toApiUrl(pApiPath);
			const options = { method: pMethod, credentials: 'same-origin' };
			if (!pSendRawData) {
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
			} else {
				options.body = pData;
			}
			try{
				const response = await fetch(url, options);
				result.status = response.status;
				result.ok = response.ok;
				const responseType = response.headers.get('Content-Type');
				const isTextResponse = (responseType !== null) && responseType.includes("text/plain");
				const isJsonResponse = (responseType !== null) && responseType.includes("application/json");
				if ((result.status === 401) || (result.status == 403)) {
					if (pLoginOnAuthError) {
						const loginForm = PiLot.View.Common.getLoginForm();
						if (pRetryAfterLogin) {
							loginForm.on('loginSuccess', function () {
								this.sendToServerAsync(pApiPath, pData, pMethod, false, false);
							})
						}
					}
				}
				else if (!result.ok){
					let responseText = 'n/a';
					if(this.isTextResponse){
						responseText = await response.text()
					};
					const error = {
						clientTimestamp: DateTime.utc(),
						errorType: 'fetch',
						httpStatus: result.status,
						requestUrl: url,
						requestBody: options.body || 'n/a',
						message: responseText
					}
					this.errors.push(error);
					this.observable.fire('error', error);
					console.log(this.errors);
				}
				else if (result.status !== 204) {
					if (isTextResponse) {
						result.data = await response.text();
					} else if (isJsonResponse) {
						result.data = await response.json();
					}
				}
			} catch(ex){
				const error = {
					clientTimestamp: DateTime.utc(),
					errorType: 'exception',
					httpStatus: result.status,
					requestUrl: url,
					requestBody: options.body,
					message: ex
				}
				this.errors.push(error);
				this.observable.fire('error', error);
				console.log(this.errors);
			}
			return result;
		},

		/**
		 * Deletes a resource from the server and returns true, if
		 * the resource was found, and false else
		 * @param {string} pApiPath - the relative Pat, as in /Ping/1
		 */
		deleteFromServerAsync: async function (pApiPath) {
			const url = this.toApiUrl(pApiPath);
			const response = await fetch(url, { method: 'Delete' });
			return response.ok;
		},

		/** @returns {Object[]} the list of all errors, the latest is the last */
		getErrors: function(){
			return this.errors;
		},

		/** clears all errors */
		clearErrors: function(){
			this.errors = [];
			this.observable.fire('errorsCleared');
		}

	},

    BoatTimeService: {

        /** @returns {Object} an object containing the current boatTime utc offset and server time */
        loadBoatTimeInfoAsync: async function(){
            return json = await PiLot.Service.Common.ServiceHelper.getFromServerAsync('/Settings/boatTime');
        },

        /** @param {PiLot.Model.Common.BoatTime} pBoatTime - the boat time to save */
        saveBoatTimeAsync: async function(pBoatTime){
            await PiLot.Service.Common.ServiceHelper.putToServerAsync(`/Settings/boatTime?utcOffset=${pBoatTime.getUtcOffsetMinutes()}`);
        },

        /**
         * Sets the current client time to the server and returns the result 
         * @returns {String} the result from the date command
         * */
        setServerTimeAsync: async function () {
            const millisUtc = RC.Date.DateHelper.utcNowMillis() + 50; // we add a tiny bit of milliseconds as it will take some time :-)
            return await PiLot.Service.Common.ServiceHelper.putToServerAsync(`/System/date?millisUtc=${millisUtc}`);
        }
    },
}