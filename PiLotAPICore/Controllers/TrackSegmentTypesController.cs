using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;

using PiLot.API.ActionFilters;
using PiLot.API.Helpers;
using PiLot.Data.Nav;
using PiLot.Model.Nav;

namespace PiLot.API.Controllers {

	/// <summary>
	/// Offers access to read and modify Track segment types
	/// </summary>
	[ApiController]
	public class TrackSegmentTypesController : ControllerBase {

		/// <summary>
		/// Reads all track segment types
		/// </summary>
		[Route(Program.APIROOT + "[controller]")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public List<TrackSegmentType> Get() {
			ITrackDataConnector dataConnector = DataConnectionHelper.TrackDataConnector;
			if (dataConnector.SupportsStatistics) {
				return dataConnector.ReadTrackSegmentTypes();
			} else {
				return new List<TrackSegmentType>(0);
			}			
		}

		/// <summary>
		/// Sends a TrackSegmentType to the server. It will either be inserted or updated.
		/// </summary>
		/// <returns>The id of the trackSegmentType</returns>
		[Route(Program.APIROOT + "[controller]")]
		[HttpPut]
		[ServiceFilter(typeof(WriteAuthorizationFilter))]
		public Int32 Put(TrackSegmentType pTrackSegmentType) {
			throw new NotImplementedException();
		}

		/// <summary>
		/// Deletes a TrackSegmentType
		/// </summary>
		/// <param name="id">The id of the element to delete</param>
		[Route(Program.APIROOT + "[controller]/{id}")]
		[HttpDelete]
		[ServiceFilter(typeof(WriteAuthorizationFilter))]
		public void DeleteTrackPoints(Int32 id) {
			throw new NotImplementedException();
		}
	}
}
