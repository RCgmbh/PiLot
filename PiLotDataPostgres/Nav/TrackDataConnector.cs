using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using Npgsql;

using PiLot.Data.Postgres.Helper;
using PiLot.Model.Nav;
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
		/// Finds the current track. This is the track that ended less than a certain time
		/// ago, defined by a constant of Track.
		/// </summary>
		/// <returns>The current track or null, if there is no current track</returns>
		public Track FindCurrentTrack(String pBoat) {
			Int64 end = DateTimeHelper.JSNow;
			Int64 start = end - (Track.MINGAPSECONDS * 1000);
			return this.ReadTracks(start, end, false).Where(t => t.Boat == pBoat).OrderByDescending(t => t.EndUTC).FirstOrDefault();
		}

		/// <summary>
		/// Returns all tracks that overlap a certain time period
		/// </summary>
		/// <param name="pStart">Start of the period in ms since epoc</param>
		/// <param name="pEnd">End of the period in ms since epoc</param>
		/// <param name="pIsBoatTime">True, to treat start/end as Boattime, false for UTC</param>
		/// <returns></returns>
		public List<Track> ReadTracks(Int64 pStart, Int64 pEnd, Boolean pIsBoatTime = false) {
			String query = "SELECT * FROM read_tracks(@p_start, @p_end, @p_is_boattime);";
			List<(String, Object)> pars = new List<(String, Object)>();
			pars.Add(("@p_start", pStart));
			pars.Add(("@p_end", pEnd));
			pars.Add(("@p_is_boattime", pIsBoatTime));
			return this.dbHelper.ReadData<Track>(query, new Func<NpgsqlDataReader, Track>(this.ReadTrack), pars);
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
