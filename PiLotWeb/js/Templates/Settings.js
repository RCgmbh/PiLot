/// safely initialize Namespaces
var PiLot = PiLot || {};
PiLot.Templates = PiLot.Templates || {};

PiLot.Templates.Settings = {

	settingsOverviewPage: `<div class="contentPadding">
		<h1 data-text="settings"></h1>
		<a href="" class="lnkLanguage tile big">
			<div>
				<span class="symbol"><i class="icon-bubbles4"></i></span>
				<span class="label" data-text="language"></span>
			</div>
		</a>
		<a href="" class="lnkTime tile big">
			<div>
				<span class="symbol"><i class="icon-time2"></i></span>
				<span class="label" data-text="boatTime"></span>
			</div>
		</a>
		<a href="" class="lnkBoatConfig tile big">
			<div>
				<span class="symbol"><i class="icon-sailing-boat-water1"></i></span>
				<span class="label" data-text="boatConfig"></span>
			</div>
		</a>
	</div>`,

	boatTimePage: `
		<div class="contentPadding">
			<h1><a href="#" class="lnkSettings" data-text="settings"></a> : <span data-text="boatTime"></span></h1>
			<div class="dataContainerHalf paddingRight marginBottomBig">
				<span class="timeLabel"><span data-text="boatTime"></span>:</span><span id="lblBoatTime"></span><br />
				<span class="timeLabel"><span data-text="boatTimeUTCOffset"></span>:</span><span id="lblBoatTimeOffset"></span> h<br />
				<span class="timeLabel"><span data-text="changeBoatTime"></span></span><a href="#" id="btnMinus">-1 h</a> / <a href="#" id="btnPlus">+1 h</a> 
			</div>
			<div class="dataContainerHalf paddingRight marginBottom">
				<canvas id="clockCanvas"></canvas>
			</div>
		</div>
	`,

	languagePage: `
		<div class="contentPadding">
			<h1><a href="#" class="lnkSettings" data-text="settings"></a> : <span data-text="language"></span></h1>
			<select class="input6 ddlLanguages"></select>
			<div class="pnlSuccess feedbackGood marginTop marginRight" data-text="languageChanged" hidden>
		</div>
	`
}