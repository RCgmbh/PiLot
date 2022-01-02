using System;
using System.Text.Json.Serialization;

namespace PiLot.Model.Common {

	/// <summary>
	/// Represents a single date, without any time or timezone logic. Just
	/// a day in the calendar. More lightwight than RC.Utils Date, and easier
	/// to serialize for JS
	/// </summary>
	public class Date {

		public Date() { }

		public Date(Int32 pYear, Int32 pMonth, Int32 pDay) {
			this.Year = pYear;
			this.Month = pMonth;
			this.Day = pDay;
		}

		public Date(DateTime pDateTime) {
			this.Year = pDateTime.Year;
			this.Month = pDateTime.Month;
			this.Day = pDateTime.Day;
		}

		[JsonPropertyName("day")]
		public Int32 Day { get; set; }

		[JsonPropertyName("month")]
		public Int32 Month { get; set; }

		[JsonPropertyName("year")]
		public Int32 Year { get; set; }

		/// <summary>
		/// returns a DateTime from this
		/// </summary>
		public DateTime ToDateTime() {
			return new DateTime(this.Year, this.Month, this.Day);
		}

		/// <summary>
		/// overrides toString, returning yyyy-mm-dd
		/// </summary>
		public override string ToString() {
			return $"{this.Year}-{this.Month}-{this.Day}";
		}

	}
}
