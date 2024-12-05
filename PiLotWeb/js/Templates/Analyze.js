var PiLot = PiLot || {};
PiLot.Templates = PiLot.Templates || {};

PiLot.Templates.Analyze = {

	analyzePage: `
		<div class="plhMainContent flexrowWrap">
			<div class="pnlSettings flexRowWrap grow easyShadow bgLight paddingAllSmall marginAllSmall" style="flex-basis:20%;">
				<div class="flexRowWrap paddingRight paddingBottom">
					<span class="col6 marginRight">Sample</span>
					<div class="col10 flex">
						<input type="range" class="rngMinSampleLength input8 marginRightSmall" min="0" max="100" step="1" value="0" />
						<span class="lblMinSampleLength"></span>&nbsp;m
					</div>
				</div>
				<div class="flexRowWrap paddingRight paddingBottom">
					<span class="col6 marginRight">Max. Abweichung</span>
					<div class="col10 flex">
						<input type="range" class="rngMaxSampleAngle input8" min="0" max="180" value="0" />
						<span class="lblMaxSampleAngle"></span>°
					</div>
				</div>
				<div class="flexRowWrap paddingRight paddingBottom">
					<span class="col6 marginRight">Min. Wendewinkel</span>
					<div class="col10 flex">
						<input type="range" class="rngMinTurnAngle input8" min="0" max="180" value="0" />
						<span class="lblMinTurnAngle"></span>°
					</div>
				</div>
				<div class="flexRowWrap paddingRight paddingBottom">
					<span class="col6 marginRight">Max Wendedistanz</span>
					<div class="col10 flex">
						<input type="range" class="rngMaxTurnDistance input8" min="0" max="500" value="0" />
						<span class="lblMaxTurnDistance"></span>&nbsp;m
					</div>
				</div>
				<div class="flexRowWrap paddingRight paddingBottom">
					<span class="col6 marginRight">Min. Leg 1</span>
					<div class="col10 flex">
						<input type="range" class="rngMinLeg1Length input8" min="1" max="1000" value="0" />
						<span class="lblMinLeg1Length"></span>&nbsp;m
					</div>
				</div>
				<div class="flexRowWrap paddingRight paddingBottom">
					<span class="col6 marginRight">Min. Leg 2</span>
					<div class="col10 flex">
						<input type="range" class="rngMinLeg2Length input8" min="1" max="1000" value="0" />
						<span class="lblMinLeg2Length"></span>&nbsp;m
					</div>
				</div>
			</div>
			<div class="pnlNoData feedbackWarning marginAll" data-text="noData" hidden></div>
			<div class="easyShadow marginAllSmall grow" style="flex-basis: 80%;">
				<div class="pnlMap" style="height: 60vh;"></div>
			</div>
		</div>`,

	tackLineOptions: { color: 'rgb(238, 102, 102)', weight: 4 }
};