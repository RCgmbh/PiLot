using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using Npgsql;
using PiLot.Backup.Client.Model;
using PiLot.Model.Nav;
using PiLot.Utils.Logger;

namespace PiLot.Backup.Client.Data {

	/// <summary>
	/// Helper for reading tracks for backup
	/// </summary>
	internal class TrackDataConnector : PiLot.Data.Postgres.Nav.TrackDataConnector {

		internal TrackDataConnector(): base(){}

		/// <summary>
		/// Reads the total number of non-empty tracks and the ids of the tracks that have been changed since the last backup
		/// </summary>
		/// <param name="pChangedAfter">The date of the last backup</param>
		/// <returns>The ids of the changed tracks, the number of non-empty tracks</returns>
		internal BackupTaskData<List<Int32>> GetChangedTracks(DateTime pChangedAfter) {
			Logger.Log("TrackDataconnector.ReadLatestChange", LogLevels.DEBUG);
			Int32 tracksCount = 0;
			List<Int32?> changedTrackIDs = new List<Int32?>(0);
			NpgsqlConnection connection = this.dbHelper.GetConnection();
			if (connection != null) {
				connection.Open();
				NpgsqlTransaction transaction = connection.BeginTransaction(IsolationLevel.RepeatableRead);
				try {
					String tracksCountQuery = "SELECT count(id) FROM tracks WHERE start_utc IS NOT NULL;";
					tracksCount = this.dbHelper.ReadValue<Int32?>(tracksCountQuery, transaction) ?? 0;
					String changedTrackIDsQuery = "SELECT id FROM tracks WHERE date_changed >= @p_date_changed ORDER BY date_changed ASC";
					List<(String, Object)> changedTrackIDsPars = new List<(String, Object)>();
					changedTrackIDsPars.Add(("@p_date_changed", pChangedAfter));
					changedTrackIDs = this.dbHelper.ReadData<Int32?>(changedTrackIDsQuery, new Func<NpgsqlDataReader, Int32?>(this.dbHelper.ReadNullableField<Int32?>), changedTrackIDsPars);
					transaction.Commit();
					connection.Close();
				} catch (Exception ex) {
					Logger.Log(ex, "TrackDataConnector.InsertTrack");
					transaction.Rollback();
					connection.Close();
					throw;
				}
			}
			return new BackupTaskData<List<Int32>>() {
				ChangedItems = changedTrackIDs.FindAll(id => id != null).Select(id => id.Value).ToList(),
				TotalItems = tracksCount
			};
		}
	}
}
