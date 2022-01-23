/// safely initialize Namespaces
var PiLot = PiLot || {};
PiLot.Templates = PiLot.Templates || {};

PiLot.Templates.Admin = {

	adminOverviewPage: `<div class="contentPadding">
		<h1 data-key="administration"></h1>
		<a href="" class="lnkTime tile big">
			<div>
				<span class="symbol"><i class="icon-time2"></i></span>
				<span class="label" data-key="time"></span>
			</div>
		</a>
		<a href="" class="lnkServices tile big">
			<div>
				<span class="symbol"><i class="icon-cogs"></i></span>
				<span class="label" data-key="services"></span>
			</div>
		</a>
		<a href="" class="lnkSystemStatus tile big">
			<div>
				<span class="symbol"><i class="icon-thermometer"></i></span>
				<span class="label" data-key="temperature"></span>
			</div>
		</a>
		<a href="" class="lnkLog tile big">
			<div>
				<span class="symbol"><i class="icon-stack"></i></span>
				<span class="label" data-key="logfiles"></span>
			</div>
		</a>
		<a href="#" class="lnkShutDown tile big">
			<div>
				<span class="symbol"><i class="icon-switch"></i></span>
				<span class="label" data-key="shutDown"></span>
			</div>
		</a>
	</div>`,

	timePage: `
		<div class="contentPadding">
			<h1><a href="#" class="lnkSettings" data-key="administration"></a> : <span data-key="time"></span></h1>
			<div class="dataContainerHalf paddingRight marginBottomBig">
				<span class="timeLabel" data-key="clientTime"></span><span id="lblClientTime"></span><br />
				<span class="timeLabel" data-key="clientTimeOffset"></span><span id="lblClientErrorOffset"></span>&nbsp;s<br />
				<span class="timeLabel" data-key="clientUTCOffset"></span><span id="lblClientTimezoneOffset"></span>&nbsp;h<br /><br />
				<span class="timeLabel" data-key="serverTimeUTC"></span><span id="lblServerTime"></span>
				<a href="#" class="lnkSetServerTime marginLeft" data-key="applyClientTime"><i class="icon-loop2"></i></a> <br />
				<br /><br />
				<span class="timeLabel strong" data-key="boatTime"></span><span id="lblBoatTime" class="strong"></span><br />
				<span class="timeLabel" data-key="boatTimeUTCOffset"></span><span id="lblBoatTimeOffset"></span>&nbsp;h<br />
				<span class="timeLabel" data-key="changeBoatTime"></span><a href="#" id="btnMinus">-1 h</a> / <a href="#" id="btnPlus">+1&nbsp;h</a> 
			</div>
			<div class="dataContainerHalf paddingRight marginBottom">
				<canvas id="clockCanvas"></canvas>
			</div>
		</div>
	`,

	systemStatusPage: `
		<div class="contentPadding">
			<h1><a href="#" class="lnkSettings" data-key="administration"></a> : <span data-key="cpuTemperature"></span></h1>
			<div class="dataContainerHalf">
				<div class="chartContainer hidden"></div>
				<div class="chartError hidden" data-key="errorLoading"></div>
				<div class="chartWait" data-key="pleaseWait"></div>
			</div>
		</div>
	`,

	servicesPage: `
		<div class="contentPadding">
			<h1><a href="#" class="lnkAdmin" data-key="administration"></a> : <span data-key="services"></span></h1>
			<div class="plhServices"></div>
		</div>
	`,

	serviceInfo: `
		<div class="marginBottomSmall" style="display:flex">
			<div style="min-width:8.5em;">
				<span class="lblService semiBold"></span><br />
				<a href="#" class="lnkStart marginRightSmall biggerText" data-key="serviceStart"><i class="icon-play2"></i></a>
				<a href="#" class="lnkStop marginRightSmall biggerText" data-key="serviceStop"><i class="icon-stop"></i></a>
				<a href="#" class="lnkRestart biggerText" data-key="serviceRestart"><i class="icon-loop2"></i></a>
			</div>
			<div>
				<span class="lblStatus" data-key="loadingStatus"></span>
			</div>
		</div>
	`,

	logFilePage: `
		<div class="contentPadding marginRight">
			<h1><a href="#" class="lnkSettings" data-key="administration"></a> : <span data-key="logfiles"></span></h1>
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
						<th data-key="filename"></th>
						<th class="right" data-key="dateUTC"></th>
						<th class="right" data-key="kb"></th>
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