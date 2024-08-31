using System;
using System.Collections.Generic;
using Npgsql;

using PiLot.Utils.Logger;

namespace PiLot.Backup.Client.Data {

	/// <summary>
	/// Helper for reading pois for backup
	/// </summary>
	internal class PoiDataConnector : PiLot.Data.Postgres.Nav.PoiDataConnector {

		internal PoiDataConnector(): base(){}

		/// <summary>
		/// Reads the latest change date of either pois, categories or features. Used as a very basic approach
		/// for an all-or-nothing backup of poi-related data.
		/// </summary>
		/// <returns>The date of the latest change or null</returns>
		internal DateTime? ReadLatestChange() {
			DateTime? result = null;
			Logger.Log("PoiDataConnector.ReadLatestChange", LogLevels.DEBUG);
			String query = "SELECT * FROM poi_latest_change;";
			List<DateTime?> resultList = this.dbHelper.ReadData<DateTime?>(query, new Func<NpgsqlDataReader, DateTime?>(this.dbHelper.ReadDateTime));
			if (resultList.Count == 1) {
				result = resultList[0];
			}
			return result;
		}
	}
}
