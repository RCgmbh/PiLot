using System;
using System.Text.Json.Serialization;

namespace PiLot.Model.Common {
	
	/// <summary>
	/// Represents a BoatTime, which can be sent to the client, and
	/// contains the current BoatTime offset as well as the current
	/// UTC timestamp
	/// </summary>
	public struct BoatTime {

		private Int32 utcOffsetMinutes;

		public BoatTime(Int32 pUtcOfsetMinutes) {
			this.utcOffsetMinutes = pUtcOfsetMinutes;
		}

		/// <summary>
		/// Gets the current utc Timestamp of the server time in
		/// milliseconds from 01.01.1970
		/// </summary>
		[JsonPropertyName("utcNow")]
		public Int64 UtcNow {
			get { return PiLot.Utils.DateAndTime.DateTimeHelper.JSNow; }
		}

		/// <summary>
		/// Gets the offset of the boatTime compared to UTC, in minutes
		/// </summary>
		[JsonPropertyName("utcOffsetMinutes")]
		public Int32 UtcOffsetMinutes {
			get { return this.utcOffsetMinutes; }
		}

		/// <summary>
		/// Gets the current date in BoatTime.
		/// </summary>
		[JsonIgnore]
		public Date Today {
			get {
				DateTime boatTimeNow = DateTime.UtcNow.AddMinutes(this.utcOffsetMinutes);
				return new Date(boatTimeNow.Year, boatTimeNow.Month, boatTimeNow.Day);
			}
		}

	}
}
