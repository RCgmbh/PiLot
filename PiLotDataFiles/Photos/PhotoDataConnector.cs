using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using SixLabors.ImageSharp;

using PiLot.Model.Photos;
using PiLot.Utils;
using PiLot.Utils.Logger;

namespace PiLot.Data.Files {

	public class PhotoDataConnector {

		public const String PHOTOSDIR = "photos";
		public const String THUMBNAILFOLDER = "thumbnail1";
		public const String PHOTOFILEFORMAT = "{0:yyyy-MM-dd}";

		private static readonly List<String> imageFileExtensions = new List<String> { ".jpg", ".jpeg", ".JPG", ".JPEG" };

		#region instance variables

		private DataHelper helper;

		#endregion

		#region constructors

		/// <summary>
		/// Default constructor
		/// </summary>
		public PhotoDataConnector() {
			this.helper = new DataHelper();
		}

		/// <summary>
		/// Creates a new PhotoDataConnector for a specific data root path
		/// </summary>
		/// <param name="pDataRoot">data root path, e.g. /var/lib/pilot</param>
		public PhotoDataConnector(String pDataRoot) {
			this.helper = new DataHelper(pDataRoot);
		}

		#endregion

		/// <summary>
		/// Returns whether there are any Photos for a certain day
		/// </summary>
		/// <param name="pDay">The date</param>
		/// <returns>True, if there are photos for pDay</returns>
		public Boolean HasPhotos(Date pDay) {
			DirectoryInfo photosDirectory = new DirectoryInfo(this.GetPhotosFilePath(pDay, false));
			Boolean result = photosDirectory.Exists && (photosDirectory.GetFiles().Count(f => PhotoDataConnector.imageFileExtensions.Contains(f.Extension)) > 0);
			return result;
		}

		/// <summary>
		/// Reads the image for a certain day with a certain name, and returns
		/// is as ImageData object
		/// </summary>
		/// <param name="pDate">The date the image was taken</param>
		/// <param name="pName">The name of the image, e.g. P1234.jpg</param>
		/// <returns>An imageData object or null, if the image was not found</returns>
		public ImageData ReadImage(Date pDate, String pName) {
			ImageData result = null;
			String imagePath = this.GetImageFilePath(pDate, pName);
			if (File.Exists(imagePath)) {
				result = new ImageData();
				result.Bytes = File.ReadAllBytes(imagePath);
				result.Day = pDate;
				result.Name = pName;
			}
			return result;
		}

		/// <summary>
		/// Returns an object to be used by the RC.ImageGallery as ImageCollection,
		/// representing the photos of one day
		/// </summary>
		/// <param name="pDay">The day for which the photos should be loaded</param>
		/// <returns>ImageCollection for RC.ImageGallery.ImageCollection, never null</returns>
		public ImageCollection ReadDailyPhotoGallery(Date pDay) {
			List<String> imageNames = new List<String>();
			DirectoryInfo photosDirectory = new DirectoryInfo(this.GetPhotosFilePath(pDay, false));
			if (photosDirectory.Exists) {
				imageNames = photosDirectory.GetFiles().OrderBy(f => f.CreationTimeUtc).Select(f => f.Name).ToList();
			}
			return new ImageCollection() {
				RootURL = this.GetPhotosRelativePath(pDay),
				ZoomFolders = this.GetImageFolders(),
				ImageNames = imageNames
			};
		}

		/// <summary>
		/// This saves an image and creates the thumbnails. The folder
		/// to save to is based on the day the picture was taken. If
		/// this is not passed within the ImageData, we try to extract
		/// it from the exif data.
		/// </summary>
		/// <param name="pImageData">The image data containing bytes, name and day</param>
		/// <param name="pFileDate">Optionally pass a date which will be used if no EXIF data is available</param>
		public void SaveImageWithThumbnails(ImageData pImageData, DateTime? pFileDate) {
			Logger.Log($"PhotoDataConnector starting SaveImageWithThumbnail for {pImageData.Name}", LogLevels.DEBUG);
			try {
				Date? day = pImageData.Day;
				Image image = Image.Load(pImageData.Bytes);
				if (day == null) {
					DateTime? imageDateTime = ImageHelper.GetImageDate(image, pFileDate);
					if(imageDateTime != null) {
						day = new Date(imageDateTime.Value);
					}
				}
				if(day != null) {
					String datePath = this.GetPhotosFilePath(day.Value, true);
					ImageHelper.EnsureOrientation(ref image);
					String imageFilePath = this.GetImageFilePath(day.Value, pImageData.Name, false);
					if (!File.Exists(imageFilePath)) {
						image.Save(imageFilePath);
					}
					this.CreateThumbnails(image, pImageData.Name, datePath);
				} else {
					Logger.Log($"Image {pImageData.Name} does not have a valid date and can not be processed.", LogLevels.ERROR);
				}
			} catch(Exception ex) {
				Logger.Log(ex, "PhotoDataConnector.SaveImageWithThumbnails");
				throw;
			}
			Logger.Log($"PhotoDataConnector finished SaveImageWithThumbnail for {pImageData.Name}", LogLevels.DEBUG);
		}

		/// <summary>
		/// returns a relative path in the form /photos/date/ for the photos folder of a certain date
		/// </summary>
		private String GetPhotosRelativePath(Date pDay) {
			return String.Concat(PHOTOSDIR, "/", String.Format(PHOTOFILEFORMAT, pDay));
		}

		/// <summary>
		/// Gets the path to the photos folder for a certain day. Optionally creates the folder,
		/// if it does not exist yet.
		/// </summary>
		/// <param name="pDay">the Day</param>
		/// <param name="pCreateMissingFolder">If true, missing folders will be created automagically</param>
		private String GetPhotosFilePath(Date pDay, Boolean pCreateMissingFolder) {
			String photoRootPath = this.helper.GetDataPath(PHOTOSDIR, pCreateMissingFolder);
			String photoDayPath = Path.Combine(photoRootPath, String.Format(PHOTOFILEFORMAT, pDay));
			if (pCreateMissingFolder && !Directory.Exists(photoDayPath)) {
				Directory.CreateDirectory(photoDayPath);
			}
			return photoDayPath;
		}

		/// <summary>
		/// Returns the path for one specific image file, without checking, whether the 
		/// folder or the image does exist. However, the folder can be created, if it
		/// does not exist yet (which makes sense, if you use this to get the saving
		/// path for an image).
		/// </summary>
		/// <param name="pDay">The date the image was taken</param>
		/// <param name="pImageName">The image name, like P1234.jpg</param>
		/// <param name="pCreateMissingFolder">If true, the folder will be created, if it does not exist</param>
		/// <returns>The full absolute path (where an image might or might not be found)</returns>
		private String GetImageFilePath(Date pDay, String pImageName, Boolean pCreateMissingFolder = false) {
			return Path.Combine(this.GetPhotosFilePath(pDay, pCreateMissingFolder), pImageName);
		}

		/// <summary>
		/// This returns a list of ImageFolders, defining the folder names
		/// and image sizes of the different zoom folders. 
		/// </summary>
		/// <returns></returns>
		private List<ImageFolder> GetImageFolders() {
			List<ImageFolder> result = new List<ImageFolder>() {
				new ImageFolder() { MaxSize = 64, Folder = "thumbnail0" },
				new ImageFolder() { MaxSize = 128, Folder = "thumbnail1" },
				new ImageFolder() { MaxSize = 256, Folder = "thumbnail2" },
				new ImageFolder() { MaxSize = 512, Folder = "thumbnail3" },
				new ImageFolder() { MaxSize = 1024, Folder = "thumbnail4" },
				new ImageFolder() { MaxSize = null, Folder = "" },
			};
			return result;
		}

		/// <summary>
		/// This creates a thumbnail for each size defined by the ImageFolders
		/// from this.GetImageFolders, and saves it to the corrext folder. If
		/// the file already exists, it will not save anything. Also for items
		/// with MaxSize == null, nothing will be done.
		/// </summary>
		/// <param name="pImage">The original size image</param>
		/// <param name="pDatePath">the base path, where the thumbnail foder will be created</param>
		/// <param name="pImageName">The fileName of the image, e.g. P1234.jpg</param>
		private void CreateThumbnails(Image pImage, String pImageName, String pDatePath) {
			foreach(ImageFolder aFolder in this.GetImageFolders().Where(i => i.MaxSize != null)) {
				String thumbnailDirectoryPath = Path.Combine(pDatePath, aFolder.Folder);
				DirectoryInfo thumbnailDirectory = new DirectoryInfo(thumbnailDirectoryPath);
				if (!thumbnailDirectory.Exists) {
					thumbnailDirectory.Create();
				}
				String thumbnailPath = Path.Combine(thumbnailDirectoryPath, pImageName);
				if (!File.Exists(thumbnailPath)) {
					Logger.Log($"PhotoDataConnector start creating thumbnail for ${pImageName}, size {aFolder.MaxSize}", LogLevels.DEBUG);
					Image thumbnail = ImageHelper.CreateThumbnail(pImage, aFolder.MaxSize.Value);
					thumbnail.Save(thumbnailPath);
					Logger.Log($"PhotoDataConnector done  creating thumbnail for ${pImageName}, size {aFolder.MaxSize}", LogLevels.DEBUG);
				}
			}
		}
	}
}