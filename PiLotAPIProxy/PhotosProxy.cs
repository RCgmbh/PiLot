using System;
using System.Threading.Tasks;

using PiLot.Model.Photos;

namespace PiLot.APIProxy {

	/// <summary>
	/// Proxy class for easy access to the /Photos REST API
	/// </summary>
	public class PhotosProxy {

		private const String CONTROLLERURL = "/Photos";

		private PiLotHttpClient httpClient;
		private String apiControllerUrl;

		/// <summary>
		/// Creates a new PhotosProxy instance, which can be used to 
		/// read data from and send data to the Track API Endpoint
		/// </summary>
		/// <param name="pApiUrl">The API Root url, such as http://localhost/pilotapi/api/v1, without ending /</param>
		/// <param name="pLoginHelper">Pass the one and only LoginHelper within the application, or null</param>
		public PhotosProxy(String pApiUrl, LoginHelper pLoginHelper) {
			this.apiControllerUrl = pApiUrl + CONTROLLERURL;
			this.httpClient = new PiLotHttpClient(pLoginHelper);
		}

		/// <summary>
		/// Reads the Photos for a certain date. 
		/// </summary>
		/// <param name="pDate">The date for which we want the photos</param>
		/// <returns>An image collection or null</returns>
		public async Task<ProxyResult<ImageCollection>> GetDailyPhotos(Date pDate) {
			String url = ($"{this.apiControllerUrl}?year={pDate.Year}&month={pDate.Month}&day={pDate.Day}");
			return  await this.httpClient.GetAsync<ImageCollection>(url);
		}

		/// <summary>
		/// Puts a photo, including image Bytes, Date and Name
		/// </summary>
		/// <param name="pImage">The image Information, not null of course</param>
		/// <returns>True for success, false for failure</returns>
		public async Task<Boolean> PutPhotoAsync(ImageData pImage) {
			String qsDay = "";
			if(pImage.Day  != null) {
				qsDay = pImage.Day.Value.ToString("yyyy-MM-dd");
			}
			String url = $"{this.apiControllerUrl}?day={qsDay}&fileName={pImage.Name}";
			return await this.httpClient.PutAsync(pImage.Bytes, url);
		}
	}
}

