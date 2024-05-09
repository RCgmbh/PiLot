using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;

using PiLot.Utils.DateAndTime;
using PiLot.Utils.Logger;
using PiLot.Model.Nav;
using PiLot.Data.Nav;
using PiLot.Utils;

namespace PiLot.Data.Files {

	/// <summary>
	/// Helper class to read and write track points
	/// </summary>
	public class TrackDataConnector: ITrackDataConnector {

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
		public TrackDataConnector() {
			this.helper = new DataHelper();
		}

		/// <summary>
		/// Creates a new TrackPointDataConnector for a specific data root path
		/// </summary>
		/// <param name="pDataRoot">root path</param>
		public TrackDataConnector(String pDataRoot) {
			this.helper = new DataHelper(pDataRoot);
		}

		#endregion

		#region public properties

		public Boolean SupportsStatistics {
			get { return false; }
		}

		public Boolean SupportsTrackIDs {
			get { return true; }
		}

		#endregion

		#region public methods

		/// <summary>
		/// This should not be called as SupportsTrackIDs is false. Will throw an exception. 
		/// Only there in order to implement ITrackDataConnector
		/// </summary>
		/// <exception cref="NotImplementedException"></exception>
		public Track ReadTrack(Int32 pTrackId) {
			throw new NotImplementedException("Files based DataConnector does not support track ids. Check SupportsTrackIDs before calling ReadTrack(Int32)");
		}

		/// <summary>
		/// Reads the track for a certain period from files. If there are no track points,
		/// the result will be a track with an empty track points list
		/// </summary>
		/// <param name="pStartTime">The start time in milliseconds, either UTC or BoatTime</param>
		/// <param name="pEndTime">The end time in milliseconds, either UTC or BoatTime</param>
		/// <param name="pIsBoatTime">If true, pStartTime and pEndTime are BoatTime, else UTC</param>
		/// <param name="pReadTrackPoints">If true, track points will be read</param>
		/// <returns>A Track, never null</returns>
		public List<Track> ReadTracks(Int64 pStartTime, Int64 pEndTime, Boolean pIsBoatTime = false, Boolean pReadTrackPoints = false) {
			List<Date> dates = null;
			return new List<Track>(1) { this.ReadTrack(pStartTime, pEndTime, pIsBoatTime, ref dates) };
		}

		/// <summary>
		/// Reads for each day of a month whether we have a track.
		/// </summary>
		/// <param name="pYear">The year</param>
		/// <param name="pMonth">The month of the year, in c#-style (1-based index)</param>
		/// <returns>List of Booleans, a value per day</returns>
		public List<Boolean> ReadTracksMonthInfo(Int32 pYear, Int32 pMonth) {
			List<Boolean> result = new List<Boolean>();
			Date loopDate = new Date(pYear, pMonth, 1);
			List<Track> tracks = this.ReadTracks(DateTimeHelper.ToJSTime(loopDate), DateTimeHelper.ToJSTime(loopDate.AddMonths(1)), true, false);
			Boolean hasTrack;
			Int64 minMS, maxMS;
			while (loopDate.Month == pMonth) {
				minMS = DateTimeHelper.ToJSTime(loopDate);
				maxMS = DateTimeHelper.ToJSTime(loopDate.AddDays(1));
				hasTrack = tracks.Exists(t => t.Overlaps(minMS, maxMS, true));
				result.Add(hasTrack);
				loopDate = loopDate.AddDays(1);
			}
			return result;
		}

		/// <summary>
		/// Saves all data for a track, deleting overlapping track points
		/// </summary>
		/// <param name="pTrack">The track, not null</param>
		public void InsertTrack(Track pTrack) {
			this.SaveTrackPoints(pTrack.TrackPoints);
		}

		/// <summary>
		/// This should not be called as SupportsTrackIDs is false. Will throw an exception. 
		/// Only there in order to implement ITrackDataConnector
		/// </summary>
		/// <exception cref="NotImplementedException"></exception>
		public void DeleteTrack(Int32 pTrackId) {
			throw new NotImplementedException("Files based DataConnector does not support track ids. Check SupportsTrackIDs before calling DeleteTrack(Int32)");
		}

		/// <summary>
		/// This should not be called as SupportsStatistics is false. Will throw an exception. 
		/// Only there in order to implement ITrackDataConnector
		/// </summary>
		/// <exception cref="NotImplementedException"></exception>
		public List<TrackSegmentType> ReadTrackSegmentTypes() {
			throw new NotImplementedException("Files based DataConnector does not support statistics. Check SupportsStatistics before calling ReadTrackSegmentTypes()");
		}

		/// <summary>
		/// This should not be called as SupportsStatistics is false. Will throw an exception. 
		/// Only there in order to implement ITrackDataConnector
		/// </summary>
		/// <exception cref="NotImplementedException"></exception>
		public List<TrackSegment> ReadTrackSegments(Int32 pTrackId) {
			throw new NotImplementedException("Files based DataConnector does not support statistics. Check SupportsStatistics before calling ReadTrackSegments()");
		}

		/// <summary>
		/// This should not be called as SupportsStatistics is false. Will throw an exception. 
		/// Only there in order to implement ITrackDataConnector
		/// </summary>
		/// <exception cref="NotImplementedException"></exception>
		public void SaveTrackSegment(TrackSegment pSegment) {
			throw new NotImplementedException("Files based DataConnector does not support statistics. Check SupportsStatistics before calling SaveTrackSegment(TrackSegment)");
		}

		/// <summary>
		/// This should not be called as SupportsStatistics is false. Will throw an exception. 
		/// Only there in order to implement ITrackDataConnector
		/// </summary>
		/// <exception cref="NotImplementedException"></exception>
		public void DeleteTrackSegment(TrackSegment pSegment) {
			throw new NotImplementedException("Files based DataConnector does not support statistics. Check SupportsStatistics before calling DeleteTrackSegment(TrackSegment)");
		}

		/// <summary>
		/// Appends a track point to the file with records. Data is always appended to
		/// the end of the file, so there is no guarantee for records to be sorted
		/// within the file
		/// </summary>
		/// <param name="pTrackPoint">The track points to save</param>
		/// <param name="pBoat">The boat name will be ignored in files based DataConnector</param>
		/// <returns>Returns -1 as the connector does not support TrackIDs</returns>
		public Int32? SaveTrackPoint(TrackPoint pTrackPoint, String pBoat = null) {
			Date trackPointDate = new Date(pTrackPoint.GetUTCDate());
			FileInfo file = this.helper.GetDataFile(DATASOURCENAME, trackPointDate, true);
			String[] line = new String[] { pTrackPoint.ToString() };
			File.AppendAllLines(file.FullName, line);
			return -1;
		}

		/// <summary>
		/// Saves a list of track points to the files. Any existing trackpoints within
		/// that period will be deleted.
		/// </summary>
		/// <param name="pTrackPoints">A list of TrackPoints</param>
		/// <param name="pBoat">The boat name will be ignored in files based DataConnector</param>
		/// <returns>Returns -1 as the connector does not support TrackIDs</returns>
		public Int32? SaveTrackPoints(List<TrackPoint> pTrackPoints, String pBoat = null) {
			if ((pTrackPoints != null) && (pTrackPoints.Count > 0)) {
				List<Date> dates = new List<Date>();
				Int64 minUTC = pTrackPoints.Min(r => r.UTC);
				Int64 maxUTC = pTrackPoints.Max(r => r.UTC);
				Track track = this.ReadFullDatesTrack(minUTC, maxUTC, false, ref dates);
				track.Cut(minUTC, maxUTC, false);
				track.AddTrackPoints(pTrackPoints);
				this.SaveTrack(track, dates);
			}
			return -1;
		}


		/// <summary>
		/// Saves the track for one UTC date to file, replacing the existing data for that day
		/// </summary>
		/// <param name="pTrackPoints">The list of track points to write</param>
		/// <param name="pDay">The day</param>
		public void SaveDailyTrack(List<TrackPoint> pTrackPoints, Date pDay) {
			IEnumerable<String> lines = pTrackPoints.Select(r => r.ToString());
			FileInfo file = this.helper.GetDataFile(DATASOURCENAME, pDay, true);
			File.WriteAllLines(file.FullName, lines);
		}

		/// <summary>
		/// Deletes all track points between pStartTime and pEndTime from the files.
		/// It's a bit tricky because we have to read entire utc days (1 UTC day = 1 file),
		/// then remove the unwanted part and re-save the files. 
		/// </summary>
		/// <param name="pTrackId">The track id must always be -1</param>
		/// <param name="pStart">The js timestamp of the start time</param>
		/// <param name="pEnd">The js timestamp of the end time</param>
		/// <param name="pIsBoatTime">Whether start and end are BoatTime (true) or UTC (fale)</param>
		public void DeleteTrackPoints(Int32 pTrackId, Int64 pStart, Int64 pEnd, Boolean pIsBoatTime) {
			Assert.IsTrue(pTrackId == -1, "Files based TrackDataConnector does not support track ids. pTrackID must be -1 in DeleteTrackPoints");
			List<Date> dates = new List<Date>();
			Track track = this.ReadFullDatesTrack(pStart, pEnd, pIsBoatTime, ref dates);
			track.Cut(pStart, pEnd, pIsBoatTime);
			this.SaveTrack(track, dates);
		}

		/// <summary>
		/// Returns the number of days that have a valid gps data file, even if it's empty.
		/// </summary>
		public Int32 ReadDaysWithData() {
			Int32 result = 0;
			DirectoryInfo gpsDirectory = new DirectoryInfo(this.helper.GetDataPath(DATASOURCENAME, false));
			if (gpsDirectory.Exists) {
				foreach(FileInfo aFile in gpsDirectory.EnumerateFiles()) {
					if (Date.TryParseExact(aFile.Name, DataHelper.FILENAMEFORMAT, CultureInfo.InvariantCulture, DateTimeStyles.None, out Date date)) {
						result++;
					}
					// todo: maybe add tryParse(int) for the case when we save tracks that come from DB, serialized as Track, using TrackID as filename
				}
			}
			return result;
		}

		#endregion

		#region private methods

		/// <summary>
		/// Reads the track for a certain period from files. If there are no track points,
		/// the result will be a track with an empty positions list
		/// </summary>
		/// <param name="pStartTime">The start time in milliseconds, either UTC or BoatTime</param>
		/// <param name="pEndTime">The end time in milliseconds, either UTC or BoatTime</param>
		/// <param name="pIsBoatTime">If true, pStartTime and pEndTime are BoatTime, else UTC</param>
		/// <param name="pDates">Takes a list of Dates that will be filled with all processed days</param>
		/// <returns>A Track, never null</returns>
		private Track ReadTrack(Int64 pStartTime, Int64 pEndTime, Boolean pIsBoatTime, ref List<Date> pDates) {
			Track result = this.ReadFullDatesTrack(pStartTime, pEndTime, pIsBoatTime, ref pDates);
			result.Crop(pStartTime, pEndTime, pIsBoatTime);
			if (result.HasTrackPoints) {
				result.StartUTC = result.FirstTrackPoint.UTC;
				result.EndUTC = result.LastTrackPoint.UTC;
				result.StartBoatTime = result.FirstTrackPoint.BoatTime.Value;
				result.EndBoatTime = result.LastTrackPoint.BoatTime.Value;
				result.Distance = null;
				result.Boat = null;
				result.DateCreated = null;
				result.DateChanged = null;
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
			result.ID = -1;
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
				this.ReadTrackPointsFromFile(loopDate, result);
				if (pDates != null) {
					pDates.Add(loopDate);
				}
				loopDate = loopDate.AddDays(1);
			}
			return result;
		}

		/// <summary>
		/// saves track data to files, creating one file per date (in UTC). BE AWARE that all data for the impacted days 
		/// will be replaced, so you might want to start off with ReadFullDatesTrack.
		/// </summary>
		/// <param name="pTrack">The track for which we save the data</param>
		/// <param name="pDates">Optionally pass a list of dates, to ensure days with no records are properly updated</param>
		private void SaveTrack(Track pTrack, List<Date> pDates = null) {
			Dictionary<Date, Track> dailyTracks = new Dictionary<Date, Track>();
			if(pDates != null) {
				pDates.ForEach(d => dailyTracks.Add(d, new Track()));
			}
			Date trackPointDate;
			pTrack.SortTrackPoints();
			foreach (TrackPoint aTrackPoint in pTrack.TrackPoints) {
				trackPointDate = new Date(aTrackPoint.GetUTCDate());
				if (!dailyTracks.ContainsKey(trackPointDate)) {
					dailyTracks.Add(trackPointDate, new Track());
				}
				dailyTracks[trackPointDate].AddTrackPoint(aTrackPoint);
			}
			foreach (Date aKey in dailyTracks.Keys) {
				this.SaveDailyTrack(dailyTracks[aKey].TrackPoints, aKey);
			}
		}

		/// <summary>
		/// Reads the track points from a file for a specific date and adds them to a given track or
		/// creates a new track
		/// </summary>
		/// <param name="pDate">The date used to find the file</param>
		/// <param name="pTrack">A given track or null</param>
		private Track ReadTrackPointsFromFile(Date pDate, Track pTrack = null) {
			FileInfo file = this.helper.GetDataFile(DATASOURCENAME, pDate);
			return this.ReadTrackPointsFromFile(file, pTrack);
		}

		/// <summary>
		/// Reads the track points from a file and adds the to a given Track or creates a new track
		/// </summary>
		/// <param name="pFile">the file to read from</param>
		/// <param name="pTrack">if a track is passed, the positions will be appended to it</param>
		protected Track ReadTrackPointsFromFile(FileInfo pFile, Track pTrack = null) {
			List<TrackPoint> trackPoints = new List<TrackPoint>();
			if (pFile != null) {
				try {
					foreach (String aLine in File.ReadLines(pFile.FullName)) {
						TrackPoint trackPoint = TrackPoint.FromString(aLine);
						if (trackPoint != null) {
							trackPoints.Add(trackPoint);
						}
					};
				} catch (Exception ex) {
					Logger.Log(ex, $"Reading GPS Data from file {pFile.FullName}");
				}
			}
			Track result;
			if (pTrack != null) {
				result = pTrack;
				result.AddTrackPoints(trackPoints);
			} else {
				result = new Track(trackPoints);
			}
			return result;
		}

		#endregion
	}
}
