using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;

using PiLot.Model.Logbook;


namespace PiLot.APIProxy {

	/// <summary>
	/// Proxy class for easy access to the /Logbook REST API
	/// </summary>
	public class LogbookProxy {

		private const String CONTROLLERURL = "/Logbook";

		private PiLotHttpClient httpClient;
		private String apiControllerUrl;

		/// <summary>
		/// Creates a new LogbookProxy instance, which can be used to 
		/// read data from and send data to the Logbook API
		/// </summary>
		/// <param name="pApiUrl">The API Root url, such as http://localhost/pilotapi/api/v1, without ending /</param>
		/// <param name="pLoginHelper">Pass the one and only LoginHelper within the application, or null</param>
		public LogbookProxy(String pApiUrl, LoginHelper pLoginHelper) {
			this.apiControllerUrl = pApiUrl + CONTROLLERURL;
			this.httpClient = new PiLotHttpClient(pLoginHelper);
		}

		/// <summary>
		/// This takes a LogbookDay and saves it to the api.
		/// </summary>
		/// <param name="pLogbookDay">LogbookDay to save</param>
		/// <returns>true, if the operation succeeded</returns>
		public async Task<Boolean> PutLogbookDayAsync(LogbookDay pLogbookDay) {
			String jsonString = JsonSerializer.Serialize(pLogbookDay);
			return await this.httpClient.PutAsync(jsonString, this.apiControllerUrl);
		}

		/// <summary>
		/// Reads the LogbookDay for the current date based on BoatTime
		/// </summary>
		/// <returns>The LogbookDay or null</returns>
		public async Task<ProxyResult<LogbookDay>> GetTodayLogbookDayAsync() {
			return await this.GetLogbookDayAsync("/today");
		}

		/// <summary>
		/// Reads the LogbookDay for a certain date
		/// </summary>
		/// <param name="pDate">The date for which we want the LogbookDay</param>
		/// <returns>The LogbookDay or null</returns>
		public async Task<ProxyResult<LogbookDay>> GetLogbookDayAsync(Date pDate) {
			return await this.GetLogbookDayAsync($"/{pDate.Year}/{pDate.Month}/{pDate.Day}");
		}

		/// <summary>
		/// Puts a diary Text to the api. Allows to decide whether any existing text
		/// should be replaced, or the new text just appended
		/// </summary>
		/// <param name="pText">The diary Text</param>
		/// <param name="pDate">The day</param>
		/// <param name="pAppendText">If false, existing text will be deleted.</param>
		public async Task<Boolean> PutDiaryTextAsync(String pText, Model.Common.Date pDate, Boolean pAppendText) {
			DiaryText text = new DiaryText(pText);
			String jsonString = JsonSerializer.Serialize(text);
			String url = $"{this.apiControllerUrl}/diary/{pDate.Year}/{pDate.Month}/{pDate.Day}?appendText={pAppendText}";
			return await this.httpClient.PutAsync(jsonString, url);
		}

		/// <summary>
		/// Puts a list of LogbookEntries to the server, allowing to decide whether all existing
		/// entries should be deleted first.
		/// </summary>
		/// <param name="pEntries">The list of entries, not null</param>
		/// <param name="pDate">The date, must match with the date of the entries (defined by EntryID)</param>
		/// <param name="pDeleteExisting">If true, existing entries will be deleted</param>
		public async Task<Boolean> PutLogbookEntriesAsync(List<LogbookEntry> pEntries, Model.Common.Date pDate, Boolean pDeleteExisting) {
			String jsonString = JsonSerializer.Serialize(pEntries);
			String url = $"{this.apiControllerUrl}/entries/{pDate.Year}/{pDate.Month}/{pDate.Day}?deleteExisting={pDeleteExisting}";
			return await this.httpClient.PutAsync(jsonString, url);
		}

		/// <summary>
		/// Reads a ProxyResult with a LogbookDay, or information about any errors
		/// </summary>
		/// <param name="pControllerPostfix">the part after ../Logbook, including the leading /</param>
		/// <returns>A ProxyResult with LogbookDay</returns>
		private async Task<ProxyResult<LogbookDay>> GetLogbookDayAsync(String pControllerPostfix) {
			return await this.httpClient.GetAsync<LogbookDay>(this.apiControllerUrl + pControllerPostfix);
		}
	}
}
