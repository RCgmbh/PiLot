using System;
using Microsoft.AspNetCore.Mvc;

using PiLot.API.ActionFilters;
using PiLot.Utils.OS;

namespace PiLot.API.Controllers {

	[ApiController]
	public class ServicesController : ControllerBase {

		/// <summary>
		/// Gets the list of all available services
		/// </summary>
		/// <returns>An arrray, might be empty, but not null</returns>
		[Route(Program.APIROOT + "[controller]")]
		[HttpGet]
		[ServiceFilter(typeof(SystemAuthorizationFilter))]
		public String[] Get() {
			return new ServiceHelper().GetServices();
		}

		/// <summary>
		/// Gets the status of a service
		/// </summary>
		/// <param name="id">The Name of the Service</param>
		/// <returns>a String or null for unknown services</returns>
		[Route(Program.APIROOT + "[controller]/{id}")]
		[HttpGet]
		[ServiceFilter(typeof(SystemAuthorizationFilter))]
		public String Get(String id) {
			return new ServiceHelper().GetServiceStatus(id);
		}

		/// <summary>
		/// Starts a service and returns the status of the service
		/// </summary>
		/// <param name="id">The Name of the Service</param>
		/// <returns>a String or null for unknown services</returns>
		[Route(Program.APIROOT + "[controller]/{id}/start")]
		[HttpPut]
		[ServiceFilter(typeof(SystemAuthorizationFilter))]
		public String PutStart(String id) {
			return new ServiceHelper().StartService(id);
		}

		/// <summary>
		/// Stops a service and returns the status of the service
		/// </summary>
		/// <param name="id">The Name of the Service</param>
		/// <returns>a String or null for unknown services</returns>
		[Route(Program.APIROOT + "[controller]/{id}/stop")]
		[HttpPut]
		[ServiceFilter(typeof(SystemAuthorizationFilter))]
		public String PutStop(String id) {
			return new ServiceHelper().StopService(id);
		}

		/// <summary>
		/// Restarts a service and returns the status of the service
		/// </summary>
		/// <param name="id">The Name of the Service</param>
		/// <returns>a String or null for unknown services</returns>
		[Route(Program.APIROOT + "[controller]/{id}/restart")]
		[HttpPut]
		[ServiceFilter(typeof(SystemAuthorizationFilter))]
		public String PutRestart(String id) {
			return new ServiceHelper().RestartService(id);
		}
	}
}
