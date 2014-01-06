/*
 * L.NonTiledLayer is an addon for leaflet which renders dynamic image overlays
 */
L.NonTiledLayer = L.Class.extend({
 	includes: L.Mixin.Events,
	options: {
        attribution: '',
		opacity: 1,
		pane: null
    },

    // override this method in the inherited class
    getImageUrl: function (world1, world2, width, height) {},

    initialize: function (options) {
        L.setOptions(this, options);
    },

    onAdd: function (map) {
        this._map = map;
		
		if(this.options.pane)
			this._pane = this.options.pane;
		else
			this._pane = this._map.getPanes().overlayPane;
	
        this._update();
		
		if (map.options.zoomAnimation && L.Browser.any3d) {
			map.on('zoomanim', this._animateZoom, this);
		}

        this._map.on('moveend', this._update, this);

		this._pane.appendChild(this._image);
	},

    onRemove: function (map) {
 		this._pane.removeChild(this._image);

		this._map.off('moveend', this._update, this);
		
		if (map.options.zoomAnimation) {
			map.off('zoomanim', this._animateZoom, this);
		}
    },

    addTo: function (map) {
        map.addLayer(this);
        return this;
    },

	setOpacity: function (opacity) {
		this.options.opacity = opacity;
		this._updateOpacity();
		return this;
	},
	
	// TODO remove bringToFront/bringToBack duplication from TileLayer/Path
	bringToFront: function () {
		if (this._image) {
			this._pane.appendChild(this._image);
		}
		return this;
	},

	bringToBack: function () {
		var pane = this._pane;
		if (this._image) {
			pane.insertBefore(this._image, pane.firstChild);
		}
		return this;
	},
	
	setUrl: function (url) {
		this._url = url;
		this._image.src = this._url;
	},
	
    getAttribution: function () {
        return this.options.attribution;
    },
	
	_initImage: function () {
		this._image = L.DomUtil.create('img', 'leaflet-image-layer');

		if (this._map.options.zoomAnimation && L.Browser.any3d) {
			L.DomUtil.addClass(this._image, 'leaflet-zoom-animated');
		} else {
			L.DomUtil.addClass(this._image, 'leaflet-zoom-hide');
		}

		this._updateOpacity();

		//TODO createImage util method to remove duplication
		L.extend(this._image, {
			galleryimg: 'no',
			onselectstart: L.Util.falseFn,
			onmousemove: L.Util.falseFn,
			onload: L.bind(this._onImageLoad, this),
			src: this._url
		});
	},

	_animateZoom: function (e) {
		var map = this._map,
		    image = this._image,
		    scale = map.getZoomScale(e.zoom),
		    nw = this._bounds.getNorthWest(),
		    se = this._bounds.getSouthEast(),

		    topLeft = map._latLngToNewLayerPoint(nw, e.zoom, e.center),
		    size = map._latLngToNewLayerPoint(se, e.zoom, e.center)._subtract(topLeft),
		    origin = topLeft._add(size._multiplyBy((1 / 2) * (1 - 1 / scale)));

		image.style[L.DomUtil.TRANSFORM] =
		        L.DomUtil.getTranslateString(origin) + ' scale(' + scale + ') ';
	},
	
	_reset: function () {
		var image   = this._image,
		    topLeft = this._map.latLngToLayerPoint(this._bounds.getNorthWest()),
		    size = this._map.latLngToLayerPoint(this._bounds.getSouthEast())._subtract(topLeft);

		L.DomUtil.setPosition(image, topLeft);

		image.style.width  = size.x + 'px';
		image.style.height = size.y + 'px';
	},

    _update: function () {
        var wgsBounds = this._map.getBounds();

        // truncate bounds to valid wgs bounds
        var lon1 = wgsBounds.getNorthWest().lng;
        var lat1 = wgsBounds.getNorthWest().lat;
        var lon2 = wgsBounds.getSouthEast().lng;
        var lat2 = wgsBounds.getSouthEast().lat;
        lon1 = (lon1 + 180) % 360 - 180;
        if (lat1 > 85.05) lat1 = 85.05;
        if (lat2 < -85.05) lat2 = -85.05;
        if (lon1 < -180) lon1 = -180;
        if (lon2 > 180) lon2 = 180;
        var world1 = new L.LatLng(lat1, lon1);
        var world2 = new L.LatLng(lat2, lon2);

        // re-project to corresponding pixel bounds
        var pix1 = this._map.latLngToContainerPoint(world1);
        var pix2 = this._map.latLngToContainerPoint(world2);

        // get pixel size
        var width = pix2.x - pix1.x;
        var height = pix2.y - pix1.y;

        // resulting image is too small
        if (width < 32 || height < 32)
            return;

        var url = this.getImageUrl(world1, world2, width, height);
        var bounds = new L.LatLngBounds(world1, world2);

        if (this._image) 
            // update existing image hide the existing image to avoid flicker
            L.DomUtil.setOpacity(this._image, 0);
		else 
		  this._initImage();
       
	   // set new url and bounds
       this.setUrl(url);
       this._bounds = bounds;

       // initializes the new position/transform
       this._reset();
    },
 
	_onImageLoad: function () {
       this._updateOpacity();
	   this.fire('load');
	},

	_updateOpacity: function () {
		L.DomUtil.setOpacity(this._image, this.options.opacity);
	}
});

L.nonTiledLayer = function () {
    return new L.TileLayer();
};