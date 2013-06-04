// the layer for the label overlays
L.NonTiledLayer = L.Class.extend({
	options: {
		attribution: '',
    },

	initialize: function (url, options) {
		options = L.setOptions(this, options);
    },

    onAdd: function (map) {
        this._map = map;
        this._update();
        this._map.on('moveend', this._update, this);
    },

    onRemove: function (map) {
        this._map.off('moveend', this._update, this);

        if (this._labelOverlay)
            this._map.removeLayer(this._labelOverlay);
    },

	getAttribution: function () {
		return this.options.attribution;
	},

    _update: function () {
        if (this._labelOverlay)
            this._map.removeLayer(this._labelOverlay);

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

        this._labelOverlay = new L.ImageOverlay(this.getImageUrl(world1, world2, width, height), new L.LatLngBounds(world1, world2));

        this._map.addLayer(this._labelOverlay);
    },

    getImageUrl: function (world1, world2, width, height) {
    }
});

L.nonTiledLayer = function () {
	return new L.TileLayer();
};

