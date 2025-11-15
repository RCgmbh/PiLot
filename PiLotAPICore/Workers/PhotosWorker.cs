using System;
using System.Collections.Generic;
using System.Threading.Tasks;

using PiLot.Data.Files;
using PiLot.Model.Photos;

namespace PiLot.API.Workers {

	/// <summary>
	/// That's the guy who processes Photos that have been uploaded in the background.
	/// The goal is to have a non-blocking, single threaded processing.
	/// </summary>
	public class PhotosWorker {

		private const String APPKEY = "photosWorker";

		private static Object staticLock = new object();

		private List<ImageData> queue;
		private Boolean isProcessing = false;
		private Object lockObject;
		private PhotoDataConnector dataConnector;

		/// <summary>
		/// Private constructor. The Instance accessor should be used
		/// </summary>
		private PhotosWorker() {
			this.queue = new List<ImageData>();
			this.lockObject = new Object();
			this.dataConnector = new PhotoDataConnector();
		}

		/// <summary>
		/// Singleton accessor
		/// </summary>
		public static PhotosWorker Instance {
			get {
				PhotosWorker result = null;
				lock(staticLock){
					Object applicationItem = Program.GetApplicationObject(APPKEY);
					if (applicationItem != null) {
						result = applicationItem as PhotosWorker;
					} else {
						result = new PhotosWorker();
						Program.SetApplicationObject(APPKEY, result);
					}
				}
				return result;
			}
		}

		public void ProcessPhoto(ImageData pImage) {
			this.queue.Add(pImage);
			this.EnsureProcessing();
		}

		/// <summary>
		/// If this.isProcessing is false, this will start the processing
		/// in a separat task
		/// </summary>
		private void EnsureProcessing() {
			lock (this.lockObject) {
				if (!this.isProcessing) {
					Task.Run(delegate { this.ProcessPhotos(); });
				}
			}
		}

		/// <summary>
		/// Does the actual processing, for as long as we have something
		/// in the queue.
		/// </summary>
		private void ProcessPhotos() {
			this.isProcessing = true;
			do {
				try {
					this.dataConnector.SaveImageWithThumbnails(this.queue[0], null);
				} catch { 
				} finally {
					this.queue.RemoveAt(0);
				}				
			} while (this.queue.Count > 0);
			this.isProcessing = false;
		}
	}
}
