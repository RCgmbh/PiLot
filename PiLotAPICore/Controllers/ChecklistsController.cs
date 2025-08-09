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

		/// <summary>
		/// Saves a checklist
		/// </summary>
		[Route(Program.APIROOT + "[controller]")]
		[HttpPut]
		[ServiceFilter(typeof(WriteAuthorizationFilter))]
		public Int32 Put(Checklist checklist) {
			return new ChecklistDataConnector().SaveChecklist(checklist);
		}

		/// <summary>
		/// Saves the checked state of a single item of a checklist
		/// </summary>
		/// <param name="id">The ID of the checklist</param>
		/// <param name="index">The index of the item</param>
		/// <param name="isChecked">Whether the item is checked or not</param>
		/// <returns></returns>
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
