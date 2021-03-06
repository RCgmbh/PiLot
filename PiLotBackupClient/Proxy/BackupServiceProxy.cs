using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Text.Json;

using PiLot.Model.Nav;
using PiLot.Model.Logbook;
using PiLot.APIProxy;
using PiLot.Utils;
using PiLot.Utils.DateAndTime;
using PiLot.Model.Sensors;

namespace PiLot.Backup.Client.Proxies {

	/// <summary>
	/// This class can be used as proxy to invoke the functionality
	/// of the BackupService REST API
	/// </summary>
	public class BackupServiceProxy {

		PiLotHttpClient httpClient = null;
		String apiUrl = null;

		public BackupServiceProxy(String pTargetApiUrl, String pUsername, String pPassword) {
			this.apiUrl = $"{pTargetApiUrl}/pilotbackupapi/v1";
			LoginHelper loginHelper = new LoginHelper(this.apiUrl, pUsername, pPassword);
			this.httpClient = new PiLotHttpClient(loginHelper);
		}

		/// <summary>
		/// Sends the gps records for one day to the server
		/// </summary>
		/// <param name="pTrack">The track of the day</param>
		/// <param name="pBackupTime">The timestamp of the current backup set</param>
		/// <returns>True, if the call was successful, else false</returns>
		public async Task<Boolean> BackupDailyTrackAsync(Track pTrack, DateTime pBackupTime) {
			Assert.IsNotNull(pTrack, "pTrack must not be null");
			String url = $"{this.apiUrl}/Track?backupTime={DateTimeHelper.ToUnixTime(pBackupTime)}";
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
			String url = $"{this.apiUrl}/Routes?backupTime={DateTimeHelper.ToUnixTime(pBackupTime)}";
			String jsonString = JsonSerializer.Serialize(pRoute);
			return await this.httpClient.PutAsync(jsonString, url);
		}

		/// <summary>
		/// Sends sensor data for one sensor and one Day the server to be backed up
		/// </summary>
		/// <param name="pRecords">The list of records</param>
		/// <param name="pSensorName">The sensor name</param>
		/// <param name="pBackupTime">The time of the current backup</param>
		/// <returns>True, if the call was successful, else false</returns>
		public async Task<Boolean> BackupSensorDataAsync(List<SensorDataRecord> pRecords, String pSensorName, DateTime pBackupTime) {
			Assert.IsNotNull(pRecords, "pRecords must not be null");
			String url = $"{this.apiUrl}/Data?sensorName={pSensorName}&backupTime={DateTimeHelper.ToUnixTime(pBackupTime)}";
			String jsonString = JsonSerializer.Serialize(pRecords);
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
