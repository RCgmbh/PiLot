using System;
using System.Text.Json.Serialization;
using PiLot.Utils.DateAndTime;

namespace PiLot.Model.Nav {

	/// <summary>
	/// Represents one GPS record
	/// </summary>
	public class GpsRecord : IComparable<GpsRecord> {

		private const Char SEPARATOR = ';';

		#region constructor

		public GpsRecord() { }

		/// <summary>
		/// Creates a GpsRecord from an Array with UTC, BoatTime, Lat, Lng. If any of them is
		/// null, the result is null. Additional values will be ignored
		/// </summary>
		/// <param name="pData">Array with UTC (ms), BoatTime (ms), Latitude, Longitude</param>
		/// <returns>A GpsRecord or null</returns>
		public static GpsRecord FromArray(Double?[] pData) {
			GpsRecord result = null;
			if(
				(pData.Length > 3)
				&& (pData[0] != null)
				&& (pData[1] != null)
				&& (pData[2] != null)
				&& (pData[3] != null)
			) {
				result = new GpsRecord {
					UTC = Convert.ToInt64(pData[0]),
					BoatTime = Convert.ToInt64(pData[1]),
					Latitude = pData[2],
					Longitude = pData[3]
				};
			}
			return result;
		}

		/// <summary>
		/// Tries to create a GpsRecord from a Separator separated String as it
		/// is created by ToString()
		/// </summary>
		/// <param name="pString">The string representation to parse</param>
		/// <returns>the GpsRecord or null, if parsing fails</returns>
		public static GpsRecord FromString(String pString) {
			String[] segments = pString.Split(SEPARATOR);
			return GpsRecord.FromStringArray(segments);
		}

		/// <summary>
		/// Reads a GPS record from an array of strings, where each item 
		/// represents one value of the record, as follows:
		/// utc in milliseconds from epoc
		/// boatTime in milliseconds from epoc
		/// lat in a decimal degrees value or "null"
		/// lon in a decimal degrees value or "null"
		/// altitude in meters above sealevel or "null"
		/// sog in kts or "null"
		/// cog in decimal degrees value or "null"
		/// lat error in meters or "null"
		/// lon error in meters or "null"
		/// alt error in meters or "null"
		/// sog error in kts or "null"
		/// </summary>
		/// <param name="pStringArray">An array of Strings</param>
		/// <returns></returns>
		public static GpsRecord FromStringArray(String[] pStringArray) {
			GpsRecord result = null;
			Double testDouble;
			if (pStringArray.Length >= 4) {
				if (
						Int64.TryParse(pStringArray[0], out Int64 utc)
						&& Int64.TryParse(pStringArray[1], out Int64 boatTime)
						&& Double.TryParse(pStringArray[2], out Double lat)
						&& Double.TryParse(pStringArray[3], out Double lon)
				) {
					result = new GpsRecord();
					result.UTC = utc;
					result.BoatTime = boatTime;
					result.Latitude = lat;
					result.Longitude = lon;
				}
				if ((pStringArray.Length >= 5) && Double.TryParse(pStringArray[4], out testDouble)) {
					result.Altitude = testDouble;
				}
				if ((pStringArray.Length >= 6) && Double.TryParse(pStringArray[5], out testDouble)) {
					result.LatitudeError = testDouble;
				}
				if ((pStringArray.Length >= 7) && Double.TryParse(pStringArray[6], out testDouble)) {
					result.LongitudeError = testDouble;
				}
				if ((pStringArray.Length >= 8) && Double.TryParse(pStringArray[7], out testDouble)) {
					result.AltitudeError = testDouble;
				}
			}
			return result;
		}

		#endregion

		#region public properties

		/// <summary>
		/// The utc timestamp in milliseconds from epoc
		/// </summary>
		[JsonPropertyName("utc")]
		public Int64 UTC { get; set; }

		/// <summary>
		/// The boatTime timestamp in milliseconds from epoc
		/// </summary>
		[JsonPropertyName("boatTime")]
		public Int64? BoatTime { get; set; }

		/// <summary>
		/// The latitude in degrees
		/// </summary>
		[JsonPropertyName("latitude")]
		public Double? Latitude { get; set; }

		/// <summary>
		/// The longitude in degrees
		/// </summary>
		[JsonPropertyName("longitude")]
		public Double? Longitude { get; set; }

		/// <summary>
		/// The asm in m as measured by the gps
		/// </summary>
		[JsonPropertyName("altitude")]
		public Double? Altitude { get; set; }

		/// <summary>
		/// The latitude error in m as indicated by the GPS
		/// </summary>
		[JsonPropertyName("latError")]
		public Double? LatitudeError { get; set; }

		/// <summary>
		/// The longitude error in m as indicated by the GPS
		/// </summary>
		[JsonPropertyName("lonError")]
		public Double? LongitudeError { get; set; }

		/// <summary>
		/// The altitude error in m as indicated by the GPS
		/// </summary>
		[JsonPropertyName("altError")]
		public Double? AltitudeError { get; set; }

		#endregion

		#region public methods

		/// <summary>
		/// Serializes the record into a string
		/// </summary>
		public override String ToString() {
			return String.Join(SEPARATOR.ToString(), new string[] {
				this.UTC.ToString("F0"),
				this.BoatTime != null ? this.BoatTime.Value.ToString("F0"): "null",
				this.DoubleToString(this.Latitude, "F7"),
				this.DoubleToString(this.Longitude, "F7"),
				this.DoubleToString(this.Altitude, "F2"),
				this.DoubleToString(this.LatitudeError, "F2"),
				this.DoubleToString(this.LongitudeError, "F2"),
				this.DoubleToString(this.AltitudeError, "F2")
			});
		}

		/// <summary>
		/// converts this into an array of doubles, consisting of 
		/// UTC, BoatTime, Lat, Lng. This is used for jsonized rest
		/// responses, because its small overhead.
		/// </summary>
		public Double?[] ToArray() {
			return new Double?[]{this.UTC, this.BoatTime, this.Latitude, this.Longitude };
		}

		/// <summary>
		/// Gets the UTC Timestamp of the record as DateTime object
		/// </summary>
		/// <returns></returns>
		public DateTime GetUTCDate() {
			return DateTimeHelper.FromJSTime(this.UTC);
		}

		/// <summary>
		/// Default comparison based on UTC
		/// </summary>
		public Int32 CompareTo(GpsRecord pRecord) {
			return this.UTC.CompareTo(pRecord.UTC);
		}

		#endregion

		#region private methods

		/// <summary>
		/// converts a nullable double to string, either returning
		/// the value formatted with pFormat, or "null"
		/// </summary>
		/// <param name="pValue">the nullable Double to format</param>
		/// <param name="pFormat">the format string, e.g. "F3"</param>
		/// <returns>stringified value or null</returns>
		private String DoubleToString(Double? pValue, String pFormat) {
			return pValue != null ? pValue.Value.ToString(pFormat) : "null";
		}

		#endregion
	}
}
