var RC = RC || {};
RC.Date = {};

var DateTime = DateTime || luxon.DateTime;

/// static methods used with dates
RC.Date.DateHelper = {

	/// gets the current utc in seconds from epoch
	utcNowUnix: function () {
		return RC.Date.DateHelper.luxonToUnix(luxon.DateTime.utc());
	},

	/** gets the current utc in milliseconds from epoch */
	utcNowMillis: function () {
		return luxon.DateTime.utc().toMillis();
	},

	/** gets a luxon object based on seconds from epoch, or null, if pUnix is falsy */
	unixToLuxon: function (pUnix) {
		let result = null;
		if (pUnix) {
			result = RC.Date.DateHelper.millisToLuxon(pUnix * 1000);
		}
		return result;
	},

	/// gets a luxon object based on milliseconds from epoc
	millisToLuxon: function (pMillis) {
		return luxon.DateTime.fromMillis(pMillis, { zone: 'UTC' });
	},

	/**
	 * Converts an ISO String to an utc based luxon DateTime
	 * @param {String} pIsoString - ISO Date String e.g. 2022-12-02T13:24:56
	 * @param {String} pLocale - The locale to use for the date, e.g. "de-ch"
	 * */
	isoToLuxon: function (pISOString, pLocale) {
		let result = null;
		if (typeof (pISOString) === 'string') {
			result = DateTime.fromISO(pISOString, { zone: 'utc', locale: pLocale });
		} 
		return result;
	},

	/// converts a luxon DateTime to unix (seconds from epoch). Be
	/// aware that the milliseconds will always be counted from
	/// the utc representation of pDate
	luxonToUnix: function (pDateTime) {
		return Math.floor(pDateTime.toMillis() / 1000);
	},

	/// converts a luxon DateTime to unix (seconds from epoc),
	/// using the local time of the object
	luxonToUnixLocal: function (pDateTime) {
		return Math.floor((pDateTime.toMillis() / 1000) + pDateTime.offset * 60);
	},

	/// returns the number of seconds since midnight for a luxon date
	secondsOfDay: function (pDateTime) {
		return Math.round(pDateTime.diff(pDateTime.startOf('day')).shiftTo('seconds').seconds);
	},

	/**
	 * Converts a string into a time, consisting of hours and minutes.
	 * The result ist an object containing
	 * minutes: the total minutes from the parsed time (incl. hours)
	 * date: if pDay was provided, the day plus the time as luxon
	 * @param {String} pTimeString - The string to parse
	 * @param {Object} pDay - an optional date to add the time to, luxon and RC.Date should work
	 * @return {Object} Object with minutes: int, date: luxon
	 */
	parseTime: function (pTimeString, pDay) {
		let result = {minutes: 0, date: null};
		let hoursString = null, minutesString = null;
		const parts = RC.Utils.multiSplit(pTimeString, [' ', ',', '.', '-', ':', '/']);
		if (parts.length == 1) { // we have just one part. We process it depending on its length
			switch (parts[0].length) {
				case 1: // fall through to 2
				case 2: // we interpret the value as just hours
					hoursString = parts[0];
					break;
				case 3: // we interpret the value as hmm, e.g. 735 > 7:35
					hoursString = parts[0].substring(0, 1);
					minutesString = parts[0].substring(1);
					break;
				case 4: // we interpret the value as hhmm, e.g. 1144 > 11:44
					hoursString = parts[0].substring(0, 2);
					minutesString = parts[0].substring(2);
					break;
			}
		} else { // we have more than one part
			hoursString = parts[0];
			minutesString = parts[1];
		}
		let hours = parseInt(hoursString);
		if (!isNaN(hours)) {
			hours = hours % 24;
			if ((parts.length > 2) && (parts[2].toLowerCase() === 'pm')) { // extra treatement for 4:35 pm
				hours += 12;
			}
		} else {
			hours = 0;
		}
		let minutes = parseInt(minutesString);
		if (!isNaN(minutes)) {
			minutes = minutes % 60
		} else {
			minutes = 0;
		}
		result.minutes = (hours * 60) + minutes;
		if (pDay) {
			let date = pDay;
			if (date instanceof RC.Date.DateOnly) {
				date = date.toLuxon();
			}
			if (date instanceof DateTime) {
				result.date = DateTime.fromObject({ year: date.year, month: date.month, day: date.day, hour: hours, minute: minutes, zone: date.zone });
			}
		}
		return result;
	},

	/**
	 * Creates a luxon object representing the local now in a custom timezone
	 * defined by a certain offset
	 * @param {number} pUtcOffsetMinutes
	 */
	localNow: function (pUtcOffsetMinutes) {
		const utc = luxon.DateTime.utc();
		const plusSign = pUtcOffsetMinutes >= 0 ? '+' : '';
		const timeZoneName = 'UTC' + plusSign + pUtcOffsetMinutes / 60;
		let result = luxon.DateTime.fromObject({
			year: utc.year,
			month: utc.month,
			day: utc.day,
			hour: utc.hour,
			minute: utc.minute,
			second: utc.second,
			millisecond: utc.millisecond,
			zone: timeZoneName
		});
		result = result.plus({ minutes: pUtcOffsetMinutes });
		return result;
	}
};

/// A DateOnly represents just a date, without a time, without 
/// a timezone. Just day, month, year. Of course it can be created
/// from and converted to any kind of Date or luxon DateTime
RC.Date.DateOnly = function () {
	this.day = null;
	this.month = null;
	this.year = null;
};

RC.Date.DateOnly.prototype = {

	isValid: function () {
		return this.toLuxon().isValid;
	},

	/// returns a new DateOnly pDays later (or before) this. Fractional parts
	/// pf pDays are ignored. If pDays is not numeric, undefined is returned.
	addDays: function (pDays) {
		if (RC.Utils.isNumeric(pDays)) {
			return RC.Date.DateOnly.fromObject(this.toLuxon().plus({ days: Math.floor(Number(pDays)) }));
		} else {
			return undefined;
		}
	},

	/// returns the seconds for this date, 00:00, in seconds since epoc 
	totalSeconds: function () {
		return this.toLuxon().toMillis() / 1000;
	},

	/// returns true, if pDateTime is on this date
	/// pDateTime: luxon DateTime
	contains: function (pDateTime) {
		var result = false;
		if (pDateTime instanceof luxon.DateTime) {
			result = ((pDateTime.year === this.year) && (pDateTime.month === this.month) && (pDateTime.day === this.day))
		}
		return result;
	},

	/**
	 * @param {RC.Date.DateOnly} pOther - the date to compare to
	 * @returns {Boolean} true, if date, month and year are the same
	 */
	equals: function (pOther) {
		return (
			this.day === pOther.day
			&& this.month === pOther.month
			&& this.year === pOther.year
		);
	},

	/// returns a luxon object with the given day, month, year. The object
	/// will always be in the UTC Timezone
	toLuxon: function () {
		return luxon.DateTime.utc(this.year, this.month, this.day);
	},

	/// returns a Date object for the given day, month, year.
	toDate: function () {
		return new Date(this.year, this.month - 1, this.day);
	},

	/// returns the date as iso String, which can be handled
	/// as System.Date on the server
	toServerObject: function () {
		return this.toLuxon().toISO();
	}
};

/// Creates a DateOnly from an object having day, month and year properties.
/// Remember that months are 1-based. You might want to call isValid() after
/// this, as the input is not validated.
RC.Date.DateOnly.fromObject = function (pObject) {
	var result = null;
	if ((pObject !== null) && (typeof pObject !== 'undefined')) {
		if (('year' in pObject) && ('month' in pObject) && ('day' in pObject)) {
			var result = new RC.Date.DateOnly();
			result.day = pObject.day;
			result.month = pObject.month;
			result.year = pObject.year;
		} else if (('Year' in pObject) && ('Month' in pObject) && ('Day' in pObject)) {
			var result = new RC.Date.DateOnly();
			result.day = pObject.Day;
			result.month = pObject.Month;
			result.year = pObject.Year;
		}
	}
	return result;
};