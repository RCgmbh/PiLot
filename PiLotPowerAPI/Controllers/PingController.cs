using System;
using Microsoft.AspNetCore.Mvc;

namespace PiLot.PowerAPI.Controllers {

	/// <summary>
	/// Simple controller just sending an "OK", used to test
	/// if the api is up and running
	/// </summary>
	[Route("powerapi/v1/[controller]")]
	[ApiController]
	public class PingController : ControllerBase {

		// GET: powerapi/v1/Ping
		[HttpGet]
		public String Get() {
			return "OK";
		}
	}
}
