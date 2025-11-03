/// safely initialize Namespaces
var PiLot = PiLot || {};
PiLot.Templates = PiLot.Templates || {};

PiLot.Templates.Settings = {

	boatTimePage: `
		<div class="contentPadding">
			<h1 data-text="boatTime"></h1>
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
			<h1 data-text="language"></h1>
			<select class="input6 ddlLanguages"></select>
			<div class="pnlSuccess feedbackGood marginTop marginRight" data-text="languageChanged" hidden>
		</div>
	`
}