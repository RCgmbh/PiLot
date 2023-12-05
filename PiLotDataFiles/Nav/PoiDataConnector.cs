using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;

using PiLot.Model.Nav;
using PiLot.Utils.Logger;


namespace PiLot.Data.Files {

	/// <summary>
	/// Helper class to save poi-related data to file (used for backup)
	/// </summary>
	public class PoiDataConnector {

		#region constants

		private const String DATASOURCENAME = "pois";
		private const String POISFILENAME = "pois.json";
		private const String CATEGORIESFILENAME = "categories.json";
		private const String FEATURESFILENAME = "features.json";

		#endregion

		#region instance variables

		private DataHelper helper;

		#endregion

		#region constructors

		/// <summary>
		/// Default constructor
		/// </summary>
		public PoiDataConnector() {
			this.helper = new DataHelper();
		}

		/// <summary>
		/// Creates a new PoiDataConnector for a specific data root path
		/// </summary>
		/// <param name="pDataRoot">root path</param>
		public PoiDataConnector(String pDataRoot) {
			this.helper = new DataHelper(pDataRoot);
		}

		#endregion

		#region public methods

		/// <summary>
		/// Saves a list of pois to a file. ALL EXISTING DATA WILL BE REPLACED
		/// </summary>
		/// <param name="pPois">The list of all POIs</param>
		public void SaveAllPois(List<Poi> pPois) {
			this.SaveData(pPois, POISFILENAME);
		}

		/// <summary>
		/// Saves a list of poi categories to a file. ALL EXISTING DATA WILL BE REPLACED
		/// </summary>
		/// <param name="pPoiCategories">The list of all categories</param>
		public void SaveAllCategories(List<PoiCategory> pPoiCategories) {
			this.SaveData(pPoiCategories, CATEGORIESFILENAME);
		}

		/// <summary>
		/// Saves a list of poi features to a file. ALL EXISTING DATA WILL BE REPLACED
		/// </summary>
		/// <param name="pPoiFeatures">The list of all features</param>
		public void SaveAllFeatures(List<PoiFeature> pPoiFeatures) {
			this.SaveData(pPoiFeatures, FEATURESFILENAME);
		}

		/// <summary>
		/// Returns all pois, or an empty list of pois
		/// </summary>
		/// <returns></returns>
		public List<Poi> ReadAllPois() {
			List<Poi> result;
			FileInfo file = this.GetFile(true, POISFILENAME);
			if (file.Exists) {
				String content = File.ReadAllText(file.FullName);
				try {
					result = JsonSerializer.Deserialize<List<Poi>>(content);
				} catch(Exception ex) {
					Logger.Log($"PoiDataConnector: Error when trying to deserialize Object. Exception: {ex.Message}", LogLevels.ERROR);
					result = new List<Poi>();
				}
			} else {
				result = new List<Poi>();
			}
			return result;
		}

		#endregion

		#region private methods

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
