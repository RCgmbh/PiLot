using System;
using System.IO;

using PiLot.Data.Files;
using PiLot.Model.Photos;

namespace PiLot.PhotosWatcher {

	/// <summary>
	/// This is used to process all images in a directory, as an 
	/// explicitly triggered alternative to the Watcher
	/// </summary>
	public class DirectoryProcessor {

		/// <summary>
		/// Default constructor, accepts the path of the folder to process
		/// and the root path where to create date folders and move images
		/// to
		/// </summary>
		/// <param name="pInputPath">The input path</param>
		/// <param name="pOutputPath">The target path</param>
		public DirectoryProcessor(String pInputPath, String pOutputPath) {
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
						dataConnector.SaveImageWithThumbnails(new ImageData() {
							Bytes = bytes,
							Name = anImage.Name,
							Day = null
						}) ;
						anImage.Delete();
						successCounter++;
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
