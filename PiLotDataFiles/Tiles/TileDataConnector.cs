using System;
using System.IO;

using PiLot.Model.Tiles;
using PiLot.Utils.Logger;

namespace PiLot.Data.Files {

	/// <summary>
	/// Helper for read / save operations with Tiles. We use a singleton
	/// pattern in order to have a proper lock mechanism for creating the
	/// missing tiles directories.
	/// </summary>
	public class TileDataConnector {

		private Object lockObject = new Object();
		private static TileDataConnector instance = null;

		public enum SaveResults { Ok, Failed, UnknownTileSet, RemoteOnlyTileSet };

		#region constructors

		/// <summary>
		/// Default constructor, only privately accessible, so use the static Instance
		/// </summary>
		private TileDataConnector() { }

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
		/// Saves a tile to disk, if the TileSet is valid and has a LocalPath
		/// </summary>
		/// <param name="pImageBytes">The Image Bytes, not null or empty</param>
		/// <param name="pTileInfo">The tile information</param>
		/// <returns>Info about whether saving was successful</returns>
		public SaveResults SaveTile(Byte[] pImageBytes, TileInfo pTileInfo) {
			return this.SaveTile(pImageBytes, pTileInfo.TileSource, pTileInfo.Zoom, pTileInfo.X, pTileInfo.Y);
		}

		/// <summary>
		/// Saves a tile to disk, if the TileSet is valid and has a LocalPath
		/// </summary>
		/// <param name="pImageBytes">The Image Bytes, not null or empty</param>
		/// <param name="pTileSource">The TileSource to which the tile belongs</param>
		/// <param name="pZ">The zoom factor</param>
		/// <param name="pX">The tiles X-Coordinate</param>
		/// <param name="pY">The tiles Y-Coordinate</param>
		/// <returns>Info about whether saving was successful</returns>
		public SaveResults SaveTile(Byte[] pImageBytes, TileSource pTileSource, Int32 pZ, Int32 pX, Int32 pY) {
			SaveResults result;
			if ((pImageBytes != null) && (pImageBytes.Length > 0)) {
				String savePath = this.GetLocalTilePath(pTileSource, pZ, pX, pY);
				if (!String.IsNullOrEmpty(savePath)) {
					try {
						this.EnsureTileDirectory(savePath);
						result = SaveResults.Ok;
						File.WriteAllBytes(savePath, pImageBytes);
					} catch (Exception ex) {
						Logger.Log("Error when trying to save tile to tileSource {0}: {1}", ex.Message, pTileSource.Name, LogLevels.ERROR);
						result = SaveResults.Failed;
					}
				} else {
					result = SaveResults.RemoteOnlyTileSet;
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

		#endregion

	}
}
