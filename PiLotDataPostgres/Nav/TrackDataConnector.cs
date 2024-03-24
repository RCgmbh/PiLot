using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Runtime.CompilerServices;
using Npgsql;

using PiLot.Data.Postgres.Helper;
using PiLot.Model.Nav;
using PiLot.Utils;
using PiLot.Utils.DateAndTime;
using PiLot.Utils.Logger;

namespace PiLot.Data.Postgres.Nav {
	
	/// <summary>
	/// Reads and writes Track data from/to the database
	/// </summary>
	public class TrackDataConnector {

		#region instance variables

		protected DBHelper dbHelper;

		#endregion

		#region constructors

		public TrackDataConnector() {
			this.dbHelper = new DBHelper();
		}

		#endregion

		#region public methods

		/// <summary>
		/// Reads a track by id, including all track points
		/// </summary>
		/// <param name="pTrackId">The track id</param>
		/// <returns>The track including its track points</returns>
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
			List<Track> tracks = new TrackDataConnector().ReadTracks(DateTimeHelper.ToJSTime(loopDate), DateTimeHelper.ToJSTime(loopDate.AddMonths(1)), true, false);
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
		/// Inserts a track into the database, and sets the Track.ID
		/// </summary>
		/// <param name="pTrack">The track to save</param>
		/// <param name="pTransaction">Optionally pass a transaction that is handled by the caller</param>
		public void InsertTrack(Track pTrack, NpgsqlTransaction pTransaction = null) {
			Assert.IsNull(pTrack.ID, "TrackDataController.InsertTrack: A track with an ID can not be inserted into the database");
			String command = "SELECT * FROM insert_track(@p_utc, @p_boattime, @p_boat);";
			List<(String, Object)> pars = new List<(String, Object)>();
			pars.Add(("@p_utc", pTrack.StartUTC));
			pars.Add(("@p_boattime", pTrack.StartBoatTime));
			pars.Add(("@p_boat", pTrack.Boat));
			pTrack.ID = this.dbHelper.ExecuteCommand<Int32>(command, pars, pTransaction);
		}

		/// <summary>
		/// Saves a track segment to the database. Any existing segment for the same track and type
		/// will be replaced.
		/// </summary>
		/// <param name="pSegment">The TrackSegment to save</param>
		public void SaveTrackSegment(TrackSegment pSegment) {
			String command = "SELECT * FROM save_track_segment (@p_type_id, @p_track_id, @p_start_utc, @p_end_utc, @p_start_boattime, @p_end_boattime, @p_distance)";
			List<(String, Object)> pars = new List<(String, Object)>();
			pars.Add(("@p_type_id", pSegment.TypeID));
			pars.Add(("@p_track_id", pSegment.TrackID));
			pars.Add(("@p_start_utc", pSegment.StartUTC));
			pars.Add(("@p_end_utc", pSegment.EndUTC));
			pars.Add(("@p_start_boattime", pSegment.StartBoatTime));
			pars.Add(("@p_end_boattime", pSegment.EndBoatTime));
			pars.Add(("@p_distance", pSegment.Distance));
			this.dbHelper.ExecuteCommand<Int32>(command, pars);
		}

		/// <summary>
		/// Reads all positions of a track.
		/// </summary>
		/// <param name="pTrackId">The id of the track</param>
		/// <returns>List of TrackPoint</returns>
		public List<TrackPoint> ReadTrackPoints(Int32 pTrackId) {
			return this.ReadTrackPoints(pTrackId, null, null, null);
		}

		/// <summary>
		/// Reads the positions of a track, limited by a timeframe.
		/// </summary>
		/// <param name="pTrackId">The id of the track</param>
		/// <param name="pStart">Optionally pass the start of the timeframe in ms utc or boattime</param>
		/// <param name="pStart">Optionally pass the end of the timeframe in ms utc or boattime</param>
		/// <param name="pIsBoatTime">Pass whether pStart and pEnd are BoatTime (true) or UTC (false)</param>
		/// <returns>List of TrackPoint</returns>
		public List<TrackPoint> ReadTrackPoints(Int32 pTrackId, Int64? pStart = null, Int64? pEnd = null, Boolean? pIsBoatTime = null) {
			String query = "SELECT * FROM read_track_points(@p_track_id, @p_start, @p_end, @p_is_boattime);";
			List<(String, Object)> pars = new List<(String, Object)>();
			pars.Add(("@p_track_id", pTrackId));
			pars.Add(("@p_start", this.dbHelper.GetNullableParameterValue(pStart)));
			pars.Add(("@p_end", this.dbHelper.GetNullableParameterValue(pEnd)));
			pars.Add(("@p_is_boattime", this.dbHelper.GetNullableParameterValue(pIsBoatTime)));
			return this.dbHelper.ReadData<TrackPoint>(query, new Func<NpgsqlDataReader, TrackPoint>(this.ReadTrackPoint), pars);
		}
		
		/// <summary>
		/// Saves a TrackPoint to the DB, using the current track for the given boat, or
		/// creating a new track if there is none
		/// </summary>
		/// <param name="pTrackPoint">The TrackPoint to save</param>
		/// <param name="pBoat">The name of the boat being used</param>
		public void SaveTrackPoint(TrackPoint pTrackPoint, String pBoat) {
			this.SaveTrackPoints(new List<TrackPoint>(1) { pTrackPoint }, pBoat);
		}

		/// <summary>
		/// Saves a list of TrackPoint to the DB, using the current track for the given boat, or
		/// creating a new track if there is none
		/// </summary>
		/// <param name="pTrackPoints">The list of track points to save</param>
		/// <param name="pBoat">The name of the current baot</param>
		public void SaveTrackPoints(List<TrackPoint> pTrackPoints, String pBoat) {
			if (pTrackPoints.Count > 0) {
				NpgsqlConnection connection = this.dbHelper.GetConnection();
				if (connection != null) {
					connection.Open();
					NpgsqlTransaction transaction = connection.BeginTransaction();
					try {
						Track track = this.EnsureTrack(pBoat, pTrackPoints[0].UTC, pTrackPoints[0].BoatTime ?? pTrackPoints[0].UTC, transaction);
						foreach (TrackPoint aTrackPoint in pTrackPoints) {
							this.InsertTrackPoint(aTrackPoint, track, pTrackPoints.Count == 1, transaction);
						}
						if(pTrackPoints.Count > 1) {
							this.UpdateTrackData(track, transaction);
						}
						transaction.Commit();
						connection.Close();
					} catch (Exception ex) {
						Logger.Log(ex, "TrackDataConnector.EnsureTrack");
						transaction.Rollback();
						connection.Close();
						throw;
					}
				}
			}
		}

		/// <summary>
		/// Deletes a range of trackpoints from a track
		/// </summary>
		public void DeleteTrackPoints(Int32 pTrackId, Int64 pStart, Int64 pEnd, Boolean pIsBoatTime){
			String command = "SELECT * FROM delete_track_points(@p_track_id, @p_start, @p_end, @p_is_boattime);";
			List<(String, Object)> pars = new List<(String, Object)>();
			pars.Add(("@p_track_id", pTrackId));
			pars.Add(("@p_start", pStart));
			pars.Add(("@p_end", pEnd));
			pars.Add(("@p_is_boattime", pIsBoatTime));
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

		#endregion

		#region private methods

		/// <summary>
		/// Saves a trackpoint to the DB. 
		/// </summary>
		/// <param name="pTrackPoint">The trackpoint to save</param>
		/// <param name="pTrack">The track the trackpoint belongs to. Must have an ID</param>
		/// <param name="pUpdateTrack">Set to true to automatically update track distance etc.</param>
		/// <param name="pTransaction">Pass an open transaction or null</param>
		private void InsertTrackPoint(TrackPoint pTrackPoint, Track pTrack, Boolean pUpdateTrack, NpgsqlTransaction pTransaction) {
			Assert.IsNotNull(pTrack.ID, "TrackDataController.InsertTrackPoint: Track.ID must not be null.");
			String command = "SELECT * FROM insert_track_point(@p_track_id, @p_utc, @p_boattime, @p_latitude, @p_longitude, @p_update_track_data);";
			List<(String, Object)> pars = new List<(String, Object)>();
			pars.Add(("@p_track_id", pTrack.ID));
			pars.Add(("@p_utc", pTrackPoint.UTC));
			pars.Add(("@p_boattime", pTrackPoint.BoatTime));
			pars.Add(("@p_latitude", pTrackPoint.Latitude));
			pars.Add(("@p_longitude", pTrackPoint.Longitude));
			pars.Add(("@p_update_track_data", pUpdateTrack));
			this.dbHelper.ExecuteCommand<Int32>(command, pars, pTransaction);
		}

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
				foreach(Track aTrack in result) {
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
				StartUTC = pReader.GetInt64("start_utc"),
				EndUTC = pReader.GetInt64("end_utc"),
				StartBoatTime = pReader.GetInt64("start_boattime"),
				EndBoatTime = pReader.GetInt64("end_boattime"),
				Distance = pReader.GetFloat("distance"),
				Boat = pReader.GetString("boat"),
				DateCreated = pReader.GetDateTime("date_created"),
				DateChanged = pReader.GetDateTime("date_changed")
			};
			return result;
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
				.Where(t => t.Boat == pBoat)
				.OrderBy(t => Math.Min(Math.Abs(pUtc - t.StartUTC), Math.Abs(pUtc - t.EndUTC)))
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
		/// <param name="pTrack">The track to update</param>
		/// <param name="pTransaction">Pass an open transaction or null</param>
		private void UpdateTrackData(Track pTrack, NpgsqlTransaction pTransaction) {
			Assert.IsNotNull(pTrack.ID, "TrackDataController.UpdateTrackData: Track.ID must not be null.");
			String command = "SELECT * FROM update_track_data(@p_id);";
			List<(String, Object)> pars = new List<(String, Object)>();
			pars.Add(("@p_track_id", pTrack.ID));
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
		/// Helper to create a TrackPoint out of a db record
		/// </summary>
		private TrackPoint ReadTrackPoint(NpgsqlDataReader pReader) {
			TrackPoint result = new TrackPoint(
				pReader.GetDouble("latitude"),
				pReader.GetDouble("longitude")
			) { 
				UTC = pReader.GetInt64("utc"),
				BoatTime = pReader.GetInt64("boattime")
			};
			return result;
		}

		#endregion
	}
}
