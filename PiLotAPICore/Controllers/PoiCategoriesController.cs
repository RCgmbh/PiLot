using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;

using PiLot.API.ActionFilters;
using PiLot.API.Helpers;
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
			return DataConnectionHelper.PoiDataConnector.ReadPoiCategories();
		}

		/// <summary>
		/// Saves a poiCategory on the server
		/// </summary>
		/// <returns>The ID of the category</returns>
		[HttpPut]
		[Route(Program.APIROOT + "[controller]")]
		[ServiceFilter(typeof(WriteAuthorizationFilter))]
		public Int32 PutCategory(PoiCategory category) {
			Logger.Log("PoisController.PutCategory", LogLevels.DEBUG);
			return DataConnectionHelper.PoiDataConnector.SavePoiCategory(category);
		}

		/// <summary>
		/// Deletes a poiCategory on the server. A category can only be deleted if there
		/// are no pois assigned to this category, and it is not referenced as parent
		/// category of any other category.
		/// </summary>
		[HttpDelete]
		[Route(Program.APIROOT + "[controller]/{categoryId}")]
		[ServiceFilter(typeof(WriteAuthorizationFilter))]
		public ActionResult DeleteCategory(Int32 categoryId) {
			Logger.Log("PoisController.DeleteCategory", LogLevels.DEBUG);
			Boolean result = DataConnectionHelper.PoiDataConnector.DeletePoiCategory(categoryId);
			if(result) {
				return this.Ok();
			} else {
				return this.BadRequest("The poi category is in use");
			}
		}
	}
}
