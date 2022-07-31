using Microsoft.AspNetCore.Mvc;

using PiLot.API.ActionFilters;
using PiLot.Config;
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
		[Route(Program.APIROOT + "[controller]/ReloadConfig")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public ActionResult GetReloadConfig() {
			TilesConfigReader.ReloadConfig();
			return this.Ok();
		}

		/// <summary>
		/// Returns a full list with all configured TileSources
		/// </summary>
		/// <returns>An array of TileSets</returns>
		[Route(Program.APIROOT + "[controller]")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public TileSource[] Get() {
			return TilesConfigReader.Instance.GetAllTileSources();
		}
	}
}