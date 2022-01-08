using System;
using System.Configuration;
using System.Threading.Tasks;
using PiLot.APIProxy;
using PiLot.Model.Nav;
using PiLot.Utils.DateAndTime;

namespace PiLot.GPSDataCreator {

	/// <summary>
	/// Helper Program to generate GPS Data on a test system, so that 
	/// position and movement can be simulated. 
	/// </summary>
	public class Program {

		private static LatLon? position;	// the current position
		private static Double speed = 0;   // m/s
		private static Double course = 0;   // course in degrees from north
		private static Int64 boatTimeOffset = 60 * 60 * 1000; // 1 hours in milliseconds
		private static PositionProxy positionProxy = null;

		public static async Task Main(String[] args) {
			position = await DefineStartPositionAsync();
			Console.WriteLine($"Starting at {position}");
			InitializeProxy();
			MoveAsync();
			WatchKeys();
		}

		/// <summary>
		/// Sets up the proxy uses to save data to the api. Requires the values
		/// for localAPI, username and password being set in app.config.
		/// </summary>
		private static void InitializeProxy() {
			String apiUrl = ConfigurationManager.AppSettings["localAPI"];
			String username = ConfigurationManager.AppSettings["username"];
			String password = ConfigurationManager.AppSettings["password"];
			LoginHelper loginHelper = new LoginHelper(apiUrl, username, password);
			positionProxy = new PositionProxy(apiUrl, loginHelper);
		}

		/// <summary>
		/// Defines the start position by either taking the last position within the
		/// last few days or by manually entering latitude and longitude
		/// </summary>
		/// <returns>A LatLng, not null</returns>
		private async static Task<LatLon> DefineStartPositionAsync() {
			LatLon result = null;
			Console.WriteLine("Loading latest position to continue");
			LatLon startPosition = await LoadLatestPosistionAsync();
			if (startPosition != null) {
				Console.WriteLine($"Last position was lat {startPosition}");
				Console.WriteLine("Press y to use this position");
				if(Console.ReadLine() == "y") {
					result = startPosition;
				}
			}
			if(result == null) {
				Double? lat = null;
				Double? lon = null;
				String? entry;
				Double test;
				while (lat == null) {
					Console.Write("Enter latitude: ");
					entry = Console.ReadLine();
					if(Double.TryParse(entry, out test)) {
						lat = ((test + 90) % 180) - 90;
					} else {
						Console.WriteLine("Invalid latitude");
					}
				}
				while (lon == null) {
					Console.Write("Enter longitude: ");
					entry = Console.ReadLine();
					if (Double.TryParse(entry, out test)) {
						lon = ((test + 180) % 360) - 180;
					} else {
						Console.WriteLine("Invalid latitude");
					}
				}
				result = new LatLon(lat.Value, lon.Value);
			}
			return result;
		}

		/// <summary>
		/// This moves the position every second, based on the current
		/// speed and direction
		/// </summary>
		private async static Task MoveAsync() {
			Int64 utcTime = 0;
			Int64 boatTime = 0;
			while (true) {
				await Task.Delay(1000);
				position.MoveBy(speed, course);
				utcTime = DateTimeHelper.ToJSTime(DateTime.UtcNow);
				boatTime = utcTime + boatTimeOffset;
				GpsRecord record = new GpsRecord();
				record.UTC = utcTime;
				record.Latitude = position.Latitude;
				record.Longitude = position.Longitude;
				SendPositionAsync(record);
			}
		}

		/// <summary>
		/// This watches the keys. The arrow keys change heading and speed,
		/// esc steps out of the loop and thus ends the program.
		/// </summary>
		private static void WatchKeys() {
			Console.WriteLine("Hit esc to stop");
			do {
				if (Console.KeyAvailable) {
					ConsoleKeyInfo key = Console.ReadKey(true);
					if (key.Key == ConsoleKey.Escape) {
						break;
					} else {
						switch (key.Key) {
							case ConsoleKey.RightArrow:
								course = (course + 5 + 360) % 360;
								break;
							case ConsoleKey.LeftArrow:
								course = (course - 5 + 360) % 360;
								break;
							case ConsoleKey.UpArrow:
								speed += 0.5;
								break;
							case ConsoleKey.DownArrow:
								speed = Math.Max(0, speed - 0.5);
								break;
						}
						Console.WriteLine(String.Format($"COG: {course:000}°, SOG: {speed}"));
					}
				}
				
			} while (true);
		}

		/// <summary>
		/// This tries to load the latest position by reading the track from the
		/// last seven days.
		/// </summary>
		private async static Task<LatLon> LoadLatestPosistionAsync() {
			LatLon result = null;
			String url = ConfigurationManager.AppSettings["localAPI"];
			TrackProxy trackProxy = new TrackProxy(url, null);
			Int64 utcNow = DateTimeHelper.JSNow;
			Int64 start = utcNow - (7 * 24 * 3600 * 1000); // 7 days
			ProxyResult<Track> proxyResult = await trackProxy.GetTrackAsync(start, utcNow, false);
			if (proxyResult.Success) {
				if (proxyResult.Data.HasRecords) {
					GpsRecord record = proxyResult.Data.LastRecord;
					result = new LatLon(record.Latitude.Value, record.Longitude.Value);
				}
			} else {
				Console.WriteLine(proxyResult.Message);
			}
			return result;
		}

		/// <summary>
		/// Saves the current position to the server.
		/// </summary>
		private async static Task SendPositionAsync(GpsRecord pRecord) {
			Boolean success = await positionProxy.PutPositionsAsync(new GpsRecord[] { pRecord });
			if(!success) {
				Console.WriteLine("Sending position was not successful");
			}
		}
	}
}