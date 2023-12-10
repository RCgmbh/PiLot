using System;

namespace PiLot.Model.Tiles {

	public struct TileInfo {

		public TileInfo(TileSource pTileSource, Int32 pZoom, Int32 pX, Int32 pY) {
			this.TileSource = pTileSource;
			this.Zoom = pZoom;
			this.X = pX;
			this.Y = pY;
		}

		public TileSource TileSource { get; set; } 

		public Int32 Zoom { get; set; }

		public Int32 X { get; set; }

		public Int32 Y { get; set; }

	}
}
