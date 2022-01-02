/// safely initialize Namespaces
var PiLot = PiLot || {};
PiLot.Templates = PiLot.Templates || {};

PiLot.Templates.Admin = {

	adminOverviewPage: `<div class="contentPadding">
		<h1>Administration</h1>
		<a href="" class="lnkTime tile big">
			<div>
				<span class="symbol"><i class="icon-time2"></i></span>
				<span class="label">Zeit &amp; Datum</span>
			</div>
		</a>
		<a href="" class="lnkServices tile big">
			<div>
				<span class="symbol"><i class="icon-cogs"></i></span>
				<span class="label">Services</span>
			</div>
		</a>
		<a href="" class="lnkSystemStatus tile big">
			<div>
				<span class="symbol"><i class="icon-thermometer"></i></span>
				<span class="label">Temperatur</span>
			</div>
		</a>
		<a href="" class="lnkLog tile big">
			<div>
				<span class="symbol"><i class="icon-stack"></i></span>
				<span class="label">Logfiles</span>
			</div>
		</a>
		<a href="#" class="lnkShutDown tile big">
			<div>
				<span class="symbol"><i class="icon-switch"></i></span>
				<span class="label">Shut down</span>
			</div>
		</a>
	</div>`,

	timePage: `
		<div class="contentPadding">
			<h1><a href="#" class="lnkSettings">Administration</a> : Zeit</h1>
			<div class="dataContainerHalf paddingRight marginBottomBig">
				<span class="timeLabel">Client-Zeit:</span><span id="lblClientTime"></span><br />
				<span class="timeLabel">Abweichung Client-Zeit:</span><span id="lblClientErrorOffset"></span>&nbsp;s<br />
				<span class="timeLabel">Client UTC Offset:</span><span id="lblClientTimezoneOffset"></span>&nbsp;h<br /><br />
				<span class="timeLabel">Server-Zeit UTC:</span><span id="lblServerTime"></span>
				<a href="#" class="lnkSetServerTime marginLeft" title="Client-Zeit auf Server übertragen"><i class="icon-loop2"></i></a> <br />
				<br /><br />
				<span class="timeLabel strong">Bordzeit:</span><span id="lblBoatTime" class="strong"></span><br />
				<span class="timeLabel">Bordzeit UTC Offset:</span><span id="lblBoatTimeOffset"></span>&nbsp;h<br />
				<span class="timeLabel">Bordzeit anpassen</span><a href="#" id="btnMinus">-1 h</a> / <a href="#" id="btnPlus">+1&nbsp;h</a> 
			</div>
			<div class="dataContainerHalf paddingRight marginBottom">
				<canvas id="clockCanvas"></canvas>
			</div>
		</div>
	`,

	systemStatusPage: `
		<div class="contentPadding">
			<h1><a href="#" class="lnkSettings">Administration</a> : CPU Temperatur</h1>
			<div class="dataContainerHalf">
				<div class="chartContainer hidden"></div>
				<div class="chartError hidden">Fehler beim Laden</div>
				<div class="chartWait">Bitte warten...</div>
			</div>
		</div>
	`,

	servicesPage: `
		<div class="contentPadding">
			<h1><a href="#" class="lnkAdmin">Administration</a> : Services</h1>
			<div class="plhServices"></div>
		</div>
	`,

	serviceInfo: `
		<div class="marginBottomSmall" style="display:flex">
			<div style="min-width:8.5em;">
				<span class="lblService semiBold"></span><br />
				<a href="#" class="lnkStart marginRightSmall biggerText" title="Start"><i class="icon-play2"></i></a>
				<a href="#" class="lnkStop marginRightSmall biggerText" title="Stop"><i class="icon-stop"></i></a>
				<a href="#" class="lnkRestart biggerText" title="Restart"><i class="icon-loop2"></i></a>  
			</div>
			<div>
				<span class="lblStatus">lade Status...</span>
			</div>
		</div>
	`,

	logFilePage: `
		<div class="contentPadding marginRight">
			<h1><a href="#" class="lnkSettings">Administration</a> : Logfiles</h1>
			<div style="border:1px solid #666; font-family: Lucida Console;" class="divLogFile fullWidth marginBottom hidden">
				<div style="display:flex; justify-content:space-between" class="fullWidth paddingAll">
					<span class="lblFilename"></span>
					<a href="#" class="lnkCloseLogFile"><i class="icon-cross"></i></a>
				</div>
				<div class="divContent paddingAll"></div>
			</div>
			<div class="divLogFilesList">
				<table class="tblLogFiles dgTable marginBottom">
					<tr class="dgHeader">
						<th>Filename</th>
						<th class="right">Datum UTC</th>
						<th class="right">KB</th>
					<tr>
					<tr class="trTemplate">
						<td class="tdFilename"><a href="#" class="lnkFile"></a></td>
						<td class="tdDate right"></td>
						<td class="tdBytes right"></td>
					</tr>
				</table>
				<div class="divPaging paging marginBottom hidden"></div>
			</div>
		</div>
	` 
}