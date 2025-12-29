using PiLot.Model.Nav;
using PiLot.Model.Photos;

namespace PiLot.RestoreClient {
	
	/// <summary>
	/// Simple app to restore data from a backup. The data is accessed directly
	/// via file storage, not via any API. Only supports the restore of track
	/// data, as all other data can be restored by simply copying the files
	/// from the backup set into the data directory.
	/// </summary>
	internal class Program {

		private static String sourceDataPath;
		private static String targetDataPath;
		private static String connectionString;
		private static Boolean importTracks;
		private static Boolean overwriteExistingTracks;
		private static Boolean importPhotos;

		static void Main(String[] args) {
			ReadUserInput();
			ImportData();
			Console.WriteLine("Done");
		}

		private static void ReadUserInput(){
			Console.WriteLine("***************************************");
			Console.WriteLine("* Welcome to the PiLot restore client *");
			Console.WriteLine("***************************************");
			Console.WriteLine();
			Console.WriteLine("Please enter the path to the backup set (the date directory):");
			Program.sourceDataPath = Console.ReadLine();
			Program.importTracks = Program.AskYesNoQuestion("Do you want to import Tracks/GSP-Data? (y/n)");
			if(Program.importTracks){
				Program.overwriteExistingTracks = Program.AskYesNoQuestion("Do you want to overwrite existing tracks? (y/n):");
				Console.WriteLine("Pease enter the DB connection String:");
				Program.connectionString = Console.ReadLine();
			}
			Program.importPhotos = Program.AskYesNoQuestion("Do you want to import Photos? (y/n)");
			if(Program.importPhotos){
				Console.WriteLine("Please enter the path where data will be stored:");
				Program.targetDataPath = Console.ReadLine();
			}
		}

		private static void ImportData(){
			if(Program.importTracks){
				Program.ImportTracks();
			}
			if(Program.importPhotos){
				Program.ImportPhotos();
			}
		}

		private static void ImportTracks(){
			Console.WriteLine("Starting Tracks import");
			PiLot.Data.Files.TrackDataConnector2 trackDataReader = PiLot.Data.Files.TrackDataConnector2.GetInstance(Program.sourceDataPath);
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
			Console.WriteLine("Tracks import done");
		}

		private static void ImportPhotos(){
			DirectoryInfo backupDirectory = new DirectoryInfo(Program.sourceDataPath);
			DirectoryInfo backupParent = backupDirectory.Parent;
			if(backupParent != null && backupParent.Exists){
				Console.WriteLine($"Starting Photos import from {backupParent.FullName}");
				Data.Files.PhotoDataConnector photoDataReader = new Data.Files.PhotoDataConnector(backupParent.FullName);
				Data.Files.PhotoDataConnector photoDataWriter = new Data.Files.PhotoDataConnector(Program.targetDataPath);
				ImageData imageData;
				foreach(ImageCollection aCollection in photoDataReader.ReadAllPhotoGalleries()){
					Console.WriteLine($"Starting Import for collection {aCollection.Name}");
					if(Date.TryParseExact(aCollection.Name, Data.Files.PhotoDataConnector.PHOTODIRFORMAT, null, System.Globalization.DateTimeStyles.None, out Date collectionDate)){
						foreach(String aName in aCollection.ImageNames){
							try{
								imageData = photoDataReader.ReadImage(collectionDate, aName);
								photoDataWriter.SaveImageWithThumbnails(imageData, collectionDate);
								Program.WriteColorful($"Image {aName} imported", ConsoleColor.Green);
							} catch(Exception ex){
								Program.WriteColorful(ex.Message, ConsoleColor.Red);
							}
						}
					} else {
						Program.WriteColorful($"Invalid date: {aCollection.Name}", ConsoleColor.Red);
					}
				}
				Console.WriteLine("Photos import done");
			}
			else {
				Program.WriteColorful($"Photos Directory not found at {backupParent.FullName}", ConsoleColor.Red);
			}
		}

		private static Boolean AskYesNoQuestion(String pQuestion){
			Console.WriteLine(pQuestion);
			Char input = Console.ReadLine().ToLower()[0];
			while(input != 'y' && input != 'n'){
				Console.WriteLine("Please enter \"y\" or \"n\" (or \"YES\" or \"No\" or whatever, just let me know what you want...)");
				input = Console.ReadLine().ToLower()[0];
			}
			return input == 'y';
		}

		private static void WriteColorful(String pMessage, ConsoleColor pColor){
			Console.ForegroundColor = pColor;
			Console.WriteLine(pMessage);
			Console.ResetColor();
		}
    }
}