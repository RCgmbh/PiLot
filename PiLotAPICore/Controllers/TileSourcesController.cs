using Microsoft.AspNetCore.Mvc;

using PiLot.API.ActionFilters;
using PiLot.Data.Files;
using PiLot.Model.Tiles;

namespace PiLot.API.Controllers {

	/// <summary>
	/// Controller that delivers information about TileSources (where
	/// to get and where to store map tiles)
	/// </summary>
	[ApiController]
	public class TileSourcesController : ControllerBase {

		/// <summary>
		/// GET: api/v1/Tiles/ReloadConfig
		/// Helper which forces a reload of the TileSources
		/// </summary>
		/// <returns>OK</returns>
		[Route("api/v1/TileSources/ReloadConfig")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public ActionResult GetReloadConfig() {
			TileDataConnector.ReloadConfig();
			return this.Ok();
		}

		/// <summary>
		/// Returns a full list with all configured TileSources
		/// </summary>
		/// <returns>An array of TileSets</returns>
		[Route("api/v1/TileSources")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public TileSource[] Get() {
			return TileDataConnector.Instance.GetAllTileSources();
		}
	}
}