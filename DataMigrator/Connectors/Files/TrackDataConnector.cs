using PiLot.Model.Nav;

namespace PiLot.DataMigrator.Connectors.Files {
	
	internal class TrackDataConnector: Data.Files.TrackDataConnector {

		internal TrackDataConnector(String pDataRoot) : base(pDataRoot) { }

		/// <summary>
		/// Returns all GPS Tracks in an iterable way
		/// </summary>
		internal IEnumerable<Track> ReadAllTracks() {
			string dataPath = this.helper.GetDataPath(DATASOURCENAME);
			Track track;
			DirectoryInfo dataDir = new DirectoryInfo(dataPath);
			if (dataDir.Exists) {
				foreach (var aFile in dataDir.EnumerateFiles()) {
					track = this.ReadTrackPointsFromFile(aFile);
					if (track != null && track.HasTrackPoints) {
						track.StartUTC = track.FirstTrackPoint.UTC;
						track.EndUTC = track.LastTrackPoint.UTC;
						track.StartBoatTime = track.FirstTrackPoint.BoatTime.Value;
						track.EndBoatTime = track.LastTrackPoint.BoatTime.Value;
						yield return track;
					}
				}
			} else {
				Console.WriteLine($"TrackDataConnector.ReadAllTracks: gps directory not found at {dataPath}");
			}
		}
	}
}
