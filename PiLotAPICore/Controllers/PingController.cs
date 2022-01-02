using System;
using Microsoft.AspNetCore.Mvc;

namespace PiLotAPI.Controllers {

    /// <summary>
    /// Simple controller just sending an "OK", used to test
    /// if the api is up and running
    /// </summary>
    [Route("api/v1/[controller]")]
    [ApiController]
    public class PingController : ControllerBase {
        
        // GET: api/v1/Ping
        [HttpGet]
        public String Get() {
            return "OK";
        }
    }
}
