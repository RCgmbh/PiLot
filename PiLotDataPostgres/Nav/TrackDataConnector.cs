using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using Npgsql;

using PiLot.Data.Postgres.Helper;
using PiLot.Model.Nav;
using PiLot.Utils;
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

		public void SaveTrackPoint(TrackPoint pTrackPoint, String pBoat) {
			NpgsqlConnection connection = this.dbHelper.GetConnection();
			if (connection != null) {
				connection.Open();
				NpgsqlTransaction transaction = connection.BeginTransaction();
				try {
					Track track = this.EnsureTrack(pBoat, pTrackPoint.UTC, pTrackPoint.BoatTime ?? pTrackPoint.UTC, transaction);
					this.InsertTrackPoint(pTrackPoint, track, transaction);
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

		/// <summary>
		/// Returns all tracks that overlap a certain time period
		/// </summary>
		/// <param name="pStart">Start of the period in ms since epoc</param>
		/// <param name="pEnd">End of the period in ms since epoc</param>
		/// <param name="pIsBoatTime">True, to treat start/end as Boattime, false for UTC</param>
		/// <param name="pTransaction">Optionally pass a transaction that is handled by the caller</param>
		/// <returns></returns>
		public List<Track> ReadTracks(Int64 pStart, Int64 pEnd, Boolean pIsBoatTime = false, NpgsqlTransaction pTransaction = null) {
			String query = "SELECT * FROM read_tracks(@p_start, @p_end, @p_is_boattime);";
			List<(String, Object)> pars = new List<(String, Object)>();
			pars.Add(("@p_start", pStart));
			pars.Add(("@p_end", pEnd));
			pars.Add(("@p_is_boattime", pIsBoatTime));
			return this.dbHelper.ReadData<Track>(query, new Func<NpgsqlDataReader, Track>(this.ReadTrack), pars, pTransaction);
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
		/// Reads all track segment types from the db
		/// </summary>
		/// <returns>List TrackSegmentType</returns>
		public List<TrackSegmentType> ReadTrackSegmentTypes() {
			String query = "SELECT * FROM track_segment_types;";
			return this.dbHelper.ReadData<TrackSegmentType>(query, new Func<NpgsqlDataReader, TrackSegmentType>(this.ReadTrackSegmentType));
		}

		/// <summary>
		/// Reads all positions of a track.
		/// </summary>
		/// <param name="pTrackId">The id of the track</param>
		/// <returns>List of TrackPoint</returns>
		public List<TrackPoint> ReadTrackPoints(Int32 pTrackId) {
			String query = "SELECT * FROM find_track_points(@p_track_id);";
			List<(String, Object)> pars = new List<(String, Object)>();
			pars.Add(("@p_track_id", pTrackId));
			return this.dbHelper.ReadData<TrackPoint>(query, new Func<NpgsqlDataReader, TrackPoint>(this.ReadTrackPoint), pars);
		}

		#endregion

		#region private methods

		/// <summary>
		/// Saves a trackpoint to the DB. 
		/// </summary>
		/// <param name="pTrackPoint">The trackpoint to save</param>
		/// <param name="pTrack">The track the trackpoint belongs to. Must have an ID</param>
		private void InsertTrackPoint(TrackPoint pTrackPoint, Track pTrack, NpgsqlTransaction pTransaction) {
			Assert.IsNotNull(pTrack.ID, "TrackDataController.InsertTrackPoint: Track.ID must not be null.");
			String command = "SELECT * FROM insert_track_point(@p_track_id, @p_utc, @p_boattime, @p_latitude, @p_longitude);";
			List<(String, Object)> pars = new List<(String, Object)>();
			pars.Add(("@p_track_id", pTrack.ID));
			pars.Add(("@p_utc", pTrackPoint.UTC));
			pars.Add(("@p_boattime", pTrackPoint.BoatTime));
			pars.Add(("@p_latitude", pTrackPoint.Latitude));
			pars.Add(("@p_longitude", pTrackPoint.Longitude));
			this.dbHelper.ExecuteCommand<Int32>(command, pars, pTransaction);
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
			result = this.ReadTracks(start, end, false, pTransaction)
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
			);
			return result;
		}

		#endregion
	}
}
