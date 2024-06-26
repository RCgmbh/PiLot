﻿using System;
using System.Collections.Generic;
using System.Data;
using Npgsql;
using PiLot.Data.Nav;
using PiLot.Data.Postgres.Helper;
using PiLot.Model.Nav;
using PiLot.Utils.DateAndTime;
using PiLot.Utils.Logger;

namespace PiLot.Data.Postgres.Nav
{

    /// <summary>
    /// Reads and writes POIs from/to the database
    /// </summary>
    public class PoiDataConnector: IPoiDataConnector {

		protected DBHelper dbHelper;

		public PoiDataConnector() {
			this.dbHelper = new DBHelper();
		}

		public PoiDataConnector(String pConnectionString) {
			this.dbHelper = new DBHelper(pConnectionString);
		}

		/// <summary>
		/// Reads all pois and returns them with all fields populated. This might become quite heavy depending
		/// on the number of pois in the system.
		/// </summary>
		/// <returns>List of Pois</returns>
		public List<Poi> ReadPois() {
			Logger.Log("PoiDataConnector.ReadPois", LogLevels.DEBUG);
			String query = "SELECT * FROM all_pois;";
			return this.dbHelper.ReadData<Poi>(query, new Func<NpgsqlDataReader, Poi>(this.ReadPoi));
		}

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
		/// <returns>List of Obect[] with id, title, category_id, feature_ids, lat, lon, valid from, valid to, source, sourceId</returns>
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
			return this.dbHelper.ReadData<Object[]>(query, new Func<NpgsqlDataReader, Object[]>(this.dbHelper.ReadObjects), pars);
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
			List<Object[]> resultList = this.dbHelper.ReadData<Object[]>(query, new Func<NpgsqlDataReader, Object[]>(this.dbHelper.ReadObjects), pars);
			if(resultList.Count == 1){
				result = resultList[0];
			}
			return result;
		}

		/// <summary>
		/// Reads an external poi with a certain source id and source namefrom the database and returns it
		/// as an array of all fields, exactly as they are returned by the db. If no record is found, returns null.
		/// </summary>
		/// <param name="pSource">The name of the source</param>
		/// <param name="pSourceId">The id of the poi in the external source</param>
		public Object[] ReadExternalPoi(String pSource, String pSourceId) {
			Object[] result = null;
			Logger.Log($"PoiDataConnector.ReadExternalPoi({pSource}, {pSourceId})", LogLevels.DEBUG);
			String query = "SELECT * FROM read_external_poi(@p_source, @p_source_id);";
			List<(String, Object)> pars = new List<(String, Object)>();
			pars.Add(("@p_source", pSource));
			pars.Add(("@p_source_id", pSourceId));
			List<Object[]> resultList = this.dbHelper.ReadData<Object[]>(query, new Func<NpgsqlDataReader, Object[]>(this.dbHelper.ReadObjects), pars);
			if (resultList.Count == 1) {
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
			Int64 result;
			String command;
			List<(String, Object)> pars = new List<(String, Object)>();
			if (pPoi.ID == null) {
				command = "SELECT * FROM insert_poi(@p_title, @p_description, @p_category_id, @p_properties, @p_latitude, @p_longitude, @p_valid_from, @p_valid_to, @p_source, @p_source_id);";
			} else {
				command = "SELECT * FROM update_poi(@p_id, @p_title, @p_description, @p_category_id, @p_properties, @p_latitude, @p_longitude, @p_valid_from, @p_valid_to, @p_source, @p_source_id);";
				pars.Add(("@p_id", pPoi.ID));
			}
			pars.Add(("@p_title", pPoi.Title));
			pars.Add(("@p_description", pPoi.Description));
			pars.Add(("@p_category_id", pPoi.CategoryID));
			pars.Add(("@p_properties", DBNull.Value));
			pars.Add(("@p_latitude", pPoi.Latitude));
			pars.Add(("@p_longitude", pPoi.Longitude));
			pars.Add(("@p_valid_from", this.NullableUnixToDateTime(pPoi.ValidFrom)));
			pars.Add(("@p_valid_to", this.NullableUnixToDateTime(pPoi.ValidTo)));
			pars.Add(("@p_source", this.dbHelper.GetNullableParameterValue(pPoi.Source)));
			pars.Add(("@p_source_id", this.dbHelper.GetNullableParameterValue(pPoi.SourceID)));
			result = this.dbHelper.ExecuteCommand<Int64>(command, pars);
			this.SavePoiFeatures(result, pPoi.FeatureIDs);
			return result;
		}

		/// <summary>
		/// Deletes and the re-creates all records in poi_features__pois for a poi id and 
		/// a list of features. Should probably at least go into a transaction, or even
		/// better pass the list of features and let one single function do it all.
		/// </summary>
		/// <param name="pPoiID">The poi ID</param>
		/// <param name="pFeatureIDs">The list of feature ids for the poi</param>
		private void SavePoiFeatures(Int64 pPoiID, Int32[] pFeatureIDs) {
			Logger.Log("PoiDataConnector.SavePoiFeatures", LogLevels.DEBUG);
			String cmdDelete = "DELETE FROM poi_features__pois WHERE poi_id = @poi_id;";
			List<(String, Object)> parsDelete = new List<(String, Object)>();
			parsDelete.Add(("@poi_id", pPoiID));
			this.dbHelper.ExecuteCommand<Object>(cmdDelete, parsDelete);
			if (pFeatureIDs != null) {
				String cmdInsert = "INSERT INTO poi_features__pois (feature_id, poi_id) VALUES (@feature_id, @poi_id)";
				List<(String, Object)> parsInsert;
				foreach (Int32 aFeatureId in pFeatureIDs) {
					parsInsert = new List<(String, Object)>();
					parsInsert.Add(("@feature_id", aFeatureId));
					parsInsert.Add(("@poi_id", pPoiID));
					this.dbHelper.ExecuteCommand<Object>(cmdInsert, parsInsert);
				}
			}
		}

		/// <summary>
		/// Deletes a POI from the DB
		/// </summary>
		/// <param name="pPoiID">The id of the poi, not null</param>
		public void DeletePoi(Int64 pPoiID) {
			Logger.Log("PoiDataConnector.DeletePoi", LogLevels.DEBUG);
			String command = "SELECT * FROM delete_poi(@p_id)";
			List<(String, Object)> pars = new List<(String, Object)>();
			pars.Add(("@p_id", pPoiID));
			this.dbHelper.ExecuteCommand<Object>(command, pars);
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
		/// Converts a DateTime that could be null into an Int representing
		/// seconds since epoc.
		/// </summary>
		/// <param name="pDateTime">The date or null</param>
		/// <returns>Seconds since epoc or null</returns>
		private Int32? NullableDateTimeToUnix(Object pDateTime) {
			Int32? result = null;
			if((pDateTime != null) && (pDateTime != DBNull.Value) && (pDateTime is DateTime?)) {
				result = DateTimeHelper.ToUnixTime((DateTime)pDateTime);
			}
			return result;
		}

		/// <summary>
		/// Helper to create a Poi out of a db record
		/// </summary>
		private Poi ReadPoi(NpgsqlDataReader pReader) {
			Int32[] featureIds = this.dbHelper.ReadNullableField<Int32[]>(pReader, "feature_ids");
			if((featureIds == null) || ((featureIds.Length == 1) && featureIds[0] == 0)) {
				featureIds = new Int32[0];
			}
			Poi result = new Poi() {
				ID = pReader.GetInt64("id"),
				Title = pReader.GetString("title"),
				Description = this.dbHelper.ReadNullableField<String>(pReader, "description"),
				CategoryID = pReader.GetInt32("category_id"),
				FeatureIDs = featureIds,
				Properties = this.dbHelper.ReadNullableField<Object>(pReader, "properties"),
				Latitude = pReader.GetDouble("latitude"),
				Longitude = pReader.GetDouble("longitude"),
				ValidFrom = this.NullableDateTimeToUnix(pReader.GetValue("valid_from")),
				ValidTo = this.NullableDateTimeToUnix(pReader.GetValue("valid_to")),
				Source = this.dbHelper.ReadNullableField<String>(pReader, "source"),
				SourceID = this.dbHelper.ReadNullableField<String>(pReader, "source_id")
			};
			return result;
		}

		/// <summary>
		/// Reads all poi_categories
		/// </summary>
		/// <returns>List of PoiCategories</returns>
		public List<PoiCategory> ReadPoiCategories() {
			Logger.Log("PoiDataConnector.ReadPoiCategories", LogLevels.DEBUG);
			String query = "SELECT * FROM poi_categories";
			return this.dbHelper.ReadData<PoiCategory>(query, new Func<NpgsqlDataReader, PoiCategory>(this.ReadPoiCategory));
		}

		/// <summary>
		/// Saves a new or existing Poi Category on the server
		/// </summary>
		/// <param name="pCategory">The category to save, not null</param>
		/// <returns>The ID of the category</returns>
		public Int32 SavePoiCategory(PoiCategory pCategory) {
			Logger.Log("PoiDataConnector.SavePoiCategory", LogLevels.DEBUG);
			Int32 result;
			String command;
			List<(String, Object)> pars = new List<(String, Object)>();
			if (pCategory.ID == null) {
				command = "SELECT * FROM insert_poi_category(@p_parent_id, @p_name, @p_labels, @p_icon);";
			} else {
				command = "SELECT * FROM update_poi_category(@p_id, @p_parent_id, @p_name, @p_labels, @p_icon);";
				pars.Add(("@p_id", pCategory.ID));
			}
			pars.Add(("@p_parent_id", pCategory.ParentId));
			pars.Add(("@p_name", pCategory.Name));
			pars.Add(("@p_labels", pCategory.Labels));
			pars.Add(("@p_icon", pCategory.Icon));
			result = this.dbHelper.ExecuteCommand<Int32>(command, pars);
			return result;
		}

		/// <summary>
		/// Deletes a Poi Category, it it isn't used by any poi. 
		/// </summary>
		/// <param name="pCategoryId">The id of the category to delete</param>
		/// <returns>true, if the category has been deleted, false if it couldn't be deleted</returns>
		public Boolean DeletePoiCategory(Int32 pCategoryId) {
			Logger.Log("PoiDataConnector.DeletePoiCategory", LogLevels.DEBUG);
			Int32 result;
			String command = "SELECT * FROM delete_poi_category(@p_id);";
			List<(String, Object)> pars = new List<(String, Object)>();
			pars.Add(("@p_id", pCategoryId));
			result = this.dbHelper.ExecuteCommand<Int32>(command, pars);
			return result == 1;
		}

		/// <summary>
		/// Helper to create a PoiCategory out of a db record
		/// </summary>
		private PoiCategory ReadPoiCategory(NpgsqlDataReader pReader) {
			PoiCategory result = new PoiCategory() {
				ID = pReader.GetInt32("id"),
				Name = pReader.GetString("name")
			};
			if (!pReader.IsDBNull("icon")) {
				result.Icon = pReader.GetString("icon");
			}
			if (!pReader.IsDBNull("parent_id")) {
				result.ParentId = pReader.GetInt32("parent_id");
			}
			String labelsString = pReader.GetString("labels");
			Object labelsObj = System.Text.Json.JsonSerializer.Deserialize<Object>(labelsString);
			result.Labels = labelsObj;
			return result;
		}

		/// <summary>
		/// Reads all poi_features
		/// </summary>
		/// <returns>List PoiFeature</returns>
		public List<PoiFeature> ReadPoiFeatures() {
			Logger.Log("PoiDataConnector.ReadPoiFeatures", LogLevels.DEBUG);
			String query = "SELECT * FROM poi_features";
			return this.dbHelper.ReadData<PoiFeature>(query,  new Func<NpgsqlDataReader, PoiFeature>(this.ReadPoiFeature));
		}

		/// <summary>
		/// Saves a new or existing Poi Feature on the server
		/// </summary>
		/// <param name="pFeature">The feature to save, not null</param>
		/// <returns>The ID of the feature</returns>
		public Int32 SavePoiFeature(PoiFeature pFeature) {
			Logger.Log("PoiDataConnector.SavePoiFeature", LogLevels.DEBUG);
			Int32 result;
			String command;
			List<(String, Object)> pars = new List<(String, Object)>();
			if (pFeature.ID == null) {
				command = "SELECT * FROM insert_poi_feature(@p_name, @p_labels);";
			} else {
				command = "SELECT * FROM update_poi_feature(@p_id, @p_name, @p_labels);";
				pars.Add(("@p_id", pFeature.ID));
			}
			pars.Add(("@p_name", pFeature.Name));
			pars.Add(("@p_labels", pFeature.Labels));
			result = this.dbHelper.ExecuteCommand<Int32>(command, pars);
			return result;
		}

		/// <summary>
		/// Deletes a Poi Feature, it it isn't used by any poi. 
		/// </summary>
		/// <param name="pFeatureId">The id of the feature to delete</param>
		/// <returns>true, if the feature has been deleted, false if it couldn't be deleted</returns>
		public Boolean DeletePoiFeature(Int32 pFeatureId) {
			Logger.Log("PoiDataConnector.DeletePoiFeature", LogLevels.DEBUG);
			Int32 result;
			String command = "SELECT * FROM delete_poi_feature(@p_id);";
			List<(String, Object)> pars = new List<(String, Object)>();
			pars.Add(("@p_id", pFeatureId));
			result = this.dbHelper.ExecuteCommand<Int32>(command, pars);
			return result == 1;
		}

		/// <summary>
		/// Helper to create a PoiFeature from a db record
		/// </summary>
		private PoiFeature ReadPoiFeature(NpgsqlDataReader pReader) {
			String labelsString = pReader.GetString("labels");
			Object labelsObj = System.Text.Json.JsonSerializer.Deserialize<Object>(labelsString);
			PoiFeature result = new PoiFeature() {
				ID = pReader.GetInt32("id"),
				Name = pReader.GetString("name"),
				Labels = labelsObj
			};
			return result;
		}
	}
}
