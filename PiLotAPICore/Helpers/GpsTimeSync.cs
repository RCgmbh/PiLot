using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Threading.Tasks;

using PiLot.Model.Nav;
using PiLot.Utils.DateAndTime;
using PiLot.Utils.Logger;
using PiLot.Utils.OS;

namespace PiLot.API.Helpers {

	/// <summary>
	/// This helps wetting the time recieved with a gps record 
	/// to the local system time, which is especially useful if
	/// the system has booted offline and thus has not chance to
	/// set the time correctly. The object is cached, just to
	/// save the conversion of the config value to an int.
	/// </summary>
	public class GpsTimeSync {

		#region constants

		private const String APPKEY = "gpsTimeSync";

		#endregion

		#region instance variables

		/// <summary>
		/// The threshold in seconds. If the GPS timestamp differs
		/// more than this many seconds from system time, the 
		/// system time will be set to the GPS record time.
		/// </summary>
		private Int32? threshold = null;

		#endregion

		#region constructors

		// hidden constructor, use the Instance getter instead
		private GpsTimeSync() {
			this.ReadConfig();
		}

		/// <summary>
		/// Gets the current instance from the Application, or creates one.
		/// </summary>
		public static GpsTimeSync Instance {
			get {
				GpsTimeSync result = null;
				Object applicationItem = Program.GetApplicationObject(APPKEY);
				if (applicationItem != null) {
					result = applicationItem as GpsTimeSync;
				} else {
					result = new GpsTimeSync();
					Program.SetApplicationObject(APPKEY, result);
				}
				return result;
			}
		}

		#endregion

		#region public methods

		/// <summary>
		/// This takes a GPS record, and applies the UTC time of the record to the
		/// system, if a threshol is set in app.config, and the record's UTC differ
		/// from the system time more than applyGpsTimeThreshold seconds.
		/// </summary>
		/// <param name="pRecord">The current GPS record</param>
		public void HandleGPSRecord(GpsRecord pRecord) {
			if((this.threshold != null) && (pRecord != null)) {
				if(Math.Abs(pRecord.UTC - DateTimeHelper.ToJSTime(DateTime.UtcNow)) > this.threshold) {
					Logger.Log(
						"Setting System time based on GPS data. Old system time UTC: {0:o}, new system time: {1:o}",
						DateTime.UtcNow,
						DateTimeHelper.FromJSTime(pRecord.UTC),
						LogLevels.INFO
					);
					new SystemHelper().SetDate(pRecord.UTC);
				}
			}
		}

		#endregion

		#region private methods

		/// <summary>
		/// Reads the threshold in seconds from the config file, and save
		/// it in milliseconds in this.threshold
		/// </summary>
		private void ReadConfig() {
			String configValue = ConfigurationManager.AppSettings["gpsTimeThreshold"];
			if (!String.IsNullOrEmpty(configValue)) {
				if(Int32.TryParse(configValue, out Int32 threshold)) {
					this.threshold = threshold * 1000;
				}
			}
		}

		#endregion

	}
}
