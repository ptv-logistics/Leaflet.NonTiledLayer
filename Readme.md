While Leaflet handles the de-facto standard for stitching a map from tiles very well, 
i havent' found a concept for imagery data which cannot be tiled.

However, not all imagery providers can handle tiles properly, for example if they render labels dynamically.
So i've added a Leaflet.NonTiledLayer which gets the imagery for the complete map viewport, whenever it changes.
Leaflet.NonTiledLayer.WMS is the implementation which makes WMS requests, similar to the TileLayer.WMS.

You can see a sample here
http://oliverheilig.github.io/Leaflet.NonTiledLayer/NonTiledDemo.html
It uses the layer PTV's xMapServer WMS service, which needs a tiled+non-tiled hybrid approach
(which is the reason i've built this), together with a OSM WMS overlay which also cannot be requested in tiles.
