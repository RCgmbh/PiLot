using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using PiLot.Data.Nav;
using PiLot.Model.Nav;
using PiLot.Utils.Logger;


namespace PiLot.Data.Files
{

    /// <summary>
    /// Helper class to rad and save poi-related data from/to file. This is used
    /// for backup and for scenarios where no db is available.
    /// </summary>
    public class PoiDataConnector: IPoiDataConnector {

		#region constants

		private const String DATASOURCENAME = "pois";
		private const String POISFILENAME = "pois.json";
		private const String CATEGORIESFILENAME = "categories.json";
		private const String FEATURESFILENAME = "features.json";

		#endregion

		#region instance variables

		private DataHelper helper;
		private Object lockObject = null;
		private List<Poi> allPois = null;

		#endregion

		#region constructors

		/// <summary>
		/// Default constructor
		/// </summary>
		public PoiDataConnector() {
			this.helper = new DataHelper();
			this.lockObject = new Object();
		}

		/// <summary>
		/// Creates a new PoiDataConnector for a specific data root path
		/// </summary>
		/// <param name="pDataRoot">root path</param>
		public PoiDataConnector(String pDataRoot) {
			this.helper = new DataHelper(pDataRoot);
			this.lockObject = new Object();
		}

		#endregion

		#region public methods

		/// <summary>
		/// Finds pois based on coordinates, categories and features. All results are within the provided
		/// rectangle, belong one of the provided categories and have all of the required features.
		/// The result is a list of Object-arrays, with id (Int64), title (String), category_id (int32),
		/// feature_ids (In32 []), latitude (Double), longitude (Double), valid_from (timestamp String),
		/// valid_to (timestamp String), source (String), source_id (String)
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
			List<Poi> pois = this.ReadPois();
			return pois
			.Where(p =>
				   p.Latitude >= pMinLat
				&& p.Latitude <= pMaxLat
				&& p.Longitude >= pMinLon
				&& p.Longitude <= pMaxLon
				&& pCategories.Contains(p.CategoryID)
				&& pFeatures.All(f => p.FeatureIDs.Contains(f))
			)
			.Select(p => p.ToShortArray())
			.ToList();
		}

		/// <summary>
		/// Returns all pois, or an empty list of pois
		/// </summary>
		/// <returns></returns>
		public List<Poi> ReadPois() {
			if (this.allPois == null) {
				this.allPois = this.ReadData<List<Poi>>(POISFILENAME) ?? new List<Poi>();
			}
			return this.allPois;
		}

		/// <summary>
		/// Reads a poi with a certain id from the file and returns it as an array of these fields:
		/// id (Int64), title (String), category_id (Int32), feature_ids (Int32[]), latitude (Double),
		/// longitude (Double), valid_from (timestamp String), valid_to (timestamp String), source (String),
		/// source_id (String), description (String), properties (Object)
		/// If no record is found, returns null.
		/// </summary>
		public Object[] ReadPoi(Int64 pPoiId) {
			return this.ReadPois().FirstOrDefault(p => p.ID == pPoiId)?.ToArray();
		}
		
		/// <summary>
		 /// Reads an external poi with a certain source id and source namefrom the file and returns it as 
		 /// an array of these fields: id (Int64), title (String), category_id (Int32), feature_ids (Int32[]),
		 /// latitude (Double), longitude (Double), valid_from (timestamp String), valid_to (timestamp String),
		 /// source (String), source_id (String), description (String), properties (Object)
		 /// If no record is found, returns null.
		 /// </summary>
		 /// <param name="pSource">The name of the source</param>
		 /// <param name="pSourceId">The id of the poi in the external source</param>
		public Object[] ReadExternalPoi(String pSource, String pSourceId) {
			List<Poi> allPois = this.ReadPois();
			return allPois.FirstOrDefault(p => p.Source == pSource && p.SourceID == pSourceId)?.ToArray();
		}

		/// <summary>
		/// Inserts or updates a POI in the file and returns the ID
		/// </summary>
		/// <param name="pPoi">The poi to save, not null</param>
		/// <returns>The pois ID</returns>
		public Int64 SavePoi(Poi pPoi) {
			lock (this.lockObject) {
				List<Poi> allPois = this.ReadPois();
				if (pPoi.ID != null) {
					allPois.RemoveAll(p => p.ID == pPoi.ID);
				} else {
					pPoi.ID = (allPois.Max(p => p.ID) ?? 0) + 1;
				}
				allPois.Add(pPoi);
				this.SaveAllPois(allPois);
			}
			return pPoi.ID.Value;
		}

		/// <summary>
		/// Saves a list of pois to a file. ALL EXISTING DATA WILL BE REPLACED
		/// </summary>
		/// <param name="pPois">The list of all POIs</param>
		public void SaveAllPois(List<Poi> pPois) {
			lock (this.lockObject) {
				this.SaveData(pPois, POISFILENAME);
			}
		}

		/// <summary>
		/// Deletes a POI from the file
		/// </summary>
		/// <param name="pPoiID">The id of the poi, not null</param>
		public void DeletePoi(Int64 pPoiID) {
			lock (this.lockObject) {
				List<Poi> allPois = this.ReadPois();
				allPois.RemoveAll(p => p.ID == pPoiID);
				this.SaveAllPois(allPois);
			}
		}

		/// <summary>
		/// Returns the list of all POI Categories, or an empty list
		/// </summary>
		public List<PoiCategory> ReadPoiCategories() {
			return this.ReadAllPoiCategories() ?? new List<PoiCategory>();
		}

		/// <summary>
		/// Saves a poi category to file, by either adding it or updating it,
		/// depending on whether a category with the same id exists.
		/// </summary>
		/// <param name="pPoiCategory"></param>
		/// <returns>The ID of the category</returns>
		public Int32 SavePoiCategory(PoiCategory pPoiCategory) {
			lock (this.lockObject) {
				List<PoiCategory> allCategories = this.ReadAllPoiCategories();
				if (pPoiCategory.ID != null) {
					allCategories.RemoveAll(c => c.ID == pPoiCategory.ID);
				} else {
					pPoiCategory.ID = (allCategories.Max(c => c.ID) ?? 0) + 1;
				}
				allCategories.Add(pPoiCategory);
				this.SaveAllCategories(allCategories);
			}
			return pPoiCategory.ID.Value;
		}

		/// <summary>
		/// Saves a list of poi categories to a file. ALL EXISTING DATA WILL BE REPLACED
		/// </summary>
		/// <param name="pPoiCategories">The list of all categories</param>
		public void SaveAllCategories(List<PoiCategory> pPoiCategories) {
			lock (this.lockObject) {
				this.SaveData(pPoiCategories, CATEGORIESFILENAME);
			}
		}

		/// <summary>
		/// Deletes a category, if one exists with the given id. The category
		/// will however only be deleted, if there are no pois for this category
		/// and if it is no other categories parent.
		/// </summary>
		/// <param name="pCategoryID">The category ID</param>
		/// <returns>True, if a category was deleted or did not exist</returns>
		public Boolean DeletePoiCategory(Int32 pCategoryID) {
			Boolean result;
			lock (this.lockObject) {
				List<PoiCategory> allCategories = this.ReadAllPoiCategories();
				List<Poi> allPois = this.ReadPois();
				if (
					allCategories.Exists(c => c.ParentId == pCategoryID)
					|| allPois.Exists(p => p.CategoryID == pCategoryID)
				) {
					result = false;
				} else {
					allCategories.RemoveAll(c => c.ID == pCategoryID);
					this.SaveAllCategories(allCategories);
					result = true;
				}
			}
			return result;
		}

		/// <summary>
		/// Returns the list of all POI features
		/// </summary>
		public List<PoiFeature> ReadPoiFeatures() {
			return this.ReadAllPoiFeatures().OrderBy(f => f.Name).ToList();
		}

		/// <summary>
		/// Saves a poi feature to file, by either adding it or updating it,
		/// depending on whether a feature with the same id exists.
		/// </summary>
		/// <param name="pPoiFeature"></param>
		/// <returns>The ID of the feature</returns>
		public Int32 SavePoiFeature(PoiFeature pPoiFeature) {
			lock (this.lockObject) {
				List<PoiFeature> allFeatures = this.ReadAllPoiFeatures();
				if (pPoiFeature.ID != null) {
					allFeatures.RemoveAll(f => f.ID == pPoiFeature.ID);
				} else {
					pPoiFeature.ID = (allFeatures.Max(f => f.ID) ?? 0) + 1;
				}
				allFeatures.Add(pPoiFeature);
				this.SaveAllFeatures(allFeatures);
			}
			return pPoiFeature.ID.Value;
		}

		/// <summary>
		/// Saves a list of poi features to a file. ALL EXISTING DATA WILL BE REPLACED
		/// </summary>
		/// <param name="pPoiFeatures">The list of all features</param>
		public void SaveAllFeatures(List<PoiFeature> pPoiFeatures) {
			lock (this.lockObject) {
				this.SaveData(pPoiFeatures, FEATURESFILENAME);
			}
		}

		/// <summary>
		/// Deletes a feature, if one exists with the given id. The feature
		/// will however only be deleted, if there are no pois using it.
		/// </summary>
		/// <param name="pFeaturedId">The feature ID</param>
		/// <returns>True, if a feature was deleted or did not exist</returns>
		public Boolean DeletePoiFeature(Int32 pFeatureID) {
			Boolean result;
			lock (this.lockObject) {
				List<Poi> allPois = this.ReadPois();
				if (allPois.Exists(p => p.FeatureIDs.Contains(pFeatureID))) {
					result = false;
				} else {
					List<PoiFeature> allFeatures = this.ReadAllPoiFeatures();
					allFeatures.RemoveAll(f => f.ID == pFeatureID);
					this.SaveAllFeatures(allFeatures);
					result = true;
				}
			}
			return result;
		}

		#endregion

		#region private methods

		/// <summary>
		/// Reads and de-serializes data from a file
		/// </summary>
		/// <typeparam name="T">The type of the result</typeparam>
		/// <param name="pFileName">The filename (no path)</param>
		private T ReadData<T>(String pFileName) {
			T result = default(T);
			FileInfo file = this.GetFile(true, pFileName);
			if (file.Exists) {
				String fileContent = File.ReadAllText(file.FullName);
				if (!String.IsNullOrEmpty(fileContent)) {
					result = JsonSerializer.Deserialize<T>(fileContent);
				}
			}
			return result;
		}

		/// <summary>
		/// Reads all poi features
		/// </summary>
		private List<PoiFeature> ReadAllPoiFeatures() {
			return this.ReadData<List<PoiFeature>>(FEATURESFILENAME) ?? new List<PoiFeature>();
		}

		/// <summary>
		/// Reads all poi categories
		/// </summary>
		private List<PoiCategory> ReadAllPoiCategories() {
			return this.ReadData<List<PoiCategory>>(CATEGORIESFILENAME) ?? new List<PoiCategory>();
		}

		/// <summary>
		/// Saves data json-serialized into a file
		/// </summary>
		/// <param name="pData">The data to save</param>
		/// <param name="pFileName">The filename</param>
		public void SaveData(Object pData, String pFileName) {
			FileInfo file = this.GetFile(true, pFileName);
			String json = null;
			try {
				json = JsonSerializer.Serialize(pData);
			} catch (Exception ex) {
				Logger.Log($"PoiDataConnector: Error when trying to serialize Object. Exception: {ex.Message}", LogLevels.WARNING);
				throw;
			}
			if (json != null) {
				File.WriteAllText(file.FullName, json);
			}
		}

		/// <summary>
		/// Gets a FileInfo, creating the file if it does not exist and pCreateIfMissing is true
		/// </summary>
		private FileInfo GetFile(Boolean pCreateIfMissing, String pFileName) {
			string path = Path.Combine(this.helper.GetDataPath(DATASOURCENAME, pCreateIfMissing), pFileName);
			FileInfo result = new FileInfo(path);
			if (!result.Exists && pCreateIfMissing) {
				result.Create().Close();
			}
			return result;
		}

		#endregion

	}
}
