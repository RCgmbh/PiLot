﻿/// safely initialize Namespaces
var PiLot = PiLot || {};
PiLot.Templates = PiLot.Templates || {};

PiLot.Templates.Admin = {

	adminOverviewPage: `<div class="contentPadding">
		<h1 data-text="administration"></h1>
		<a href="" class="lnkTime tile big">
			<div>
				<span class="symbol"><i class="icon-time2"></i></span>
				<span class="label" data-text="time"></span>
			</div>
		</a>
		<a href="" class="lnkServices tile big">
			<div>
				<span class="symbol"><i class="icon-cogs"></i></span>
				<span class="label" data-text="services"></span>
			</div>
		</a>
		<a href="" class="lnkSystemStatus tile big">
			<div>
				<span class="symbol"><i class="icon-thermometer"></i></span>
				<span class="label" data-text="temperature"></span>
			</div>
		</a>
		<a href="" class="lnkLog tile big">
			<div>
				<span class="symbol"><i class="icon-stack"></i></span>
				<span class="label" data-text="logfiles"></span>
			</div>
		</a>
		<a href="#" class="lnkShutDown tile big">
			<div>
				<span class="symbol"><i class="icon-switch"></i></span>
				<span class="label" data-text="shutDown"></span>
			</div>
		</a>
	</div>`,

	timePage: `
		<div class="contentPadding">
			<h1><a href="#" class="lnkSettings" data-text="administration"></a> : <span data-text="time"></span></h1>
			<div class="dataContainerHalf paddingRight marginBottomBig">
				<span class="timeLabel" data-text="clientTime"></span><span id="lblClientTime"></span><br />
				<span class="timeLabel" data-text="clientTimeOffset"></span><span id="lblClientErrorOffset"></span>&nbsp;s<br />
				<span class="timeLabel" data-text="clientUTCOffset"></span><span id="lblClientTimezoneOffset"></span>&nbsp;h<br /><br />
				<span class="timeLabel" data-text="serverTimeUTC"></span><span id="lblServerTime"></span>
				<a href="#" class="lnkSetServerTime marginLeft" data-title="applyClientTime"><i class="icon-loop2"></i></a> <br />
				<br /><br />
				<span class="timeLabel strong" data-text="boatTime"></span><span id="lblBoatTime" class="strong"></span><br />
				<span class="timeLabel" data-text="boatTimeUTCOffset"></span><span id="lblBoatTimeOffset"></span>&nbsp;h<br />
				<span class="timeLabel" data-text="changeBoatTime"></span><a href="#" id="btnMinus">-1 h</a> / <a href="#" id="btnPlus">+1&nbsp;h</a> 
			</div>
			<div class="dataContainerHalf paddingRight marginBottom">
				<canvas id="clockCanvas"></canvas>
			</div>
		</div>
	`,

	systemStatusPage: `
		<div class="contentPadding">
			<h1><a href="#" class="lnkSettings" data-text="administration"></a> : <span data-text="cpuTemperature"></span></h1>
			<div class="dataContainerHalf">
				<div class="chartContainer hidden"></div>
				<div class="chartError hidden" data-text="errorLoading"></div>
				<div class="chartWait" data-text="pleaseWait"></div>
			</div>
		</div>
	`,

	servicesPage: `
		<div class="contentPadding">
			<h1><a href="#" class="lnkAdmin" data-text="administration"></a> : <span data-text="services"></span></h1>
			<div class="plhServices"></div>
		</div>
	`,

	serviceInfo: `
		<div class="marginBottomSmall" style="display:flex">
			<div style="min-width:8.5em;">
				<span class="lblService semiBold"></span><br />
				<a href="#" class="lnkStart marginRightSmall biggerText" data-title="serviceStart"><i class="icon-play2"></i></a>
				<a href="#" class="lnkStop marginRightSmall biggerText" data-title="serviceStop"><i class="icon-stop"></i></a>
				<a href="#" class="lnkRestart biggerText" data-title="serviceRestart"><i class="icon-loop2"></i></a>
			</div>
			<div>
				<span class="lblStatus" data-text="loadingStatus"></span>
			</div>
		</div>
	`,

	logFilePage: `
		<div class="contentPadding marginRight">
			<h1><a href="#" class="lnkSettings" data-text="administration"></a> : <span data-text="logfiles"></span></h1>
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
						<th data-text="filename"></th>
						<th class="right" data-text="dateUTC"></th>
						<th class="right" data-text="kb"></th>
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