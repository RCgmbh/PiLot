using System;
using System.Text.Json.Serialization;

namespace PiLot.Model.Tiles {

	/// <summary>
	/// represents a source for Tiles, including information about where to get and
	/// where to story map tiles
	/// </summary>
	public class TileSource {

		public TileSource() { }

		/// <summary>
		/// A unique Name for this TileSource
		/// </summary>
		[JsonPropertyName("name")]
		public String Name { get; set; }

		/// <summary>
		/// The full tile url of the Tile Server, e.g. https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
		/// from wehere we download the tiles.
		/// </summary>
		[JsonPropertyName("onlineUrl")]
		public String OnlineUrl { get; set; }

		/// <summary>
		/// The local url format. This is used to check if a tile already exists, and to be
		/// used in the Leaflet map to create the tile layer.
		/// </summary>
		[JsonPropertyName("localUrl")]
		public String LocalUrl { get; set; }

		/// <summary>
		/// The absolute local path to store tiles
		/// {0} will be replaced by z (zoom)
		/// {1} will be replaced by x
		/// {2} will be replaced by y
		/// </summary>
		[JsonPropertyName("localPath")]
		public String LocalPath { get; set; }

		/// <summary>
		/// The minimal zoom level, usually 1
		/// </summary>
		[JsonPropertyName("minZoom")]
		public Int32 MinZoom { get; set; }

		/// <summary>
		/// The maximal zoom level, usually around 17
		/// </summary>
		[JsonPropertyName("maxZoom")]
		public Int32 MaxZoom { get; set; }

	}
}