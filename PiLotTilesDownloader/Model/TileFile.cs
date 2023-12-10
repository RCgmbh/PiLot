using System.IO;

using PiLot.Model.Tiles;

namespace PiLot.TilesDownloader.Model {
	
	internal class TileFile {

		internal TileFile(TileInfo pTile, FileInfo pFile) {
			this.Tile = pTile;
			this.File = pFile;
		}

		internal TileInfo Tile { get; set; }

		internal FileInfo File { get; set; }

	}
}
