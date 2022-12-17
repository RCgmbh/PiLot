using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using Npgsql;
using PiLot.Model.Nav;
using PiLot.Utils.DateAndTime;
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
			String query = "SELECT * FROM find_pois(@min_lat, @min_lng, @max_lat, @max_lng, @categories, @features);";
			List<(String, Object)> pars = new List<(String, Object)>();
			pars.Add(("@min_lat", pMinLat));
			pars.Add(("@min_lng", pMinLon));
			pars.Add(("@max_lat", pMaxLat));
			pars.Add(("@max_lng", pMaxLon));
			pars.Add(("@categories", pCategories));
			pars.Add(("@features", pFeatures));
			return this.ReadData(query, pars);
		}

		/// <summary>
		/// Reads a poi with a certain id from the database and returns it as an array of all fields,
		/// exactly as they are returned by the db. If no record is found, returns null.
		/// </summary>
		public Object[] ReadPoi(Int64 pPoiId){
			Object[] result = null;
			Logger.Log($"PoiDataConnector.ReadPoi({pPoiId})", LogLevels.DEBUG);
			String query = "SELECT * FROM read_poi(@poi_id);";
			List<(String, Object)> pars = new List<(String, Object)>();
			pars.Add(("@poi_id", pPoiId));
			List<Object[]> resultList = this.ReadData(query, pars);
			if(resultList.Count == 1){
				result = resultList[0];
			}
			return result;
		}

		/// <summary>
		/// Inserts or updates a POI in the DB and returns the ID
		/// </summary>
		/// <param name="pPoi">The poi to save, not null</param>
		/// <returns>The pois ID</returns>
		public Int64 SavePoi(Poi pPoi) {
			Logger.Log("PoiDataConnector.SavePoi", LogLevels.DEBUG);
			Int64? result = null;
			String command;
			if(pPoi.ID == null) {
				command = "SELECT * FROM insert_poi(@p_title, @p_description, @p_category_id, @p_properties, @p_latitude, @p_longitude, @p_valid_from, @p_valid_to);";
			} else {
				command = "SELECT * FROM update_poi(@p_id, @p_title, @p_description, @p_category_id, @p_properties, @p_latitude, @p_longitude, @p_valid_from, @p_valid_to);";
				result = pPoi.ID;
			}
			NpgsqlConnection connection = null;
			try {
				String connectionString = ConfigurationManager.AppSettings["connectionString"];
				connection = new NpgsqlConnection(connectionString);
				NpgsqlCommand cmd = new NpgsqlCommand(command, connection);
				if(pPoi.ID != null) {
					cmd.Parameters.AddWithValue("@p_id", pPoi.ID);
				}
				cmd.Parameters.AddWithValue("@p_title", pPoi.Title);
				cmd.Parameters.AddWithValue("@p_description", pPoi.Description);
				cmd.Parameters.AddWithValue("@p_category_id", pPoi.CategoryID);
				cmd.Parameters.AddWithValue("@p_properties", DBNull.Value);
				cmd.Parameters.AddWithValue("@p_latitude", pPoi.Latitude);
				cmd.Parameters.AddWithValue("@p_longitude", pPoi.Longitude);
				cmd.Parameters.AddWithValue("@p_valid_from", this.NullableUnixToDateTime(pPoi.ValidFrom));
				cmd.Parameters.AddWithValue("@p_valid_to", this.NullableUnixToDateTime(pPoi.ValidTo));
				connection.Open();
				Object cmdResult = cmd.ExecuteScalar();
				if(pPoi.ID == null) {
					result = (Int64)cmdResult;
				}
			} catch (Exception ex) {
				Logger.Log(ex, "PoiDataConnector.SavePoi");
				throw;
			} finally {
				if ((connection != null) && (connection.State == ConnectionState.Open)) {
					connection.Close();
				}
			}
			return result.Value;
		}

		/// <summary>
		/// Converts a DateTime in seconds since epoc into a date time, accepting null values
		/// </summary>
		/// <param name="pUnixTime">The dateTime in Unix or null</param>
		/// <returns>DateTime or DBNull.Value</returns>
		private Object NullableUnixToDateTime(Int32? pUnixTime) {
			Object result = DBNull.Value;
			if(pUnixTime != null) {
				result = DateTimeHelper.FromUnixTime(pUnixTime.Value);
			}
			return result;
		}

		/// <summary>
		/// Reads all poi_categories
		/// </summary>
		/// <returns>List PoiCategories</returns>
		public List<PoiCategory> ReadPoiCategories() {
			Logger.Log("PoiDataConnector.ReadPoiCategories", LogLevels.DEBUG);
			List<PoiCategory> result = new List<PoiCategory>();
			NpgsqlConnection connection = null;
			try {
				String connectionString = ConfigurationManager.AppSettings["connectionString"];
				Logger.Log($"connectionString: {connectionString}", LogLevels.DEBUG);
				connection = new NpgsqlConnection(connectionString);
				NpgsqlCommand cmd = new NpgsqlCommand("SELECT * FROM poi_categories", connection);
				connection.Open();
				NpgsqlDataReader reader = cmd.ExecuteReader();
				while (reader.Read()) {
					PoiCategory category = new PoiCategory(){
						ID = reader.GetInt32("id"),
						Name = reader.GetString("name")
					};
					if(!reader.IsDBNull("parent_id")){
						category.ParentId = reader.GetInt32("parent_id");
					}
					result.Add(category);
				}
				reader.Close();
			} catch (Exception ex) {
				Logger.Log(ex, "PoiDataConnector.ReadPoiCategories");
				throw;
			} finally {
				if ((connection != null) && (connection.State == ConnectionState.Open)) {
					connection.Close();
				}
			}
			return result;
		}

		/// <summary>
		/// Reads all poi_features
		/// </summary>
		/// <returns>List of Arrays with id and name</returns>
		public List<Object[]> ReadPoiFeatures() {
			Logger.Log("PoiDataConnector.ReadPoiFeatures", LogLevels.DEBUG);
			return this.ReadData("SELECT * FROM poi_features");
		}

		/// <summary>
		/// Reads data and returns a list of Object-arrays, containing each field for each record
		/// as it is returned from the query
		/// </summary>
		/// <param name="pQuery">Well... the query</param>
		/// <param name="pParams">The parameters with name and value</param>
		/// <returns></returns>
		private List<Object[]> ReadData(String pQuery, List<(String, Object)> pParams = null) {
			List<Object[]> result = new List<Object[]>();
			NpgsqlConnection connection = null;
			try {
				String connectionString = ConfigurationManager.AppSettings["connectionString"];
				Logger.Log($"connectionString: {connectionString}", LogLevels.DEBUG);
				connection = new NpgsqlConnection(connectionString);
				NpgsqlCommand cmd = new NpgsqlCommand(pQuery, connection);
				if (pParams != null) {
					foreach (var aParam in pParams) {
						cmd.Parameters.AddWithValue(aParam.Item1, aParam.Item2);
					}
				}
				connection.Open();
				NpgsqlDataReader reader = cmd.ExecuteReader();
				while (reader.Read()) {
					Object[] values = new Object[reader.FieldCount];
					reader.GetValues(values);
					result.Add(values);
				}
				reader.Close();
			} catch (Exception ex) {
				Logger.Log(ex, "PoiDataConnector.ReadData");
				throw;
			} finally {
				if ((connection != null) && (connection.State == ConnectionState.Open)) {
					connection.Close();
				}
			}
			return result;
		}

	}
}
