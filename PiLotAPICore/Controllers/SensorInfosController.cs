using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;

using PiLot.API.ActionFilters;
using PiLot.Data.Files;
using PiLot.Model.Sensors;

namespace PiLot.API.Controllers {

	/// <summary>
	/// A controller to get information about the different available DataSources.
	/// </summary>
	[ApiController]
	public class SensorInfosController : ControllerBase {

		/// <summary>
		/// Gets a list of all SensorInfos having a certain tag
		/// </summary>
		[Route("api/v1/SensorInfos/{tag}")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public List<SensorInfo> Get(String tag) {
			return new SensorInfoConnector().ReadSensorInfos(tag);
		}

		/// <summary>
		/// Gets a list of all SensorInfos
		/// </summary>
		[Route("api/v1/SensorInfos")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public List<SensorInfo> Get() {
			return new SensorInfoConnector().ReadSensorInfos();
		}

	}
}
