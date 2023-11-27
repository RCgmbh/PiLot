using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using PiLot.Config;
using PiLot.Data.Files;
using PiLot.Model.Tiles;

namespace PiLot.API.Controllers {

	/// <summary>
	/// Controller for Tiles, currently only used to save Tiles to the Server (PUT)
	/// </summary>
	[ApiController]
	public class TilesController : ControllerBase {

		/// <summary>
		/// PUT:  api/Tiles/tileSourceName/z/x/y
		/// Saves a tile onto the server
		/// </summary>
		[Route(Program.APIROOT + "[controller]/{tileSource}/{z}/{x}/{y}")]
		[HttpPut]
		public async Task<ActionResult> Put(String tileSource, Int32 z, Int32 x, Int32 y) {
			TileDataConnector.SaveResults saveResult;
			TileSource knownTileSource = TilesConfigReader.Instance.GetTileSource(tileSource);
			if (knownTileSource != null) {
				Byte[] bytes = await new PiLot.Utils.Various.BytesHelper().ReadBytes(this.Request.Body, this.Request.ContentLength.Value);
				if(bytes.Length > 0) {
					saveResult = TileDataConnector.Instance.SaveTile(bytes, knownTileSource, z, x, y);
				} else {
					saveResult = TileDataConnector.SaveResults.Failed;
				}
			} else {
				saveResult = TileDataConnector.SaveResults.UnknownTileSet;
			}			
			switch (saveResult) {
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
