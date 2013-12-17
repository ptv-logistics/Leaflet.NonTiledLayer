/*
 * L.NonTiledLayer is an addon for leaflet which renders dynamic image overlays
 */
L.NonTiledLayer = L.Class.extend({
    options: {
        attribution: '',
    },

    // override this method in the inherited class
    getImageUrl: function (world1, world2, width, height) {},

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

        this._labelOverlay.off('load', this._imageloaded, this);
        this._labelOverlay = null;
    },

    addTo: function (map) {
        map.addLayer(this);
        return this;
    },

    // TODO remove bringToFront/bringToBack duplication from TileLayer/Path
    bringToFront: function () {
        if (this._labelOverlay) {
            this._map._panes.overlayPane.appendChild(this._labelOverlay);
        }
        return this;
    },

    bringToBack: function () {
        var pane = this._map._panes.overlayPane;
        if (this._labelOverlay) {
            pane.insertBefore(this._labelOverlay, pane.firstChild);
        }
        return this;
    },

    getAttribution: function () {
        return this.options.attribution;
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

        if (this._labelOverlay) {
            // update existing image hide the existing image to avoid flicker
            L.DomUtil.setOpacity(this._labelOverlay._image, 0);

            // set new url and bounds
            this._labelOverlay.setUrl(url);
            this._labelOverlay._bounds = bounds;

            // initializes the new position/transform
            this._labelOverlay._reset();
        } else {
            // create the initial label layer
            this._labelOverlay = new L.ImageOverlay(url, bounds);
            this._map.addLayer(this._labelOverlay);

            // attach to load event to reset opacity later
            this._labelOverlay.on('load', this._imageloaded, this);
        }
    },

    _imageloaded: function () {
        this._labelOverlay._updateOpacity();
    }
});

L.nonTiledLayer = function () {
    return new L.TileLayer();
};