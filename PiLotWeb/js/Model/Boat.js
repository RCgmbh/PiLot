var PiLot = PiLot || {};
PiLot.Model = PiLot.Model || {};

PiLot.Model.Boat = (function () {

	/// Class BoatConfig, representing the static config of the boat, containing non - changing
	/// info like the names and number of sails, availability of an engine etc. 
	var BoatConfig = function (pName) {
		this.name = pName;
		this.displayName = null;
		this.rawConfig = null;	// this will be passed further to create the BoatImageConfig
		this.features = null;
		this.boatSetups = null;
		this.initialize();
	};

	BoatConfig.prototype = {

		initialize: function () {
			this.features = new Map();
			this.boatSetups = new Array();
		},

		/** gets the name of this config */
		getName: function () {
			return this.name;
		},

		/** gets the display name to be used in the GUI */
		getDisplayName: function () {
			return this.displayName;
		},

		/** sets the displayName used in the GUI */
		setDisplayName: function (pDisplayName) {
			this.displayName = pDisplayName;
		},

		/** returns the raw config object for further use */
		getRawConfig: function () {
			return this.rawConfig;
		},

		/**
		 * sets the raw object which was used to create this, to be
		 * used to create View-specific objects from this
		 */
		setRawConfig: function (pRawConfig) {
			this.rawConfig = pRawConfig;
		},

		/// returns a map with all features (key: featureId, value: BoatFeature)
		getFeatures: function () {
			return this.features;
		},

		/// adds a BoatFeature if it's not null or undefined
		addFeature: function (pFeature) {
			if (pFeature) {
				this.features.set(pFeature.getFeatureId(), pFeature);
			}
		},

		/// gets the predefined BoatSetups for this boat, an array containing
		/// BoatSetup objects
		getBoatSetups: function () {
			return this.boatSetups;
		},

		/// adds a BoatSetup, if it's not null or undefined
		addBoatSetup: function (pBoatSetup) {
			if (pBoatSetup) {
				this.boatSetups.push(pBoatSetup);
			}
		},

		/// returns either the first of the predefined boat setups, or
		/// an empty setup
		getDefaultSetup: function () {
			var result;
			if (this.boatSetups.length > 0) {
				result = this.boatSetups[0].clone();
			} else {
				result = new BoatSetup('', this);
			}
			return result;
		}
	};

	/**
	 * Creates a BoatConfig object based on a data object, as it will be recieved from the server.
	 * We also expect the name (the filename without .json), as this is not part of the saved data.
	 * @param {Object} pData - the data object recieved from the server
	 */
	BoatConfig.fromData = function (pData) {
		let result = null;
		if (pData) {
			result = new BoatConfig(pData.name);
			result.setDisplayName(pData.displayName);
			if (pData.features) {
				pData.features.forEach(i => result.addFeature(BoatFeature.fromData(i)));
			}
			if (pData.boatSetups) {
				pData.boatSetups.forEach(i => result.addBoatSetup(BoatSetup.fromData(i, result)));
			}
			result.setRawConfig(pData);
		}
		return result;
	};

	/// A single feature of the boat, e.g a sail or the engine, which
	/// can has different states (set, reefed)
	BoatFeature = function (pFeatureId, pName) {
		this.featureId = pFeatureId;	// the is, a number, unique for the boat
		this.name = pName;				// the name of the feature
		this.states = null;				// a Map (key = stateId, value = FeatureState object)
		this.transitions = null;		// a Map (key = transitionId, value = FeaturesTransition object)
		this.initialize();
	};

	BoatFeature.prototype = {

		initialize: function () {
			this.states = new Map();
		},

		/// adds a state to this feature
		addState: function (pStateId, pStateName) {
			this.states.set(pStateId, new FeatureState(pStateId, this, pStateName));
		},

		/// gets the featureId of this feature
		getFeatureId: function () {
			return this.featureId;
		},

		/// returns the feature's name
		getName: function () {
			return this.name;
		},

		/// return the possible states for this feature. Map with key = stateId and value = stateName
		getStates: function () {
			return this.states;
		}
	};

	BoatFeature.fromData = function (pData) {
		const result = new BoatFeature(pData.featureId, pData.name);
		pData.states.forEach(function (aState) {
			result.addState(aState.stateId, aState.name);
		});
		return result;
	}

	/// The current state of a feature, e.g. "reef 1" for the feature
	/// main Sail. 
	var FeatureState = function (pStateId, pFeature, pName) {
		this.stateId = pStateId;
		this.feature = pFeature;
		this.name = pName;
	};

	FeatureState.prototype = {

		getStateId: function () {
			return this.stateId;
		},

		getName: function () {
			return this.name;
		}
	};

	/// A combination of FeatureStates define a BoatSetup, e.g no engine,
	/// all sails set, on sea. The available BoatStates are explicitly
	/// defined in the boat config file.
	/**
	 * Constructor for BoatSetup
	 * @param {any} pSetupName - for predefined setups the name of the setup
	 * @param {any} pBoatConfig - the BoatConfig this applies to
	 * @param {any} pFeatureStates - an array of objects with {featureId, stateId}
	 */
	var BoatSetup = function (pSetupName, pBoatConfig, pFeatureStates = null) {
		this.name = pSetupName;
		this.boatConfig = pBoatConfig;
		this.featureStates = null;
		this.initialize(pFeatureStates);
	};

	BoatSetup.prototype = {

		/**
		 * initializes the object and assigns the FeatureStates while verifying that
		 * each feature and state are valid for this.boatConfig
		 * @param {Array} pFeatureStates - Array of {featureId, stateId} Objects
		 */
		initialize: function (pFeatureStates) {
			this.featureStates = new Map();
			if (pFeatureStates !== null) {
				pFeatureStates.forEach(function (pItem) {
					this.setFeatureState(pItem.featureId, pItem.stateId);	
				}.bind(this));
			}
		},

		/// returns the name of this setup
		getName: function () {
			return this.name;
		},

		/// returns the name of the boat config this applies to
		getBoatConfigName: function () {
			return this.boatConfig.getName();
		},

		/// returns the boatConfig this setup refers to
		getBoatConfig: function () {
			return this.boatConfig;
		},

		/// sets a feature state with featureId and stateId, if this boatConfig has a feature
		/// with this pFeatureId, and the feature has a state with pStateId
		setFeatureState: function (pFeatureId, pStateId) {
			const boatFeatures = this.boatConfig.getFeatures();
			if (boatFeatures.has(pFeatureId) && boatFeatures.get(pFeatureId).getStates().has(pStateId)) {
				this.featureStates.set(pFeatureId, pStateId);
			} else {
				PiLot.log(`Invalid feature for boat config: config name: ${this.boatConfig.name}, featureId: ${pFeatureId}, stateId: ${pStateId}`, 1);
			}
		},

		/// returns a Map with key = featureId, value = stateId which in sum
		/// defines this boat setup
		getFeatureStates: function () {
			return this.featureStates;
		},

		/** returns an array of objects {featureId, stateId} representing the featureStates */
		getFeatureStatesArray: function () {
			let result = new Array();
			this.featureStates.forEach((v, k, m) => result.push({ featureId: k, stateId: v }));
			return result;
		},

		/// creates a clone of this, with the same name (value), config (reference)
		/// and featureStates (reference)
		clone: function () {
			return new BoatSetup(this.name, this.boatConfig, this.getFeatureStatesArray());
		},

		/**
		 * returns true, if this and another setup have the same features with the same states
		 * and are based on a boatConfig with the same name
		 * @param {any} pOther
		 */
		equals: function (pOther) {
			let result = pOther && this.boatConfig.getName() === pOther.getBoatConfigName();
			if (result) {
				for (const keyValue of pOther.getFeatureStates()) {
					result = result && this.featureStates.get(keyValue[0]) === keyValue[1];
					if (!result) {
						break;
					}
				}
			}
			return result;
		},

		/**
		 * Converts this to an object which can be understood by the server, especially
		 * replacing the featureStats by an array of arrays
		 */
		toServerObject: function () {
			let result = {
				name: this.name,
				boatConfigName: this.boatConfig.getName(),
				featureStates: this.getFeatureStatesArray()
			}
			return result;
		}
	};

	/**
	 * Creates a new BoatSetup based on data and a BoatConfig, if pData is not null
	 * @param {any} pData - the data object
	 * @param {any} pBoatConfig - the BoatConfig, corresponding to pData.boatConfigName
	 */
	BoatSetup.fromData = function (pData, pBoatConfig) {
		if (pData) {
			return new BoatSetup(pData.name || '', pBoatConfig, pData.featureStates);
		} else {
			return null;
		}
	};

	/** Reads a list of simple object containing information about all available configs */
	var loadConfigInfosAsync = async function () {
		return PiLot.Utils.Common.getFromServerAsync(`/BoatConfigs`);
	};

	/**
	 * Loads a BoatConfig with a given name from the server and return either a BoatConfig or null
	 * @param {string} pConfigName
	 */
	var loadConfigAsync = async function (pConfigName) {
		return BoatConfig.fromData(await PiLot.Utils.Common.getFromServerAsync(`/BoatConfigs/${pConfigName}`));
	};

	/** Loads the current BoatConfig */
	var loadCurrentConfigAsync = async function () {
		return BoatConfig.fromData(await PiLot.Utils.Common.getFromServerAsync(`/BoatConfigs/current`));
	};

	/** Loads the name of the current BoatConfig */
	var loadCurrentConfigNameAsync = async function () {
		return PiLot.Utils.Common.getFromServerAsync('/Settings/currentBoatConfigName');
	};

	/**
	 * Saves the name of the current BoatConfig
	 * @param {string} pName
	 */
	var saveCurrentConfigNameAsync = async function (pName) {
		return await PiLot.Utils.Common.putToServerAsync(`/Settings/currentBoatConfigName?name=${pName}`, null);
	};

	return {
		BoatConfig: BoatConfig,
		BoatFeature: BoatFeature,
		FeaturesState: FeatureState,
		BoatSetup: BoatSetup,
		loadConfigAsync: loadConfigAsync,
		loadConfigInfosAsync: loadConfigInfosAsync,
		loadCurrentConfigAsync: loadCurrentConfigAsync,
		loadCurrentConfigNameAsync: loadCurrentConfigNameAsync,
		saveCurrentConfigNameAsync: saveCurrentConfigNameAsync
	};

})();