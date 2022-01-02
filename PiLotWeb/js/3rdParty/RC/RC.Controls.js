var RC = RC || {};

RC.Controls = (function () {

	/// Class Calendar
	/// This represents a calendar/date picker control. The control can be attached to either a
	/// textbox (input) or a Label which will show the selected date or, in the case of a textbox,
	/// will allow to manually enter the selected date. In that case, the calendar control also
	/// manages parsing the date. The calendar control can also exist not being attached to anything,
	/// however I currently can't imagine this making any sense.
	/// The calendar will be created dynamically inside a container, probably always a div, which
	/// must be passed as an HTMLElement or jQuery object.
	/// pOnDateSelected: a function which will be called when a day is selected in the calendar
	/// possibility to add custom content into the day control
	var Calendar = function (pContainer, pControlToAttach, pCalendarLink, pOnDateSelected, pUtcOffset) {
		this.container = null;
		if ((pContainer instanceof jQuery) && (pContainer.length > 0)) {
			this.container = pContainer;
		} else if (pContainer instanceof HTMLElement) {
			this.container = $(pContainer);
		} 
		this.attachedTo = null;
		if ((pControlToAttach instanceof jQuery) && (pControlToAttach.length > 0)) {
			this.attachedTo = pControlToAttach;
		} else if (pControlToAttach instanceof HTMLElement) {
			this.attachedTo = $(pControlToAttach);
		}
		this.calendarLink = null;
		if ((pCalendarLink instanceof jQuery) && (pCalendarLink.length > 0)) {
			this.calendarLink = pCalendarLink;
		} else if (pCalendarLink instanceof HTMLElement) {
			this.calendarLink = $(pCalendarLink);
		}
		this.onDateSelected = null;
		if (typeof pOnDateSelected === 'function') {
			this.onDateSelected = pOnDateSelected;
		}
		this.utcOffset = pUtcOffset || 0;
		this.onMonthRendered = null;
		this.selectedDate = null;	// luxon object
		this.firstDay = null;		// luxon object, the first day in the days view. Can be part of the previous month
		this.lastDay = null;		// luxon object, the last day in the days view. Can be part of the next month already
		const now = RC.Date.DateHelper.localNow(this.utcOffset);
		this.currentMonth = now.month;
		this.currentYear = now.year;
		this.mode = 0 // = days, 1: months, 2: years
		this.prepare();
	};

	/// Calendar Methods
	Calendar.prototype = {

		calendarStartDayISO: 1,		// 1: Monday, 7: Sunday see https://momentjs.com/docs/#/get-set/iso-weekday/
		displayFormat: 'D',			// used for the attachedTo control
		todayFormat: 'DDDD',		// used for the "today" link in the calendar
		dayTooltipFormat: 'DDDD',	// used for the tooltip in the days table
		mapFormat: 'yyyyLLdd',		// the format used for the dayCells map

		isVisible: false,			// keeping track of the visibility to minimize calls to is(':visible') or show() / hide()
		isParsed: false,			// if true, we write back the parsed date to the attached field when leaving

		pnlHeader: null,
		pnlHeaderMonth: null,
		lnkCurrentMonth: null,
		pnlHeaderYear: null,
		lnkCurrentYear: null,

		pnlDaysView: null,
		tblDays: null,
		lnkDaysToday: null,

		pnlMonthsView: null,
		tblMonths: null,

		pnlYearsView: null,
		tblYears: null,

		dayCells: null,				// a map with date (yyyymmdd) and the corresponding cell, used to add custom content

		/// handles clicks on the body. hides the calendar, if the click did not happen
		/// on the calendarLink or the attachedTo control. Clicks on the calendar
		/// itself are not propagated to the body, so we not need to handle them here
		body_click: function (event) {
			if (this.isVisible) {
				const eventSource = event.target;
				if (
					((this.attachedTo === null) || !this.attachedTo.get().includes(eventSource))
					&& ((this.calendarLink === null) || !this.calendarLink.get().includes(eventSource))
				) {
					this.hide();
				}
			}
		},

		/// click handler for the previous month link in the header
		lnkPreviousMonth_Click: function () {
			this.switchMonth(-1);
			this.renderCurrentView();
		},

		/// click handler for the next month link in the header
		lnkNextMonth_Click: function () {
			this.switchMonth(1);
			this.renderCurrentView();
		},

		/// click handler for the previous year link in the header
		lnkPreviousYear_Click: function () {
			this.switchYear(-1);
			this.renderCurrentView();
		},

		/// click handler for the next year link in the header
		lnkNextYear_Click: function () {
			this.switchYear(1);
			this.renderCurrentView();
		},

		/// click handler for the days in the days table
		day_Click: function (pDate) {
			this.date(pDate);
			this.renderCurrentView();
			this.showDate();
			this.dateSelected();
			this.hide();
		},

		/// click handler for the today link
		lnkDaysToday_Click: function () {
			const localNow = RC.Date.DateHelper.localNow(this.utcOffset).startOf('day');
			this.date(DateTime.utc(localNow.year, localNow.month, localNow.day)); // we use utc generally
			this.renderCurrentView();
			this.showDate();
			this.dateSelected();
			this.hide();
		},

		/// click handler for the months in the months table
		month_Click: function (pMonth) {
			this.setMonth(pMonth);
			this.changeMode(0);
		},

		/// click handler for the month link in the header
		headerMonth_Click: function(){
			this.changeMode(1);
		},

		/// click handler for the year link in the header
		headerYear_Click: function () {
			this.changeMode(2);
		},

		/// click handler for the pager in the years table
		yearsPrevious_Click: function(){
			this.switchYear(-9);
			this.renderCurrentView();
		},

		/// click handler for the pager in the years table
		yearsNext_Click: function () {
			this.switchYear(9);
			this.renderCurrentView();
		},

		/// click handler for the years in the years table
		year_Click: function (pYear) {
			this.setYear(pYear);
			this.changeMode(0);
		},

		/// keydown handler for the attached textfield
		textfield_KeyDown: function (e) {
			if ([9, 27].indexOf(e.which) > -1) {
				this.hide();
			}
		},

		/// blur handler for the attached textfield
		textfield_blur: function () {
			if (this.isParsed) {
				this.showDate();
				this.isParsed = false;
			}
		},

		/// sets the function to be called when a month is rendered in the days view. The 
		/// function will be called using (pYear, pMonth)
		setOnMonthRendered: function (pCallback) {
			this.onMonthRendered = pCallback;
		},

		/// builds up the main structure which we will keep during the lifetime of the control
		/// and hides the control. This does nothing, if we have no container
		prepare: function () {
			if (this.container.length > 0) {
				this.prepareMainContainer();
				this.prepareDaysContainer();
				this.prepareMonthsContainer();
				this.prepareYearsContainer();
				this.bindGlobalHandlers();
				this.isVisible = this.container.is(':visible');
			}
		},

		/// binds handlers mainly to ensure proper show/hide behaviour
		bindGlobalHandlers: function () {
			$('body').on('click', this.body_click.bind(this));
			this.container.on('click', function (event) { event.stopPropagation(); });
			if (this.attachedTo !== null) {
				this.attachedTo.on('focus', this.show.bind(this));
				this.attachedTo.on('blur', this.textfield_blur.bind(this));
				this.attachedTo.on('keyup', this.parseDate.bind(this));
				const keyDownHandler = this.textfield_KeyDown.bind(this);
				this.attachedTo.on('keydown', function (event) { keyDownHandler(event); });
			}
			if (this.calendarLink !== null) {
				this.calendarLink.on('click', this.toggle.bind(this));
			}
		},

		/// prepares the common controls for all views
		prepareMainContainer: function () {
			this.container.toggleClass('rcCalendar', true);
			this.pnlHeader = this.addDiv(this.container, 'header');
			this.pnlHeaderMonth = this.addSpan(this.pnlHeader, 'headerMonth');
			this.addArrowLink(this.pnlHeaderMonth, 'linkButton', this.lnkPreviousMonth_Click.bind(this), 'left');
			this.lnkCurrentMonth = this.addLink(this.pnlHeaderMonth, 'currentMonth');
			this.lnkCurrentMonth.on('click', this.headerMonth_Click.bind(this));
			this.addArrowLink(this.pnlHeaderMonth, 'linkButton', this.lnkNextMonth_Click.bind(this), 'right');
			this.pnlHeaderYear = this.addSpan(this.pnlHeader, 'headerYear');
			this.addArrowLink(this.pnlHeaderYear, 'linkButton', this.lnkPreviousYear_Click.bind(this), 'left');
			this.lnkCurrentYear = this.addLink(this.pnlHeaderYear, 'currentYear');
			this.lnkCurrentYear.on('click', this.headerYear_Click.bind(this));
			this.addArrowLink(this.pnlHeaderYear, 'linkButton', this.lnkNextYear_Click.bind(this), 'right');
		},

		/// prepares the controls for the days view
		prepareDaysContainer: function () {
			this.pnlDaysView = this.addDiv(this.container, 'daysView');
			this.tblDays = this.addTable(this.pnlDaysView, 'days datesTable');
			this.addWeekDayHeader(this.tblDays);
			this.lnkDaysToday = this.addLink(this.pnlDaysView, 'daysToday').on('click', this.lnkDaysToday_Click.bind(this));
		},

		/// prepares the controls for the months view
		prepareMonthsContainer: function () {
			this.pnlMonthsView = this.addDiv(this.container, 'monthsView');
			this.tblMonths = this.addTable(this.pnlMonthsView, 'months datesTable');
		},

		/// prepares the controls for the years view
		prepareYearsContainer: function () {
			this.pnlYearsView = this.addDiv(this.container, 'yearsView');
			this.addArrowLink(this.pnlYearsView, 'yearsPager', this.yearsPrevious_Click.bind(this), 'up');
			this.tblYears = this.addTable(this.pnlYearsView, 'years datesTable');
			this.addArrowLink(this.pnlYearsView, 'yearsPager', this.yearsNext_Click.bind(this), 'down');
		},

		/// shows the calender (as in making visible)
		show: function () {
			this.renderCurrentView();
			if (!this.isVisible) {
				this.isVisible = true;
				this.container.fadeIn('fast');
			}
		},

		/// hides the calendar
		hide: function () {
			if (this.isVisible) {
				this.isVisible = false;
				this.container.fadeOut('fast');
			}
		},

		/// shows / hides the calendar
		toggle: function(){
			if (this.isVisible) {
				this.hide();
			} else {
				this.show();
			}
		},

		/// adds or updates the dynamic parts of the calendar for the 
		/// current view (days / months / years)
		renderCurrentView: function () {
			this.pnlDaysView.toggle(this.mode === 0);
			this.pnlMonthsView.toggle(this.mode === 1);
			this.pnlYearsView.toggle(this.mode === 2);
			this.pnlHeader.toggle(this.mode < 2);
			this.pnlHeaderMonth.toggle(this.mode === 0);
			this.pnlHeaderYear.toggle(this.mode < 2);
			this.firstDay = null;
			this.lastDay = null;
			switch (this.mode) {
				case 0:
					this.renderDaysView();
					break;
				case 1:
					this.renderMonthsView();
					break;
				case 2:
					this.renderYearsView();
					break;
			}
		},

		/// shows the currently focused month in the header
		renderMonthHeader: function (pCurrentDate) {
			this.lnkCurrentMonth.text(pCurrentDate.toLocaleString({ month: 'short' }));
		},

		/// shows the currently focused year in the header
		renderYearHeader: function (pCurrentDate) {
			this.lnkCurrentYear.text(pCurrentDate.toFormat('yyyy'));
		},

		/// renders the row with weekday names to the days table
		addWeekDayHeader: function (pDaysTable) {
			const header = this.addTableRow(pDaysTable, '');
			let cell;
			let loopDate = DateTime.utc();
			for (let i = 0; i < 7; i++) {
				loopDate = loopDate.set({ weekday: this.calendarStartDayISO + i });
				cell = this.addTableHeaderCell(header, 'day' + loopDate.weekday);
				cell.text(loopDate.toLocaleString({ weekday: 'short' }));
			}
		},

		/// renders the days by re-creating the table rows and properly
		/// assigning texts, titles, classes and links
		renderDaysView: function () {
			$('.trDays').remove();
			this.dayCells = new Map();
			let loopDate = DateTime.utc(this.currentYear, this.currentMonth, 1);
			const endDate = loopDate.plus({ months: 1 }).minus({ days: 1 }); // this is not exactly the end date, but as we always render one whole week, it's ok
			this.renderMonthHeader(loopDate);
			this.renderYearHeader(loopDate);
			const today = RC.Date.DateHelper.localNow(this.utcOffset);
			this.calendarStartDayISO = Math.max(Math.min(7, this.calendarStartDayISO), 1); // make sure we are within 1..7
			while (loopDate.weekday !== this.calendarStartDayISO)  {
				loopDate = loopDate.minus({ days: 1 });
			}
			let row;
			let cell;
			let link;
			this.firstDay = loopDate;
			while (loopDate <= endDate) {
				row = this.addTableRow(this.tblDays, 'trDays');
				for (let i = 0; i < 7; i++) {
					cell = this.addTableCell(row, '');
					link = this.addLink(cell, '');
					link.text(loopDate.toFormat('d'));
					link.on('click', this.day_Click.bind(this, loopDate));
					link.attr('title', loopDate.toFormat(this.dayTooltipFormat));
					cell.toggleClass('selected', ((this.selectedDate !== null) && loopDate.hasSame(this.selectedDate, 'days')));
					if (loopDate.hasSame(today, 'days')) {
						cell.addClass('today');
					}
					if (loopDate.month !== this.currentMonth) {
						cell.addClass('oddMonth');
					}
					if ([6, 7].indexOf(loopDate.weekday) !== -1) {
						cell.addClass('weekend');
					}
					this.dayCells.set(loopDate.toFormat(this.mapFormat), cell);
					loopDate = loopDate.plus({ days: 1 });
				}
			}
			this.lastDay = loopDate
			this.lnkDaysToday.text(today.toFormat(this.todayFormat));
			if (this.onMonthRendered !== null) {
				this.onMonthRendered(this.currentYear, this.currentMonth);
			}
		},

		/// renders the months by re-creating the months table rows
		renderMonthsView: function () {
			$('.months tr').remove();
			const today = RC.Date.DateHelper.localNow(this.utcOffset);
			let loopDate = DateTime.utc(this.currentYear, 1, 1);
			const currentDate = DateTime.utc(this.currentYear, this.currentMonth, 1);
			this.renderYearHeader(currentDate);
			let row;
			let cell;
			for (let month = 1; month <= 12; month++) {
				if ((month-1) % 4 === 0) {
					row = this.addTableRow(this.tblMonths, '');
				}
				cell = this.addTableCell(row, '');
				cell.text(loopDate.toLocaleString({ month: 'short' }));
				cell.on('click', this.month_Click.bind(this, month));
				cell.toggleClass('selected', ((this.selectedDate !== null) && loopDate.hasSame(this.selectedDate, 'months')));
				if (loopDate.hasSame(today, 'months')) {
					cell.addClass('today');
				}
				loopDate = loopDate.plus({ months: 1 });
			}
		},

		/// renders the years by re-creating the years table rows
		renderYearsView: function () {
			$('.years tr').remove();
			const today = RC.Date.DateHelper.localNow(this.utcOffset);
			let year = this.currentYear - (this.currentYear % 3) -3;
			let row;
			let cell;
			for (let i = 0; i < 9; i++) {
				if (i % 3 === 0) {
					row = this.addTableRow(this.tblYears, '');
				}
				cell = this.addTableCell(row, '');
				cell.text(year.toString());
				cell.on('click', this.year_Click.bind(this, year));
				cell.toggleClass('selected', year === this.currentYear);
				if ((today.year === year)) {
					cell.addClass('today');
				}
				year++;
			}
		},

		/// takes the content of the attachedTo control and tries to convert
		/// it into a date by using unique RC logic.
		parseDate: function(){
			let dateText = this.attachedTo.val().trim();
			let date = null;
			const now = RC.Date.DateHelper.localNow(this.utcOffset);
			if (dateText.length > 0) {
				let sign = 1;
				if (dateText[0] === '-') {
					sign = -1;
					dateText = dateText.substr(1);
				}
				const parts = dateText.split(/[.;:-\s]+/);
				if (parts.length === 1) {
					if ($.isNumeric(parts[0])) {
						date = DateTime.utc(now.year, now.month, now.day).plus({ days: Number(parts[0]) * sign });
					}
				} else if ($.isNumeric(parts[0]) && $.isNumeric(parts[1])) {
					const day = Number(parts[0]);
					const month = Number(parts[1]);
					if (parts.length === 2) {
						date = DateTime.utc(now.year, month, day);
					} else if ((parts.length === 3) && $.isNumeric(parts[2])) {
						let year = Number(parts[2]);
						if (year < 30) {
							year += 2000;
						} else if (year < 100) {
							year += 1900;
						}
						date = DateTime.utc(year, month, day);
					}

				}
				if (date !== null) {
					this.date(date);
					this.dateSelected();
					this.isParsed = true;
					this.renderCurrentView();
				}
			} else {
				this.date(null);
				this.dateSelected();
				this.isParsed = true;
				this.renderCurrentView();
			}
		},

		/// changes the mode between days view (0), months view (1) and years view (2)
		changeMode: function (pMode) {
			if (pMode >= 0 && pMode <= 2) {
				this.mode = pMode;
				this.renderCurrentView();
			}
		},

		/// sets the currently focused month to a given value, starting with 1
		setMonth: function (pMonth){
			if (pMonth >= 1 && pMonth <= 12) {
				this.currentMonth = pMonth;
			} else{
				PiLot.log('invalid month in Calendar.setMonth: ' + pMonth, 1);
			}
		},

		/// increases / decreases the currently focused value by a certain amount. pChangeBy must 
		/// be equal to or less than 12
		switchMonth: function (pChangeBy) {
			if (Math.abs(pChangeBy) < 12) {
				let month = this.currentMonth + pChangeBy;
				let year = this.currentYear;
				if (month > 12) {
					month -= 12;
					year += 1;
				} else if (month < 1) {
					month += 12;
					year -= 1;
				}
				this.currentMonth = month;
				this.currentYear = year;
			} else {
				PiLot.log('invalid value for pChangeBy in Calendar.switchMonth. Value must be between -11 and 11, but was ' + pChangeBy, 1);
			}
		},

		/// sets the currently focused year to a value between 0 and 2999
		setYear: function (pYear) {
			if (pYear >= 0 && pYear <= 2999) {
				this.currentYear = pYear;
			} else {
				PiLot.log('invalid year in Calendar.setYear: ' + pYear, 1);
			}
		},

		/// increases / decreases the currently focused year by a certain amount
		switchYear: function(pChangeBy){
			this.setYear(this.currentYear + pChangeBy);
		},

		/// fires the onDataSelected method which has been assigned
		dateSelected: function(){
			if (this.onDateSelected !== null) {
				this.onDateSelected(this.selectedDate);
			}
		},

		/// shows the selected date in the attached control
		showDate: function () {
			if (this.attachedTo !== null) {
				let dateText = '';
				if (this.selectedDate !== null) {
					dateText = this.selectedDate.toFormat(this.displayFormat);
				}
				this.attachedTo.val(dateText);
				this.attachedTo.text(dateText);
			}
		},

		/// gets or sets the selected date as a luxon object
		date: function (pDate) {
			if (arguments.length > 0) {
				if (pDate === null) {
					this.selectedDate = null;
				} else if (pDate.isValid) {
					this.selectedDate = pDate;
					this.currentYear = pDate.year;
					this.currentMonth = pDate.month;
				}
			}
			return this.selectedDate;
		},

		/// gets the cell (as jquery object) for a certain day, 
		/// if this cell exists, otherwise null
		getDayCell: function (pDate) {
			let result = null;
			const key = pDate.toFormat(this.mapFormat);
			if (this.dayCells && this.dayCells.has(key)) {
				result = this.dayCells.get(key);
			}
			return result;
		},

		/** Returns the first day visible in days overview as luxon object, null if not days overview */
		getFirstDay: function () {
			return this.firstDay;
		},

		/** Returns the last day visible in days overview as luxon object, null if not days overview */
		getLastDay: function () {
			return this.lastDay;
		},

		addDiv: function (pParent, pCssClass) {
			return RC.Utils.addDomObject('div', pParent, pCssClass);
		},

		addSpan: function (pParent, pCssClass) {
			return RC.Utils.addDomObject('span', pParent, pCssClass);
		},

		addLink: function (pParent, pCssClass) {
			return RC.Utils.addDomObject('a', pParent, pCssClass).attr('href', '#');
		},

		addArrowLink: function(pParent, pOuterClass, pOnClick, pDirection){
			const result = this.addLink(pParent, pOuterClass).on('click', pOnClick);
			let innerClass;
			switch (pDirection.toLowerCase().substr(0, 1)) {
				case 'l':
					innerClass = 'triangleLeft';
					break;
				case 'r':
					innerClass = 'triangleRight';
					break;
				case 'u':
					innerClass = 'triangleUp';
					break;
				case 'd':
					innerClass = 'triangleDown';
					break;
			}
			this.addSpan(result, innerClass);
		},

		addTable: function (pParent, pCssClass) {
			const result = RC.Utils.addDomObject('table', pParent, pCssClass);
			RC.Utils.addDomObject('tbody', result, '');
			return result;
		},

		addTableRow: function (pParent, pCssClass) {
			return RC.Utils.addDomObject('tr', pParent, pCssClass);
		},

		addTableHeaderCell: function (pParent, pCssClass) {
			return RC.Utils.addDomObject('th', pParent, pCssClass);
		},

		addTableCell: function (pParent, pCssClass) {
			return RC.Utils.addDomObject('td', pParent, pCssClass);
		}
	}

	/**
	 * This can be attached to a checkbox, and the checkbox will then loop through 3 states
	 * (unchecked, indeterminate, checked). If you use it, make sure to use the setState()
	 * method instead of directly accessing checkbox.checked and checkbox.indeterminate.
	 * If you want to observe the checkbox changed events, please register to this by
	 * calling cb.on('change', callback);
	 * @param {HTMLElement} pElement - the HTML Element representing the checkbox
	 */
	var TriStateCheckBox = function (pElement) {
		this.cb = pElement;
		this.state = null;
		this.observers = null;
		this.initialize();
	};

	TriStateCheckBox.prototype = {

		initialize: function () {
			this.observers = RC.Utils.initializeObservers(['change']);
			this.cb.addEventListener('change', this.cb_change.bind(this));
			this.initState();
		},

		/// registers an observer which will be called when pEvent happens
		on: function (pEvent, pCallback) {
			RC.Utils.addObserver(this.observers, pEvent, pCallback);
		},

		cb_change: function () {
			this.state = (2 + this.state) % 3; //loop backwards
			this.applyState();
			RC.Utils.notifyObservers(this, this.observers, 'change', null);
		},

		applyState: function () {
			this.cb.checked = this.state === 1;
			this.cb.indeterminate = this.state === 2;
		},

		initState: function () {
			if (this.cb.indeterminate) {
				this.state = 2;
			} else if (this.cb.checked) {
				this.state = 1;
			} else {
				this.state = 0;
			}
		},

		/** Set the state, where 0: unchecked, 1: checked, 2: indeterminate */
		setState: function (pState) {
			this.state = pState;
			this.applyState();
		},

		/** Get the state, 0: unchecked, 1: checked, 2: indeterminate */
		getState: function () {
			return this.state;
		},

	};

	/// Returning the class
	return {
		Calendar: Calendar,
		TriStateCheckBox: TriStateCheckBox
	};
})();