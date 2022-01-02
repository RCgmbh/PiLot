using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;

namespace PiLot.Utils.DateAndTime {

	public class DateTimeHelper {

		/// <summary>
		/// any leap year which we will use to validate the day values
		/// </summary>
		private const Int32 LEAPYEAR = 2000;

		private static TimeZoneInfo defaultLocalZone = null;

		/// <summary>
		/// Gets the local current time for Amsterdam. 
		/// TODO: based on defaultLocalZone, should be able to work with different timezones (probably non-static)
		/// </summary>
		public static DateTime LocalNow {
			get {
				return DateTimeHelper.ToLocal(DateTime.UtcNow);
			}
		}

		/// <summary>
		/// Gets the current UTC Time in Unix
		/// </summary>
		public static Int32 UnixNow {
			get {
				return DateTimeHelper.ToUnixTime(DateTime.UtcNow);
			}
		}

		/// <summary>
		/// Gets the current UTC Time in ms since epoc
		/// </summary>
		public static Int64 JSNow {
			get {
				return DateTimeHelper.ToJSTime(DateTime.UtcNow);
			}
		}

		/// <summary>
		/// Returns the timezone for Amsterdam
		/// </summary>
		public static TimeZoneInfo DefaultTimeZone {
			get {
				if (DateTimeHelper.defaultLocalZone == null) {
					DateTimeHelper.defaultLocalZone = TimeZoneInfo.GetSystemTimeZones().First(zone => zone.DisplayName.Contains("Amsterdam"));
					if (DateTimeHelper.defaultLocalZone == null) {
						DateTimeHelper.defaultLocalZone = TimeZoneInfo.CreateCustomTimeZone("default time", new TimeSpan(1, 0, 0), "default time", "default time");
					}
				}
				return DateTimeHelper.defaultLocalZone;
			}
		}

		/// <summary>
		/// Returns a dictionary with all System timezones, where the key is the
		/// Id (e.g. "UTC", "W. Europe Standard Time")
		/// </summary>
		public static Dictionary<String, TimeZoneInfo> GetTimeZones() {
			Dictionary<String, TimeZoneInfo> result = new Dictionary<String, TimeZoneInfo>();
			foreach (var aTimeZone in TimeZoneInfo.GetSystemTimeZones()) {
				result.Add(aTimeZone.Id, aTimeZone);
			}
			return result;
		}

		/// <summary>
		/// Converts a DateTime to the current local time for Amsterdam
		/// </summary>
		public static DateTime ToLocal(DateTime pDateTime) {
			DateTime dateTime = pDateTime;
			if (pDateTime.Kind != DateTimeKind.Unspecified) {
				// We just want to make sure to not run into problems with DateTime.Kind,
				// therefore we set it to unspecified.
				dateTime = new DateTime(pDateTime.Ticks, DateTimeKind.Unspecified);
			}
			return TimeZoneInfo.ConvertTimeFromUtc(dateTime, DateTimeHelper.DefaultTimeZone);
		}

		/// <summary>
		/// Converts a DateTime? to the current local time for Amsterdam
		/// </summary>
		public static DateTime? ToLocal(DateTime? pDateTime) {
			DateTime? result = null;
			if (pDateTime != null) {
				result = DateTimeHelper.ToLocal((DateTime)pDateTime);
			}
			return result;
		}

		/// <summary>
		/// Converts a local DateTime in Amsterdam to UTC
		/// </summary>
		public static DateTime ToUtc(DateTime pDateTime) {
			DateTime dateTime = pDateTime;
			if (pDateTime.Kind != DateTimeKind.Unspecified) {
				// ConvertTimeToUtc throws an exception if pDateTime.Kind is UTC. so we set
				// it to unspecified, wich allows to not worry too much about DateTime.Kind
				dateTime = new DateTime(pDateTime.Ticks, DateTimeKind.Unspecified);
			}
			return TimeZoneInfo.ConvertTimeToUtc(dateTime, DateTimeHelper.DefaultTimeZone);
		}

		/// <summary>
		/// Converts a local DateTime? in Amsterdam to UTC. Null returns null
		/// </summary>
		public static DateTime? ToUtc(DateTime? pDateTime) {
			DateTime? result = null;
			if (pDateTime != null) {
				result = DateTimeHelper.ToUtc((DateTime)pDateTime);
			}
			return result;
		}

		/// <summary>
		/// Converts a unix date (seconds since 1.1.1970) to a DateTime
		/// </summary>
		public static DateTime FromUnixTime(Int32 pUnixTime) {
			return new DateTime(1970, 1, 1).AddSeconds(pUnixTime);
		}

		/// <summary>
		/// Converts a unix date (seconds since 1.1.1970) to a DateTime
		/// </summary>
		public static DateTime FromUnixTime(Double pUnixTime) {
			return new DateTime(1970, 1, 1).AddSeconds(pUnixTime);
		}

		/// <summary>
		/// Creates a date based on a number of milliseconds since epoc
		/// </summary>
		public static DateTime FromJSTime(Int64 pJSTime) {
			return new DateTime(1970, 1, 1).AddMilliseconds(pJSTime);
		}

		/// <summary>
		/// Returns the number of seconds between 1.1.1970 and pTime
		/// </summary>
		public static Int32 ToUnixTime(DateTime pTime) {
			return (Int32)(pTime - new DateTime(1970, 1, 1)).TotalSeconds;
		}

		/// <summary>
		/// Returns the number of milliseconds between 1.1.1970 and pTime
		/// </summary>
		public static Int64 ToJSTime(DateTime pTime) {
			return (Int64)(pTime - new DateTime(1970, 1, 1)).TotalMilliseconds;
		}

		/// <summary>
		/// This converts a unix time (seconds since 1970) to JS time
		/// (milliseconds since 1970).
		/// </summary>
		public static Int64 UnixTimeToJSTime(Int32 pUnixTime) {
			return (Int64)pUnixTime * 1000;
		}

		/// <summary>
		/// Tries to convert a String to an int, then converts the int
		/// into a dateTime interpreting it as seconds since 1.1.1970.
		/// Returns null, if the String can not be converted to an int
		/// </summary>
		public static DateTime? FromUnixTime(String pUnixTime) {
			DateTime? result = null;
			Double unixTime;
			if (Double.TryParse(pUnixTime, out unixTime)) {
				result = DateTimeHelper.FromUnixTime((Int32)unixTime);
			}
			return result;
		}

		/// <summary>
		/// returns the earlier of two dates.
		/// </summary>
		public static Date Min(Date pDate1, Date pDate2) {
			return (pDate1 < pDate2) ? pDate1 : pDate2;
		}

		/// <summary>
		/// returns the earlier of two dates. If one date is null, the other will be returned.
		/// If both ar null, null is returned
		/// </summary>
		public static Date? Min(Date? pDate1, Date? pDate2) {
			Date? result = null;
			if ((pDate1 != null) && (pDate2 != null)) {
				result = DateTimeHelper.Min((Date)pDate1, (Date)pDate2);
			} else {
				if ((pDate1 == null) && (pDate2 == null)) {
					result = null;
				} else {
					if (pDate1 == null) {
						result = pDate2;
					} else {
						result = pDate1;
					}
				}
			}
			return result;
		}

		/// <summary>
		/// returns the earlier of two DateTimese
		/// </summary>
		public static DateTime Min(DateTime pDateTime1, DateTime pDateTime2) {
			return (pDateTime1 < pDateTime2) ? pDateTime1 : pDateTime2;
		}

		/// <summary>
		/// returns the earlier of two DateTimes. If one date is null, the other will be returned.
		/// If both ar null, null is returned
		/// </summary>
		public static DateTime? Min(DateTime? pDateTime1, DateTime? pDateTime2) {
			DateTime? result = null;
			if ((pDateTime1 != null) && (pDateTime2 != null)) {
				result = DateTimeHelper.Min((DateTime)pDateTime1, (DateTime)pDateTime2);
			} else {
				if ((pDateTime1 == null) && (pDateTime2 == null)) {
					result = null;
				} else {
					if (pDateTime1 == null) {
						result = pDateTime2;
					} else {
						result = pDateTime1;
					}
				}
			}
			return result;
		}

		/// <summary>
		/// Returns the smaller of two TimeSpans
		/// </summary>
		public static TimeSpan Min(TimeSpan pTime1, TimeSpan pTime2) {
			TimeSpan result = pTime1;
			if (pTime2 < pTime1) {
				result = pTime2;
			}
			return result;
		}

		/// <summary>
		/// returns the later of two dates.
		/// </summary>
		public static Date Max(Date pDate1, Date pDate2) {
			return (pDate1 > pDate2) ? pDate1 : pDate2;
		}

		/// <summary>
		/// returns the later of two dates. If one date is null, the other will be returned.
		/// If both ar null, null is returned
		/// </summary>
		public static Date? Max(Date? pDate1, Date? pDate2) {
			Date? result = null;
			if ((pDate1 != null) && (pDate2 != null)) {
				result = DateTimeHelper.Max((Date)pDate1, (Date)pDate2);
			} else {
				if ((pDate1 == null) && (pDate2 == null)) {
					result = null;
				} else {
					if (pDate1 == null) {
						result = pDate2;
					} else {
						result = pDate1;
					}
				}
			}
			return result;
		}

		/// <summary>
		/// returns the later of two DateTimese
		/// </summary>
		public static DateTime Max(DateTime pDateTime1, DateTime pDateTime2) {
			return (pDateTime1 > pDateTime2) ? pDateTime1 : pDateTime2;
		}

		/// <summary>
		/// returns the later of two DateTimes. If one DateTime is null, the other will be returned.
		/// If both ar null, null is returned
		/// </summary>
		public static DateTime? Max(DateTime? pDateTime1, DateTime? pDateTime2) {
			DateTime? result = null;
			if ((pDateTime1 != null) && (pDateTime2 != null)) {
				result = DateTimeHelper.Max((DateTime)pDateTime1, (DateTime)pDateTime2);
			} else {
				if ((pDateTime1 == null) && (pDateTime2 == null)) {
					result = null;
				} else {
					if (pDateTime1 == null) {
						result = pDateTime2;
					} else {
						result = pDateTime1;
					}
				}
			}
			return result;
		}

		/// <summary>
		/// Returns the larger of two TimeSpans
		/// </summary>
		public static TimeSpan Max(TimeSpan pTime1, TimeSpan pTime2) {
			TimeSpan result = pTime1;
			if (pTime2 > pTime1) {
				result = pTime2;
			}
			return result;
		}

		/// <summary>
		/// Compares two nullable dates. If both are null, 0 is returned
		/// </summary>
		public static Int32 Compare(DateTime? pDate1, DateTime? pDate2) {
			Int32 result = 0;
			if (pDate1 != null) {
				if (pDate2 != null) {
					result = ((DateTime)pDate1).CompareTo((DateTime)pDate2);
				} else {
					result = 1;
				}
			} else {
				if (pDate2 != null) {
					result = -1;
				}
			}
			return result;
		}

		/// <summary>
		/// returns the calendar week for a given date. In addition to the standard .net functionality, this makes
		/// sure that for CalendarWeekRule.FirstFourDayWeek, the any calendarWeek is always 7 days long. In .net,
		/// the first week can be just 4 days long for CalendarWeekRule.FirstFourDayWeek, see
		/// https://msdn.microsoft.com/en-us/library/system.globalization.calendarweekrule(v=vs.110).aspx
		/// </summary>
		public static Int32 GetCalendarWeek(DateTime pDate, Calendar pCalendar, CalendarWeekRule pCalendarWeekRule, DayOfWeek pFirstDayOfWeek) {
			Int32 result = pCalendar.GetWeekOfYear(pDate, pCalendarWeekRule, pFirstDayOfWeek);
			if ((result == 53) && (pCalendarWeekRule == CalendarWeekRule.FirstFourDayWeek)) {
				DateTime testDate = new DateTime(pDate.Year, 12, 31);
				// we go at most three days back to find the first day of week
				for (Int32 i = 0; i < 3; i++) {
					if (testDate.DayOfWeek == pFirstDayOfWeek) {
						if (pDate >= testDate) {
							result = 1;
							break;
						}
					}
					testDate = testDate.AddDays(-1);
				}
			}
			return result;
		}

		/// <summary>
		/// returns the calendar week for a certain date based on a culture, defining the calendar rule and firstDayOfWeek
		/// </summary>
		public static Int32 GetCalendarWeek(DateTime pDate, CultureInfo pCulture) {
			return DateTimeHelper.GetCalendarWeek(pDate, pCulture.Calendar, pCulture.DateTimeFormat.CalendarWeekRule, pCulture.DateTimeFormat.FirstDayOfWeek);
		}

		/// <summary>
		/// This returns the first occurrence of a specific weekday in a certain year,
		/// E.g get the first Monday in 2016
		/// </summary>
		public static Date GetFirstOccurrenceOfDayOfWeek(DayOfWeek pDayOfWeek, Int32 pYear) {
			Date firstJanuary = new Date(pYear, 1, 1);
			Int32 offset = ((Int32)pDayOfWeek - (Int32)firstJanuary.DayOfWeek + 7) % 7; // the number of days we must move forward from the first january to the result
			return firstJanuary.AddDays(offset);
		}

		/// <summary>
		/// Returns the first day of a certain calendar week in a certain year. pCulture is used to define the FirstDayOfWeek and the CalendarWeekRule.
		/// This can return a value in the year before pYear (using CalendarWeekRule.FirstFourDayWeek), of in the year after pYear, if pCalendarWeek is 53
		/// but pYear only has 52 weeks
		/// </summary>
		public static Date GetFirstDayOfCalendarWeek(Int32 pYear, Int32 pCalendarWeek, CultureInfo pCulture) {
			Assert.IsNotNull(pCulture, "pCulture can not be null");
			return DateTimeHelper.GetFirstDayOfCalendarWeek(pYear, pCalendarWeek, pCulture.DateTimeFormat.FirstDayOfWeek, pCulture.DateTimeFormat.CalendarWeekRule);
		}

		/// <summary>
		/// Returns the first day of a certain calendar week in a certain year. 
		/// This can return a value in the year before pYear (using CalendarWeekRule.FirstFourDayWeek), of in the year after pYear, if pCalendarWeek is 53
		/// but pYear only has 52 weeks
		/// </summary>
		public static Date GetFirstDayOfCalendarWeek(Int32 pYear, Int32 pCalendarWeek, DayOfWeek pFirstDayOfWeek, CalendarWeekRule pCalendarWeekRule) {
			Assert.IsTrue((pCalendarWeek > 0) && (pCalendarWeek <= 53), "pCalendarWeek must be a value from 1 to 53");
			Date result;
			Date firstJanuary = new Date(pYear, 1, 1);
			Date firstFirstDayOfWeek = DateTimeHelper.GetFirstOccurrenceOfDayOfWeek(pFirstDayOfWeek, pYear);
			result = firstFirstDayOfWeek.AddDays((pCalendarWeek - 1) * 7);
			switch (pCalendarWeekRule) {
				case CalendarWeekRule.FirstDay:
					// if the first firstDayOfWeek isn't the first january, we need to move one week back.
					if (firstFirstDayOfWeek.DayOfYear > 1) {
						result = result.AddDays(-7);
					}
					// for CalendarWeekRule.FirstDay, the result can't be before pYear
					result = DateTimeHelper.Max(result, firstJanuary);
					break;
				case CalendarWeekRule.FirstFourDayWeek:
					// if the first firstDayOfWeek is after 4th january, we need to move one week back.
					if (firstFirstDayOfWeek.DayOfYear > 4) {
						result = result.AddDays(-7);
					}
					break;
				case CalendarWeekRule.FirstFullWeek:
					break;
			}
			return result;
		}

		/// <summary>
		/// returns the last first day of the week before a given date (e.g. "last monday").
		/// </summary>
		public static Date GetPreviousFirstDayOfWeek(DateTime pDate, DayOfWeek pFirstDayOfWeek) {
			Int32 dayOffset = (Int32)pDate.DayOfWeek - (Int32)pFirstDayOfWeek; // the number of days we must move back to find the first day of the week
																			   //TODO: Use mod7			
			if (dayOffset < 0) {
				dayOffset += 7;
			}
			return new Date(pDate.Year, pDate.Month, pDate.Day).AddDays(dayOffset * -1);
		}

		/// <summary>
		/// Returns the DateTime which lies in the middle between two DateTimes. 
		/// Exact to the second. If one of the parameters is null, the result is null.
		/// </summary>
		public static DateTime? Middle(DateTime? pStart, DateTime? pEnd) {
			DateTime? result = null;
			if ((pStart != null) && (pEnd != null)) {
				Double seconds = ((DateTime)pEnd).Subtract((DateTime)pStart).TotalSeconds;
				result = ((DateTime)pStart).AddSeconds(seconds / 2);
			}
			return result;
		}

		/// <summary>
		/// Moves a DateTime to the next midnight. Use this, if a user-entered date needs to
		/// be at the end of the entered date ("to"-field)
		/// </summary>
		public static Date? ToNextMidnight(DateTime? pDateTime) {
			Date? result = null;
			if (pDateTime != null) {
				result = DateTimeHelper.ToNextMidnight((DateTime)pDateTime);
			}
			return result;
		}

		/// <summary>
		/// Moves a DateTime to the next midnight. Use this, if a user-entered date needs to
		/// be at the end of the entered date ("to"-field)
		/// </summary>
		public static Date ToNextMidnight(DateTime pDateTime) {
			return new Date(pDateTime.Date.AddDays(1));
		}

		/// <summary>
		/// If the user says from Monday to Friday, we store the values Monday 00:00 to Saturday 00:00. In order
		/// to display Friday, not Saturday as EndDate, we remove one day. This must never be used for calculations,
		/// because it will not be accurate. Only use it when displaying an end date!
		/// </summary>
		public static Date ToFriendlyEndDate(Date pDate) {
			return pDate.AddDays(-1);
		}

		/// <summary>
		/// If the user says from Monday to Friday, we store the values Monday 00:00 to Saturday 00:00. In order
		/// to display Friday, not Saturday as EndDate, we remove one day. This must never be used for calculations,
		/// because it will not be accurate. Only use it when displaying an end date!
		/// </summary>
		public static Date? ToFriendlyEndDate(Date? pDate) {
			Date? result = pDate;
			if (result != null) {
				result = DateTimeHelper.ToFriendlyEndDate((Date)result);
			}
			return result;
		}

		/// <summary>
		/// If the user says from Monday to Friday, we store the values Monday 00:00 to Saturday 00:00. In order
		/// to display Friday, not Saturday as EndDate, we remove one day. This must never be used for calculations,
		/// because it will not be accurate. Only use it when displaying an end date!
		/// </summary>
		public static DateTime? ToFriendlyEndDate(DateTime? pDateTime) {
			DateTime? result = pDateTime;
			if (result != null) {
				result = DateTimeHelper.ToFriendlyEndDate((Date)result);
			}
			return result;
		}

		/// <summary>
		/// This rounds a date to a full day. Any value can be rounded up or down, depending
		/// on what is closer, e.g. 12:01 will be 00:00 the next day
		/// </summary>
		public static Date Round(DateTime pDateTime) {
			Int64 ticks = pDateTime.Ticks;
			Double days = Math.Round((pDateTime - DateTime.MinValue).TotalDays);
			Date result = new Date(DateTime.MinValue.AddDays(days));
			return result;
		}

		/// <summary>
		/// This rounds a DateTime to a full minute. It's useful when avoiding mismatches between
		/// automatically generated dates and manually entered dates.
		/// </summary>
		/// <param name="pDateTime">The DateTime to round, null returns null</param>
		public static DateTime? RoundToMinute(DateTime? pDateTime) {
			DateTime? result = null;
			if (pDateTime != null) {
				result = DateTimeHelper.RoundToMinute((DateTime)pDateTime);
			}
			return result;
		}

		/// <summary>
		/// This rounds a DateTime to a full minute. It's useful when avoiding mismatches between
		/// automatically generated dates and manually entered dates.
		/// </summary>
		/// <param name="pDateTime">The DateTime to round</param>
		public static DateTime RoundToMinute(DateTime pDateTime) {
			return pDateTime.AddTicks(-pDateTime.Ticks % TimeSpan.TicksPerMinute);
		}

		/// <summary>
		/// returns true, if the period pStart1-pEnd1 overlaps the period pStart2-pEnd2. If any value is null, the result is true
		/// </summary>
		/// <returns></returns>
		public static Boolean Overlaps(DateTime? pStartDate1, DateTime? pEndDate1, DateTime? pStartDate2, DateTime? pEndDate2) {
			return (
				!((pStartDate1 >= pEndDate2) || (pStartDate2 >= pEndDate1))
			);
		}

		/// <summary>
		/// Checks wheter one period exceeds another period, both defined by start and end date.
		/// Exceeding means it starts before or ends after the other timeSpan.
		/// Null values mean infinity, so startDate at null
		/// is always before a startDate not null; same with endDates
		/// </summary>
		/// <returns>true, if the period pStartDate1-pEndDate1 exceeds the period from pStartDate2 to pEndDate2</returns>
		public static Boolean Exceeds(DateTime? pStartDate1, DateTime? pEndDate1, DateTime? pStartDate2, DateTime? pEndDate2) {
			return (!DateTimeHelper.Contains(pStartDate2, pEndDate2, pStartDate1, pEndDate1));
		}

		/// <summary>
		/// This returns true, if a period, defined by pStartDate1 and pEndDate1 contains (starts before or same, ends after
		/// or same) another period defined by pStartDate2 and pEndDate2
		/// </summary>
		/// <param name="pStartDate1">the start of the outer period</param>
		/// <param name="pEndDate1">the end of the outer period</param>
		/// <param name="pStartDate2">the start of the inner period</param>
		/// <param name="pEndDate2">the end of the inner period</param>
		/// <returns></returns>
		public static Boolean Contains(DateTime? pStartDate1, DateTime? pEndDate1, DateTime? pStartDate2, DateTime? pEndDate2) {
			return (
				DateTimeHelper.Contains(pStartDate1, pEndDate1, pStartDate2)
				&& DateTimeHelper.Contains(pStartDate1, pEndDate1, pEndDate2)
			);
		}

		/// <summary>
		/// This returns true, if a date is same or later than a start date, and same or before
		/// an end date. Start or end being null represent infinity. If pDate is null, this will
		/// return true if both start and end are null as well.
		/// </summary>
		/// <param name="pStartDate">The start of the period</param>
		/// <param name="pEndDate">The end of the period</param>
		/// <param name="pDate">the date to be tested</param>
		/// <returns>true, if pDate lies within pStartDate and pEndDate</returns>
		public static Boolean Contains(DateTime? pStartDate, DateTime? pEndDate, DateTime? pDate) {
			return (
				((pStartDate == null) || (pStartDate <= pDate))
				&& ((pEndDate == null) || (pEndDate >= pDate))
			);
		}

		/// <summary>
		/// This checks whether e certain combination of Day and Month is valid (eg. 31. November isn't). We use a leap year to check.
		/// </summary>
		public static Boolean ValidateDayMonth(Int32 pDay, Int32 pMonth) {
			return DateTimeHelper.ValidateDayMonthYear(pDay, pMonth, DateTimeHelper.LEAPYEAR);
		}

		/// <summary>
		/// Checks whether the combination of pDay, pMonth and pYear give a valid date
		/// </summary>
		public static Boolean ValidateDayMonthYear(Int32 pDay, Int32 pMonth, Int32 pYear) {
			Boolean result = false;
			if ((pMonth > 0) && (pMonth <= 12)) {
				result = pDay <= DateTime.DaysInMonth(pYear, pMonth);
			}
			return result;
		}
	}
}