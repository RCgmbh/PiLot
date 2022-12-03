using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using Npgsql;

using PiLot.Utils.Logger;

namespace PiLot.Data.Postgres.Nav {
	
	/// <summary>
	/// Reads and writes POIs from/to the database
	/// </summary>
	public class PoiDataConnector {

		/// <summary>
		/// Finds pois based on coordinates, categories and features. All results are within the provided
		/// rectangle, belong one of the provided categories and have all of the required features.
		/// The result is a list of Object-arrays, directly as it is returned by the postgresql function.
		/// Not all attributes are read, in order to keep the resulting data as slim as possible.
		/// </summary>
		/// <param name="pMinLat">Minimal latitude, degrees WGS84</param>
		/// <param name="pMinLon">Minimal longitude, degrees WGS84</param>
		/// <param name="pMaxLat">Maximal latitude, degrees WGS84</param>
		/// <param name="pMaxLon">Maximal lontitude, degrees WGS84</param>
		/// <param name="pCategories">Array of category ids</param>
		/// <param name="pFeatures">Array of feature ids</param>
		/// <returns>List of Obect[] with id, title, category_id, feature_ids, lat, lon, valid from, valid to</returns>
		public List<Object[]> FindPois(Double pMinLat, Double pMinLon, Double pMaxLat, Double pMaxLon, Int32[] pCategories, Int32[] pFeatures) {
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
		}
	}
}
