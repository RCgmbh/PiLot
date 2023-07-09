using System;
using System.Device.Gpio;

namespace PiLot.GPIO.Devices {

	public class Button {

		private const Int32 BOUNCEDEFAULT = 300; // default bounce time in MS

		private Int32 bounceTime = BOUNCEDEFAULT;
		private DateTime? lastPush = null;
		private Action onPushAction;

		/// <summary>
		/// Default constructor
		/// </summary>
		/// <param name="pController">Pleaese pass a GpioController</param>
		/// <param name="pPinNumber">The Pin number the button is connected to. Use numbering scheme from pController</param>
		/// <param name="pConnectionType">Plus: the button is connected to a GPIO Pin and 3.3v, Ground: GPIO and GND</param>
		/// <param name="pOnPush">The method to call when the button is pushed</param>
		public Button(GpioController pController, Int32 pPinNumber, ConnectionTypes pConnectionType, Action pOnPush) {
			PinMode pinMode;
			PinEventTypes eventType;
			if(pConnectionType == ConnectionTypes.Plus) {
				pinMode = PinMode.InputPullDown;
				eventType = PinEventTypes.Rising;
			} else {
				pinMode = PinMode.InputPullUp;
				eventType = PinEventTypes.Falling;
			}
			pController.OpenPin(pPinNumber, pinMode);
			pController.RegisterCallbackForPinValueChangedEvent(pPinNumber, eventType, new PinChangeEventHandler(this.OnPush));
			this.onPushAction = pOnPush;
		}

		/// <summary>
		/// Calls this.onPushAction, if there was no push within now - bounceTime
		/// </summary>
		private void OnPush(Object sender, PinValueChangedEventArgs e) {
			DateTime utcNow = DateTime.UtcNow;
			if((this.lastPush == null) || ((utcNow - this.lastPush.Value).TotalMilliseconds >= this.bounceTime)){
				this.lastPush = utcNow;
				this.onPushAction();
			} 
		}
	}
}
