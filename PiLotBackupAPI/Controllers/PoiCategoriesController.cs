﻿using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using PiLot.Backup.API.ActionFilters;
using PiLot.Backup.API.Helpers;
using PiLot.Model.Nav;
using PiLot.Model.Users;
using PiLot.Utils.DateAndTime;

namespace PiLot.Backup.API.Controllers {

	[ApiController]
	public class PoiCategoriesController : ControllerBase {

		/// <summary>
		/// Accepts puts with the list of all poi categories, which will be all saved into one single file
		/// </summary>
		/// <param name="poiCategories">The list of poi categories</param>
		/// <param name="backupTime">The unix timestamp for the backup set to create/use</param>
		[Route(Program.APIROOT + "[controller]")]
		[HttpPut]
		[ServiceFilter(typeof(BackupAuthorizationFilter))]
		public ActionResult Put(List<PoiCategory> poiCategories, Int32 backupTime) {
			ActionResult result;
			Object userObj = this.HttpContext.Items["user"];
			if(userObj != null) {
				User user = (User)userObj;
				try {
					BackupHelper.BackupPoiCategories(poiCategories, user.Username, DateTimeHelper.FromUnixTime(backupTime));
					result = this.Ok();
				} catch (Exception ex) {
					result = this.StatusCode(StatusCodes.Status500InternalServerError, ex.Message);
				}
			} else {
				result = this.Unauthorized();
			}
			return result;
		}
	}
}
