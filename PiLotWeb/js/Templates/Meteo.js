var PiLot = PiLot || {};
PiLot.Templates = PiLot.Templates || {};

PiLot.Templates.Meteo = {

	meteoPage: `
		<div class="contentPadding">
			<div class="plhChartContainer meteoChartContainer marginBottom"></div>
			<div class="plhMeteoblue dataContainerFull paddingAll marginBottom hidden"></div>
			<div class="plhMoon dataContainerFull paddingAll marginBottom"></div>
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
				<div class="divChart chartContainer hidden"></div>
				<div class="divChartLoading chartWait" ><span data-text="loadingData"></span></div>
				<div class="divChartError chartError hidden" ><span data-text="error"></span></div>
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
				<div class="divChart chartContainer hidden"></div>
				<div class="divChartLoading chartWait"><span data-key="loadingData"></span></div>
				<div class="divChartError chartError hidden" ><span data-key="error"></span></div>
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
				<div class="divChart chartContainer hidden"></div>
				<div class="divChartLoading chartWait"><span data-text="loadingData"></span></div>
				<div class="divChartError chartError hidden"><span data-text="error"></span></div>
				<div class="divLabel"><i class="icon-barometer"></i> <span class="lblName"></span></div>
			</div>
		</div>
	`,

	moonInfo: `
		<div class="dataContainerFull marginBottom marginRightBig">
			<div class="borderBox bgLight fullWidth">
				<div class="moonContainer block hCenter center">
					<img src="img/moonNew.svg" class="imgMoonNew moonImage active" />
					<img src="img/moonWaxingCrescent.svg" class="imgMoonWaxingCrescent moonImage" />
					<img src="img/moonFirstQuarter.svg" class="imgMoonFirstQuarter moonImage" />
					<img src="img/moonWaxingGibbous.svg" class="imgMoonWaxingGibbous moonImage" />
					<img src="img/moonFull.svg" class="imgMoonFull moonImage" />
					<img src="img/moonWaningGibbous.svg" class="imgMoonWaningGibbous moonImage" />
					<img src="img/moonThirdQuarter.svg" class="imgMoonThirdQuarter moonImage" />
					<img src="img/moonWaningCrescent.svg" class="imgMoonWaningCrescent moonImage" />
					<div class=" divTodayBar moonTodayBar borderLightBlue"></div>
				</div>
			</div>
		</div>`,

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