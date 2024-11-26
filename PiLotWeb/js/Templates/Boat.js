var PiLot = PiLot || {};
PiLot.Templates = PiLot.Templates || {};

PiLot.Templates.Boat = {

	boatImageLink:
		'<object type="image/svg+xml" style="height:100%; max-height:100%; max-width:100%; position:absolute;"></object>',

	boatSetupForm:
		`<div class="pnlOverlay vCenter overlay" hidden>
			<div class="boatSetupForm dialogPanel hCenter paddingAllSmall">
				<span class="block semiBold marginBottom" data-text="boatSetup"></span>
				<div class="plhFeatures"></div>
				<div class="buttons reverse marginTop marginBottom">
					<a href="#" class="btnBoatSetupOk linkButton bold" data-text="ok"></a>
					<a href="#" class="btnBoatSetupCancel linkButton" data-text="cancel"></a>
				</div>
			</div>
		</div>`,

	boatFeatureSelect:
		`<div>
			<span class="lblFeatureName"></span>
			<select class="fullWidth marginBottomSmall selFeatureStates"></select>
		</div>`,

	boatSetupDetails:
		`<div class="pnlOverlay vCenter overlay" hidden>
			<div class="pnlDialog boatSetupDetails dialogPanel hCenter">
				<div class="flexRow bgLight paddingAllSmall" style="justify-content:flex-end;">
					<a href="#" class="lnkClose" style="flex-grow:0;"><i class="icon-cross"></i></a>
				</div>
				<div class="flexRowWrap paddingAllSmall" style="justify-content:center">
					<div class="plhImage image marginRight"></div>
					<div class="plhFeatures features"></div>
				</div>
			</div>
		</div>`,

	boatFeatureInfo:
		`<div class="flexRowWrap" style="border-bottom:1px dotted;">
			<span class="lblFeatureName col5"></span> <span class="lblFeatureState"></span>
		</div>`,

	boatPage:
		`<div>
			<div class="contentPadding marginRight">
				<h1><a href="#" class="lnkSettings" data-text="settings"></a> : <span data-text="boat"></span></h1>
			</div>
			<div class="plhBoatImages boatImages flexRowWrap" style="justify-content:center;"><div>
		</div>`,

	boatImage:
		`<div class="boatImage marginAll">
			<img class="imgBoat" style="width:100%;" />
			<span class="lblConfigName center"></span>
		</div>`,


	startPageBoatImage: `
		<div class="border startPageBoat">
			<div class="plhBoatSetupForm hidden"></div>
			<div class="divImageContainer"></div>
			<div class="plhAlternativeSetups">
				<div class="divAlternativeSetup"></div>
			</div>
		</div>`

};