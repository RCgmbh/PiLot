using System;
using Microsoft.AspNetCore.Mvc;

namespace PiLot.Backup.API.Controllers {

	/// <summary>
	/// Simple controller just sending an "OK", used to test
	/// if the api is up and running
	/// </summary>
	[Route(Program.APIROOT + "[controller]")]
	[ApiController]
	public class PingController : ControllerBase {

		// GET: pilotbackupapi/v1/Ping
		[HttpGet]
		public String Get() {
			return "OK";
		}
	}
}
