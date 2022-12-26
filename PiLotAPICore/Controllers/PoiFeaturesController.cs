using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;

using PiLot.API.ActionFilters;
using PiLot.Data.Postgres.Nav;
using PiLot.Model.Nav;
using PiLot.Utils.Logger;

namespace PiLot.API.Controllers {

	/// <summary>
	/// Offers access to POI features
	/// </summary>
	[ApiController]
	public class PoiFeaturesController : ControllerBase {

		

		/// <summary>
		/// Gets the list of all poi features, having id and title
		/// </summary>
		[HttpGet]
		[Route(Program.APIROOT + "[controller]")]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public List<PoiFeature> GetFeatures() {
			Logger.Log("PoisController.GetPoiFeatures", LogLevels.DEBUG);
			return new PoiDataConnector().ReadPoiFeatures();
		}
	}
}
