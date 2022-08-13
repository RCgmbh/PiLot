using System;
using System.IO;

using PiLot.Data.Files;
using PiLot.Model.Photos;
using PiLot.Utils.DateAndTime;
using PiLot.Utils.Logger;

namespace PiLot.PhotosWatcher {

	/// <summary>
	/// This is used to process all images in a directory, as an 
	/// explicitly triggered alternative to the Watcher
	/// </summary>
	public class DirectoryProcessor {

		/// <summary>
		/// This processes all images within one directory
		/// </summary>
		/// <param name="pInputPath">The path where the images to be processed are</param>
		/// <param name="pOutputPath">The root data path</param>
		public static void ProcessDirectory(String pInputPath, String pOutputPath) {
			DirectoryInfo inputDirectory = new DirectoryInfo(pInputPath);
			if (inputDirectory.Exists) {
				Int32 successCounter = 0;
				Int32 errorCounter = 0;
				Program.WriteLine("Starting to process directory {0}", pInputPath);
				PhotoDataConnector dataConnector = new PhotoDataConnector(pOutputPath);
				Byte[] bytes;
				foreach (FileInfo anImage in inputDirectory.EnumerateFiles()) {
					bytes = FileHelper.TryReadFile(anImage.FullName);
					if(bytes != null) {
						try {
							dataConnector.SaveImageWithThumbnails(new ImageData() {
								Bytes = bytes,
								Name = anImage.Name,
								Day = null
							}, DateTimeHelper.Min(anImage.CreationTime, anImage.LastWriteTime));
							anImage.Delete();
							successCounter++;
						} catch {
							errorCounter++;
							Logger.Log($"DirectoryProcessor.ProcessDirectory: Image could not be processed: {anImage.Name}", LogLevels.ERROR);
						}
					} else {
						errorCounter++;
					}
				}
				Program.WriteLine("Done processing Images. {0} succesful, {1} errors.", successCounter, errorCounter);
			} else {
				Program.WriteLine("The directory {0} could not be found.", pInputPath);
			}
		}
	}
}
