using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;

using PiLot.API.ActionFilters;
using PiLot.Data.Files;
using PiLot.Model.Nav;

namespace PiLot.API.Controllers {

	[ApiController]
	public class RegionsController : ControllerBase {

		/// <summary>
		/// Returns all available regions
		/// </summary>
		[Route(Program.APIROOT + "[controller]")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public List<Region> Get() {
			return RegionDataConnector.GetInstance().ReadRegions();
		}

		/// <summary>
		/// Saves a region
		/// </summary>
		[Route(Program.APIROOT + "[controller]")]
		[HttpPut]
		[ServiceFilter(typeof(WriteAuthorizationFilter))]
		public Int32 Put(Region region) {
			return RegionDataConnector.GetInstance().SaveRegion(region);
		}

		[Route(Program.APIROOT + "[controller]/{id}")]
		[HttpDelete]
		[ServiceFilter(typeof(WriteAuthorizationFilter))]
		public void DeleteRegion(Int32 id) {
			RegionDataConnector.GetInstance().DeleteRegion(id);
		}		
	}
}
