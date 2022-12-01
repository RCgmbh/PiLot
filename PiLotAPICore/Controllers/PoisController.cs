using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;

using PiLot.API.ActionFilters;
using PiLot.Data.Postgres.Nav;

namespace PiLot.API.Controllers {

	/// <summary>
	/// Offers access to points of interest (POIs)
	/// </summary>
	[ApiController]
	public class PoisController : ControllerBase {

		/// <summary>
		/// Gets all poins within a certain area
		/// </summary>
		/// <param name="dataSource">the name of the data source.</param>
		/// <param name="startTimeUnix">Seconds from epoc UTC</param>
		/// <param name="endTimeUnix">Seconds from epoc UTC</param>
		/// <param name="aggregateSeconds">The data will be aggregated into chunks summarizing n seconds</param>
		[HttpGet]
		[Route(Program.APIROOT + "[controller]/find")]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public List<List<Object>> Get(
			[FromQuery] Double minLat, 
			[FromQuery] Double minLon,
			[FromQuery] Double maxLat,
			[FromQuery] Double maxLon
		) {
			return new PoiDataConnector().FindPois(minLat, minLon, maxLat, maxLon);
		}
	}
}
