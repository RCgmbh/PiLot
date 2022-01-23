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
			let loader = PiLot.Utils.Loader;
			PiLot.View.Common.setCurrentMainMenuPage(loader.pages.system.admin.overview);
			let pageContent = PiLot.Utils.Common.createNode(PiLot.Templates.Admin.adminOverviewPage);
			loader.getContentArea().appendChild(pageContent);
			pageContent.querySelector('.lnkTime').setAttribute('href', loader.createPageLink(loader.pages.system.admin.time));
			pageContent.querySelector('.lnkServices').setAttribute('href', loader.createPageLink(loader.pages.system.admin.services));
			pageContent.querySelector('.lnkSystemStatus').setAttribute('href', loader.createPageLink(loader.pages.system.admin.status));
			pageContent.querySelector('.lnkLog').setAttribute('href', loader.createPageLink(loader.pages.system.admin.log));
			pageContent.querySelector('.lnkShutDown').addEventListener('click', this.lnkShutDown_click);
		},

		/**
		 * Handles the click on "Shut down" by showing a confirm dialog and then calling
		 * the shut down action against the api, then loads a nice image
		 * @param {Event} e
		 */
		lnkShutDown_click: function (e) {
			e.preventDefault();
			if (window.confirm(PiLot.Utils.Language.getText('confirmShutDown'))) {
				document.location = 'img/evening.jpg';
				fetch(PiLot.Utils.Common.toApiUrl(`/System/shutdown`), { method: 'PUT' });
			}
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
			PiLot.View.Common.setCurrentMainMenuPage(PiLot.Utils.Loader.pages.system.admin.overview);
			this.boatTime = await PiLot.Model.Common.getCurrentBoatTimeAsync();
			this.draw();
			this.showTime();
			this.startTimer();
		},

		lnkSetServerTime_click: async function () {
			if (confirm(PiLot.Utils.Language.getText('confirmApplyClientTime'))) {
				await PiLot.Model.Admin.setServerTime();
				this.boatTime = await PiLot.Model.Common.getCurrentBoatTimeAsync();
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
			contentArea.querySelector('.lnkSettings').setAttribute('href', loader.createPageLink(loader.pages.system.admin.overview));
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
			this.analogClock = Analogclock.drawClock('clockCanvas', this.boatTime.getUtcOffsetHours());
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
			RC.Utils.setText(this.lblClientTime, nowLocal.toFormat(this.formatString));
			RC.Utils.setText(this.lblClientTimezoneOffset, nowLocal.toFormat('ZZZ'));
		},

		showServerTime: function () {
			RC.Utils.setText(this.lblServerTime, this.boatTime.utcNow().toFormat(this.formatString));
		},

		showBoatTime: function () {
			const boatTimeNow = this.boatTime.now();
			RC.Utils.setText(this.lblClientErrorOffset, this.boatTime.getClientErrorOffsetSeconds().toFixed(1));
			RC.Utils.setText(this.lblBoatTime, boatTimeNow.toFormat(this.formatString));
			RC.Utils.setText(this.lblBoatTimeOffset, boatTimeNow.toFormat('ZZZ'));
		}
	};

	var SystemStatusPage = function () {

		this.chart = null;
		this.initialize();

	};

	SystemStatusPage.prototype = {

		initialize: function () {
			PiLot.View.Common.setCurrentMainMenuPage(PiLot.Utils.Loader.pages.system.admin.overview);
			this.draw();
			this.showCPUTemperature();
			this.startCPUTempTimer();
		},

		draw: function () {
			const loader = PiLot.Utils.Loader;
			const contentArea = loader.getContentArea();
			contentArea.appendChild(PiLot.Utils.Common.createNode(PiLot.Templates.Admin.systemStatusPage));
			contentArea.querySelector('.lnkSettings').setAttribute('href', loader.createPageLink(loader.pages.system.admin.overview));
			const controls = {
				error: contentArea.querySelector('.chartError'),
				loading: contentArea.querySelector('.chartWait'),
				chart: contentArea.querySelector('.chartContainer')
			};
			this.chart = new PiLot.Utils.Chart.DataChart(controls, 60, 20, null, 'HH:mm');
		},

		showCPUTemperature: function () {
			PiLot.Utils.Chart.loadRecentData('cpuTemperature', 7200, 120).then(pData => this.chart.showChart(pData));
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
			PiLot.View.Common.setCurrentMainMenuPage(PiLot.Utils.Loader.pages.system.admin.overview);
			await this.drawAsync();
			this.startServiceTimer();
		},

		drawAsync: async function () {
			const loader = PiLot.Utils.Loader;
			const contentArea = loader.getContentArea();
			contentArea.appendChild(PiLot.Utils.Common.createNode(PiLot.Templates.Admin.servicesPage));
			contentArea.querySelector('.lnkAdmin').setAttribute('href', loader.createPageLink(loader.pages.system.admin.overview));
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
		 * @param {any} pFilename
		 */
		lnkFile_click: function (pFilename) {
			this.showLogFile(pFilename);
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
			PiLot.View.Common.setCurrentMainMenuPage(loader.pages.system.admin.overview);
			const contentArea = loader.getContentArea();
			contentArea.appendChild(PiLot.Utils.Common.createNode(PiLot.Templates.Admin.logFilePage));
			contentArea.querySelector('.lnkSettings').setAttribute('href', loader.createPageLink(loader.pages.system.admin.overview));
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
			const content = await this.dataLoader.loadLogFile(pFilename.substring(0, pFilename.length - 4));
			this.divLogFile.querySelector('.lblFilename').innerText = pFilename;
			this.divLogFile.querySelector('.divContent').innerText = content;
			RC.Utils.showHide(this.divLogFile, true);
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
		BoatTimePage: BoatTimePage,
		SystemStatusPage: SystemStatusPage,
		ServicesPage: ServicesPage,
		ServiceInfo: ServiceInfo,
		LogFilesPage: LogFilesPage
	};

})();