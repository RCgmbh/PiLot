var RC = RC || {};

RC.Utils = {


	/** 
	 * Reads a queryString value. If there is no such query string, returns null
	 * */
	getUrlParameter: function (pKey) {
		var result = null;
		if (typeof pKey === 'string') {
			pKey = pKey.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
			var regex = new RegExp('[\\?&]' + pKey + '=([^&#]*)');
			var results = regex.exec(location.search);
			result = (results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' ')));
		}
		return result;
	},

	/**
	 * sets a query string to an url and returns the resulting url. The url
	 * can be passed either as String or as URL object
	 * @param {string or URL} pUrl
	 * @param {string} pKey
	 * @param {string} pValue
	 */
	setUrlParameter: function (pUrl, pKey, pValue) {
		const isUrl = pUrl instanceof URL;
		let url = isUrl ? pUrl : new URL(pUrl);
		const params = new URLSearchParams(url.search);
		params.set(pKey, pValue);
		url.search = params;
		return isUrl ? url : url.toString();
	},

	/**
	 * Removes a queryString and returns the url
	 * @param {String or URL} pUrl - the url as String or URL object
	 * @param {String} pKey - the key to remove
	 */
	removeUrlParameter: function (pUrl, pKey) {
		const isUrl = pUrl instanceof URL;
		let url = isUrl ? pUrl : new URL(pUrl);
		const params = new URLSearchParams(url.search);
		if (params.has(pKey)) {
			params.delete(pKey);
		}
		url.search = params;
		return isUrl ? url : url.toString();
	},

	/** 
	 *  clears parameters from the current url, and sets the cleared url as 
	 *  current url. This is useful, if on the first load of the page, something
	 *  based on url parameters should happen, but afterwards the page should
	 *  behave as usually.
	 *  @param {Object} pKey - if null, clears all keys, if String clears that one
	 */
	clearUrlParameters: function (pKey) {
		var url = location.href;
		if (typeof pKey === 'string') {
			url = RC.Utils.removeUrlParameter(url, pKey);
		} else {
			url = url.substring(0, url.indexOf('?'));
		}
		window.history.pushState({}, '', url);
	},

	/// creates a dom object using the given tag, assigns css classes and adds it as last
	/// child to pParent. Works with both jQuery objects and HTMLElements
	addDomObject: function (pTag, pParent, pCssClass) {
		var obj = document.createElement(pTag);
		let result;
		/*if (pParent instanceof jQuery) {
			result = $(obj).appendTo(pParent);
			if (pCssClass) {
				result.addClass(pCssClass);
			}
		} else {*/
			result = obj;
			pParent.appendChild(result);
			if (pCssClass) {
				result.classList.add(pCssClass);
			}
		//}		
		return result;
	},

	/// fills a dropdown-list (select) with valued provided as array of arrays [[value, text],...].
	/// optionally, a empty value is added, which can be provided as pEmptyValue, being a string
	/// which will be used for both, value and text, or an array with two items [value, text].
	/*fillJQueryDropdown: function(pDropdown, pValues, pEmptyValue) {
		if ((typeof pEmptyValue !== 'undefined') && (pEmptyValue !== null)) {
			var value, text;
			if (Array.isArray(pEmptyValue) && (pEmptyValue.length === 2)) {
				value = pEmptyValue[0];
				text = pEmptyValue[1]
			} else {
				value = pEmptyValue;
				text = pEmptyValue;
			}
			RC.Utils.addDomObject('option', pDropdown).val(value).text(text);
		}
		pValues.forEach(function (anItem) {
			RC.Utils.addDomObject('option', pDropdown).val(anItem[0]).text(anItem[1]);
		});
	},*/

	/// fills a dropdown-list (select) with values provided as array of arrays [[value, text],...].
	/// optionally, an empty value is added, which can be provided as pEmptyValue, being a string
	/// which will be used for both, value and text, or an array with two items [value, text].
	fillDropdown: function (pDropdown, pValues, pEmptyValue) {
		/*if (pDropdown instanceof jQuery) {
			RC.Utils.fillJQueryDropdown(pDropdown, pValues, pEmptyValue);
		} else {*/
			if ((typeof pEmptyValue !== 'undefined') && (pEmptyValue !== null)) {
				let value, text;
				if (Array.isArray(pEmptyValue) && (pEmptyValue.length === 2)) {
					value = pEmptyValue[0];
					text = pEmptyValue[1]
				} else {
					value = pEmptyValue;
					text = pEmptyValue;
				}
				RC.Utils.addOption(pDropdown, value, text);
			}
			pValues.forEach(function (anItem) {
				RC.Utils.addOption(pDropdown, anItem[0], anItem[1]);
			});
		//}		
	},

	/**
	 * Adds an option to a dropdown-List
	 * @param {HTMLElement} pDropdown - a select element
	 * @param {String} pValue - the value to set
	 * @param {String} pText - the text to set
	 */
	addOption: function (pDropdown, pValue, pText) {
		let option = document.createElement('option');
		option.innerText = pText;
		option.value = pValue;
		pDropdown.appendChild(option);
	},

	// sometimes, if you're lucky, converts a number into a string with a fixed
	// number of digits before and after the comma. Null returns null
	toFixedLength: function (pNumber, pPreComma, pPostComma) {
		var result = null;
		if (pNumber != null) {
			var totalLength = pPreComma + pPostComma + (pPostComma > 0 ? 1 : 0);
			result = '000' + pNumber.toFixed(pPostComma);
			result = result.substr(result.length - (totalLength));
		}
		return result;
	},

	/// reads the value from a textbox and returns it as a number, if it 
	/// is a valid number. Otherwise returns null.
	getNumericValue: function (pTextbox) {
		let result = null;
		let fieldValue = null;
		if (pTextbox instanceof HTMLElement) {
			fieldValue = pTextbox.value;
		}
		/*else if (pTextbox instanceof jQuery) {
			fieldValue = pTextbox.val();
		}*/
		if (RC.Utils.isNumeric(fieldValue)) {
			result = Number(fieldValue);
		}
		return result;
	},

	/// shows a numeric value within a field or control. 
	/// params:
	/// pControl: a jQuery control or a HTMLElement
	/// pValue: the value to display
	/// pDefault: the value to display if pValue is not a number
	/// [pFixed]: if set, the number of decimals to show
	/// [pHideIfEmpty]: Hides the control if it equals ''
	/// [pShowLeadingPlus]: adds a "+" if the value is positive
	showNumericValue: function (pControl, pValue, pDefault, pFixed, pHideIfEmpty, pShowLeadingPlus = false) {
		var text = pDefault;
		if (RC.Utils.isNumeric(pValue)) {
			var number = Number(pValue);
			if ((pFixed !== null) && (typeof pFixed !== 'undefined')) {
				text = number.toFixed(pFixed);
			} else {
				text = number.toString();
			}
			if (pShowLeadingPlus && (number > 0)) {
				text = `+${text}`;
			}
		}
		if (pHideIfEmpty && text === '') {
			pControl.hide();
		} else {
			RC.Utils.setText(pControl, text);
		}
	},

	/** returns a Map with each item of pEvents as key and
	 *  an empty array (to be filled with the observers)
	 *  as value. 
	 *  @param {String | Array} pEvents: The name of the events to create
	 *  */
	initializeObservers: function (pEvents) {
		var result = new Map();
		if (Array.isArray(pEvents)) {
			for (var i = 0; i < pEvents.length; i++) {
				result.set(pEvents[i], new Array());
			}
		} else {
			result.set(pEvents, new Array());
		}
		return result;
	},

	/**
	 * calls all observers that registered for pEvent. Passes the sender
	 * and pArg as parameters. Does nothing, if pObservers is falsy.
	 * @param {Object} pSender: the object in which the event happened
	 * @param {Map} pObservers: Map with event names and arrays of callback functions
	 * @param {String} pEvent: the name of the event, a string (e.g. 'click')
	 * @param {any} pArg: Additional argument to be passed to the callback
	 * @param {Boolean} pRemove: if true, removes the observer after calling it
	 * */
	notifyObservers: function (pSender, pObservers, pEvent, pArg, pRemove = false) {
		if (pObservers && pObservers.has(pEvent)) {
			var eventObservers = pObservers.get(pEvent);
			for (var i = 0; i < eventObservers.length; i++) {
				eventObservers[i](pSender, pArg);
				if (pRemove) {
					eventObservers.remove(i, i);
				}
			}
		}
	},

	/// adds an observer for an event
	/// param pObservers: the Map with the observers
	/// param pEvent: the event name to be observed
	/// param pCallback: the callback to call when pEvent happens
	addObserver: function (pObservers, pEvent, pCallback) {
		if (pObservers.has(pEvent)) {
			var eventObservers = pObservers.get(pEvent);
			if (!eventObservers.includes(pCallback)) {
				eventObservers.push(pCallback);
				PiLot.log(`observer added: ${pEvent}`, 3);
			} else {
				PiLot.log(`observer not added as it already existed: ${pEvent}`, 3);
			}			
		} else {
			console.log('invalid event name: ' + pEvent);
		}
	},

	/**
	 * Removes all observers for a certain event
	 * @param {Map} pObservers - The map with all observers
	 * @param {String} pEvent - The name of the event
	 */
	removeObservers: function (pObservers, pEvent) {
		if (pObservers.has(pEvent)) {
			pObservers.set(pEvent, new Array());
		}
	},

	/// binds some handlers to controls based on them styles
	handleActiveStyles: function () {
		for (element of document.querySelectorAll('.selectOnFocus')) {
			RC.Utils.selectOnFocus(element);
		}
		//$('.selectOnFocus').each(function () { RC.Utils.selectOnFocus($(this)) });
	},

	/** makes sure that the text within a control is selected as soon
	 * as the control gets control
	 * @param {Object} args - the controls as HTMLElement or jQuery item, each parameter will be processed 
	 */
	selectOnFocus: function () {
		for (let i = 0; i < arguments.length; i++) {
			(arguments[i] /*instanceof jQuery ? arguments[i].get(0) : arguments[i]*/).addEventListener('focus', function () { this.select(); });
		}		
	},

	/// sets the text of an element by using innerText. pControl can be
	/// either a jQuery control or an HTMLElement or a jquery object. This
	/// should be prefered over jQuery.text as it does not create new node
	/// and thus fill up memory. Returns the control for easy chaining.
	setText: function (pControl, pText) {
		//if (pControl instanceof HTMLElement) {
			if ('value' in pControl) {
				pControl.value = pText;
			} else {
				pControl.innerText = pText;
			}
		/*}
		else if (pControl instanceof jQuery) {
			var controls = pControl.get();
			controls.forEach(function (item) {
				RC.Utils.setText(item, pText);
			});
		} else {
			console.log(pControl + ' is neither HTMLElement nor jQuery');
		}*/
		return pControl;
	},

	/// makes sure a class is added or removed from an element. 
	/// OBSOLETE, use classList.toggle instead
	toggleClass: function (pControl, pClassName, pAdd) {
		if (pControl && pControl instanceof HTMLElement) {
			pControl.classList.toggle(pClassName, pAdd);
		} 
	},

	/**
	 * Toggles the visibility of an Element using the "hidden" class,
	 * which must be defined in a stylesheet.
	 * @param {Element} pControl - the control to show/hide
	 * @param {Boolean} pVisible - true: show the element, false: hide it, undefined: toggle
	 */
	showHide: function (pControl, pVisible) {
		let hidden = (typeof pVisible !== 'undefined') ? !pVisible : undefined;
		RC.Utils.toggleClass(pControl, 'hidden', hidden);
	},

	/// this takes a string and returns a node, allowing
	/// to quickly create a html Element from template string
	stringToNode: function(pString) {
		var result = null;
		var nodes = this.stringToNodes(pString);
		if (nodes.length > 0) {
			result = nodes[0];
		}
		return result;
	},

	/// this takes a string and returns an array of nodes, allowing
	/// to quickly create html Elements from template string
	stringToNodes: function(pString) {
		var template = document.createElement('template');
		template.innerHTML = pString.trim();
		return template.content.childNodes;
	},

	/// returns whether an element is currently visible
	isVisible: function (pControl) {
		if (pControl instanceof HTMLElement) {
			var style = window.getComputedStyle(pControl);
			return style.getPropertyValue('display') !== 'none';
		} else {
			console.log(`invalid control in isVisible: ${pControl}`);
		}
	},

	/// checks if pValue is a number
	isNumeric: function (pValue) {
		return (typeof pValue !== 'undefined') && (pValue !== null) && !isNaN(parseFloat(pValue)) && isFinite(pValue);
	},

	/**
	 * splits a string using not a single delimiter, but allowing an array of delimiters
	 * @param {String} pString - the input string to split
	 * @param {String[]} pDelimeters - the list of delimiters
	 */
	multiSplit: function (pString, pDelimeters) {
		let result = [pString];
		if (typeof (pDelimeters) == 'string')
			pDelimeters = [pDelimeters];
		while (pDelimeters.length > 0) {
			for (let i = 0; i < result.length; i++) {
				var tempSplit = result[i].split(pDelimeters[0]);
				result = result.slice(0, i).concat(tempSplit).concat(result.slice(i + 1));
			}
			pDelimeters.shift();
		}
		return result;
	}
};

// Array Remove - By John Resig (MIT Licensed)
if (!Array.prototype.remove) {
	Object.defineProperty(Array.prototype, "remove", {
		value: function (from, to) {
			const rest = this.slice((to || from) + 1 || this.length);
			this.length = from < 0 ? this.length + from : from;
			return this.push.apply(this, rest);
		},
		enumerable: false
	});
}

// swaps two items in an array, without performing any checks
if (!Array.prototype.swap) {
	Object.defineProperty(Array.prototype, "swap", {
		value: function (pIndex1, pIndex2) {
			const item = this[pIndex1];
			this[pIndex1] = this[pIndex2];
			this[pIndex2] = item;
		},
		enumerable: false
	});
}

// Returns the last item of an array or null, if the array is empty
if (!Array.prototype.last) {
	Object.defineProperty(Array.prototype, "last", {
		value: function () {
			return this.length > 0 ? this[this.length - 1] : null;
		},
		enumerable: false
	});
} 

// returns a new array which only contains each value once
if (!Array.prototype.distinct) {
	Object.defineProperty(Array.prototype, "distinct", {
		value: function () {
			let result = new Array();
			this.forEach(function (arrayItem) {
				if (!result.some(function (resultItem) { return resultItem === arrayItem })) {
					result.push(arrayItem);
				}
			});
			return result;
		},
		enumerable: false
	});
}

// allows to query a Map for an existing value
if (!Map.prototype.hasValue) {
	Object.defineProperty(Map.prototype, "hasValue", {
		value: function (pValue) {
			let result = false;
			const iterator = this.values();
			let next = iterator.next();
			while (!next.done) {
				if (next.value === pValue) {
					result = true;
					break;
				} else {
					next = iterator.next();
				}
			}
			return result;
		},
		enumerable: false
	});
} 

// clears all child nodes from a Node
if (!Node.prototype.clear) {
	Object.defineProperty(Node.prototype, "clear", {
		value: function () {
			while (this.hasChildNodes()) {
				this.removeChild(this.lastChild);
			}
		},
		enumerable: false
	});
}

/** Appends an array of nodes to a parent node */
if (!Node.prototype.appendChildren) {
	Object.defineProperty(Node.prototype, "appendChildren", {
		value: function (pChildren) {
			for (let i = 0; i < pChildren.length; i++) {
				this.appendChild(pChildren[i]);
			}
		},
		enumerable: false
	});
}

/**
 * Checks wheter a Node is the same or a descendant at any level of another
 * node. This can be used to check wheter an event happened on a certain element
 * or within this element, using something like event.target.isSameOrDescendantOf(myButton)
 * @param {any} pOther
 */
if (!Node.prototype.isSameOrDescendantOf) {
	Object.defineProperty(Node.prototype, "isSameOrDescendantOf", {
		value: function (pOther) {
			let node = this;
			let result = false;
			while ((node !== null) && !result) {
				result = node === pOther;
				node = node.parentNode;
			}
			return result;
		},
		enumerable: false
	});
}

/** replaceAll polyfill for old browsers */
if (!String.prototype.replaceAll) {
	Object.defineProperty(String.prototype, "replaceAll", {
		value: function (pattern, replacement) {
			if (replacement.indexOf(pattern) === -1) {
				let result = this;
				while (result.indexOf(pattern) >= 0) {
					result = result.replace(pattern, replacement);
				}
				return result;
			} else {
				throw new Error('The replacement must not contain the pattern in String.replaceAll (polyfill)');
			}
		},
		enumerable: false
	});
}