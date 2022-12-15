using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Mvc;

using PiLot.API.ActionFilters;
using PiLot.Data.Postgres.Nav;
using PiLot.Model.Nav;
using PiLot.Utils.Logger;

namespace PiLot.API.Controllers {

	/// <summary>
	/// Offers access to points of interest (POIs)
	/// </summary>
	[ApiController]
	public class PoisController : ControllerBase {

		/// <summary>
		/// Gets all pois within a certain area, with a specific category
		/// and a set of features
		/// </summary>
		/// <param name="minLat">Minimal latitude, degrees WGS84</param>
		/// <param name="minLon">Minimal longitude, degrees WGS84</param>
		/// <param name="maxLat">Maximal latitude, degrees WGS84</param>
		/// <param name="maxLon">Maximal lontitude, degrees WGS84</param>
		/// <param name="categories">Array of category ids</param>
		/// <param name="features">Array of feature ids</param>
		[HttpGet]
		[Route(Program.APIROOT + "[controller]")]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public List<Object[]> Get(
			[FromQuery] Double minLat, 
			[FromQuery] Double minLon,
			[FromQuery] Double maxLat,
			[FromQuery] Double maxLon,
			[FromQuery] String categories,
			[FromQuery] String features
		) {
			Logger.Log("PoisController.Get", LogLevels.DEBUG);
			Int32[] categoriesInt;
			Int32[] featuresInt;
			try {
				categoriesInt = this.ParseArray(categories);
				featuresInt = this.ParseArray(features);
			} catch(Exception ex) {
				Logger.Log($"PoisController.Get: Error parsing arrays: categories={categories}, features={features}", LogLevels.ERROR);
				Logger.Log(ex, "PoisController.Get");
				throw;
			}
			return new PoiDataConnector().FindPois(minLat, minLon, maxLat, maxLon, categoriesInt, featuresInt);
		}

		/// <summary>
		/// Gets a poi by its id or null, if there is no such poi
		/// </summary>
		/// <param name="id">The id of the poi</param>
		[HttpGet]
		[Route(Program.APIROOT + "[controller]/{id}")]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public Object[] Get(Int64 id) {
			Logger.Log("PoisController.Get", LogLevels.DEBUG);
			return new PoiDataConnector().ReadPoi(id);
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
