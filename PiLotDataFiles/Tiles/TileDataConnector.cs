using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;

using PiLot.Model.Tiles;
using PiLot.Utils.Logger;

namespace PiLot.Data.Files {

	/// <summary>
	/// Helper for read / save operations with Tiles and TileSources. We use a singleton
	/// pattern in order to minimize read/write effort to read configs.
	/// </summary>
	public class TileDataConnector {

		public const String DATADIR = "tiles";
		public const String FILENAME = "tileSources.json";

		private Dictionary<String, TileSource> tileSources = null;
		private Object lockObject = new Object();
		private static TileDataConnector instance = null;

		private DataHelper dataHelper = null;

		public enum SaveResults { Ok, Failed, UnknownTileSet, RemoteOnlyTileSet };

		#region constructors

		/// <summary>
		/// Default constructor, only privately accessible, so use the static Instance
		/// </summary>
		private TileDataConnector() {
			this.dataHelper = new DataHelper();
			this.ReadTileSources();
		}

		/// <summary>
		/// Returns the current instance of the TileHelper, implementing the singleton pattern
		/// </summary>
		public static TileDataConnector Instance {
			get {
				if (TileDataConnector.instance == null) {
					TileDataConnector.instance = new TileDataConnector();
				}
				return TileDataConnector.instance;
			}
		}

		#endregion

		#region public methods

		/// <summary>
		/// returns an array of all TileSets
		/// </summary>
		/// <returns></returns>
		public TileSource[] GetAllTileSources() {
			return this.tileSources.Values.ToArray();
		}


		/// <summary>
		/// Reloads the TileSets config
		/// </summary>
		public static void ReloadConfig() {
			TileDataConnector.Instance.ReadTileSources();
			Logger.Log("TileHelper: Reloading Config", LogLevels.INFO);
		}

		/// <summary>
		/// Saves a tile to disk, if the TileSet is valid and has a LocalPath
		/// </summary>
		/// <param name="pImageBytes">The Image Bytes, not null or empty</param>
		/// <param name="pTileSourceName">The name of the TileSet</param>
		/// <param name="pZ">The zoom factor</param>
		/// <param name="pX">The tiles X-Coordinate</param>
		/// <param name="pY">The tiles Y-Coordinate</param>
		/// <returns></returns>
		public SaveResults SaveTile(Byte[] pImageBytes, String pTileSourceName, Int32 pZ, Int32 pX, Int32 pY) {
			SaveResults result;
			TileSource tileSource = null;
			if ((pImageBytes != null) && (pImageBytes.Length > 0)) {
				if (this.tileSources.TryGetValue(pTileSourceName, out tileSource)) {
					String savePath = this.GetLocalTilePath(tileSource, pZ, pX, pY);
					if (!String.IsNullOrEmpty(savePath)) {
						try {
							this.EnsureTileDirectory(savePath);
							result = SaveResults.Ok;
							File.WriteAllBytes(savePath, pImageBytes);
						} catch (Exception ex) {
							Logger.Log("Error when trying to save tile to tileSource {0}: {1}", ex.Message, pTileSourceName, LogLevels.ERROR);
							result = SaveResults.Failed;
						}
					} else {
						result = SaveResults.RemoteOnlyTileSet;
					}
				} else {
					result = SaveResults.UnknownTileSet;
				}
			} else {
				Logger.Log("pImageBytes was null or empty in SaveTiles", LogLevels.ERROR);
				result = SaveResults.Failed;

			}
			return result;
		}

		#endregion

		#region private methods

		/// <summary>
		/// Gets the absolute local path for a certain tile file
		/// </summary>
		private String GetLocalTilePath(TileSource pTileSource, Int32 pZ, Int32 pX, Int32 pY) {
			return String.Format(pTileSource.LocalPath, pZ, pX, pY);
		}

		/// <summary>
		/// Makes sure a certain directory exists
		/// </summary>
		/// <param name="pPath"></param>
		private void EnsureTileDirectory(String pPath) {
			lock (this.lockObject) {
				FileInfo fileInfo = new FileInfo(pPath);
				String directoryName = fileInfo.DirectoryName;
				if (!Directory.Exists(directoryName)) {
					Directory.CreateDirectory(directoryName);
				}
			}
		}

		/// <summary>
		/// Reads the tileSources configs from the tileSources.json in App_Data
		/// </summary>
		private void ReadTileSources() {
			this.tileSources = new Dictionary<string, TileSource>();
			List<TileSource> tileSourcesList = null;
			String configPath = Path.Combine(this.dataHelper.GetDataPath(DATADIR), FILENAME);
			Logger.Log("ConfigPath is {0}", configPath, LogLevels.DEBUG);
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
