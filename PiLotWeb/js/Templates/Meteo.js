var PiLot = PiLot || {};
PiLot.Templates = PiLot.Templates || {};

PiLot.Templates.Meteo = {

	sensorsPage: `
		<div class="contentPadding">
			<h1 data-text="measurements"></h1>
			<div class="pnlNoSensors feedbackWarning marginRight" data-text="noSensors" hidden></div>
			<div class="pnlData marginRight">
				<div>
					<div class="flexRowWrap reverse">
						<div class="flexRowWrap reverse marginRight marginBottom">
							<label class="marginRight"><input type="radio" name="rblTimeMode" value="historic" /><span data-text="measurementsHistoric"></span></label>
							<label class="marginRight"><input type="radio" name="rblTimeMode" value="current" checked /><span data-text="measurementsCurrent"></span></label>
						</div>
						<select class="ddlDateRange input8 marginBottom"></select><span class="lblLoading marginLeft" hidden><i class="icon-hour-glass"></i></span>
					</div>
					<div class="pnlSelectDate flex" style="align-items:first baseline;" hidden>
						<div class="marginBottomSmall marginRightBig">
							<a href="#" class="lnkPrevious"><i class="icon-arrow-left2"></i></a>
							<i class="icon-calendar2 biggerText lnkCalendar marginLeftSmall marginRightSmall pointer"></i>
							<div class="pnlCalendar" hidden></div>
							<a href="#" class="lnkNext"><i class="icon-arrow-right2"></i></a>
						</div>
						<div><span class="lblFromDate"></span> - <span class="lblToDate"></span></div>
					</div>
				</div>
				<div class="plhChartsContainer meteoChartContainer marginBottom"></div>
			</div>
		</div>
	`,

	startPageMeteo: `
		<div class="border startPageMeteo meteoChartContainer"></div>
	`,

	temperatureInfo: `
		<div class="divMinMax">
			<div class="divData">
				<div class="divMinValue"><i class="icon-arrow-down2"></i><span class="lblMinValue">---</span> &#176;C</div>
				<div class="divCurrentValue"><span class="lblCurrentValue">---</span> &#176;C</div>
				<div class="divMaxValue"><i class="icon-arrow-up2"></i><span class="lblMaxValue">---</span> &#176;C</div>
			</div>
			<div class="divChartContainer">
				<div class="divChart chartContainer" hidden></div>
				<div class="divChartLoading chartWait" ><span data-text="loadingData"></span></div>
				<div class="divLabel"><i class="icon-thermometer"></i><span class="lblName"></span></div>
			</div>
		</div>
	`,

	humidityInfo: `
		<div class="divMinMax">
			<div class="divData">
				<div class="divMinValue"><i class="icon-arrow-down2"></i><span class="lblMinValue">---</span> &#37;</div>
				<div class="divCurrentValue"><span class="lblCurrentValue">---</span> &#37;</div>
				<div class="divMaxValue"><i class="icon-arrow-up2"></i><span class="lblMaxValue">---</span> &#37;</div>
			</div>
			<div class="divChartContainer">
				<div class="divChart chartContainer" hidden></div>
				<div class="divChartLoading chartWait"><span data-key="loadingData"></span></div>
				<div class="divLabel"><i class="icon-droplet"></i> <span class="lblName"></span></div>
			</div>
		</div>
	`,

	pressureInfo: `
		<div class="divPressure">
			<div class="divData">
				<div class="divCurrentPressure"><span class="lblPressure">---</span> hPa</div>
				<div class="divPressureTrendIcons">
					<span class="lblRiseFast hidden"><i class="icon-arrow-up"></i></span>
					<span class="lblRise hidden"><i class="icon-arrow-up-right"></i></span>
					<span class="lblConstant hidden"><i class="icon-arrow-right"></i></span>
					<span class="lblDrop hidden"><i class="icon-arrow-down-right"></i></span>
					<span class="lblDropFast hidden"><i class="icon-arrow-down"></i></span>
					<span class="lblDropExtreme hidden"><i class="icon-arrow-down"></i><i class="icon-arrow-down"></i></span>
				</div>
				<div class="divPressureTrend"><span class="lblPressureTrend">--</span> <span data-text="hPaPH"></span></div>				
			</div>
			<div class="divChartContainer">
				<div class="divChart chartContainer" hidden></div>
				<div class="divChartLoading chartWait"><span data-text="loadingData"></span></div>
				<div class="divLabel"><i class="icon-barometer"></i> <span class="lblName"></span></div>
			</div>
		</div>
	`,

	meteoblueFrame: `
		<div>
			<iframe src="https://www.meteoblue.com/de/wetter/widget/daily/{lat}{lon}?geoloc=fixed&days=7&tempunit=CELSIUS&windunit=KILOMETER_PER_HOUR&precipunit=MILLIMETER&coloured=coloured&pictoicon=0&pictoicon=1&maxtemperature=0&maxtemperature=1&mintemperature=0&mintemperature=1&windspeed=0&windspeed=1&windgust=0&windgust=1&winddirection=0&winddirection=1&uv=0&humidity=0&precipitation=0&precipitation=1&precipitationprobability=0&precipitationprobability=1&spot=0&pressure=0&layout={layout}"
				frameborder="0" scrolling="NO" allowtransparency="true" sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
				style="width: 100%; min-height: 320px; height:calc(15vw + 250px)">
			</iframe>
			<div><!-- DO NOT REMOVE THIS LINK -->
				<a href="https://www.meteoblue.com/de/wetter/woche/{lat}{lon}?utm_source=weather_widget&utm_medium=linkus&utm_content=daily&utm_campaign=Weather%2BWidget" target="_blank">meteoblue</a>
			</div>
		<div>
	`

};