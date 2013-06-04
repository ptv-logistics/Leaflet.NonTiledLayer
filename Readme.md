While Leaflet handles the de-facto standard for stitching a map from tiles very well, 
i haven't found a concept for imagery data which cannot be queried in tiles.

Not all imagery providers can handle tiles properly, for example if they render labels dynamically.
So i've added a Leaflet.NonTiledLayer which gets the imagery for the complete map viewport whenever it changes.
Leaflet.NonTiledLayer.WMS is the implementation which makes WMS requests, similar to the TileLayer.WMS.

You can see a sample here

http://oliverheilig.github.io/Leaflet.NonTiledLayer/NonTiledDemo.html

It uses the WMS service of xMap-Server http://xserver.ptvgroup.com/en-uk/products/ptv-xserver/ptv-xmap/
from PTV Group, which requires a tiled/non-tiled hybrid approach (and that is the reason i've built this).
The sample also displays an OSM WMS overlay which also cannot be requested in tiles.
