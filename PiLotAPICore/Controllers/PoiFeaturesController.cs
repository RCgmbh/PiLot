using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Mvc;

using PiLot.API.ActionFilters;
using PiLot.Data.Postgres.Nav;
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
		[Route(Program.APIROOT + "[controller]/features")]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public List<Object[]> GetFeatures() {
			Logger.Log("PoisController.GetPoiFeatures", LogLevels.DEBUG);
			return new PoiDataConnector().ReadPoiFeatures();
		}

		/// <summary>
		/// Parses a comma separated string into an int array. No error handling included.
		/// </summary>
		/// <param name="pString">comma separated values, e.g. 1, 3, 42</param>
		/// <returns>An array of ints, empty if pString is empty</returns>
		private Int32[] ParseArray(String pString) {
			Int32[] result;
			if (!String.IsNullOrEmpty(pString)) {
				List<String> stringList = new List<String>(pString.Split(','));
				result = stringList.Select(s => Int32.Parse(s.Trim())).ToArray();
			} else {
				result = new Int32[0];
			}
			return result;
		}
	}
}
