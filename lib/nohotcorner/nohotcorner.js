/**
 * Inspired by No Topleft Hot Corner by HRomano (nohotcorner@azuri.free.fr)
 * see: https://github.com/HROMANO/nohotcorner/
 * Licence: GPL-2 (https://github.com/HROMANO/nohotcorner/blob/master/LICENSE)
 */

const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;
const Config = imports.misc.config;

let _hot_corner_id;

function _disable_hot_corners() {
  // Disables all hot corners
  Main.layoutManager.hotCorners.forEach(function(hot_corner) {
    if (!hot_corner) {
      return;
    }

    hot_corner._toggleOverview = function() {};
    hot_corner._pressureBarrier._trigger = function() {};
  });
}

function enable() {
  _disable_hot_corners();
  // Hot corners may be re-created afterwards (for example, If there's a monitor change).
  // So we catch all changes.
  _hot_corner_id = Main.layoutManager.connect('hot-corners-changed', _disable_hot_corners);
}

function disable() {
  // Disconnects the callback and re-creates the hot corners
  Main.layoutManager.disconnect(_hot_corner_id);
  Main.layoutManager._updateHotCorners();
}
