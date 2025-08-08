using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;

using PiLot.API.ActionFilters;
using PiLot.Config;
using PiLot.Data.Files;
using PiLot.Model.Tools;

namespace PiLot.API.Controllers {

	[ApiController]
	public class ChecklistsController : ControllerBase {

		/// <summary>
		/// Returns all available checklists
		/// </summary>
		[Route(Program.APIROOT + "[controller]")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public List<Checklist> Get() {
			return new ChecklistDataConnector().ReadChecklists();
		}

		[Route(Program.APIROOT + "[controller]/{id}/checked")]
		[HttpPut]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public ActionResult PutChecked(Int32 id, Int32 index, Boolean isChecked) {
			ActionResult result;
			ChecklistDataConnector connector = new ChecklistDataConnector();
			Checklist checklist = connector.ReadChecklist(id);
			if (checklist != null) {
				if (checklist.Items.Length > index) {
					checklist.Items[index].Checked = isChecked;
					connector.SaveChecklist(checklist);
					result = this.Ok();
				} else {
					result = this.StatusCode(StatusCodes.Status400BadRequest, "Invalid index for checklist item");
				}
			} else {
				result = this.NotFound();
			}
			return result;
		}

		[Route(Program.APIROOT + "[controller]/{id}")]
		[HttpDelete]
		[ServiceFilter(typeof(WriteAuthorizationFilter))]
		public void DeleteChecklist(Int32 id) {
			new ChecklistDataConnector().DeleteChecklist(id);
		}
		
	}
}
