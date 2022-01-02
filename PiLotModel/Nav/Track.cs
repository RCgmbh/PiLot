using System;
using System.Collections.Generic;
using System.Linq;
using PiLot.Utils;

namespace PiLot.Model.Nav {
	
	/// <summary>
	/// Represents a track, which consists of a series of GPSRecords. This offers
	/// some functionality to crop or cut a track, which is useful when reading
	/// track data for an entire day (from file), and afterwards limit the data
	/// to a certain timeframe.
	/// </summary>
	public class Track {

		private List<GpsRecord> gpsRecords = null;
		private Boolean sorted = false;

		/// <summary>
		/// Default constructor
		/// </summary>
		public Track() {
			this.gpsRecords = new List<GpsRecord>();
		}

		/// <summary>
		/// Constructor expecting a list of records
		/// </summary>
		/// <param name="pGpsRecords">The list of records, not null</param>
		public Track(List<GpsRecord> pGpsRecords) {
			Assert.IsNotNull(pGpsRecords);
			this.gpsRecords = pGpsRecords;
		}

		/// <summary>
		/// Gets the list of all GpsRecords within the track 
		/// </summary>
		public List<GpsRecord> GpsRecords {
			get { return this.gpsRecords; }
		}

		/// <summary>
		/// Gets the first position or null, if the track is empty
		/// </summary>
		public GpsRecord FirstRecord {
			get {
				GpsRecord result = null;
				if (this.gpsRecords.Count > 0) {
					result = this.gpsRecords[0];
				}
				return result;
			}
		}

		/// <summary>
		/// Gets the last position or null, if the track is empty
		/// </summary>
		public GpsRecord LastRecord {
			get {
				GpsRecord result = null;
				if (this.gpsRecords.Count > 0) {
					result = this.gpsRecords.Last();
				}
				return result;
			}
		}

		/// <summary>
		/// Returns whether the Track contains at least one record.
		/// </summary>
		public Boolean HasRecords {
			get {
				return this.gpsRecords.Count > 0;
			}
		}

		/// <summary>
		/// Sorts the gpsRecords by UTC timestamp ascending
		/// </summary>
		public void SortRecords() {
			if (!this.sorted) {
				this.gpsRecords.Sort((x, y) => x.UTC.CompareTo(y.UTC));
				this.sorted = true;
			}
		}

		/// <summary>
		/// Adds a range of records
		/// </summary>
		/// <param name="pRecords">The range to add, not null</param>
		public void AddRecords(List<GpsRecord> pRecords) {
			Assert.IsNotNull(pRecords);
			this.gpsRecords.AddRange(pRecords);
			this.sorted = false;
		}

		/// <summary>
		/// Adds a single record 
		/// </summary>
		/// <param name="pRecord">The record to add, not null</param>
		public void AddRecord(GpsRecord pRecord) {
			Assert.IsNotNull(pRecord);
			this.gpsRecords.Add(pRecord);
			this.sorted = false;
		}

		/// <summary>
		/// Adds a position defined by an array representing UTC ms, BoatTime ms, Lat, Lng
		/// </summary>
		/// <param name="pPosition">ms UTC, ms BoatTime, Lat, Lng</param>
		public void AddPosition(Double?[] pPosition) {
			GpsRecord gpsRecord = GpsRecord.FromArray(pPosition);
			Assert.IsNotNull(gpsRecord, "Invalid positions Array in Track.AddPosition");
			this.AddRecord(gpsRecord);
		}
		
		/// <summary>
		/// Removes all records which lie outside a certain timeframe
		/// </summary>
		/// <param name="pStartTime">start time in milliseconds UTC or BoatTime</param>
		/// <param name="pEndTime">end time in milliseconds UTC or BoatTime</param>
		/// <param name="pIsBoatTime">if true, pStartTime and pEndTime are considered BoatTime, else UTC</param>
		public void Crop(Int64 pStartTime, Int64 pEndTime, Boolean pIsBoatTime) {
			if (pIsBoatTime) {
				this.gpsRecords.RemoveAll(r => ((r.BoatTime < pStartTime) || (r.BoatTime > pEndTime)));
			} else {
				this.gpsRecords.RemoveAll(r => ((r.UTC < pStartTime) || (r.UTC > pEndTime)));
			}
		}

		/// <summary>
		/// Removes all records which lie within a certain timeframe
		/// </summary>
		/// <param name="pStartTime">start time in milliseconds UTC or BoatTime</param>
		/// <param name="pEndTime">end time in milliseconds UTC or BoatTime</param>
		/// <param name="pIsBoatTime">if true, pStartTime and pEndTime are considered BoatTime, else UTC</param>
		public void Cut(Int64 pStartTime, Int64 pEndTime, Boolean pIsBoatTime) {
			if (pIsBoatTime) {
				this.gpsRecords.RemoveAll(r => ((r.BoatTime >= pStartTime) && (r.BoatTime <= pEndTime)));
			} else {
				this.gpsRecords.RemoveAll(r => ((r.UTC >= pStartTime) && (r.UTC <= pEndTime)));
			}
		}

		/// <summary>
		/// Returns a list of arrays, each array representing a record (UTC, BoatTime, Lat, Lng).
		/// This is helpful to send data across the wire, as the array is very light when serialized.
		/// </summary>
		public List<Double?[]> ToList() {
			this.SortRecords();
			return this.gpsRecords.Select(r => r.ToArray()).ToList();
		}
	}
}
