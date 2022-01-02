using System;
using System.Collections.Generic;
using System.Linq;

using PiLot.Data.Files;
using PiLot.Model.Nav;
using PiLot.Utils.Logger;

namespace PiLot.API.Helpers {

	/// <summary>
	/// A helper which caches the latest GPS Positions in order to reduce IO 
	/// Operations. But even more, it also makes sure GPS Data is persisted
	/// in a reasonable way, which means we only persist positions that have a
	/// certain geographical and temporal distance
	/// </summary>
	public class GpsCache {

		#region constants

		private const String APPKEY = "gpsCache";

		private const Int32 MAXLENGTH = 150;    // max number of items to store
		private const Int64 MINDELTAT = 9500;   // minimal time between two persisted positions in ms > 9.5s
		private const Int32 MINDISTANCE = 5;    // minimal distance between two persisted positions in meters

		#endregion

		#region instance variables

		private List<GpsRecord> records = null;
		private GpsRecord previousSavedRecord = null;   // the last record we saved to disk
		private GlobalDataConnector globalDataConnector = null;
		private DataHelper dataHelper = null;

		#endregion

		#region constructors

		// hidden constructor, use the Instance getter instead
		private GpsCache() {
			this.records = new List<GpsRecord>();
			this.dataHelper = new DataHelper();
			this.globalDataConnector = new GlobalDataConnector();
		}

		/// <summary>
		/// Gets the current instance from the Application, or creates one.
		/// </summary>
		public static GpsCache Instance {
			get {
				GpsCache result = null;
				Object applicationItem = Program.GetApplicationObject(APPKEY);
				if (applicationItem != null) {
					result = applicationItem as GpsCache;
				} else {
					result = new GpsCache();
					Program.SetApplicationObject(APPKEY, result);
				}
				return result;
			}
		}

		#endregion

		#region public methods

		/// <summary>
		/// Returns the latest record or null, if we have no data yet
		/// </summary>
		public GpsRecord GetLatestRecord() {
			return this.records.FirstOrDefault();
		}

		/// <summary>
		/// Return a list of all cached GPS Records with the UTC
		/// timestamp greater than a given number
		/// </summary>
		/// <param name="pMinDateUTCMS">Only records with a larger UTC timestamp than this will be returned. MS UTC</param>
		public List<GpsRecord> GetLatestRecords(Int64 pMinDateUTCMS) {
			List<GpsRecord> result = this.records.FindAll(r => r.UTC > pMinDateUTCMS);
			result.Sort();
			return result;
		}

		/// <summary>
		/// Adds a record to the list, and persits it if necessary. Only records
		/// that have latitude and longitude are processed
		/// </summary>
		public void AddRecord(GpsRecord pRecord) {
			if ((pRecord?.Latitude != null) && (pRecord?.Longitude != null)) {
				Int64 utcOffset = this.globalDataConnector.GetBoatTime().UtcOffsetMinutes * 60 * 1000;
				pRecord.BoatTime = pRecord.UTC + utcOffset;
				this.records.Insert(0, pRecord);
				this.records.Sort((x, y) => y.UTC.CompareTo(x.UTC));
				this.CropRecords();
				this.PersistLatest();
			}
		}

		#endregion

		#region private methods

		/// <summary>
		/// This makes sure we have no more than MAXLENGTH records in the list
		/// </summary>
		private void CropRecords() {
			if (this.records.Count > MAXLENGTH) {
				this.records.RemoveRange(MAXLENGTH - 1, this.records.Count - MAXLENGTH);
			}
		}

		/// <summary>
		/// Persists the latest record, if the distance and delta t to the previous
		/// record are above the minimal values. If not, nothing happens.
		/// </summary>
		private void PersistLatest() {
			Boolean doPersist;
			Int64 deltaT;
			Double deltaX;
			if (this.records.Count > 0) {
				GpsRecord lastRecord = this.records[0];
				if (this.previousSavedRecord != null) {
					deltaT = lastRecord.UTC - this.previousSavedRecord.UTC;
					deltaX = GeoHelper.Haversine(lastRecord.Latitude.Value, this.previousSavedRecord.Latitude.Value, lastRecord.Longitude.Value, this.previousSavedRecord.Longitude.Value);
					doPersist = (deltaT >= MINDELTAT) && (deltaX > MINDISTANCE);
				} else {
					doPersist = true;
				}
				if (doPersist) {
					new GPSDataConnector().SavePosition(lastRecord);
					this.previousSavedRecord = lastRecord;
				}
			}
		}

		#endregion
	}
}