var PiLot = PiLot || {};
PiLot.Templates = PiLot.Templates || {};

PiLot.Templates.Analyze = {

	analyzePage: `
		<div class="fullHeight fullWidth flexColumn">
			<div class="flexRowWrap reverse grow paddingTop">
				<div class="contentColumn marginLeftSmall marginRightSmall flex">
					<div class="easyShadow grow marginBottomSmall" style="min-height: 70vh; max-height:90vh;">
						<div class="pnlMap" style="height: 100%;"></div>
					</div>
				</div>
				<div class="contextColumn marginLeftSmall marginRightSmall">
					<div class="flexColumn easyShadow paddingLeftSmall paddingRightSmall marginBottomSmall" style="max-height: 90vh; overflow: auto;">
						<h3 data-text="tackAngles"></h3>
						<div class="flexRowWrap paddingBottomSmall">
							<label class="marginRight"><input type="radio" name="rblMode" value="0" class="rblMode" /><span data-text="live"></span></label>
							<label><input type="radio" name="rblMode" value="1" class="rblMode" /><span data-text="historic"></span></label>
						</div>
						<div class="plhLiveTacks"></div>
						<div class="plhHistoricTacks"></div>
						<div class="plhSettings"></div>
					</div>
				</div>
			</div>
		</div>`,

	historicTacksInfo: `
		<div class="flexColumn">
			<div class="marginTopSmall marginBottomSmall">
				<input type="text" class="tbDate input4 marginRightSmall" />
				<div class="divCalDate" hidden></div>
				<button class="btnLoadData" data-text="loadData"></button>
			</div>
			<div class="plhTracksList"></div>
			<div class="pnlNoData feedbackWarning marginBottom" data-text="noData" hidden></div>
		</div>
	`,

	liveTackInfo: `
		<div class="flexColumn borderLight paddingAllSmall">
			<div class="pnlNoData feedbackWarning marginBottom" data-text="noGpsData" hidden></div>
			<div>
				<div class="marginBottom flexRow" style="align-items:baseline; justify-content:space-between;">
					<span class="semiBold" data-text="tackAngle"></span>
					<span class="veryBigDisplayText"><span class="lblTackAngle">-</span>°</span>
				</div>
				<div class="flexRow" style="align-items:baseline; justify-content:space-between;">
					<span class="semiBold" data-text="vmg"></span>
					<div><span class="lblVMG veryBigDisplayText">-</span> <span data-text="kn"></span></div>
				</div>
			</div>
		</div>
	`,

	tackAnalyzerOptions: `
		<div class="marginTop">
			<span class="lblSettings block fullWidth semiBold marginBottomSmall" data-text="settings"></span>
			<div class="pnlSettings" hidden>
				<div class="flexRowWrap paddingRight paddingBottomSmall">
					<span class="col6 marginRight" data-text="scale"></span>
					<div class="col10 flex">
						<select class="ddlSliderScale input8">
							<option value="1">1</option>
							<option value="10">10</option>
							<option value="100">100</option>
						</select>
					</div>
				</div>
				<div class="flexRowWrap paddingBottomSmall">
					<span class="col6 marginRight" data-text="sample"></span>
					<div class="col10 flex">
						<input type="range" class="rngMinSampleLength input8 marginRightSmall" min="0" max="50" step="1" />
						<span class="lblMinSampleLength"></span>&nbsp;m
					</div>
				</div>
				<div class="flexRowWrap paddingBottomSmall">
					<span class="col6 marginRight" data-text="maximalDeviation"></span>
					<div class="col10 flex">
						<input type="range" class="rngMaxSampleAngle input8 marginRightSmall" min="0" max="180" step="1" />
						<span class="lblMaxSampleAngle"></span>°
					</div>
				</div>
				<div class="flexRowWrap paddingBottomSmall">
					<span class="col6 marginRight" data-text="minimalTackAngle"></span>
					<div class="col10 flex">
						<input type="range" class="rngMinTurnAngle input8 marginRightSmall" min="0" max="180" step="1" />
						<span class="lblMinTurnAngle"></span>°
					</div>
				</div>				
				<div class="flexRowWrap paddingBottomSmall">
					<span class="col6 marginRight" data-text="maximalTackAngle"></span>
					<div class="col10 flex">
						<input type="range" class="rngMaxTurnAngle input8 marginRightSmall" min="0" max="180" step="1" />
						<span class="lblMaxTurnAngle"></span>°
					</div>
				</div>
				<div class="flexRowWrap paddingBottomSmall">
					<span class="col6 marginRight" data-text="maximalTackDistance"></span>
					<div class="col10 flex">
						<input type="range" class="rngMaxTurnDistance input8 marginRightSmall" min="0" max="100" step="1" />
						<span class="lblMaxTurnDistance"></span>&nbsp;m
					</div>
				</div>
				<div class="flexRowWrap paddingBottomSmall">
					<span class="col6 marginRight" data-text="minimalLeg1"></span>
					<div class="col10 flex">
						<input type="range" class="rngMinLeg1Length input8 marginRightSmall" min="0" max="100" step="1" />
						<span class="lblMinLeg1Length"></span>&nbsp;m
					</div>
				</div>
				<div class="flexRowWrap paddingBottomSmall">
					<span class="col6 marginRight" data-text="minimalLeg2"></span>
					<div class="col10 flex">
						<input type="range" class="rngMinLeg2Length input8 marginRightSmall" min="0" max="100" step="1" />
						<span class="lblMinLeg2Length"></span>&nbsp;m
					</div>
				</div>
				<div class="flexColumn marginTop paddingBottomSmall">
					<a href="#" class="lnkSaveSettings block" hidden><i class="icon-floppy-disk marginRightSmall"></i><span data-text="saveSettings"></span></a>
					<div data-text="saveSettingsSuccess" class="pnlSaveSuccess feedbackGood marginTopSmall grow" hidden></div>
				</div>
			</div>
		</div>
	`,

	tackLineOptions: { color: 'rgb(238, 102, 102)', weight: 4 }
};