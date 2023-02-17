using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;

using PiLot.API.ActionFilters;
using PiLot.Data.Postgres.Nav;
using PiLot.Model.Nav;
using PiLot.Utils.Logger;

namespace PiLot.API.Controllers {

	/// <summary>
	/// Offers access to POI categories
	/// </summary>
	[ApiController]
	public class PoiCategoriesController : ControllerBase {

		/// <summary>
		/// Gets the list of all poi categories, having id, parent_id and name
		/// </summary>
		[HttpGet]
		[Route(Program.APIROOT + "[controller]")]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public List<PoiCategory> GetCategories( ) {
			Logger.Log("PoisController.GetPoiCategories", LogLevels.DEBUG);
			return new PoiDataConnector().ReadPoiCategories();
		}

		/// <summary>
		/// Saves a poiCategory on the server
		/// </summary>
		/// <returns>The ID of the category</returns>
		[HttpPut]
		[Route(Program.APIROOT + "[controller]")]
		[ServiceFilter(typeof(WriteAuthorizationFilter))]
		public Int32 PutCategory(PoiCategory pCategory) {
			Logger.Log("PoisController.PutCategory", LogLevels.DEBUG);
			return new PoiDataConnector().SavePoiCategory(pCategory);
		}
	}
}
