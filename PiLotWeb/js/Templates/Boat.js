var PiLot = PiLot || {};
PiLot.Templates = PiLot.Templates || {};

PiLot.Templates.Boat = {

	boatImageLink:
		'<object type="image/svg+xml" style="height:100%; max-height:100%; max-width:100%; position:absolute;"></object>',

	boatSetupForm: 
		`<div class="boatSetupForm dialogPanel" hidden>
			<span class="block semiBold marginBottom" data-text="boatSetup"></span>
			<div class="plhFeatures"></div>
			<div class="buttons reverse marginTop">
				<a href="#" class="btnBoatSetupOk linkButton bold" data-text="ok"></a>
				<a href="#" class="btnBoatSetupCancel linkButton" data-text="cancel"></a>
			</div>
		</div>`,

	boatFeatureSelect:
		`<div>
			<span class="lblFeatureName"></span>
			<select class="fullWidth marginBottomSmall selFeatureStates"></select>
		</div>`,

	boatPage:
		`<div class="contentPadding">
			<div class="dataContainerFull marginBottom">
				<h1><a href="#" class="lnkSettings" data-text="settings">Einstellungen</a> : <span data-text="boat"></span></h1>
				<div class="boatConfigSlider">	
					<div class="configNameFrame">
						<span class="plhConfigName semiBold"></span>
					</div>
					<div class="imageFrame">
						<img  /> 
					</div>
					<div class="buttons">
						<a href="#" class="btnLeft block linkButton"><i class="icon-arrow-left"></i></a>
						<a href="#" class="btnRight block linkButton"><i class="icon-arrow-right"></i></a>
					</div>
				</div>
			</div>
		</div>`,

	configSliderImageLeft: '<img style="height:100%;margin-left:-100%;" />',

	configSliderImageRight: '<img style="height:100%;" />',

	startPageBoatImage: `
		<div class="border startPageBoat">
			<div class="plhBoatSetupForm hidden"></div>
			<div class="divImageContainer"></div>
			<div class="plhAlternativeSetups">
				<div class="divAlternativeSetup"></div>
			</div>
		</div>`

};