using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using Npgsql;

using PiLot.Utils.Logger;

namespace PiLot.Data.Postgres.Nav {
	
	public class PoiDataConnector {

		public List<List<Object>> FindPois(Double pMinLat, Double pMinLon, Double pMaxLat, Double pMaxLon) {
			Logger.Log("PoiDataConnector.FindPois", LogLevels.INFO);
			List<List<Object>> result = new List<List<Object>>();
			NpgsqlConnection connection = null;
			try {
				Logger.Log($"connectionString: {this.ConnectionString}", LogLevels.INFO);
				connection = new NpgsqlConnection(this.ConnectionString);
				String query = "SELECT * FROM find_pois(@min_lat, @min_lng, @max_lat, @max_lng);";
				NpgsqlCommand cmd = new NpgsqlCommand(query, connection);
				cmd.Parameters.AddWithValue("@min_lat", pMinLat);
				cmd.Parameters.AddWithValue("@min_lng", pMinLon);
				cmd.Parameters.AddWithValue("@max_lat", pMaxLat);
				cmd.Parameters.AddWithValue("@max_lng", pMaxLon);
				connection.Open();
				NpgsqlDataReader reader = cmd.ExecuteReader();
				while (reader.Read()) {
					result.Add(new List<Object>(){
						reader.GetInt64("id"),
						reader.GetString("title"),
						reader.GetDouble("latitude"),
						reader.GetDouble("longitude")
					});
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
		}
	}
}
