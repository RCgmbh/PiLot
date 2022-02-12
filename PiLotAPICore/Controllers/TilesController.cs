using System;
using System.Buffers;
using System.Linq;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using PiLot.Data.Files;

namespace PiLot.API.Controllers {

	/// <summary>
	/// Controller for Tiles, currently only used to save Tiles to the Server (PUT)
	/// </summary>
	[ApiController]
	public class TilesController : ControllerBase {

		/// <summary>
		/// PUT:  api/Tiles/tileSet/z/x/y
		/// Saves a tile onto the server
		/// Note: bytes ist an Int array, because it did not work with a byte array. Seems
		/// to be some kind of bug/feature with the serializer.
		/// </summary>
		[Route(Program.APIROOT + "[controller]/{tileSource}/{z}/{x}/{y}")]
		[HttpPut]
		public ActionResult Put(String tileSource, Int32 z, Int32 x, Int32 y, [FromBody] Int32[] bytes) {
			Byte[] realBytes = bytes.Select(b => (Byte)b).ToArray();
			TileDataConnector.SaveResults result = TileDataConnector.Instance.SaveTile(realBytes, tileSource, z, x, y);
			switch (result) {
				case TileDataConnector.SaveResults.Ok:
					return this.StatusCode(StatusCodes.Status204NoContent);
				case TileDataConnector.SaveResults.Failed:
					return this.StatusCode(StatusCodes.Status500InternalServerError);
				case TileDataConnector.SaveResults.UnknownTileSet:
					return this.NotFound();
				case TileDataConnector.SaveResults.RemoteOnlyTileSet:
					return this.StatusCode(StatusCodes.Status204NoContent);
				default: return this.StatusCode(StatusCodes.Status204NoContent);
			}
		}
	}
}
