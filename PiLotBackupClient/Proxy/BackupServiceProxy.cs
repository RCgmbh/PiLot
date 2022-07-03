using System;
using System.Threading.Tasks;
using System.Text.Json;

using PiLot.Model.Nav;
using PiLot.Model.Logbook;
using PiLot.APIProxy;
using PiLot.Utils;
using PiLot.Utils.DateAndTime;

namespace PiLot.Backup.Client.Proxies {

	/// <summary>
	/// This class can be used as proxy to invoke the functionality
	/// of the BackupService REST API
	/// </summary>
	public class BackupServiceProxy {

		PiLotHttpClient httpClient = null;
		String apiUrl = null;

		public BackupServiceProxy(String pTargetApiUrl, String pUsername, String pPassword) {
			LoginHelper loginHelper = new LoginHelper(pTargetApiUrl, pUsername, pPassword);
			this.apiUrl = $"{pTargetApiUrl}/pilotbackupapi/v1";
			this.httpClient = new PiLotHttpClient(loginHelper);
		}

		/// <summary>
		/// Sends the gps records for one day to the server, and returns the number
		/// of records that have been saved (which should actually be the Length
		/// of pRecords)
		/// </summary>
		/// <param name="pDate">The day. All records must be from that day</param>
		/// <param name="pTrack">The track of the day</param>
		/// <param name="pBackupTime">The timestamp of the current backup set</param>
		/// <returns>True, if the call was successful, else false</returns>
		public async Task<Boolean> BackupDailyTrackAsync(Date pDate, Track pTrack, DateTime pBackupTime) {
			Assert.IsNotNull(pTrack, "pTrack must not be null");
			String url = $"{this.apiUrl}/DailyTracks/{pDate.Year}/{pDate.Month}/{pDate.Day}?backupTime={DateTimeHelper.ToUnixTime(pBackupTime)}";
			String jsonString = JsonSerializer.Serialize(pTrack.GpsRecords);
			return await this.httpClient.PutAsync(jsonString, url);
		}

		/// <summary>
		/// Sends a LogbookDay the server to be backed up
		/// </summary>
		/// <param name="pLogbookDay">The LogbookDay to backup</param>
		/// <param name="pBackupTime">The time of the current backup</param>
		/// <returns>True, if the call was successful, else false<</returns>
		public async Task<Boolean> BackupLogbookDayAsync(LogbookDay pLogbookDay, DateTime pBackupTime) {
			Assert.IsNotNull(pLogbookDay, "pLogbookDay must not be null");
			String url = $"{this.apiUrl}/Logbook?backupTime={DateTimeHelper.ToUnixTime(pBackupTime)}";
			String jsonString = JsonSerializer.Serialize(pLogbookDay);
			return await this.httpClient.PutAsync(jsonString, url);
		}

		/// <summary>
		/// Sends a Route the server to be backed up
		/// </summary>
		/// <param name="pRoute">The Route to backup</param>
		/// <param name="pBackupTime">The time of the current backup</param>
		/// <returns>True, if the call was successful, else false</returns>
		public async Task<Boolean> BackupRouteAsync(Route pRoute, DateTime pBackupTime) {
			Assert.IsNotNull(pRoute, "pRoute must not be null");
			String url = $"{this.apiUrl}/Routes/{pRoute.RouteID}/?backupTime={DateTimeHelper.ToUnixTime(pBackupTime)}";
			String jsonString = JsonSerializer.Serialize(pRoute);
			return await this.httpClient.PutAsync(jsonString, url);
		}

		/// <summary>
		/// Sends the commit command to the backup api, which persist the data
		/// on the server
		/// </summary>
		/// <param name="pBackupTime">The time of the current backup</param>
		/// <returns>True, if success</returns>
		public async Task<Boolean> CommitAsync(DateTime pBackupTime) {
			String url = $"{this.apiUrl}/Backup/commit?backupTime={DateTimeHelper.ToUnixTime(pBackupTime)}";
			return await this.httpClient.PutAsync(String.Empty, url);
		}

		/// <summary>
		/// This just checks whether the API is accessible
		/// </summary>
		public async Task<Boolean> PingAsync() {
			String url = $"{this.apiUrl}/Ping";
			ProxyResult<String> proxyResult = await this.httpClient.GetAsync<String>(url);
			if (proxyResult.Success) {
				Out.WriteDebug("Ping to {0} succeeded", this.apiUrl);
			} else {
				Out.WriteInfo("Ping to {0} failed with Status message {1}", this.apiUrl, proxyResult.Message);
			}
			return proxyResult.Success;
		}
	}
}
