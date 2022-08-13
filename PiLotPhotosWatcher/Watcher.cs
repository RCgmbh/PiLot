using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;

using PiLot.Data.Files;
using PiLot.Model.Photos;
using PiLot.Utils.DateAndTime;
using PiLot.Utils.Logger;

namespace PiLot.PhotosWatcher {

	/// <summary>
	/// Watches a folder for changes and triggers processing newly addes images
	/// </summary>
	internal class Watcher {

		private PhotoDataConnector dataConnector = null;
		private List<String> queue = null;
		Boolean isProcessing = false;

		/// <summary>
		/// Default constructor
		/// </summary>
		/// <param name="pWatchPath">The path of the directory to watch</param>
		/// <param name="pOutputPath">The path where processed images are stored (subdirectories will be created)</param>
		internal Watcher(String pWatchPath, String pOutputPath) {
			this.dataConnector = new PhotoDataConnector(pOutputPath);
			this.queue = new List<String>();
			FileSystemWatcher watcher = new FileSystemWatcher();
			watcher.Path = pWatchPath;
			watcher.Created += new FileSystemEventHandler(this.OnCreated);
			watcher.EnableRaisingEvents = true;
			watcher.IncludeSubdirectories = false;
			Program.WriteLine("Starting to watch directory {0}", watcher.Path);
			while (Console.Read() != 'q') { 
				watcher.WaitForChanged(WatcherChangeTypes.All);
			}
		}

		/// <summary>
		/// Handles added images and pushes them into the queue. Makes sure the queue is
		/// being processed
		/// </summary>
		private void OnCreated(object source, FileSystemEventArgs e) {
			Program.WriteLine("FileSystemWatcher observed change: File " + e.FullPath + " " + e.ChangeType);
			if (!this.queue.Contains(e.FullPath)) {
				this.queue.Add(e.FullPath);
			}
			this.EnsureQueueProcessing();
		}

		/// <summary>
		/// Processes the queue as long as there are any images to be processed
		/// </summary>
		private async void EnsureQueueProcessing() {
			if (!this.isProcessing) {
				this.isProcessing = true;
				Program.WriteLine("Waiting a moment...");
				await Task.Delay(5 * 1000); // wait a moment to make sure the entire image will be copied
				do {
					if(this.queue.Count > 0) {
						FileInfo fileInfo = new FileInfo(this.queue[0]);
						if (fileInfo.Exists) {
							Byte[] bytes = FileHelper.TryReadFile(this.queue[0]);
							if (bytes != null) {
								try {
									this.dataConnector.SaveImageWithThumbnails(new ImageData() {
										Bytes = bytes,
										Name = Path.GetFileName(this.queue[0]),
										Day = null
									}, DateTimeHelper.Min(fileInfo.CreationTime, fileInfo.LastWriteTime));
								} catch {
									Logger.Log($"Watcher.EnsureQueueProcessing: Image could not be processed: {fileInfo.Name}", LogLevels.ERROR);
								}								
							}
							File.Delete(this.queue[0]);
							this.queue.RemoveAt(0);
						}						
					}
				}
				while (this.queue.Count > 0);
				this.isProcessing = false;
			}
		}
	}
}
