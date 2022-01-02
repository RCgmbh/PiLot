L.Control.ScaleNautic = L.Control.Scale.extend({
	options: {
		nautic: false
	},

	_addScales: function(options, className, container) {
		L.Control.Scale.prototype._addScales.call(this, options, className, container);
		L.setOptions(options);
		if (this.options.nautic) {
			this._nScale = L.DomUtil.create('div', className, container);
		}
	},

	_updateScales: function (maxMeters) {
		L.Control.Scale.prototype._updateScales.call(this, maxMeters);
		if (this.options.nautic && maxMeters) {
			this._updateNautic(maxMeters);
		}
	},

	_updateNautic: function (maxMeters) {
		var scale = this._nScale,
			maxNauticalMiles = maxMeters / 1852, nauticalMiles;

		nauticalMiles = this._getRoundNum(maxNauticalMiles);

		scale.style.width = Math.round(this.options.maxWidth * (nauticalMiles / maxNauticalMiles)) - 10 + 'px';
		scale.innerHTML = nauticalMiles + ' nm';
	},
	
	_getRoundNum: function (num) {
        var pow10, d;
		if (num >= 1) {
			pow10 = Math.pow(10, (Math.floor(num) + '').length - 1);
			d = num / pow10;
		}
		else {
            pow10 = 1;
            d = num;
			while (d < 1) {
				d *= 10;
				pow10 *= 10;
			}
		} 
		
		d = d >= 10 ? 10 :
		    d >= 5 ? 5 :
		    d >= 3 ? 3 :
			d >= 2 ? 2 : 1;
		
		return num >= 1 ? pow10 * d : d / pow10;
	}
});

L.control.scalenautic = function (options) {
	return new L.Control.ScaleNautic(options);
};
