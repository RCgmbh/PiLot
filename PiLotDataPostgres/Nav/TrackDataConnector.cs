using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;

using Npgsql;

using PiLot.Data.Nav;
using PiLot.Data.Postgres.Helper;
using PiLot.Model.Nav;
using PiLot.Utils;
using PiLot.Utils.DateAndTime;
using PiLot.Utils.Logger;

namespace PiLot.Data.Postgres.Nav {
	
	/// <summary>
	/// Reads and writes Track data from/to the database
	/// </summary>
	public class TrackDataConnector : ITrackDataConnector {

		#region instance variables

		protected DBHelper dbHelper;

		#endregion

		#region constructors

		public TrackDataConnector() {
			this.dbHelper = new DBHelper();
		}

		public TrackDataConnector(String pConnectionString) {
			this.dbHelper = new DBHelper(pConnectionString);
		}

		#endregion

		#region public properties

		public Boolean SupportsStatistics {
			get { return true; }
		}

		public Boolean SupportsTrackIDs {
			get { return true; }
		}

		#endregion

		#region public methods

		/// <summary>
		/// Reads a track by id, including all track points
		/// </summary>
		/// <param name="pTrackId">The track id</param>
		/// <returns>The track including its track points or null</returns>
		public Track ReadTrack(Int32 pTrackId) {
			Track result = null;
			String query = "SELECT * FROM tracks WHERE id=@p_id";
			List<(String, Object)> pars = new List<(String, Object)>();
			pars.Add(("@p_id", pTrackId));
			List<Track> tracks = this.dbHelper.ReadData<Track>(query, new Func<NpgsqlDataReader, Track>(this.ReadTrack), pars);
			if (tracks.Count == 1) {
				result = tracks[0];
				result.AddTrackPoints(this.ReadTrackPoints(result.ID.Value));
			}
			return result;
		}

		/// <summary>
		/// Returns all tracks that overlap with a certain time period
		/// </summary>
		/// <param name="pStart">Start of the period in ms since epoc</param>
		/// <param name="pEnd">End of the period in ms since epoc</param>
		/// <param name="pIsBoatTime">True, to treat start/end as Boattime, false for UTC</param>
		/// <param name="pReadTrackPoints">True to also read all trackpoints. False by default</param>
		/// <returns></returns>
		public List<Track> ReadTracks(Int64 pStart, Int64 pEnd, Boolean pIsBoatTime = false, Boolean pReadTrackPoints = false) {
			return this.ReadTracks(pStart, pEnd, pIsBoatTime, pReadTrackPoints, null);
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
		/// Saves a track into the database, and sets the Track.ID. If there are overlapping
		/// tracks, an error is thrown and nothing is written. If you want to change the
		/// boat for a track, please use the SetBoat Operation.
		/// </summary>
		/// <param name="pTrack">The track to save.</param>
		public void SaveTrack(Track pTrack) {
			Logger.Log("TrackDataConnector.InsertTrack", LogLevels.DEBUG);
			NpgsqlConnection connection = this.dbHelper.GetConnection();
			if (connection != null) {
				connection.Open();
				NpgsqlTransaction transaction = connection.BeginTransaction(IsolationLevel.RepeatableRead);
				try {
					if (
						(pTrack.StartUTC != null)
						&& (pTrack.EndUTC != null)
						&& this.ReadTracks(pTrack.StartUTC.Value, pTrack.EndUTC.Value, false, false, transaction).Exists(t => t.ID != pTrack.ID)
					) {
						String msg = "TrackDataConnector.SaveTrack: Could not save Track as there is an overlapping Track";
						Logger.Log(msg, LogLevels.ERROR);
						throw new Exception(msg);
					}
					if (pTrack.ID == null) {
						this.InsertTrack(pTrack, transaction);
					} else {
						this.SaveTrackPoints(pTrack.TrackPoints, pTrack.ID.Value, transaction);
					}
					transaction.Commit();
					connection.Close();
				} catch (Exception ex) {
					Logger.Log(ex, "TrackDataConnector.InsertTrack");
					transaction.Rollback();
					connection.Close();
					throw;
				}
			}
		}

		/// <summary>
		/// Deletes a track from the database, if it exists.
		/// </summary>
		/// <param name="pTrackId">The track id</param>
		public void DeleteTrack(Int32 pTrackId) {
			this.DeleteTrack(pTrackId, null);
		}

		/// <summary>
		/// Sets the boat for a track
		/// </summary>
		/// <param name="pTrackId">The track id, not null</param>
		/// <param name="pBoat">The boat name, not null</param>
		public void SetBoat(Int32 pTrackId, String pBoat){
			String command = "SELECT update_track_boat (@p_id, @p_boat)";
			List<(String, Object)> pars = new List<(String, Object)>();
			pars.Add(("@p_id", pTrackId));
			pars.Add(("@p_boat", pBoat));
			this.dbHelper.ExecuteCommand<Int32>(command, pars);
		}

		/// <summary>
		/// Reads all track segment types from the db
		/// </summary>
		/// <returns>List TrackSegmentType</returns>
		public List<TrackSegmentType> ReadTrackSegmentTypes() {
			String query = "SELECT * FROM track_segment_types;";
			return this.dbHelper.ReadData<TrackSegmentType>(query, new Func<NpgsqlDataReader, TrackSegmentType>(this.ReadTrackSegmentType));
		}

		/// <summary>
		/// Reads all TrackSegments that belong to a certain track.
		/// </summary>
		/// <param name="pTrackId">The id of the track</param>
		/// <returns>A list of TrackSegment, can be empty but will not be null</returns>
		public List<TrackSegment> ReadTrackSegments(Int32 pTrackId) {
			String query = "SELECT * FROM read_track_segments_by_track(@p_track_id)";
			List<(String, Object)> pars = new List<(String, Object)>();
			pars.Add(("@p_track_id", pTrackId));
			return this.dbHelper.ReadData<TrackSegment>(query, new Func<NpgsqlDataReader, TrackSegment>(this.ReadTrackSegment), pars);
		}

		/// <summary>
		/// Saves a track segment to the database. Any existing segment for the same track and type
		/// will be replaced.
		/// </summary>
		/// <param name="pSegment">The TrackSegment to save</param>
		public void SaveTrackSegment(TrackSegment pSegment) {
			String command = "SELECT save_track_segment (@p_type_id, @p_track_id, @p_start_utc, @p_end_utc, @p_start_boattime, @p_end_boattime, @p_distance_mm)";
			List<(String, Object)> pars = new List<(String, Object)>();
			pars.Add(("@p_type_id", pSegment.TypeID));
			pars.Add(("@p_track_id", pSegment.TrackID));
			pars.Add(("@p_start_utc", pSegment.StartUTC));
			pars.Add(("@p_end_utc", pSegment.EndUTC));
			pars.Add(("@p_start_boattime", pSegment.StartBoatTime));
			pars.Add(("@p_end_boattime", pSegment.EndBoatTime));
			pars.Add(("@p_distance_mm", pSegment.Distance_mm));
			this.dbHelper.ExecuteCommand<Int32>(command, pars);
		}

		/// <summary>
		/// Deletes a single TrackSegment from the DB
		/// </summary>
		/// <param name="pSegment">The segment to delete</param>
		public void DeleteTrackSegments(Int32? pTrackId, Int32? pTypeId){
			String command = "SELECT delete_track_segments (@p_type_id, @p_track_id)";
			List<(String, Object)> pars = new List<(String, Object)>();
			pars.Add(("@p_type_id", this.dbHelper.GetNullableParameterValue(pTypeId)));
			pars.Add(("@p_track_id", this.dbHelper.GetNullableParameterValue(pTrackId)));
			this.dbHelper.ExecuteCommand<Int32>(command, pars);
		}

		/// <summary>
		/// Saves a TrackPoint to the DB, using the current track for the given boat, or
		/// creating a new track if there is none
		/// </summary>
		/// <param name="pTrackPoint">The TrackPoint to save</param>
		/// <param name="pBoat">The name of the boat being used</param>
		/// <returns>The id of the track to which the point is added</returns>
		public Int32? SaveTrackPoint(TrackPoint pTrackPoint, String pBoat) {
			return this.SaveTrackPoints(new List<TrackPoint>(1) { pTrackPoint }, pBoat);
		}

		/// <summary>
		/// Saves a list of TrackPoint to the DB, using the current track for the given boat, or
		/// creating a new track if there is none. All TrackPoints will be associated with the
		/// same track, defined by the first TrackPoint.
		/// </summary>
		/// <param name="pTrackPoints">The list of track points to save</param>
		/// <param name="pBoat">The name of the current boat</param>
		/// <returns>The id of the track to which the points are added or null, if there are no points</returns>
		public Int32? SaveTrackPoints(List<TrackPoint> pTrackPoints, String pBoat, Int32? pTrackId = null) {
			Logger.Log("TrackDataConnector.SaveTrackPoints", LogLevels.DEBUG);
			Int32? trackId = null;
			if (pTrackPoints.Count > 0) {
				NpgsqlConnection connection = this.dbHelper.GetConnection();
				if (connection != null) {
					connection.Open();
					NpgsqlTransaction transaction = connection.BeginTransaction(IsolationLevel.RepeatableRead);
					try {
						if (pTrackId == null) {
							Track track = this.EnsureTrack(pBoat, pTrackPoints[0].UTC, pTrackPoints[0].BoatTime ?? pTrackPoints[0].UTC, transaction);
							trackId = track.ID;
						} else {
							trackId = pTrackId;
						}
						this.SaveTrackPoints(pTrackPoints, trackId.Value, transaction);
						transaction.Commit();
						connection.Close();
					} catch (Exception ex) {
						Logger.Log(ex, "TrackDataConnector.SaveTrackPoints");
						transaction.Rollback();
						connection.Close();
						throw;
					}
				}
			}
			return trackId;
		}

		/// <summary>
		/// Deletes a range of trackpoints from a track
		/// </summary>
		public void DeleteTrackPoints(Int32 pTrackId, Int64 pStart, Int64 pEnd, Boolean pIsBoatTime){
			String command = "SELECT delete_track_points(@p_track_id, @p_start, @p_end, @p_is_boattime);";
			List<(String, Object)> pars = new List<(String, Object)>();
			pars.Add(("@p_track_id", pTrackId));
			pars.Add(("@p_start", pStart));
			pars.Add(("@p_end", pEnd));
			pars.Add(("@p_is_boattime", pIsBoatTime));
			this.dbHelper.ExecuteCommand<Int32>(command, pars);
		}

		#endregion

		#region private methods

		/// <summary>
		/// Returns all tracks that overlap a certain time period
		/// </summary>
		/// <param name="pStart">Start of the period in ms since epoc</param>
		/// <param name="pEnd">End of the period in ms since epoc</param>
		/// <param name="pIsBoatTime">True, to treat start/end as Boattime, false for UTC</param>
		/// <param name="pReadTrackPoints">If set true, the trackpoints will be added</param>
		/// <param name="pTransaction">Optionally pass a transaction that is handled by the caller</param>
		/// <returns></returns>
		private List<Track> ReadTracks(Int64 pStart, Int64 pEnd, Boolean pIsBoatTime = false, Boolean pReadTrackPoints = false, NpgsqlTransaction pTransaction = null) {
			List<Track> result;
			String query = "SELECT * FROM read_tracks(@p_start, @p_end, @p_is_boattime);";
			List<(String, Object)> pars = new List<(String, Object)>();
			pars.Add(("@p_start", pStart));
			pars.Add(("@p_end", pEnd));
			pars.Add(("@p_is_boattime", pIsBoatTime));
			result = this.dbHelper.ReadData<Track>(query, new Func<NpgsqlDataReader, Track>(this.ReadTrack), pars, pTransaction);
			if (pReadTrackPoints) {
				foreach (Track aTrack in result) {
					aTrack.AddTrackPoints(this.ReadTrackPoints(aTrack.ID.Value, pStart, pEnd, pIsBoatTime));
				}
			}
			return result;
		}

		/// <summary>
		/// Helper to create a Track out of a db record
		/// </summary>
		private Track ReadTrack(NpgsqlDataReader pReader) {
			Track result = new Track() {
				ID = pReader.GetInt32("id"),
				StartUTC = this.dbHelper.ReadNullableField<Int64?>(pReader, "start_utc"),
				EndUTC = this.dbHelper.ReadNullableField<Int64?>(pReader, "end_utc"), 
				StartBoatTime = this.dbHelper.ReadNullableField<Int64?>(pReader, "start_boattime"),
				EndBoatTime = this.dbHelper.ReadNullableField<Int64?>(pReader, "end_boattime"),
				Distance = pReader.GetFloat("distance"),
				Boat = pReader.GetString("boat"),
				DateCreated = pReader.GetDateTime("date_created"),
				DateChanged = pReader.GetDateTime("date_changed")
			};
			return result;
		}

		/// <summary>
		/// Inserts a track into the database, and sets the Track.ID.
		/// </summary>
		/// <param name="pTrack">The track to save</param>
		/// <param name="pTransaction">Optionally pass a transaction that is handled by the caller</param>
		private void InsertTrack(Track pTrack, NpgsqlTransaction pTransaction = null) {
			Assert.IsNull(pTrack.ID, "TrackDataController.InsertTrack: A track with an ID can not be inserted into the database");
			String command = "SELECT * FROM insert_track(@p_boat);";
			List<(String, Object)> pars = new List<(String, Object)>();
			pars.Add(("@p_boat", pTrack.Boat));
			pTrack.ID = this.dbHelper.ExecuteCommand<Int32>(command, pars, pTransaction);
			this.SaveTrackPoints(pTrack.TrackPoints, pTrack.ID.Value, pTransaction);
		}

		/// <summary>
		/// Returns the track a new TrackPoint should belong to. This is the track that is closer than a
		/// certain time (defined by a constant of the Track class) to the timestamp, and belongs to a 
		/// given boat. If there is no such track, a new one will be created and returned.
		/// </summary>
		/// <param name="pBoat">The boat for which a track is needed</param>
		/// <param name="pUtc">The initial track start/end in utc</param>
		/// <param name="pBoatTime">The initial track start/end in boat time </param>
		/// <param name="pTransaction">An open transaction, not null</param>
		/// <returns>The current track or null, if no db connection is configured</returns>
		private Track EnsureTrack(String pBoat, Int64 pUtc, Int64 pBoatTime, NpgsqlTransaction pTransaction) {
			Assert.IsNotNull(pTransaction, "pTransaction must not be null in TrackDataConnector.EnsureTrack");
			Track result = null;
			Int64 range = Track.MINGAPSECONDS * 1000;
			Int64 start = pUtc - range;
			Int64 end = pUtc + range;
			result = this.ReadTracks(start, end, false, false, pTransaction)
				.Where(t => (t.Boat == pBoat) && (t.StartUTC != null) && (t.EndUTC != null))
				.OrderBy(t => Math.Min(Math.Abs(pUtc - t.StartUTC.Value), Math.Abs(pUtc - t.EndUTC.Value)))
				.FirstOrDefault();
			if (result == null) {
				result = new Track() {
					StartUTC = pUtc,
					EndUTC = pUtc,
					StartBoatTime = pBoatTime,
					EndBoatTime = pBoatTime,
					Boat = pBoat
				};
				this.InsertTrack(result, pTransaction);
			}
			return result;
		}

		/// <summary>
		/// Updates a track so that its distance, start and end corresponds to the track points
		/// </summary>
		/// <param name="pTrackId">The ID of the track to update</param>
		/// <param name="pTransaction">Pass an open transaction or null</param>
		private void UpdateTrackData(Int32 pTrackId, NpgsqlTransaction pTransaction) {
			String command = "SELECT update_track_data(@p_id);";
			List<(String, Object)> pars = new List<(String, Object)>();
			pars.Add(("@p_id", pTrackId));
			this.dbHelper.ExecuteCommand<Int32>(command, pars, pTransaction);
		}

		/// <summary>
		/// Deletes a track from the database
		/// </summary>
		/// <param name="pTrackId">The track id</param>
		/// <param name="pTransaction">Pass an open transaction or null</param>
		private void DeleteTrack(Int32 pTrackId, NpgsqlTransaction pTransaction) {
			String command = "SELECT delete_track(@p_id);";
			List<(String, Object)> pars = new List<(String, Object)>();
			pars.Add(("@p_id", pTrackId));
			this.dbHelper.ExecuteCommand<Int32>(command, pars, pTransaction);
		}

		/// <summary>
		/// Helper to create a TrackSegmentType out of a db record
		/// </summary>
		private TrackSegmentType ReadTrackSegmentType(NpgsqlDataReader pReader) {
			String labelsString = pReader.GetString("labels");
			Object labelsObj = System.Text.Json.JsonSerializer.Deserialize<Object>(labelsString);
			TrackSegmentType result = new TrackSegmentType(
				pReader.GetInt32("id"),
				this.dbHelper.ReadNullableField<Int32?>(pReader, "duration"),
				this.dbHelper.ReadNullableField<Int32?>(pReader, "distance"),
				labelsObj
			);
			return result;
		}

		/// <summary>
		/// Helper to create a TrackSegment out of a db record
		/// </summary>
		private TrackSegment ReadTrackSegment(NpgsqlDataReader pReader) {
			TrackSegment result = new TrackSegment(pReader.GetInt32("track_id"), pReader.GetInt32("type_id")) {
				StartUTC = pReader.GetInt64("start_utc"),
				EndUTC = pReader.GetInt64("end_utc"),
				StartBoatTime = pReader.GetInt64("start_boattime"),
				EndBoatTime = pReader.GetInt64("end_boattime"),
				Distance_mm = pReader.GetInt32("distance_mm")
			};
			return result;
		}

		/// <summary>
		/// Reads the positions of a track, limited by a timeframe.
		/// </summary>
		/// <param name="pTrackId">The id of the track</param>
		/// <param name="pStart">Optionally pass the start of the timeframe in ms utc or boattime</param>
		/// <param name="pStart">Optionally pass the end of the timeframe in ms utc or boattime</param>
		/// <param name="pIsBoatTime">Pass whether pStart and pEnd are BoatTime (true) or UTC (false)</param>
		/// <returns>List of TrackPoint</returns>
		private List<TrackPoint> ReadTrackPoints(Int32 pTrackId, Int64? pStart = null, Int64? pEnd = null, Boolean? pIsBoatTime = null) {
			String query = "SELECT * FROM read_track_points(@p_track_id, @p_start, @p_end, @p_is_boattime);";
			List<(String, Object)> pars = new List<(String, Object)>();
			pars.Add(("@p_track_id", pTrackId));
			pars.Add(("@p_start", this.dbHelper.GetNullableParameterValue(pStart)));
			pars.Add(("@p_end", this.dbHelper.GetNullableParameterValue(pEnd)));
			pars.Add(("@p_is_boattime", this.dbHelper.GetNullableParameterValue(pIsBoatTime)));
			return this.dbHelper.ReadData<TrackPoint>(query, new Func<NpgsqlDataReader, TrackPoint>(this.ReadTrackPoint), pars);
		}

		/// <summary>
		/// Helper to create a TrackPoint out of a db record
		/// </summary>
		private TrackPoint ReadTrackPoint(NpgsqlDataReader pReader) {
			TrackPoint result = new TrackPoint(
				Math.Round(pReader.GetDouble("latitude"), 7),
				Math.Round(pReader.GetDouble("longitude"), 7)
			) { 
				UTC = pReader.GetInt64("utc"),
				BoatTime = pReader.GetInt64("boattime")
			};
			return result;
		}

		/// <summary>
		/// Saves a list of TrackPoints to the db, making sure the track will be updated at the end (and only then)
		/// </summary>
		/// <param name="pTrackPoints">The list of TrackPoints to save</param>
		/// <param name="pTrackId">The TrackID</param>
		/// <param name="pTransaction">An open transaction or null</param>
		private void SaveTrackPoints(List<TrackPoint> pTrackPoints, Int32 pTrackId, NpgsqlTransaction pTransaction) {
			if (pTrackPoints != null && pTrackPoints.Count > 0) {
				foreach (TrackPoint aTrackPoint in pTrackPoints) {
					this.SaveTrackPoint(aTrackPoint, pTrackId, pTrackPoints.Count == 1, pTransaction);
				}
				if (pTrackPoints.Count > 1) {
					this.UpdateTrackData(pTrackId, pTransaction);
				}
			}
		}

		/// <summary>
		/// Saves a trackpoint to the DB. 
		/// </summary>
		/// <param name="pTrackPoint">The trackpoint to save</param>
		/// <param name="pTrackID">The ID of the track the trackpoint belongs to</param>
		/// <param name="pUpdateTrack">Set to true to automatically update track distance etc.</param>
		/// <param name="pTransaction">Pass an open transaction or null</param>
		private void SaveTrackPoint(TrackPoint pTrackPoint, Int32 pTrackId, Boolean pUpdateTrack, NpgsqlTransaction pTransaction) {
			String command = "SELECT insert_track_point(@p_track_id, @p_utc, @p_boattime, @p_latitude, @p_longitude, @p_update_track_data);";
			List<(String, Object)> pars = new List<(String, Object)>();
			pars.Add(("@p_track_id", pTrackId));
			pars.Add(("@p_utc", pTrackPoint.UTC));
			pars.Add(("@p_boattime", pTrackPoint.BoatTime));
			pars.Add(("@p_latitude", pTrackPoint.Latitude));
			pars.Add(("@p_longitude", pTrackPoint.Longitude));
			pars.Add(("@p_update_track_data", pUpdateTrack));
			this.dbHelper.ExecuteCommand<Int32>(command, pars, pTransaction);
		}

		#endregion
	}
}
