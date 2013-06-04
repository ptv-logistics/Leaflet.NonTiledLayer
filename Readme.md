While Leaflet supports the de-facto standard for stitching map from tiles, 
it doesn't seem to have a concept for imagery data which cannot be tiled.

However, not all imagery providers can handle tiles properly, for example if they render labels dynamically.
Leaflet.NonTiledLayer.WMS is the implementation which makes WMS requests, similar to the TileLayer.WMS

You can see a sample for this layer for PTV's xMapServer WMS service (this is why i've built it),
together with a OSM overlay.
http://oliverheilig.github.io/Leaflet.NonTiledLayer/NonTiledDemo.html
