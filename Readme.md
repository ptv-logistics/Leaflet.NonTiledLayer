While Leaflet handles the de-facto standard for stitching a map from tiles very well, 
i havent' found a concept for imagery data which cannot be tiled.

However, not all imagery providers can handle tiles properly, for example if they render labels dynamically.
So i've added a Leaflet.NonTiledLayer which gets the imagery for the complete map viewport, whenever it changes.
Leaflet.NonTiledLayer.WMS is the implementation which makes WMS requests, similar to the TileLayer.WMS.

You can see a sample here

http://oliverheilig.github.io/Leaflet.NonTiledLayer/NonTiledDemo.html

It uses the WMS service of the xMap Server http://xserver.ptvgroup.com/en-uk/products/ptv-xserver/ptv-xmap
from PTV Group, which requires a tiled/non-tiled hybrid approach (and that is the reason i've built this).
It also displays an OSM WMS overlay which also cannot be requested in tiles.
