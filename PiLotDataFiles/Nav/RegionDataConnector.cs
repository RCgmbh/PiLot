using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;

using PiLot.Model.Nav;
using PiLot.Utils;
using PiLot.Utils.Logger;

namespace PiLot.Data.Files {

	/// <summary>
	/// Helper used to load/save Regions data from file
	/// </summary>
	public class RegionDataConnector {
		
		#region constants

		private const String DATASOURCENAME = "nav";
		private const String CHECKLISTSFILENAME = "regions.json";

		private static RegionDataConnector instance = null;
		
		#endregion

		#region instance variables

		private DataHelper helper;
		private Object lockObject = null;

		#endregion

		#region constructors

		/// <summary>
		/// Default constructor, private for singleton
		/// </summary>
		protected RegionDataConnector() {
			this.helper = new DataHelper();
			this.lockObject = new Object();
		}

		/// <summary>
		/// Creates a new RegionDataConnector for a specific data root path
		/// </summary>
		/// <param name="pDataRoot">root path</param>
		public RegionDataConnector(String pDataRoot) {
			this.helper = new DataHelper(pDataRoot);
			this.lockObject = new Object();
		}

		/// <summary>
		/// Returns the instance for the default data root, or creates a new one
		/// </summary>
		public static RegionDataConnector GetInstance(){
			if(RegionDataConnector.instance == null){
				RegionDataConnector.instance = new RegionDataConnector();
			} 
			return RegionDataConnector.instance;
		}

		#endregion

		#region public methods

		/// <summary>
		/// Returns all regions, or an empty list of regions
		/// </summary>
		public List<Region> ReadRegions() {
			List<Region> result = new List<Region>();
			FileInfo file = this.GetFile(true);
			if (file.Exists) {
				String fileContent = File.ReadAllText(file.FullName);
				if (!String.IsNullOrEmpty(fileContent)) {
					result = JsonSerializer.Deserialize<List<Region>>(fileContent);
				}
			}
			return result;
		}

		/// <summary>
		/// Returns a Region by its id
		/// </summary>
		/// <param name="pId">The ID</param>
		/// <returns>A Region or null</returns>
		public Region ReadRegion(Int32 pId) {
			Region result = null;
			List<Region> allRegions = this.ReadRegions();
			result = allRegions.FirstOrDefault(r => r.ID == pId);
			return result;
		}

		/// <summary>
		/// Inserts or updates a Region in the file and returns the ID
		/// </summary>
		/// <param name="pRegion">The region to save, not null</param>
		/// <returns>The regions ID</returns>
		public Int32 SaveRegion(Region pRegion) {
			lock (this.lockObject) {
				List<Region> allRegions = this.ReadRegions();
				if (pRegion.ID != null) {
					allRegions.RemoveAll(p => p.ID == pRegion.ID);
				} else {
					pRegion.ID = (allRegions.Max(p => p.ID) ?? 0) + 1;
				}
				allRegions.Add(pRegion);
				this.SaveAllRegions(allRegions);
			}
			return pRegion.ID.Value;
		}

		/// <summary>
		/// Saves a list of regions to a file. ALL EXISTING DATA WILL BE REPLACED
		/// </summary>
		/// <param name="pRegions">The list of all Regions</param>
		public void SaveAllRegions(List<Region> pRegions) {
			lock (this.lockObject) {
				FileInfo file = this.GetFile(true);
				String json = null;
				try {
					json = JsonSerializer.Serialize(pRegions);
				} catch (Exception ex) {
					Logger.Log($"RegionsDataConnector: Error when trying to serialize Object. Exception: {ex.Message}", LogLevels.WARNING);
					throw;
				}
				if (json != null) {
					File.WriteAllText(file.FullName, json);
				}
			}
		}

		/// <summary>
		/// Deletes a Region from the file
		/// </summary>
		/// <param name="pRegionID">The id of the region, not null</param>
		public void DeleteRegion(Int32 pRegionID) {
			lock (this.lockObject) {
				List<Region> allRegions = this.ReadRegions();
				allRegions.RemoveAll(p => p.ID == pRegionID);
				this.SaveAllRegions(allRegions);
			}
		}

		#endregion

		#region private methods		

		/// <summary>
		/// Gets the FileInfo for all regions, creating the file if it does not exist and pCreateIfMissing is true
		/// </summary>
		protected FileInfo GetFile(Boolean pCreateIfMissing) {
			string path = Path.Combine(this.helper.GetDataPath(DATASOURCENAME, pCreateIfMissing), CHECKLISTSFILENAME);
			FileInfo result = new FileInfo(path);
			if (!result.Exists && pCreateIfMissing) {
				result.Create().Close();
			}
			return result;
		}

		#endregion

	}
}