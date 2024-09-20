using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;

using PiLot.API.ActionFilters;
using PiLot.API.Helpers;
using PiLot.Data.Nav;
using PiLot.Model.Nav;

namespace PiLot.API.Controllers {

	/// <summary>
	/// Offers access to read Track segments (for the segments a one specific track,
	/// please use the Tracks controller)
	/// </summary>
	[ApiController]
	public class TrackSegmentsController : ControllerBase {

		/// <summary>
		/// Finds track segments based on the type, the boats and optionally a timeframe.
		/// </summary>
		/// <param name="typeId">The id of the segment type to load</param>
		/// <param name="start">Optional start time in milliseconds</param>
		/// <param name="end">Optional end time in milliseconds</param>
		/// <param name="isBoatTime">Whether start and end are BoatTime or UTC</param>
		/// <param name="boats">A list of boat names</param>
		/// <param name="pageSize">The maximal number of results to return</param>
		[Route(Program.APIROOT + "[controller]")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public List<TrackSegment> FindTrackSegments(Int32 typeId, Int64? start, Int64? end, Boolean isBoatTime, String boats, Int32 pageSize) {
			ITrackDataConnector dataConnector = DataConnectionHelper.TrackDataConnector;
			if (dataConnector.SupportsStatistics) {
				return dataConnector.FindTrackSegments(typeId, start, end, isBoatTime, boats.Split(','), pageSize);
			} else {
				return new List<TrackSegment>(0);
			}			
		}
	}
}
