using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
//using Npgsql;

using PiLot.Utils.Logger;

namespace PiLot.Data.Postgres.Nav {
	
	/// <summary>
	/// Reads and writes POIs from/to the database
	/// </summary>
	public class PoiDataConnector {

		/*public List<Object[]> FindPois(Double pMinLat, Double pMinLon, Double pMaxLat, Double pMaxLon, Int32[] pCategories, Int32[] pFeatures) {
			Logger.Log("PoiDataConnector.FindPois", LogLevels.DEBUG);
			List<Object[]> result = new List<Object[]>();
			NpgsqlConnection connection = null;
			try {
				Logger.Log($"connectionString: {this.ConnectionString}", LogLevels.DEBUG);
				connection = new NpgsqlConnection(this.ConnectionString);
				String query = "SELECT * FROM find_pois(@min_lat, @min_lng, @max_lat, @max_lng, @categories, @features);";
				NpgsqlCommand cmd = new NpgsqlCommand(query, connection);
				cmd.Parameters.AddWithValue("@min_lat", pMinLat);
				cmd.Parameters.AddWithValue("@min_lng", pMinLon);
				cmd.Parameters.AddWithValue("@max_lat", pMaxLat);
				cmd.Parameters.AddWithValue("@max_lng", pMaxLon);
				cmd.Parameters.AddWithValue("@categories", pCategories);
				cmd.Parameters.AddWithValue("@features", pFeatures);
				connection.Open();
				NpgsqlDataReader reader = cmd.ExecuteReader();
				while (reader.Read()) {
					Object[] values = new Object[8];
					reader.GetValues(values);
					result.Add(values);
				}
				reader.Close();
			} catch(Exception ex) {
				Logger.Log(ex, "PoiDataConnector.FindPois");
				throw;
			} finally {
				if ((connection != null) && (connection.State == ConnectionState.Open)) {
					connection.Close();
				}
			}
			return result;
		}

		private String ConnectionString {
			get {
				return ConfigurationManager.AppSettings["connectionString"];
			}			
		}*/
	}
}
