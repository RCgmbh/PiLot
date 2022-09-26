using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;

using PiLot.Model.Sensors;
using PiLot.Utils;
using PiLot.Utils.DateAndTime;
using PiLot.Utils.Logger;

namespace PiLot.Data.Files {

	/// <summary>
	/// Class for reading and writing sensor data from and to files
	/// </summary>
	public class SensorDataConnector {

		private DataHelper dataHelper;
		// we use these variable in loops, and save some memory-allocation that way :-)
		private String[] segments;
		private Int32 utc;
		private Int32 boatTime;
		private Double number;

		/// <summary>
		/// Default constructor
		/// </summary>
		public SensorDataConnector() {
			this.dataHelper = new DataHelper();
		}

		/// <summary>
		/// Creates a SensorDataConnector with a specific data root, useful i.e. for Backup
		/// </summary>
		/// <param name="pRootPath"></param>
		public SensorDataConnector(String pRootPath) {
			this.dataHelper = new DataHelper(pRootPath);
		}

		/// <summary>
		/// Appends a dataRecord to the file of the current day. The filename is derived
		/// from the UTC. The file is created, if it does not exist yet.
		/// </summary>
		/// <param name="pData">The sensor data</param>
		/// <param name="pDataSourceName">The data source name, e.g. "temperature1"</param>
		public void SaveData(SensorDataRecord pData, String pDataSourceName) {
			Date utcDay = new Date(DateTimeHelper.FromUnixTime(pData.UTC));
			FileInfo file = this.dataHelper.GetDataFile(pDataSourceName, utcDay, true);
			File.AppendAllLines(file.FullName, new String[] { this.DataToString(pData) });
		}

		/// <summary>
		/// Saves the values for different Sensors, and automatically sets timestamps
		/// based on current server UTC and BoatTime
		/// </summary>
		public void SaveData(SensorValue[] pValues) {
			Int32 utc = DateTimeHelper.UnixNow;
			Int32 boatTimeOffset = new GlobalDataConnector().GetBoatTime().UtcOffsetMinutes * 60;
			Int32 boatTime = utc + boatTimeOffset;
			for (Int32 i = 0; i < pValues.Length; i++) {
				if (pValues[i].Value != null) {
					this.SaveData(new SensorDataRecord(utc, boatTime, pValues[i].Value), pValues[i].SensorName);
				}
			}
		}

		/// <summary>
		/// Saves a set of Data records for one sensor to a file. All records must belong to 
		/// the same day (based on utc).
		/// </summary>
		/// <param name="pData">A list of data records all for the same day, containing utc, boatTime, value</param>
		/// <param name="pDataSourceName">the name of the sensor</param>
		public void SaveDailyData(List<SensorDataRecord> pData, String pDataSourceName) {
			if(pData.Count > 0) {
				Date utcDay = new Date(DateTimeHelper.FromUnixTime(pData[0].UTC));
				Int32 minTimestamp = DateTimeHelper.ToUnixTime(utcDay);
				Int32 maxTimestamp = DateTimeHelper.ToUnixTime(utcDay.AddDays(1));
				Assert.IsFalse(
					pData.Exists(d => (d.UTC < minTimestamp) || (d.UTC > maxTimestamp)),
					$"The sensor data for {pDataSourceName} contains invalid dates for {utcDay}"
				);
				pData.Sort();
				List<String> lines = pData.Select(d => this.DataToString(d)).ToList();
				FileInfo file = this.dataHelper.GetDataFile(pDataSourceName, utcDay, true);
				File.WriteAllLines(file.FullName, lines);
			}			
		}

		/// <summary>
		/// returns the latest entry from a data file, if the value is no older than pMaxSecondsOld,
		/// otherwise it returns null. If the data source does not exist, it returns null too.
		/// </summary>
		/// <param name="pSensorName">the data source name</param>
		/// <param name="pMaxSecondsOld">the maximum age of the data in seconds</param>
		/// <returns>a number or null</returns>
		public SensorDataRecord GetLatestValue(String pSensorName, Int32 pMaxSecondsOld) {
			SensorDataRecord result = null;
			FileInfo dataFile;
			Int32 minTimeUnix = DateTimeHelper.UnixNow - pMaxSecondsOld;        // used to test the values
			Date loopDate = new Date(DateTime.UtcNow);                          // the date used to loop through the files
			Date minDate = new Date(DateTimeHelper.FromUnixTime(minTimeUnix));  // the minimal date to loop to
			String lastLine;
			while ((loopDate >= minDate) && (result == null)) {
				dataFile = this.dataHelper.GetDataFile(pSensorName, (Date)loopDate);
				if (dataFile != null) {
					SensorDataRecord record = null;
					lastLine = File.ReadLines(dataFile.FullName).LastOrDefault();
					if (lastLine != null) {
						record = this.ParseLine(lastLine);
						if (record.UTC >= minTimeUnix) {
							result = record;
						}
					}
					if (record == null) {
						Logger.Log("Invalid content in data file {0}: {1}", dataFile.FullName, lastLine, LogLevels.WARNING);
					}
				}
				loopDate = loopDate.AddDays(-1);
			}
			return result;
		}

		/// <summary>
		/// Returns an aggregated list of Sensor Data which lies between 
		/// </summary>
		/// <param name="pSensorName">The name of the sensor / data source</param>
		/// <param name="pStartTime">start time in seconds from epoc (utc or BoatTime, see pCheckBoatTime)</param>
		/// <param name="pEndTime">end time in seconds from epoc (utc or BoatTime, see pCheckBoatTime)</param>
		/// <param name="pAggregateSeconds">the duration of a cluster for which we aggregate data, in seconds</param>
		/// <param name="pCheckBoatTime">if true, pStarTime and pEndTime are interpreted as BoatTime, otherwise as UTC</param>
		/// <returns></returns>
		public AggregatedSensorData ReadSensorData(String pSensorName, Int32 pStartTime, Int32 pEndTime, Int32 pAggregateSeconds, Boolean pCheckBoatTime) {
			Int32 minTime = pStartTime - pAggregateSeconds / 2;
			Int32 maxTime = pEndTime + pAggregateSeconds / 2;
			DateTime loopDateTime = DateTimeHelper.FromUnixTime(minTime);
			DateTime endDateTime = DateTimeHelper.FromUnixTime(maxTime);
			Func<SensorDataRecord, Int32, Int32, Boolean> boundaryCheck;
			if (pCheckBoatTime) {
				// we need to enlarge the range of files checked, because the files are based on UTC,
				// but we query based on BoatTime, which can differ up to +/-12 h 
				loopDateTime = loopDateTime.AddHours(-12);
				endDateTime = endDateTime.AddHours(12);
				boundaryCheck = this.IsInBoatTimeRange;
			} else {
				boundaryCheck = this.IsInUTCRange;
			}
			Date loopDate = (Date)loopDateTime;
			Date endDate = (Date)endDateTime;
			List<SensorDataRecord> rawData = new List<SensorDataRecord>();
			while (loopDate <= endDate) {
				FileInfo file = this.dataHelper.GetDataFile(pSensorName, loopDate);
				foreach (SensorDataRecord aRecord in this.ReadRawData(file)) {
					if (boundaryCheck(aRecord, minTime, maxTime)) {
						rawData.Add(aRecord);
					}
				}
				loopDate = loopDate.AddDays(1);
			}
			return new AggregatedSensorData(rawData, minTime, maxTime, pAggregateSeconds);
		}

		/// <summary>
		/// Reads all data that has been changed after a certain time, by just reading those files
		/// that have a younger changed after value. The result is clustered by date, giving one
		/// list of SensorDataRecords per day.
		/// </summary>
		/// <param name="pSensorName">The name of the sensor</param>
		/// <param name="pChangedAfter">The minimal changed date</param>
		/// <returns></returns>
		public Dictionary<Date, List<SensorDataRecord>> GetChangedDailyData(String pSensorName, DateTime pChangedAfter) {
			Dictionary<Date, List<SensorDataRecord>> result = new Dictionary<Date, List<SensorDataRecord>>();
			string dataPath = this.dataHelper.GetDataPath(pSensorName);
			DirectoryInfo dataDir = new DirectoryInfo(dataPath);
			if (dataDir.Exists) {
				foreach (var aFile in dataDir.EnumerateFiles()) {
					if (aFile.LastWriteTimeUtc > pChangedAfter) {
						Date date = Date.ParseExact(aFile.Name, DataHelper.FILENAMEFORMAT, CultureInfo.InvariantCulture);
						result.Add(date, this.ReadRawData(aFile));
					}
				}
			} else {
				Logger.Log($"SensorDataConnector.GetChangedDailyData: Invalid directory: {dataPath}", LogLevels.WARNING);
			}
			return result;
		}

		/// <summary>
		/// This returns a list of all SensorDataRecords from a specified file, if the file exists.
		/// Otherwise returns an empty list.
		/// </summary>
		/// <param name="pFile">The file containing data. Can be null, which will return an empty list.</param>
		private List<SensorDataRecord> ReadRawData(FileInfo pFile) {
			List<SensorDataRecord> result = new List<SensorDataRecord>();
			if ((pFile != null) && pFile.Exists) {
				try {
					foreach (String aLine in File.ReadLines(pFile.FullName)) {
						SensorDataRecord record = this.ParseLine(aLine);
						if (record != null) {
							result.Add(record);
						}
						if (record == null) {
							Logger.Log($"Invalid content in data file {pFile.FullName}: {aLine}", LogLevels.WARNING);
						}
					}
				} catch (Exception ex) {
					Logger.Log(ex, "SensorDataConnector.ReadFileData");
				}
			}
			return result;
		}

		/// <summary>
		/// Function which checks whether the UTC of a record is between pMinTime and pMaxTime,
		/// which are both interpreted as seconds from epoc UTC
		/// </summary>
		/// <param name="pRecord">The record to check</param>
		/// <param name="pMinTime">the min utc in seconds from epoc</param>
		/// <param name="pMaxTime">the max utc in seconds from epoc</param>
		private Boolean IsInUTCRange(SensorDataRecord pRecord, Int32 pMinTime, Int32 pMaxTime) {
			return pRecord.UTC >= pMinTime && pRecord.UTC <= pMaxTime;
		}

		/// <summary>
		/// Function which checks whether the BoatTime of a record is between pMinTime and pMaxTime,
		/// which are both interpreted as seconds from epoc BoatTime
		/// </summary>
		/// <param name="pRecord">The record to check</param>
		/// <param name="pMinTime">the min seconds from epoc in BoatTime </param>
		/// <param name="pMaxTime">the max seconds from epoc in BoatTime </param>

		private Boolean IsInBoatTimeRange(SensorDataRecord pRecord, Int32 pMinTime, Int32 pMaxTime) {
			return pRecord.BoatTime >= pMinTime && pRecord.BoatTime <= pMaxTime;
		}

		/// <summary>
		/// Returns the median number of a list of doubles or null, if the list contains
		/// no non-null values
		/// </summary>
		public Double? Median(List<Double?> pData) {
			Double? result = null;
			if (pData != null) {
				List<Double?> nonNullData = pData.FindAll(d => d != null);
				if (nonNullData.Count > 0) {
					nonNullData.Sort();
					if ((nonNullData.Count % 2) == 0) {
						result = (
							  nonNullData[(nonNullData.Count) / 2]
							+ nonNullData[(nonNullData.Count / 2) - 1]
						) / 2;
					} else {
						result = nonNullData[(nonNullData.Count - 1) / 2];
					}
				}
			}
			return result;
		}

		/// <summary>
		/// Takes a line and parses it into a SensorDataRecord
		/// returns null, if the line is null or empty or otherwise invalid
		/// </summary>
		/// <param name="pLine">a string containing ; separated values</param>
		/// <returns>a SensorDataRecord or null</returns>
		private SensorDataRecord ParseLine(String pLine) {
			SensorDataRecord result = null;
			this.segments = pLine.Split(';');
			if (this.segments.Length == 3) {
				if (
					Int32.TryParse(this.segments[0], out this.utc)
					&& Int32.TryParse(this.segments[1], out this.boatTime)
					&& Double.TryParse(this.segments[2], out this.number)
				) {
					result = new SensorDataRecord(this.utc, this.boatTime, this.number);
				}
			}
			return result;
		}

		/// <summary>
		/// Returns a semicolon separated String containing utc, boatTime and value,
		/// the latest with a 2-digit precision.
		/// </summary>
		/// <param name="pData">a Tuple with utc, boatTime, value</param>
		/// <returns>a semicolon separated String</returns>
		private String DataToString(SensorDataRecord pData) {
			return String.Format("{0:F0};{1:F0};{2:F2}", pData.UTC, pData.BoatTime, pData.Value);
		}
	}
}
