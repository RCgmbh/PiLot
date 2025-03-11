using PiLot.Model.Nav;
using PiLot.Model.Logbook;
using PiLot.Utils.DateAndTime;

namespace PiLot.RestoreClient {
	
	/// <summary>
	/// Simple app to restore data from a backup. The data is accessed directly
	/// via file storage, not via any API. Only supports the restore of track
	/// data, as all other data can be restored by simply copying the files
	/// from the backup set into the data directory.
	/// </summary>
	internal class Program {

		private static String dataPath;
		private static String connectionString;
		private static Boolean overwriteExistingTracks;

		static void Main(String[] args) {
			ReadUserInput();
			ImportData();
			Console.WriteLine("Done");
		}

		private static void ReadUserInput(){
			Console.WriteLine("Please enter the path to the backup set (the date directory):");
			Program.dataPath = Console.ReadLine();
			Console.WriteLine("Pease enter the DB connection String:");
			Program.connectionString = Console.ReadLine();
			Console.WriteLine("Do you want to overwrite existing tracks? (y/n):");
			Char input = Console.ReadLine().ToLower()[0];
			while(input != 'y' && input != 'n'){
				Console.WriteLine("Please enter \"y\" or \"n\" (or \"YES\" or \"No\" or whatever, just let me know what you want...)");
				input = Console.ReadLine().ToLower()[0];
			}
			Program.overwriteExistingTracks = input == 'y';
		}

		private static void ImportData(){
			Console.WriteLine("Starting Data import");
			PiLot.Data.Files.TrackDataConnector2 trackDataReader = PiLot.Data.Files.TrackDataConnector2.GetInstance(Program.dataPath);
			PiLot.Data.Postgres.Nav.TrackDataConnector trackDataWriter = new PiLot.Data.Postgres.Nav.TrackDataConnector(Program.connectionString);
			List<Track> overlappingTracks;
			TrackAnalyzer analyzer;
			List<TrackSegment> segments;
			List<TrackSegmentType> segmentTypes = trackDataWriter.ReadTrackSegmentTypes();
			Boolean doImport;
			Int32 oldId;
			foreach(Track aTrack in trackDataReader.ReadAllTracks().Where(t => t.StartUTC != null && t.EndUTC != null)){
				doImport = true;
				overlappingTracks = trackDataWriter.ReadTracks(aTrack.StartUTC.Value, aTrack.EndUTC.Value);
				if(overlappingTracks.Count > 0){
					if(Program.overwriteExistingTracks){
						foreach(Track anOverlappingTrack in overlappingTracks){
							trackDataWriter.DeleteTrack(anOverlappingTrack.ID.Value);
							Console.WriteLine($"Track with ID {anOverlappingTrack.ID.Value} deleted");
						}
					} else{
						Console.WriteLine($"Skipping track with ID {aTrack.ID.Value} as it overlaps with existing track(s)");
						doImport = false;
					}
				}
				if(doImport) try{
					oldId = aTrack.ID.Value;
					aTrack.ID =  null;
					trackDataWriter.SaveTrack(aTrack);
					Program.WriteColorful($"Track with ID {oldId} imported successfully as Track with ID {aTrack.ID.Value}", ConsoleColor.Green);
					analyzer = new TrackAnalyzer(aTrack);
					segments = analyzer.GetTrackSegments(segmentTypes);
					foreach (TrackSegment aSegment in segments) {
						trackDataWriter.SaveTrackSegment(aSegment);
					}
				} catch(Exception ex){
					Program.WriteColorful(ex.Message, ConsoleColor.Red);
				}
			}
		}

		private static void WriteColorful(String pMessage, ConsoleColor pColor){
			Console.ForegroundColor = pColor;
			Console.WriteLine(pMessage);
			Console.ResetColor();
		}
    }
}