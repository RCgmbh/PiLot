using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

using PiLot.Utils.DateAndTime;
using PiLot.Utils.Logger;
using PiLot.Model.Nav;
using System.Globalization;

namespace PiLot.Data.Files {

	/// <summary>
	/// Helper class to read and write GPS data
	/// </summary>
	public class GPSDataConnector {

		#region constants

		protected const String DATASOURCENAME = "gps";

		#endregion

		#region instance variables

		protected DataHelper helper;

		#endregion

		#region constructors

		/// <summary>
		/// Default constructor
		/// </summary>
		public GPSDataConnector() {
			this.helper = new DataHelper();
		}

		/// <summary>
		/// Creates a new GPSDataConnector for a specific data root path
		/// </summary>
		/// <param name="pDataRoot">root path</param>
		public GPSDataConnector(String pDataRoot) {
			this.helper = new DataHelper(pDataRoot);
		}

		#endregion

		#region public methods

		/// <summary>
		/// Appends a GPS record to the file with records. Data is always appended to
		/// the end of the file, so there is no guarantee for records to be sorted
		/// within the file
		/// </summary>
		public void SavePosition(GpsRecord pRecord) {
			Date recordDate = new Date(pRecord.GetUTCDate());
			FileInfo file = this.helper.GetDataFile(DATASOURCENAME, recordDate, true);
			String[] line = new String[] { pRecord.ToString() };
			File.AppendAllLines(file.FullName, line);
		}

		/// <summary>
		/// Saves a list of positions to the files. Optionally, the existing data for the
		/// period of the track is deleted, an then the new data is added.
		/// </summary>
		/// <param name="pRecords">The records as a list of double arrays representing UTC, BoatTime, Lat, Lng</param>
		/// <param name="pReplaceExisting">True, if all data overlapping with pRecords should be deleted</param>
		public void SavePositions(List<Double?[]> pRecords, Boolean pReplaceExisting) {
			if ((pRecords != null) && (pRecords.Count > 0)) {
				List<GpsRecord> records = new List<GpsRecord>();
				foreach(Double?[] aRecord in pRecords) {
					GpsRecord gpsRecord = GpsRecord.FromArray(aRecord);
					if(gpsRecord != null) {
						records.Add(gpsRecord);
					}
				}
				this.SavePositions(records, pReplaceExisting);
			}
		}

		/// <summary>
		/// Saves a list of positions to the files. Optionally, the existing data for the
		/// period of the track is deleted, an then the new data is added.
		/// </summary>
		/// <param name="pRecords">A list of GpsRecords</param>
		/// <param name="pReplaceExisting">True, if all data overlapping with pRecords should be deleted</param>
		public void SavePositions(List<GpsRecord> pRecords, Boolean pReplaceExisting) {
			if ((pRecords != null) && (pRecords.Count > 0)) {
				List<Date> dates = new List<Date>();
				Int64 minUTC = pRecords.Min(r => r.UTC);
				Int64 maxUTC = pRecords.Max(r => r.UTC);
				Track track = this.ReadFullDatesTrack(minUTC, maxUTC, false, ref dates);
				if (pReplaceExisting) {
					track.Cut(minUTC, maxUTC, false);
				}
				track.AddRecords(pRecords);
				this.SaveTrack(track, dates);
			}
		}

		/// <summary>
		/// Deletes all positions between pStartTime and pEndTime from the gps files.
		/// It's a bit tricky because we have to read entire utc days (1 UTC day = 1 file),
		/// then remove the unwanted part and re-save the files. 
		/// </summary>
		/// <param name="pStartTime">The js timestamp of the start time</param>
		/// <param name="pEndTime">The js timestamp of the end time</param>
		public void DeletePositions(Int64 pStartTime, Int64 pEndTime, Boolean pIsBoatTime) {
			List<Date> dates = new List<Date>();
			Track track = this.ReadFullDatesTrack(pStartTime, pEndTime, pIsBoatTime, ref dates);
			track.Cut(pStartTime, pEndTime, pIsBoatTime);
			this.SaveTrack(track, dates);
		}

		/// <summary>
		/// Reads the GPS Track for a certain period from files. If there are no GPS Records,
		/// the result will be a Track with an empty positions list
		/// </summary>
		/// <param name="pStartTime">The start time in milliseconds, either UTC or BoatTime</param>
		/// <param name="pEndTime">The end time in milliseconds, either UTC or BoatTime</param>
		/// <param name="pIsBoatTime">If true, pStartTime and pEndTime are BoatTime, else UTC</param>
		/// <returns>A Track, never null</returns>
		public Track ReadTrack(Int64 pStartTime, Int64 pEndTime, Boolean pIsBoatTime) {
			List<Date> dates = null;
			return this.ReadTrack(pStartTime, pEndTime, pIsBoatTime, ref dates);
		}

		/// <summary>
		/// Reads the GPS Track for a certain period from files. If there are no GPS Records,
		/// the result will be a Track with an empty positions list
		/// </summary>
		/// <param name="pStartTime">The start time in milliseconds, either UTC or BoatTime</param>
		/// <param name="pEndTime">The end time in milliseconds, either UTC or BoatTime</param>
		/// <param name="pIsBoatTime">If true, pStartTime and pEndTime are BoatTime, else UTC</param>
		/// <param name="pDates">Takes a list of Dates that will be filled with all processed days</param>
		/// <returns>A Track, never null</returns>
		public Track ReadTrack(Int64 pStartTime, Int64 pEndTime, Boolean pIsBoatTime, ref List<Date> pDates) {
			Track result = this.ReadFullDatesTrack(pStartTime, pEndTime, pIsBoatTime, ref pDates);
			result.Crop(pStartTime, pEndTime, pIsBoatTime);
			return result;
		}

		/// <summary>
		/// Returns the amount of days that have a valid gps data file, even if it's empty
		/// means no data.
		/// </summary>
		/// <returns></returns>
		public Int32 ReadDaysWithData() {
			Int32 result = 0;
			DirectoryInfo gpsDirectory = new DirectoryInfo(this.helper.GetDataPath(DATASOURCENAME, false));
			if (gpsDirectory.Exists) {
				foreach(FileInfo aFile in gpsDirectory.EnumerateFiles()) {
					if (Date.TryParseExact(aFile.Name, DataHelper.FILENAMEFORMAT, CultureInfo.InvariantCulture, DateTimeStyles.None, out Date date)) {
						result++;
					}
				}
			}
			return result;
		}

		/// <summary>
		/// This reads a track, but always in a way the entire data for all involved days is loaded. That way,
		/// the data can be manipulated and saved back to files, without losing existing data.
		/// </summary>
		/// <param name="pStartTime">Start time in milliseconds, UTC or BoatTime</param>
		/// <param name="pEndTime">End time in milliseconds, UTC or BoatTime</param>
		/// <param name="pIsBoatTime">If true, pStartTime and pEndTime are BoatTime, if false they are UTC.</param>
		/// <param name="pDates">The list will be filled with all dates processed</param>
		/// <returns>A track containing all positions for the involved UTC days (= files)</returns>
		private Track ReadFullDatesTrack(Int64 pStartTime, Int64 pEndTime, Boolean pIsBoatTime, ref List<Date> pDates) {
			Track result = new Track();
			DateTime loopStartUtc = DateTimeHelper.FromJSTime(pStartTime); // we need this to loop the files, the filename is based on utc
			DateTime loopEndUtc = DateTimeHelper.FromJSTime(pEndTime);
			if (pIsBoatTime) {
				// we need to enlarge the range of files checked, because the files are based on UTC,
				// but we query based on BoatTime, which can differ up to +/-12 h 
				loopStartUtc = loopStartUtc.AddHours(-12);
				loopEndUtc = loopEndUtc.AddHours(12);
			}
			Date loopDate = new Date(loopStartUtc);
			Date loopEndDate = new Date(loopEndUtc);
			while (loopDate <= loopEndDate) {
				this.ReadRecordsFromFile(loopDate, result);
				if (pDates != null) {
					pDates.Add(loopDate);
				}
				loopDate = loopDate.AddDays(1);
			}
			return result;
		}

		/// <summary>
		/// saves track data to files, creating one file per date (in UTC). BE AWARE that all data for the impacted days 
		/// will be replaced, so you might want to start off with ReadFullDatesTrack. If the track has no positions, but
		/// there is a file, the file will be deleted.
		/// </summary>
		/// <param name="pTrack">The track for which we save the data</param>
		/// <param name="pDates">Optionally pass a list of dates, to ensure days with no records are properly updated</param>
		private void SaveTrack(Track pTrack, List<Date> pDates = null) {
			Dictionary<Date, Track> dailyTracks = new Dictionary<Date, Track>();
			if(pDates != null) {
				pDates.ForEach(d => dailyTracks.Add(d, new Track()));
			}
			Date recordDate;
			pTrack.SortRecords();
			foreach (GpsRecord aRecord in pTrack.GpsRecords) {
				recordDate = new Date(aRecord.GetUTCDate());
				if (!dailyTracks.ContainsKey(recordDate)) {
					dailyTracks.Add(recordDate, new Track());
				}
				dailyTracks[recordDate].AddRecord(aRecord);
			}
			FileInfo file;
			List<String> lines;
			foreach (Date aKey in dailyTracks.Keys) {
				lines = dailyTracks[aKey].GpsRecords.Select(r => r.ToString()).ToList();
				file = this.helper.GetDataFile(DATASOURCENAME, aKey, true);
				File.WriteAllLines(file.FullName, lines);
			}
		}

		/// <summary>
		/// Reads the records from a file for a specific date and adds them to a given track or
		/// creates a new track
		/// </summary>
		/// <param name="pDate">The date used to find the file</param>
		/// <param name="pTrack">A given track or null</param>
		/// <returns></returns>
		private Track ReadRecordsFromFile(Date pDate, Track pTrack = null) {
			FileInfo file = this.helper.GetDataFile(DATASOURCENAME, pDate);
			return this.ReadRecordsFromFile(file, pTrack);
		}

		/// <summary>
		/// Reads the records from a file and adds the to a given Track or creates a new track
		/// </summary>
		/// <param name="pFile">the file to read from</param>
		/// <param name="pTrack">if a track is passed, the positions will be appended to it</param>
		/// <returns></returns>
		protected Track ReadRecordsFromFile(FileInfo pFile, Track pTrack = null) {
			List<GpsRecord> records = new List<GpsRecord>();
			if (pFile != null) {
				try {
					foreach (String aLine in File.ReadLines(pFile.FullName)) {
						GpsRecord record = GpsRecord.FromString(aLine);
						if (record != null) {
							records.Add(record);
						}
					};
				} catch (Exception ex) {
					Logger.Log(ex, $"Reading GPS Data from file {pFile.FullName}");
				}
			}
			Track result;
			if (pTrack != null) {
				result = pTrack;
				result.AddRecords(records);
			} else {
				result = new Track(records);
			}
			return result;
		}

		#endregion
	}
}
