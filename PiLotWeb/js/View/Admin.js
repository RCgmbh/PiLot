/// safely initialize Namespaces
var PiLot = PiLot || {};
PiLot.View = PiLot.View || {};

/**
 * Namespace with GUIs for system admin functionality
 * */
PiLot.View.Admin = (function () {

	/**
	 * The very basic page with just tiles
	 * */
	var AdminOverviewPage = function () {
		this.draw();
	};

	AdminOverviewPage.prototype = {

		/** Draws the page and sets the link urls based on the Loader logic */
		draw: function () {
			const loader = PiLot.Utils.Loader;
			const pageContent = PiLot.Utils.Common.createNode(PiLot.Templates.Admin.adminOverviewPage);
			loader.getContentArea().appendChild(pageContent);
			pageContent.querySelector('.lnkTime').setAttribute('href', loader.createPageLink(loader.pages.systemTime));
			pageContent.querySelector('.lnkWiFi').setAttribute('href', loader.createPageLink(loader.pages.wifi));
			pageContent.querySelector('.lnkServices').setAttribute('href', loader.createPageLink(loader.pages.services));
			pageContent.querySelector('.lnkSystemStatus').setAttribute('href', loader.createPageLink(loader.pages.systemStatus));
			pageContent.querySelector('.lnkLog').setAttribute('href', loader.createPageLink(loader.pages.logs));
			pageContent.querySelector('.lnkShutDown').setAttribute('href', loader.createPageLink(loader.pages.shutDown));
		}
	};

	/**
	 * Represents a page which shows the current BoatTime and allows to change it
	 */
	var BoatTimePage = function () {

		this.boatTime = null;					// the current BoatTime
		this.formatString = 'yyyy-LL-dd TT';	// string used to format date/times

		this.lblClientTime = null;				// label showing the client time
		this.lblClientErrorOffset = null;		// label showing the error offset between client and server
		this.lblClientTimezoneOffset = null;	// label showing the clients timezone utc offset
		this.lblServerTime = null;				// label showing the server UTC time
		this.tbDateCommand = null;				// textbox containing the text to copy into the console in order to set the server time
		this.btnCopy = null;					// button to copy the text from the textbox above
		this.lblBoatTime = null;				// label showing the current BoatTime
		this.lblBoatTimeOffset = null;			// label showing the UTC offset of the BoatTime
		this.btnMinus = null;					// button to reduce the BoatTime by 1 hour
		this.btnPlus = null;					// button to increase the BoatTime by 1 hour
		this.clockCanvas = null;				// the canvas where the clock will be drawn
		this.analogClock = null;				// the AnalogClock object representing the clock

		this.initializeAsync();
	};

	BoatTimePage.prototype = {

		initializeAsync: async function () {
			this.boatTime = await PiLot.Model.Common.getCurrentBoatTimeAsync();
			this.draw();
			this.showTime();
			this.startTimer();
		},

		lnkSetServerTime_click: async function () {
			if (confirm(PiLot.Utils.Language.getText('confirmApplyClientTime'))) {
				await PiLot.Model.Admin.setServerTimeAsync();
                this.boatTime = await PiLot.Model.Common.getCurrentBoatTimeAsync(true);
				this.showTime();
			}
		},

		btnMinus_click: function () {
			this.changeBoardTime(-1);
		},

		btnPlus_click: function () {
			this.changeBoardTime(1);
		},

		draw: function () {
			const loader = PiLot.Utils.Loader;
			const contentArea = loader.getContentArea();
			contentArea.appendChildren(RC.Utils.stringToNodes(PiLot.Templates.Admin.timePage));
			this.lblClientTime = contentArea.querySelector('#lblClientTime');
			this.lblClientErrorOffset = contentArea.querySelector('#lblClientErrorOffset');
			this.lblClientTimezoneOffset = contentArea.querySelector('#lblClientTimezoneOffset');
			this.lblServerTime = contentArea.querySelector('#lblServerTime');
			contentArea.querySelector('.lnkSetServerTime').addEventListener('click', this.lnkSetServerTime_click.bind(this));
			this.lblBoatTime = contentArea.querySelector('#lblBoatTime');
			this.lblBoatTimeOffset = contentArea.querySelector('#lblBoatTimeOffset');
			this.btnMinus = contentArea.querySelector('#btnMinus');
			this.btnMinus.onclick = this.btnMinus_click.bind(this);
			this.btnPlus = contentArea.querySelector('#btnPlus');
			this.btnPlus.onclick = this.btnPlus_click.bind(this);
			PiLot.Utils.Language.applyTexts(contentArea);
			this.clockCanvas = contentArea.querySelector('#lblClientTime');
			this.analogClock = Analogclock.drawClock('clockCanvas', this.boatTime.getUtcOffsetHours(), this.boatTime.getClientErrorOffsetSeconds() * -1);
		},

		startTimer: function () {
			const milliseconds = DateTime.local().millisecond;
			window.setTimeout(function () {
				this.showTime();
				window.setInterval(this.showTime.bind(this), 1000);
			}.bind(this), 1010 - milliseconds);
		},

		changeBoardTime: function (pHours) {
			this.boatTime.setUtcOffset(this.boatTime.getUtcOffsetMinutes() + (pHours * 60));
			this.showBoatTime();
			this.analogClock.getClockOpts().hoursOffset = this.boatTime.getUtcOffsetHours();
		},

		showTime: function () {
			this.showClientTime();
			this.showServerTime();
			this.showBoatTime();
		},

		showClientTime: function () {
			const nowLocal = DateTime.local();
			this.lblClientTime.innerText = nowLocal.toFormat(this.formatString);
			this.lblClientTimezoneOffset.innerText = nowLocal.toFormat('ZZZ');
		},

		showServerTime: function () {
			this.lblServerTime.innerText = this.boatTime.utcNow().toFormat(this.formatString);
		},

		showBoatTime: function () {
			const boatTimeNow = this.boatTime.now();
			this.lblClientErrorOffset.innerText = this.boatTime.getClientErrorOffsetSeconds().toFixed(1);
			this.lblBoatTime.innerText = boatTimeNow.toFormat(this.formatString);
            this.lblBoatTimeOffset.innerText = boatTimeNow.toFormat('ZZZ');
		}
	};

	var SystemStatusPage = function () {

		this.chart = null;
		this.initialize();

	};

	SystemStatusPage.prototype = {

		initialize: function () {
			this.draw();
			this.showCPUTemperature();
			this.startCPUTempTimer();
		},

		draw: function () {
			const loader = PiLot.Utils.Loader;
			const contentArea = loader.getContentArea();
			contentArea.appendChild(PiLot.Utils.Common.createNode(PiLot.Templates.Admin.systemStatusPage));
			const controls = {
				loading: contentArea.querySelector('.chartWait'),
				chart: contentArea.querySelector('.chartContainer')
			};
			this.chart = new PiLot.Utils.Chart.DataChart(controls, 60, 20, null, null);
		},

		showCPUTemperature: function () {
			PiLot.Utils.Chart.loadRecentDataAsync('cpuTemperature', 7200, 120).then(pData => this.chart.showChart(pData));
		},

		startCPUTempTimer: function () {
			window.setInterval(this.showCPUTemperature.bind(this), 10000);
		},
	};

	/** The page containing the status and interaction with services */
	var ServicesPage = function () {

		this.serviceInfos = null;
		this.initializeAsync();

	};

	ServicesPage.prototype = {

		initializeAsync: async function () {
			await this.drawAsync();
			this.startServiceTimer();
		},

		drawAsync: async function () {
			const loader = PiLot.Utils.Loader;
			const contentArea = loader.getContentArea();
			contentArea.appendChild(PiLot.Utils.Common.createNode(PiLot.Templates.Admin.servicesPage));
			const plhServices = contentArea.querySelector('.plhServices');
			this.serviceInfos = new Array();
			const services = await PiLot.Model.Admin.getServicesAsync();
			services.forEach(function (s) {
				this.serviceInfos.push(new ServiceInfo(s, plhServices));
			}.bind(this));
		},

		showServiceStates: function () {
			this.serviceInfos.forEach(s => s.loadStatusAsync());
		},

		startServiceTimer: function () {
			window.setInterval(this.showServiceStates.bind(this), PiLot.Config.System.Admin.servicesUpdateInterval * 1000);
		}

	};

	/**
	 * A controls showing the status of a service and allowing to interact with the service
	 * @param {String} pServiceName - the name of the service, as used by the OS
	 * @param {HTMLElement} pPlaceholder - the container to which the control will be added
	 */
	var ServiceInfo = function (pServiceName, pPlaceholder) {
		this.serviceName = pServiceName;
		this.placeholder = pPlaceholder;
		this.lblStatus = null;
		this.initialize();
	};

	ServiceInfo.prototype = {

		initialize: function () {
			this.draw();
			this.loadStatusAsync();
		},

		lnkStart_click: function () {
			this.changeStatusAsync('start');
		},

		lnkStop_click: function () {
			this.changeStatusAsync('stop');
		},

		lnkRestart_click: function () {
			this.changeStatusAsync('restart');
		},

		draw: function () {
			const control = PiLot.Utils.Common.createNode(PiLot.Templates.Admin.serviceInfo);
			this.placeholder.appendChild(control);
			control.querySelector('.lblService').innerText = this.serviceName;
			this.lblStatus = control.querySelector('.lblStatus');
			control.querySelector('.lnkStart').addEventListener('click', this.lnkStart_click.bind(this));
			control.querySelector('.lnkStop').addEventListener('click', this.lnkStop_click.bind(this));
			control.querySelector('.lnkRestart').addEventListener('click', this.lnkRestart_click.bind(this));
		},

		loadStatusAsync: async function () {
			const status = await PiLot.Utils.Common.getFromServerAsync(`/Services/${this.serviceName}`);
			this.showStatus(status);
		},

		showStatus: function (pStatus) {
			this.lblStatus.innerText = pStatus;
		},

		changeStatusAsync: async function (pAction) {
			const result = await PiLot.Utils.Common.putToServerAsync(`/Services/${this.serviceName}/${pAction}`);
			this.showStatus(result.data);
		}
	};

	/**
	 * This incombarably sophisticated piece of software engineering ingenuity represents
	 * a page that is shown when the PiLot is shutting down. Now only does it show a dialog
	 * where the user has to confirm the shutdown, but also it observes whethere the PiLot 
	 * is still available, and shows green, orange and red boxes with kind text inside to let
	 * the user have no doubt about the current state of the computer. Rarely have there been
	 * more lines of code with less use.
	 * */
	var ShutdownPage = function () {
		this.pingInterval = null;
		this.previousResult = null;

		this.pnlAvailable = null;
		this.pnlShuttingDown = null;
		this.pnlUnavailable = null;

		this.initialize();
	};

	ShutdownPage.prototype = {

		initialize: function () {
			this.draw();
			this.callPing();
			this.startPing(2000);
		},

		draw: function () {
			const loader = PiLot.Utils.Loader;
			const contentArea = loader.getContentArea();
			contentArea.appendChild(PiLot.Utils.Common.createNode(PiLot.Templates.Admin.shutdownPage));
			this.pnlAvailable = contentArea.querySelector('.pnlAvailable');
			this.pnlShuttingDown = contentArea.querySelector('.pnlShuttingDown');
			this.pnlUnavailable = contentArea.querySelector('.pnlUnavailable');
			setTimeout(this.showConfirmDialog.bind(this), 100);
		},

		/** Shows a confirm dialog and then calls the shut down action against the api */
		showConfirmDialog: function () {
			if (window.confirm(PiLot.Utils.Language.getText('confirmShutDown'))) {
				this.pnlShuttingDown.hidden = false;
				this.pnlAvailable.hidden = true;
				fetch(PiLot.Utils.Common.toApiUrl(`/System/shutdown`), { method: 'PUT' });
			}
		},

		/**
		 * Starts the ping interval, which regularily tries to reach the PiLot
		 * @param {Number} pInterval - the interval in ms
		 */
		startPing: function (pInterval) {
			if (this.pingInterval) {
				clearInterval(this.pingInterval);
			}			
			this.pingInterval = setInterval(this.callPing.bind(this), pInterval);
		},

		/** calls the ping REST endpoint and does stuffs with the result */
		callPing: async function () {
			let result = await PiLot.Utils.Common.pingServerAsync(5000);
			this.handlePingResult(result);
		},

		/**
		 * Handles the ping result. When the state changes, a whole lot of 
		 * magic is done, such as changing to a faster ping interval, if 
		 * the device is available, or a slower if it's not available (to
		 * not make the wakeup too stressing)
		 * @param {Boolean} pResult - true, if pinging was successful
		 */
		handlePingResult: function (pResult) {
			if (pResult !== this.previousResult) {
				this.showAvailable(pResult);
				this.startPing(pResult ? 2000 : 30000);
				this.previousResult = pResult;
			}
		},

		/**
		 * Shows the apropriate colored boxes with kind texts inside.
		 * @param {Boolean} pAvailable - true: PiLot is available
		 */
		showAvailable: function (pAvailable) {
			this.pnlAvailable.hidden = !pAvailable;
			this.pnlUnavailable.hidden = pAvailable;
			if (!pAvailable) {
				this.pnlShuttingDown.hidden = true;
			}
		},
	};

	var wifiIconInstance = null;

	/** An icon showing the current wifi state */
	var WiFiIcon = function () {
		this.wifiHelper = null;
		this.icoWiFiInternet = null;
		this.icoWiFiConnected = null;
		this.initialize();
	}

	WiFiIcon.prototype = {

		initialize: function () {
			this.wifiHelper = new PiLot.Model.Admin.WiFiHelper();
			const authHelper = PiLot.Model.Common.AuthHelper.instance();
			authHelper.on('login', this.authHelper_change.bind(this));
			authHelper.on('logout', this.authHelper_change.bind(this));
			this.draw();
			this.showWiFiStatusAsync();
			this.startUpdateInterval();
		},

		authHelper_change: function () {
			this.toggleAdminLinks();
		},

		draw: function () {
			const control = PiLot.Utils.Common.createNode(PiLot.Templates.Admin.wifiIcon);
			PiLot.Utils.Loader.getIconsArea().appendChild(control);
			this.icoWiFiInternet = control.querySelector('.icoWiFiInternet');
			this.icoWiFiConnected = control.querySelector('.icoWiFiConnected');
			this.toggleAdminLinks();
		},

		showWiFiStatusAsync: async function () {
			const wifiStatus = await this.wifiHelper.getOverallStatusAsync();
			this.icoWiFiInternet.hidden = !wifiStatus.internetAccess;
			this.icoWiFiConnected.hidden = wifiStatus.internetAccess || !wifiStatus.connected;
		},

		startUpdateInterval: function () {
			window.setInterval(this.showWiFiStatusAsync.bind(this), 10000);
		},

		/**
		 * Adds the links to the wifi admin page to the icons, if the user has the required permissions
		 */
		toggleAdminLinks: function () {
			let url;
			if (PiLot.Permissions.hasSystemAccess()) {
				const url = PiLot.Utils.Loader.createPageLink(PiLot.Utils.Loader.pages.wifi);
				this.icoWiFiInternet.setAttribute('href', url);
				this.icoWiFiConnected.setAttribute('href', url);
			} else {
				this.icoWiFiInternet.removeAttribute('href');
				this.icoWiFiConnected.removeAttribute('href');
			}
		}
	}

	/** Singleton accessor returning the current WiFiIcon */
	WiFiIcon.getInstance = function () {
		if (wifiIconInstance === null) {
			wifiIconInstance = new WiFiIcon();
		}
		return wifiIconInstance;
	};

	/** The page showing the list of available wireless networks and allowing to connect to them */
	var WiFiPage = function () {
		this.wifiHelper = null;
		this.ddlInterface = null;
		this.icoWait = null;
		this.lnkRefresh = null;
		this.plhNetworks = null;
		this.pnlNetworkKey = null;
		this.pnlOutput = null;
		this.initializeAsync();
	};

	WiFiPage.prototype = {

		initializeAsync: async function () {
			this.wifiHelper = new PiLot.Model.Admin.WiFiHelper();
			PiLot.Model.Common.AuthHelper.instance().on('login', this.authHelper_login.bind(this));
			await this.drawAsync();
			this.loadInterfacesAsync();
		},

		authHelper_login: function () {
			this.loadNetworksAsync();
		},

		ddlInterface_change: function () {
			const value = this.ddlInterface.value;
			if (value) {
				PiLot.Utils.Common.saveUserSetting('PiLot.View.Admin.SelectedInterface', this.ddlInterface.value);
				this.selectInterfaceAsync(this.ddlInterface.value);
			}
		},

		lnkRefresh_click: function(){
			this.loadNetworksAsync();
		},

		lnkName_click: async function (pSSID, pIsAvailable, pIsKnown, pNumber) {
			if (!pIsAvailable) {
				alert(PiLot.Utils.Language.getText('wifiUnavailable'));
			} else if (!pIsKnown) {
				this.showKeyDialog(pSSID);
			} else {
				this.showHideWait(true);
				const output = await this.wifiHelper.selectWiFiAsync(pNumber);
				this.showOutput(output.data);
				this.loadNetworksAsync();
			}
		},

		lnkForget_click: async function (pSSID, pNumber) {
			if (window.confirm(PiLot.Utils.Language.getText('wifiConfirmForgetX').replace('{{x}}', pSSID))) {
				this.showHideWait(true);
				const output = await this.wifiHelper.forgetWiFiAsync(pNumber);
				this.showOutput(`delete ${output ? 'OK\n' : 'FAILED\n'}`);
				await this.loadNetworksAsync();
			}
		},

		btnClose_click: function () {
			this.hideKeyDialog();
		},

		btnConnect_click: async function (pSSID) {
			this.hideKeyDialog();
			this.icoWait.hidden = false;
			const key = this.pnlNetworkKey.querySelector('.tbWifiKey').value;
			const output = await this.wifiHelper.addWiFiAsync(pSSID, key);
			this.showOutput(output.data);
			WiFiIcon.getInstance().showWiFiStatusAsync();
			this.loadNetworksAsync();
		},

		btnCancel_click: function () {
			this.hideKeyDialog();
		},

		lnkStatus_click: async function () {
			const output = await this.wifiHelper.getWiFiStatusAsync();
			this.showOutput(output);
		},

		lnkClear_click: function () {
			this.pnlOutput.innerText = "";
		},

		drawAsync: async function () {
			const loader = PiLot.Utils.Loader;
			const contentArea = loader.getContentArea();
			contentArea.appendChild(PiLot.Utils.Common.createNode(PiLot.Templates.Admin.wifiPage));
			this.ddlInterface = contentArea.querySelector('.ddlInterface');
			this.ddlInterface.addEventListener('change', this.ddlInterface_change.bind(this));
			this.lnkRefresh = contentArea.querySelector('.lnkRefresh');
			this.lnkRefresh.addEventListener('click', this.lnkRefresh_click.bind(this));
			this.plhNetworks = contentArea.querySelector('.plhNetworks');
			this.icoWait = contentArea.querySelector('.icoWait');
			this.pnlNetworkKey = contentArea.querySelector('.pnlNetworkKey');
			this.pnlNetworkKey.querySelector('.btnClose').addEventListener('click', this.btnClose_click.bind(this));
			this.pnlNetworkKey.querySelector('.btnCancel').addEventListener('click', this.btnCancel_click.bind(this));
			this.pnlOutput = contentArea.querySelector('.pnlOutput');
			contentArea.querySelector('.lnkStatus').addEventListener('click', this.lnkStatus_click.bind(this));
		},

		loadInterfacesAsync: async function () {
			const interfaces = await this.wifiHelper.getInterfacesAsync();
			const selectableInterfaces = [];
			for (const interface of interfaces) {
				interface.startsWith('p2p') || selectableInterfaces.push(interface);
			}
			if (selectableInterfaces.length == 1) {
				await this.selectInterfaceAsync(selectableInterfaces[0]);
			} else if (selectableInterfaces.length > 1) {
				const ddlValues = [];
				for (const interface of selectableInterfaces) {
					ddlValues.push([interface, interface]);
				}
				RC.Utils.fillDropdown(this.ddlInterface, ddlValues, ['', PiLot.Utils.Language.getText('selectInterface')]);
				this.ddlInterface.hidden = false;
				const savedInterface = PiLot.Utils.Common.loadUserSetting('PiLot.View.Admin.SelectedInterface');
				if (savedInterface && selectableInterfaces.includes(savedInterface)) {
					this.ddlInterface.value = savedInterface;
					await this.selectInterfaceAsync(savedInterface);
				}
			}
		},

		selectInterfaceAsync: async function (pInterface) {
			this.ddlInterface.disabled = true;
			this.wifiHelper.setInterface(pInterface);
			await this.loadNetworksAsync();
			this.ddlInterface.disabled = false;
		},

		loadNetworksAsync: async function () {
			this.plhNetworks.clear();
			this.showHideWait(true);
			this.showOutput('loading networks...');
			const interval = window.setInterval(this.showOutput.bind(this, '.'), 1000);
			const networks = await this.wifiHelper.getWiFiInfosAsync();
			if (networks) {
				networks.sort(function (a, b) {
					return (b.signalStrength || -100) - (a.signalStrength || -100) || a.ssid.localeCompare(b.ssid); 					
				});
				for (let i = 0; i < networks.length; i++) {
					const node = PiLot.Utils.Common.createNode(PiLot.Templates.Admin.networkInfo);
					this.plhNetworks.appendChild(node);
					const lnkName = node.querySelector('.lnkName');
					lnkName.innerText = networks[i].ssid;
					lnkName.addEventListener('click', this.lnkName_click.bind(this, networks[i].ssid, networks[i].isAvailable, networks[i].isKnown, networks[i].number));
					const level = Math.ceil(networks[i].signalStrength / -33);
					node.querySelector('.icoWeak').hidden = (level != 3);
					node.querySelector('.icoMedium').hidden = (level != 2);
					node.querySelector('.icoStrong').hidden = (level != 1);
					node.querySelector('.icoConnected').hidden = !networks[i].isConnected;
					const lnkForget = node.querySelector('.lnkForget');
					lnkForget.hidden = !networks[i].isKnown;
					lnkForget.addEventListener('click', this.lnkForget_click.bind(this, networks[i].ssid, networks[i].number))
				}
				this.showOutput(' done\n');
			} else {
				this.showOutput(' failed\n');
			}
			window.clearInterval(interval);
			this.showHideWait(false);
		},

		showKeyDialog: function (pSSID) {
			this.pnlNetworkKey.hidden = false;
			this.pnlNetworkKey.querySelector('.lblDialogTitle').innerText = PiLot.Utils.Language.getText('wifiConnectX').replace('{{x}}', pSSID);
			this.pnlNetworkKey.querySelector('.tbWifiKey').value='';
			this.pnlNetworkKey.querySelector('.tbWifiKey').focus();
			this.pnlNetworkKey.querySelector('.tbWifiKey').select();
			this.pnlNetworkKey.querySelector('.btnConnect').onclick = this.btnConnect_click.bind(this, pSSID);
		},

		hideKeyDialog: function () {
			this.pnlNetworkKey.hidden = true;
		},

		showHideWait: function (pShow) {
			this.icoWait.hidden = !pShow;
			this.lnkRefresh.hidden = pShow
		},

		showOutput: function (pOutput) {
			pOutput = pOutput.replace('\n', '<br/>')
			this.pnlOutput.insertAdjacentHTML('beforeend', pOutput);
			this.pnlOutput.scrollTop = this.pnlOutput.scrollHeight;
		}
	};

	/** A Page listing the logfiles and allowing to open them */
	var LogFilesPage = function () {
		this.dataLoader = null;
		this.divLogFile = null;
		this.divLogFilesList = null;
		this.tblLogFiles = null;
		this.rowTemplate = null;
		this.divPaging = null;
		this.dataRows = null;
		this.pageSize = 50;
		this.currentPage = 0;
		this.pagerMaxPages = 9;
		this.initializeAsync();
	};

	LogFilesPage.prototype = {

		initializeAsync: async function () {
			this.dataRows = new Array();
			this.dataLoader = new PiLot.Model.Admin.LogFilesLoader();
			this.draw();
			this.loadData();
		},

		/**
		 * handles the click on a file, by displaying the file content
		 * @param {String} pFilename
		 */
		lnkFile_click: function (pFilename) {
			this.showLogFile(pFilename);
		},

		/**
		 * handles the click on the delete icon, by deleting the file after a confirmation
		 * @param {String} pFilename
		 */
		lnkDelete_click: function (pFilename) {
			if (window.confirm(PiLot.Utils.Language.getText('confirmDeleteElement'))){
				this.deleteLogFile(pFilename);
			}
		},

		/** handles the click on the close icon in the file content box */
		lnkCloseLogFile_click: function () {
			RC.Utils.showHide(this.divLogFile, false);
			RC.Utils.showHide(this.divLogFilesList, true);
		},

		/**
		 * handles pager link clicks
		 * @param {any} pPage
		 */
		lnkPager_click: function (pPage) {
			this.currentPage = pPage;
			this.loadData();
		},

		/** draws the the page based on the template, saves the tempalte row
		 * for later use and removes it from the table */
		draw: function () {
			const loader = PiLot.Utils.Loader;
			const contentArea = loader.getContentArea();
			contentArea.appendChild(PiLot.Utils.Common.createNode(PiLot.Templates.Admin.logFilePage));
			this.divLogFile = contentArea.querySelector('.divLogFile');
			this.divLogFile.querySelector('.lnkCloseLogFile').addEventListener('click', this.lnkCloseLogFile_click.bind(this));
			this.divLogFilesList = contentArea.querySelector('.divLogFilesList');
			this.tblLogFiles = this.divLogFilesList.querySelector('.tblLogFiles');
			this.rowTemplate = this.tblLogFiles.querySelector('.trTemplate');
			this.rowTemplate.classList.remove('trTemplate');
			this.rowTemplate.parentNode.removeChild(this.rowTemplate);
			this.divPaging = contentArea.querySelector('.divPaging');
		},

		/** loads the data and shows it */
		loadData: async function () {
			let data = await this.dataLoader.loadLogFiles(this.currentPage * this.pageSize, this.pageSize);
			this.showData(data);
		},

		/**
		 * Shows the data within the table, and updates the paging if necessary
		 * @param {Object} pData - {logFiles: array of {fileName, dateChanged, bytes}, totalItems: Int}
		 */
		showData: function (pData) {
			const tableBody = this.tblLogFiles.querySelector('tbody');
			while (this.dataRows.length > 0) {
				tableBody.removeChild(this.dataRows.pop());
			}			
			for (let i = 0; i < pData.logFiles.length; i++) {
				this.drawRow(pData.logFiles[i], tableBody);
			}
			this.showPaging(pData.totalItems);
		},

		/**
		 * Loads the content of the logFile and shows it
		 * @param {String} pFilename - the filename
		 */
		showLogFile: async function (pFilename) {
			RC.Utils.showHide(this.divLogFilesList, false);
			const content = await this.dataLoader.loadLogFile(pFilename);
			this.divLogFile.querySelector('.lblFilename').innerText = pFilename;
			this.divLogFile.querySelector('.divContent').innerText = content;
			RC.Utils.showHide(this.divLogFile, true);
		},

		/**
		 * Deletes a logfile
		 * @param {String} pFilename - the filename
		 */
		deleteLogFile: async function (pFilename) {
			await this.dataLoader.deleteLogFile(pFilename);
			this.loadData();
		},

		/**
		 * Draws a row and appends it to the table body
		 * @param {Object} pLogFile - the logfile info {filename, dateChanged, bytes}, where dateChanged is unix utc timestamp
		 * @param {HTMLElement} pTableBody - the table body to add the row to
		 */
		drawRow: function (pLogFile, pTableBody) {
			const row = this.rowTemplate.cloneNode(true);
			const lnkFile = row.querySelector('.lnkFile');
			lnkFile.innerText = pLogFile.filename;
			lnkFile.addEventListener('click', this.lnkFile_click.bind(this, pLogFile.filename));
			const tdDate = row.querySelector('.tdDate');
			tdDate.innerText = RC.Date.DateHelper.unixToLuxon(pLogFile.dateChanged).toFormat('yyyy-MM-dd -- HH:mm:ss');
			const tdBytes = row.querySelector('.tdBytes');
			tdBytes.innerText = (pLogFile.bytes / 1024).toFixed(0);
			const lnkDelete = row.querySelector('.lnkDelete');
			lnkDelete.addEventListener('click', this.lnkDelete_click.bind(this, pLogFile.filename));
			this.dataRows.push(row);
			pTableBody.appendChild(row);
		},

		/**
		 * shows the paging if necessary. Only a maximum number of page links are 
		 * displayed, we can add a "first" and "last" link in the future.
		 * @param {Number} pTotalItems - the total number of items in the result
		 * */
		showPaging: function (pTotalItems) {
			if (pTotalItems > this.pageSize) {
				RC.Utils.showHide(this.divPaging, false);
				this.divPaging.clear();
				let minPage = Math.max(0, this.currentPage - Math.floor(this.pagerMaxPages / 2));
				let maxPage = Math.min(minPage + this.pagerMaxPages, Math.ceil(pTotalItems / this.pageSize)) - 1;
				minPage = Math.max(Math.min(minPage, maxPage - this.pagerMaxPages + 1), 0);
				for (let i = minPage; i <= maxPage; i++) {
					let lnkPager = document.createElement('a');
					this.divPaging.appendChild(lnkPager);
					lnkPager.setAttribute('href', '#');
					lnkPager.innerText = i + 1;
					lnkPager.addEventListener('click', this.lnkPager_click.bind(this, i));
					if (i == this.currentPage) {
						lnkPager.classList.add('active');
					}
				}
			} else {
				RC.Utils.showHide(this.divPaging, false);
			}
		}
	};

	/// return the classes
	return {
		AdminOverviewPage: AdminOverviewPage,
		WiFiIcon: WiFiIcon,
		WiFiPage: WiFiPage,
		BoatTimePage: BoatTimePage,
		SystemStatusPage: SystemStatusPage,
		ServicesPage: ServicesPage,
		ServiceInfo: ServiceInfo,
		ShutdownPage: ShutdownPage,
		LogFilesPage: LogFilesPage
	};

})();