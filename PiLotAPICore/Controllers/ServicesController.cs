using System;
using Microsoft.AspNetCore.Mvc;

using PiLot.API.ActionFilters;
using PiLot.Utils.OS;

namespace PiLot.API.Controllers {

	[ApiController]
	public class ServicesController : ControllerBase {

		/// <summary>
		/// Gets the status of a service
		/// </summary>
		/// <param name="id">The Name of the Service</param>
		/// <returns>a String or null for unknown services</returns>
		[Route("api/v1/Services/{id}")]
		[HttpGet]
		[ServiceFilter(typeof(SystemAuthorizationFilter))]
		public String Get(String id) {
			return new SystemHelper().GetServiceStatus(id);
		}

		/// <summary>
		/// Starts a service and returns the status of the service
		/// </summary>
		/// <param name="id">The Name of the Service</param>
		/// <returns>a String or null for unknown services</returns>
		[Route("api/v1/Services/{id}/start")]
		[HttpPut]
		[ServiceFilter(typeof(SystemAuthorizationFilter))]
		public String PutStart(String id) {
			return new SystemHelper().StartService(id);
		}

		/// <summary>
		/// Stops a service and returns the status of the service
		/// </summary>
		/// <param name="id">The Name of the Service</param>
		/// <returns>a String or null for unknown services</returns>
		[Route("api/v1/Services/{id}/stop")]
		[HttpPut]
		[ServiceFilter(typeof(SystemAuthorizationFilter))]
		public String PutStop(String id) {
			return new SystemHelper().StopService(id);
		}

		/// <summary>
		/// Restarts a service and returns the status of the service
		/// </summary>
		/// <param name="id">The Name of the Service</param>
		/// <returns>a String or null for unknown services</returns>
		[Route("api/v1/Services/{id}/restart")]
		[HttpPut]
		[ServiceFilter(typeof(SystemAuthorizationFilter))]
		public String PutRestart(String id) {
			return new SystemHelper().RestartService(id);
		}
	}
}
