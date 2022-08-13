using System;
using System.Globalization;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.Metadata.Profiles.Exif;

using PiLot.Utils.Logger;

namespace PiLot.Data.Files {

	/// <summary>
	/// This contains some static methods used to work with images,
	/// especially for creating thumbnails, and work with image
	/// metadata (exif tags)
	/// </summary>
	public class ImageHelper {

		/// <summary>
		/// Creates a thumbnail with a maximal width and height,
		/// and returns the new image object.
		/// </summary>
		/// <param name="pImage">the original image</param>
		/// <param name="pMaxSize">the max width and height</param>
		public static Image CreateThumbnail(Image pImage, Int32 pMaxSize) {
			float hRatio = (float)pMaxSize / (float)pImage.Height;
			float wRatio = (float)pMaxSize / (float)pImage.Width;
			float ratio = Math.Min(1, Math.Min(wRatio, hRatio));
			int newHeight = Convert.ToInt32(Math.Round(pImage.Height * ratio));
			int newWidth = Convert.ToInt32(Math.Round(pImage.Width * ratio));
			Image result = pImage.Clone(x => x.Resize(newWidth, newHeight)); 
			ImageHelper.CopyMedatata(pImage, result);
			return result;
		}

		/// <summary>
		/// This copies the exif tags from the original image to the thumbnail, or more
		/// generically speaking from a source image to a target image.
		/// </summary>
		private static void CopyMedatata(Image pSource, Image pTarget) {
			if(pSource.Metadata?.ExifProfile != null) {
				pTarget.Metadata.ExifProfile = pSource.Metadata.ExifProfile;
			}			
		}

		/// <summary>
		/// this rotates an image which is only displayed correctly if exif orientation tag
		/// is present, and removes the orientation tag
		/// </summary>
		public static void EnsureOrientation(ref Image pImage) {
			try {
				var orientationProperty = pImage.Metadata?.ExifProfile?.GetValue(ExifTag.Orientation);
				if (orientationProperty != null) {
					RotateMode rotateMode = RotateMode.None;
					switch (orientationProperty.Value) {
						case 8:
							rotateMode = RotateMode.Rotate270;
							break;
						case 3:
							rotateMode = RotateMode.Rotate180;
							break;
						case 6:
							rotateMode = RotateMode.Rotate90;
							break;
					}
					pImage.Mutate(i => i.RotateFlip(rotateMode, FlipMode.None));
					pImage.Metadata.ExifProfile.RemoveValue(ExifTag.Orientation);
				}
			} catch(Exception ex) {
				Logger.Log(ex, "ImageHelper.EnsureOrientation");
			}
		}

		/// <summary>
		/// Tries to read the metadata from the file and returns the creation date. If no EXIF data
		/// is available, it will take the pFileDate, if one has been passed.
		/// </summary>
		/// <param name="pFileDate">Pass the file's creation date as fallback</param>
		public static DateTime? GetImageDate(Image pImage, DateTime? pFileDate) {
			DateTime? result = null;
			CultureInfo cultureInfo = CultureInfo.CurrentCulture;
			DateTime testDate;
			String dateTakenString = pImage.Metadata?.ExifProfile?.GetValue(ExifTag.DateTimeOriginal)?.Value;
			if (String.IsNullOrEmpty(dateTakenString)) {
				dateTakenString = pImage.Metadata?.ExifProfile?.GetValue(ExifTag.DateTime)?.Value;
			}
			if (!String.IsNullOrEmpty(dateTakenString) && (dateTakenString.Length >= 19)) {
				if (DateTime.TryParseExact(dateTakenString.Substring(0, 19), "yyyy:MM:dd HH:mm:ss", cultureInfo, DateTimeStyles.AllowInnerWhite | DateTimeStyles.AllowTrailingWhite, out testDate)) {
					result = testDate;
				} else {
					Logger.Log($"Image EXIF Date could not be parsed: {dateTakenString}", LogLevels.WARNING);
				}
			} if (result == null) {
				Logger.Log($"ImageHelper.GetImageDate: No EXIF found. Falling back to file info.", LogLevels.WARNING);
				result = pFileDate;
			}
			return result;
		}
	}
}
