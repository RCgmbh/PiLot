/// safely initialize Namespaces
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
		<a href="" class="lnkWiFi tile big">
			<div>
				<span class="symbol"><i class="icon-connection"></i></span>
				<span class="label" data-text="wifi"></span>
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

	wifiPage: `
		<div class="contentPadding">
			<h1><a href="#" class="lnkAdmin" data-text="administration"></a> : <span data-text="wifi"></span></h1>
			<div class="pnlOutput marginBottom" style="font-family:courier; color:white; background-color:black; height:5.5em; max-width:54em; padding: 0.5em; white-space: pre;
			border:3px solid; border-color: #333 #bbb #bbb #333; overflow:auto;"></div>
			<div style="text-align:center; max-width:54em;" class="marginRight marginBottom">
				<a href="#" class="lnkRefresh"><i class="icon-loop2"></i></a>
				<i class="icon-hour-glass icoWait" hidden></i>
				<a href="#" class="lnkStatus marginLeft"><i class="icon-info"></i></a>
			</div>
			<div class="pnlNetworkKey dialogPanel" style="width: 21em;" hidden>
				<div class="fullWidth right"><a href="#" class="btnClose marginRightSmall"><i class="icon-cross"></i></a></div>
				<div class="paddingAll">
					<span class="lblDialogTitle block bold marginBottom" data-text="wifiConnectX"></span>
					<div class="marginBottom">
						<span data-text="wifiKey" class="input6 "></span>
						<input type="password" class="tbWifiKey input12" autocomplete="off" value="" />
					</div>
					<a href="#" class="btnCancel linkButton input6" data-text="cancel"></a>
					<a href="#" class="btnConnect linkButton input6" data-text="wifiConnect"></a>
				</div>
			</div>
			<div class="plhNetworks marginBottom marginRight" style="max-width: 54em;"></div>
		</div>
	`,

	networkInfo: `
		<div class="lnkNetwork" style="display:flex; border-bottom: 1px dotted #999;">
			<div style="width:2em;">
				<i class="icon-wifi-low icoWeak"></i><i class="icon-wifi-mid icoMedium"></i><i class="icon-wifi-full icoStrong"></i>
			</div>
			<a class="lnkName blockLink" href="#" style="flex-grow:1; padding: 0.125em 0.25em;" data-title="wifiConnect"></a>
			<div style="min-width:4.5em; text-align:right;">
				<i class="icon-checkmark icoConnected marginRight" data-title="wifiConnected"></i><a class="lnkForget" href="#" data-title="wifiForget"><i class="icon-cross"></i></a>
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