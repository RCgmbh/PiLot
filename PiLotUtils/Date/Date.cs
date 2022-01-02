﻿/*
The MIT License (MIT)

Copyright (c) 2015 Clay Anderson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

using System.Globalization;
using System.Runtime.Serialization;
using System.Security.Permissions;

namespace System {
	[Serializable]
	public struct Date : IComparable, IFormattable, ISerializable, IComparable<Date>, IEquatable<Date> {
		private DateTime dateTime;

		public static readonly Date MaxValue = new Date(DateTime.MaxValue);
		public static readonly Date MinValue = new Date(DateTime.MinValue);

		public Date(Int32 pYear, Int32 pMonth, Int32 pDay) {
			this.dateTime = new DateTime(pYear, pMonth, pDay);
		}

		public Date(DateTime pDateTime) {
			this.dateTime = pDateTime.AddTicks(-pDateTime.Ticks % TimeSpan.TicksPerDay);
		}

		public Date(Int64 pTicks) {
			this.dateTime = new DateTime(pTicks).Date;
		}

		public Date(SerializationInfo info, StreamingContext context) : this() {
			Int64 ticks = info.GetInt64("ticks");
			this.dateTime = new DateTime(ticks).Date;
		}

		public static TimeSpan operator -(Date d1, Date d2) {
			return d1.dateTime - d2.dateTime;
		}

		public static Date operator -(Date d, TimeSpan t) {
			return new Date(d.dateTime - t);
		}

		public static bool operator !=(Date d1, Date d2) {
			return d1.dateTime != d2.dateTime;
		}

		public static Date operator +(Date d, TimeSpan t) {
			return new Date(d.dateTime + t);
		}

		public static bool operator <(Date d1, Date d2) {
			return d1.dateTime < d2.dateTime;
		}

		public static bool operator <=(Date d1, Date d2) {
			return d1.dateTime <= d2.dateTime;
		}

		public static bool operator ==(Date d1, Date d2) {
			return d1.dateTime == d2.dateTime;
		}

		public static bool operator >(Date d1, Date d2) {
			return d1.dateTime > d2.dateTime;
		}

		public static bool operator >=(Date d1, Date d2) {
			return d1.dateTime >= d2.dateTime;
		}

		public static implicit operator DateTime(Date d) {
			return d.dateTime;
		}

		public static explicit operator Date(DateTime d) {
			return new Date(d);
		}

		public DateTime DateTime {
			get { return this.dateTime; }
		}

		public int Day {
			get {
				return this.dateTime.Day;
			}
		}

		public DayOfWeek DayOfWeek {
			get {
				return this.dateTime.DayOfWeek;
			}
		}

		public int DayOfYear {
			get {
				return this.dateTime.DayOfYear;
			}
		}

		public int Month {
			get {
				return this.dateTime.Month;
			}
		}

		public static Date Today {
			get {
				return new Date(DateTime.Today);
			}
		}

		public int Year {
			get {
				return this.dateTime.Year;
			}
		}

		public long Ticks {
			get { return this.dateTime.Ticks; }
		}

		public Date AddDays(Double value) {
			return new Date(this.dateTime.AddDays(value));
		}

		public Date AddMonths(int value) {
			return new Date(this.dateTime.AddMonths(value));
		}

		public Date AddYears(int value) {
			return new Date(this.dateTime.AddYears(value));
		}

		public static int Compare(Date d1, Date d2) {
			return d1.CompareTo(d2);
		}

		public int CompareTo(Date value) {
			return this.dateTime.CompareTo(value.dateTime);
		}

		public int CompareTo(object value) {
			return this.dateTime.CompareTo(value);
		}

		public static int DaysInMonth(int year, int month) {
			return DateTime.DaysInMonth(year, month);
		}

		public bool Equals(Date value) {
			return this.dateTime.Equals(value.dateTime);
		}

		public override bool Equals(object value) {
			return value is Date && this.dateTime.Equals(((Date)value).dateTime);
		}

		public override int GetHashCode() {
			return this.dateTime.GetHashCode();
		}

		public static bool Equals(Date d1, Date d2) {
			return d1.dateTime.Equals(d2.dateTime);
		}

		void ISerializable.GetObjectData(SerializationInfo info, StreamingContext context) {
			info.AddValue("ticks", this.dateTime.Ticks);
		}

		public static bool IsLeapYear(int year) {
			return DateTime.IsLeapYear(year);
		}

		public static Date Parse(string s) {
			return new Date(DateTime.Parse(s));
		}

		public static Date Parse(string s, IFormatProvider provider) {
			return new Date(DateTime.Parse(s, provider));
		}

		public static Date Parse(string s, IFormatProvider provider, DateTimeStyles style) {
			return new Date(DateTime.Parse(s, provider, style));
		}

		public static Date ParseExact(string s, string format, IFormatProvider provider) {
			return new Date(DateTime.ParseExact(s, format, provider));
		}

		public static Date ParseExact(string s, string format, IFormatProvider provider, DateTimeStyles style) {
			return new Date(DateTime.ParseExact(s, format, provider, style));
		}

		public static Date ParseExact(string s, string[] formats, IFormatProvider provider, DateTimeStyles style) {
			return new Date(DateTime.ParseExact(s, formats, provider, style));
		}

		public TimeSpan Subtract(Date value) {
			return this - value;
		}

		public Date Subtract(TimeSpan value) {
			return this - value;
		}

		public string ToLongString() {
			return this.dateTime.ToLongDateString();
		}

		public string ToShortString() {
			return this.dateTime.ToShortDateString();
		}

		public override string ToString() {
			return this.ToShortString();
		}

		public string ToString(IFormatProvider provider) {
			return this.dateTime.ToString(provider);
		}

		public string ToString(string format) {
			if (format == "O" || format == "o" || format == "s") {
				return this.ToString("yyyy-MM-dd");
			}

			return this.dateTime.ToString(format);
		}

		public string ToString(string format, IFormatProvider provider) {
			return this.dateTime.ToString(format, provider);
		}

		public static bool TryParse(string s, out Date result) {
			DateTime d;
			bool success = DateTime.TryParse(s, out d);
			result = new Date(d);
			return success;
		}

		public static bool TryParse(string s, IFormatProvider provider, DateTimeStyles style, out Date result) {
			DateTime d;
			bool success = DateTime.TryParse(s, provider, style, out d);
			result = new Date(d);
			return success;
		}

		public static bool TryParseExact(string s, string format, IFormatProvider provider, DateTimeStyles style, out Date result) {
			DateTime d;
			bool success = DateTime.TryParseExact(s, format, provider, style, out d);
			result = new Date(d);
			return success;
		}

		public static bool TryParseExact(string s, string[] formats, IFormatProvider provider, DateTimeStyles style, out Date result) {
			DateTime d;
			bool success = DateTime.TryParseExact(s, formats, provider, style, out d);
			result = new Date(d);
			return success;
		}
	}

	public static class DateTimeExtensions {
		public static Date ToDate(this DateTime dt) {
			return new Date(dt);
		}
	}
}
