using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Text.Json;

using PiLot.Utils.Logger;
using PiLot.Model.Common;

namespace PiLot.Data.Files {

	/// <summary>
	/// Connector that gives access to the data in the app.json file,
	/// where we save application-level settings.
	/// </summary>
	public class GlobalDataConnector {

		/// <summary>
		/// the path to the settings file
		/// </summary>
		private const String SETTINGSDIR = "global";
		private const String SETTINGSFILE = "app.json";

		private const String BOATTIMEKEY = "PiLot.Model.Common.boatTimeOffset";
		private const String BOATCONFIGKEY = "PiLot.Model.Boat.currentBoatConfigName";
		private const String ACTIVEROUTEKEY = "PiLot.Model.Nav.currentRouteId";

		private DataHelper dataHelper = null;

		/// <summary>
		/// Default constructor
		/// </summary>
		public GlobalDataConnector() {
			this.dataHelper = new DataHelper();
		}

		/// <summary>
		/// This returns the settings file for application-wide settings
		/// </summary>
		public FileInfo GetSettingsFile() {
			String path = Path.Combine(this.dataHelper.GetDataRoot(), SETTINGSDIR, SETTINGSFILE);
			FileInfo result = new FileInfo(path);
			if (!result.Exists) {
				throw new Exception("Settings file not found at " + path);
			}
			return result;
		}

		/// <summary>
		/// Persists an application setting into a json file in /data/global
		/// </summary>
		/// <param name="pKey">the key, existing values will be replaced, not null</param>
		/// <param name="pValue">the Value as String</param>
		public void PersistApplicationSetting(String pKey, String pValue) {
			FileInfo settingsFile = this.GetSettingsFile();
			String filePath = settingsFile.FullName;
			Dictionary<String, String> settings = this.ReadPersistedApplicationSettings();
			try {
				settings[pKey] = pValue;
				String content = JsonSerializer.Serialize(settings);
				File.WriteAllText(filePath, content);
			} catch (Exception ex) {
				Logger.Log("Error when trying persist application settings: {0}", ex.Message, LogLevels.ERROR);
			}
		}

		/// <summary>
		/// Tries to read a persisted application setting. Returns null, if no persisted setting was found
		/// </summary>
		public String ReadPersistedApplicationSetting(String pKey) {
			String result = null;
			Dictionary<String, String> settings = this.ReadPersistedApplicationSettings();
			if (settings.ContainsKey(pKey) && (settings[pKey] != null)) {
				result = settings[pKey];
			}
			return result;
		}

		/// <summary>
		/// Gets the current boatTime offset, plus the current utc timestamp
		/// </summary>
		/// <returns>an object {offsetMinutes: object, utcTimestamp: double}</returns>
		public BoatTime GetBoatTime() {
			String offsetMinutes = this.ReadPersistedApplicationSetting(BOATTIMEKEY) ?? "0";
			return new BoatTime(Int32.Parse(offsetMinutes));
		}

		/// <summary>
		/// Saves the current BoatTime offset to the application settings
		/// </summary>
		/// <param name="pUtcOffset">The utc offset in minutes</param>
		public void SetBoatTime(Int32 pUtcOffset) {
			this.PersistApplicationSetting(BOATTIMEKEY, pUtcOffset.ToString());
		}

		/// <summary>
		/// Gets the current route ID or null
		/// </summary>
		/// <returns></returns>
		public Int32? GetActiveRouteId() {
			Int32? result = null;
			String routeIDString = this.ReadPersistedApplicationSetting(ACTIVEROUTEKEY);
			if(Int32.TryParse(routeIDString, out Int32 routeID)){
				result = routeID;
			}
			return result;
		}

		/// <summary>
		/// Sets the Active Route ID, which can be null if no route is active
		/// </summary>
		/// <param name="pRouteId">The ID of the currently active route or null</param>
		public void SetActiveRouteId(Int32? pRouteId) {
			String settingsValue = "";
			if(pRouteId != null) {
				settingsValue = pRouteId.Value.ToString();
			}
			this.PersistApplicationSetting(ACTIVEROUTEKEY, settingsValue);
		}

		/// <summary>
		/// Gets the current Boat Config Name
		/// </summary>
		public String GetCurrentBoatConfigName() {
			return this.ReadPersistedApplicationSetting(BOATCONFIGKEY);
		}

		/// <summary>
		/// Saves the name of the current BoatConfig
		/// </summary>
		public void SetCurrentBoatConfigName(String pName) {
			this.PersistApplicationSetting(BOATCONFIGKEY, pName);
		}

		/// <summary>
		/// Reads the hashtable of persisted settings.
		/// </summary>
		public Dictionary<String, String> ReadPersistedApplicationSettings() {
			FileInfo settingsFile = this.GetSettingsFile();
			String filePath = settingsFile.FullName;
			Dictionary<String, String> result = null;
			try {
				String fileContent = File.ReadAllText(filePath);
				if (!String.IsNullOrEmpty(fileContent)) {
					result = JsonSerializer.Deserialize<Dictionary<String, String>>(fileContent);
				} else {
					result = new Dictionary<String, String>();
				}
			} catch (Exception ex) {
				Logger.Log("Error when trying to load persisted application settings: {0}", ex.Message, LogLevels.ERROR);
			}
			return result;
		}
	}
}