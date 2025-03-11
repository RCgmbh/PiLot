using PiLot.Model.Nav;
using PiLot.Model.Logbook;
using PiLot.Utils.DateAndTime;

namespace PiLot.DataMigrator {
	
	/// <summary>
	/// Simple app to copy tracks from the old files based storage to the DB.
	/// Will probably not be used anymore.
	/// </summary>
	internal class Program {

		private static Connectors.Files.TrackDataConnector trackDataReader;
		private static Data.Files.LogbookDataConnector logbookDataReader;
		private static Data.Postgres.Nav.TrackDataConnector trackDataWriter;
		private static String defaultBoat;

		static void Main(string[] args) {
			ReadUserInput();
			MoveData();
			Console.WriteLine("Done");

		}

		private static void ReadUserInput() {
			Console.WriteLine("Files root path:");
			String input = Console.ReadLine();
			trackDataReader = new Connectors.Files.TrackDataConnector(input);
			logbookDataReader = new Data.Files.LogbookDataConnector(input);
			Console.WriteLine("DB connection String:");
			input = Console.ReadLine();
			trackDataWriter = new Data.Postgres.Nav.TrackDataConnector(input);
			Console.WriteLine("Default boat:");
			defaultBoat = Console.ReadLine();
			Console.WriteLine();
		}

		private static void MoveData() {
			DateTime dateTime;
			Double readMS, writeMS, analyzeMS;
			LogbookDay logbookDay;
			Model.Common.Date day;
			TrackAnalyzer analyzer;
			List<TrackSegment> segments;
			List<TrackSegmentType> segmentTypes = trackDataWriter.ReadTrackSegmentTypes();
			dateTime = DateTime.UtcNow;
			foreach(Track aTrack in trackDataReader.ReadAllTracks()) {
				if(aTrack?.StartBoatTime != null) {
					try {
						day = new Model.Common.Date(DateTimeHelper.FromJSTime(aTrack.StartBoatTime.Value));
						logbookDay = logbookDataReader.ReadLogbookDay(day);
						aTrack.Boat = logbookDay?.LogbookEntries.FirstOrDefault()?.BoatSetup.BoatConfigName ?? defaultBoat;
						readMS = (DateTime.UtcNow - dateTime).TotalMilliseconds;
						dateTime = DateTime.UtcNow;
						trackDataWriter.SaveTrack(aTrack);
						writeMS = (DateTime.UtcNow - dateTime).TotalMilliseconds;
						dateTime = DateTime.UtcNow;
						analyzer = new TrackAnalyzer(aTrack);
						trackDataWriter.DeleteTrackSegments(aTrack.ID, null);
						segments = analyzer.GetTrackSegments(segmentTypes);
						foreach (TrackSegment aSegment in segments) {
							trackDataWriter.SaveTrackSegment(aSegment);
						}
						analyzeMS = (DateTime.UtcNow - dateTime).TotalMilliseconds;
						Console.WriteLine($"Migrated track for {day}. Boat: {aTrack.Boat}. Read: {readMS:F0} ms, write: {writeMS:F0} ms, analyze: {analyzeMS:F0} ms");
						dateTime = DateTime.UtcNow;
					} catch(Exception ex) {
						Console.WriteLine($"Error: {ex.Message}");
						Console.Write("Hit x to quit, any key to continue");
						Char input = (Console.ReadKey().KeyChar);
						if((input == 'x') || (input == 'X')){
							break;
						}
					}
				} else {
					Console.WriteLine("Track or StartBoatTime is null, skipping");
				}
			}
		}
	}
}
