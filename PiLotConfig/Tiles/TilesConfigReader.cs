﻿using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;

using PiLot.Model.Tiles;
using PiLot.Utils.Logger;

namespace PiLot.Config {

	/// <summary>
	/// Helper for readind TileSources. We use a singleton
	/// pattern in order to minimize read/write effort to read configs.
	/// </summary>
	public class TilesConfigReader {

		public const String CONFIGFILENAME = "tileSources.json";

		private Dictionary<String, TileSource> tileSources = null;
		private static TilesConfigReader instance = null;

		#region constructors

		/// <summary>
		/// Default constructor, only privately accessible, so use the static Instance
		/// </summary>
		private TilesConfigReader() {
			this.ReadTileSources();
		}

		/// <summary>
		/// Returns the current instance of the TileHelper, implementing the singleton pattern
		/// </summary>
		public static TilesConfigReader Instance {
			get {
				if (TilesConfigReader.instance == null) {
					TilesConfigReader.instance = new TilesConfigReader();
				}
				return TilesConfigReader.instance;
			}
		}

		#endregion

		#region public methods

		/// <summary>
		/// returns an array of all TileSources (cached, call ReloadConfig if needed)
		/// </summary>
		/// <returns>All tileSources from cache</returns>
		public TileSource[] GetAllTileSources() {
			return this.tileSources.Values.ToArray();
		}

		/// <summary>
		/// Returns a certain tileSource from the cached list of all known tileSources
		/// or null, if there is no such TileSource.
		/// </summary>
		/// <returns>The TileSource with Name = pName or null</returns>
		public TileSource GetTileSource(String pName) {
			TileSource result = null;
			this.tileSources.TryGetValue(pName, out result);
			return result;
		}

		/// <summary>
		/// Reloads the TileSets config
		/// </summary>
		public static void ReloadConfig() {
			TilesConfigReader.Instance.ReadTileSources();
			Logger.Log("TileHelper: Reloading Config", LogLevels.INFO);
		}

		#endregion

		#region private methods

		/// <summary>
		/// Reads the tileSources configs from the tileSources.json in App_Data
		/// </summary>
		private void ReadTileSources() {
			this.tileSources = new Dictionary<string, TileSource>();
			List<TileSource> tileSourcesList = null;
			String configRoot = ConfigHelper.GetConfigDirectory();
			String configPath = Path.Combine(configRoot, CONFIGFILENAME);
			Logger.Log("TileSources configPath is {0}", configPath, LogLevels.DEBUG);
			if (File.Exists(configPath)) {
				try {
					String fileContent = null;
					fileContent = File.ReadAllText(configPath);
					tileSourcesList = JsonSerializer.Deserialize<List<TileSource>>(fileContent);
				} catch (Exception ex) {
					Logger.Log("Error reading config: {0}", ex.Message, LogLevels.ERROR);
				}
			}
			if (tileSourcesList != null) {
				foreach (TileSource aTileSource in tileSourcesList) {
					this.tileSources.Add(aTileSource.Name, aTileSource);
				}
			}
		}

		#endregion

	}
}
