using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;

using PiLot.API.ActionFilters;
using PiLot.API.Helpers;
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
			return DataConnectionHelper.PoiDataConnector.ReadPoiFeatures();
		}

		/// <summary>
		/// Saves a poiFeature on the server
		/// </summary>
		/// <returns>The ID of the feature</returns>
		[HttpPut]
		[Route(Program.APIROOT + "[controller]")]
		[ServiceFilter(typeof(WriteAuthorizationFilter))]
		public Int32 PutFeature(PoiFeature feature) {
			Logger.Log("PoisController.PutFeature", LogLevels.DEBUG);
			return DataConnectionHelper.PoiDataConnector.SavePoiFeature(feature);
		}

		/// <summary>
		/// Deletes a poiFeature from the server. A feature can only be deleted if there
		/// are no pois using it.
		/// </summary>
		[HttpDelete]
		[Route(Program.APIROOT + "[controller]/{featureId}")]
		[ServiceFilter(typeof(WriteAuthorizationFilter))]
		public ActionResult DeleteFeature(Int32 featureId) {
			Logger.Log("PoisController.DeleteFeature", LogLevels.DEBUG);
			Boolean result = DataConnectionHelper.PoiDataConnector.DeletePoiFeature(featureId);
			if (result) {
				return this.Ok();
			} else {
				return this.BadRequest("The poi feature is in use");
			}
		}
	}
}
