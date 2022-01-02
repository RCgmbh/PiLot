using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;

using PiLot.API.ActionFilters;
using PiLot.Utils.Logger;
using PiLotModel.System;

namespace PiLot.API.Controllers {

	/// <summary>
	/// Controller for accessing logfiles
	/// </summary>
	[ApiController]
	public class LogFilesController : ControllerBase {

		/// <summary>
		/// Returns one page of Log files, plus the total number of logFiles available. The files
		/// are ordered by fileName in descending order, so that starting at page 0 will return
		/// the latest files
		/// </summary>
		/// <param name="start">The start index, 0 for the first page, n * pageSize for page n</param>
		/// <param name="pageSize">The maximal number of items to return</param>
		[Route("api/v1/LogFiles")]
		[HttpGet]
		[ServiceFilter(typeof(SystemAuthorizationFilter))]
		public LogFilesResponse Get([FromQuery] Int32 start, [FromQuery] Int32 pageSize) {
			DirectoryInfo logDir = new DirectoryInfo(Logger.LogFolderPath);
			FileInfo[] files = (
				from fileInfo in logDir.GetFiles("*.txt")
				orderby fileInfo.Name descending
				select fileInfo
			).ToArray<FileInfo>();
			List<LogFileInfo> logFileInfos = new List<LogFileInfo>();
			for (int i = start; ((i < start + pageSize) && (i < files.Length)); i++) {
				logFileInfos.Add(new LogFileInfo(files[i]));
			}
			return new LogFilesResponse(files.Length, logFileInfos);
		}

		/// <summary>
		/// Gets the content of an individual logFile or 404 if the file does not exist
		/// </summary>
		/// <param name="filename">the filename, without .txt (which would confuse the webserver)</param>
		/// <returns>the content of the file, not html encoded or 404 if no such file exists</returns>
		[Route("api/v1/LogFiles/{filename}")]
		[HttpGet]
		[ServiceFilter(typeof(SystemAuthorizationFilter))]
		public ActionResult Get(String filename) {
			String path = $"{Logger.LogFolderPath}{Path.DirectorySeparatorChar}{filename}.txt";
			if (System.IO.File.Exists(path)) {
				return this.Ok(new { content = System.IO.File.ReadAllText(path) });
			} else {
				return this.NotFound();
			}
		}
	}

	public struct LogFilesResponse {

		public LogFilesResponse(Int32 pTotalItems, List<LogFileInfo> pLogFileInfos) {
			this.TotalItems = pTotalItems;
			this.LogFileInfos = pLogFileInfos;
		}

		[JsonPropertyName("logFiles")]
		public List<LogFileInfo> LogFileInfos { get; set; }

		[JsonPropertyName("totalItems")]
		public Int32 TotalItems { get; set; }

	}

}