/// safely initialize Namespaces
var PiLot = PiLot || {};
PiLot.Templates = PiLot.Templates || {};

PiLot.Templates.Settings = {

	settingsOverviewPage: `<div class="contentPadding">
		<h1>Einstellungen</h1>
		<a href="" class="lnkTime tile big">
			<div>
				<span class="symbol"><i class="icon-time2"></i></span>
				<span class="label">Bordzeit</span>
			</div>
		</a>
		<a href="" class="lnkBoatConfig tile big">
			<div>
				<span class="symbol"><i class="icon-sailing-boat-water1"></i></span>
				<span class="label">Boots-Config</span>
			</div>
		</a>
	</div>`,

	boatTimePage: `
		<div class="contentPadding">
			<h1><a href="#" class="lnkSettings">Einstellungen</a> : Bordzeit</h1>
			<div class="dataContainerHalf paddingRight marginBottomBig">
				<span class="timeLabel strong">Bordzeit:</span><span id="lblBoatTime" class="strong"></span><br />
				<span class="timeLabel">Bordzeit UTC Offset:</span><span id="lblBoatTimeOffset"></span> h<br />
				<span class="timeLabel">Bordzeit anpassen</span><a href="#" id="btnMinus">-1 h</a> / <a href="#" id="btnPlus">+1 h</a> 
			</div>
			<div class="dataContainerHalf paddingRight marginBottom">
				<canvas id="clockCanvas"></canvas>
			</div>
		</div>
	`

}