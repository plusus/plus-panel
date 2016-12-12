/**
 * package: plus-panel
 * sub-package: lib.mmod.position
 * author: Samuel Longchamps <samuel.longchamps@usherbrooke.ca>
 * license: LiLiQ-P, Version 1.1 <https://www.forge.gouv.qc.ca/participez/licence-logicielle/licence-libre-du-quebec-liliq-in-english/quebec-free-and-open-source-licence-%C2%96-permissive-liliq-p-v1-1/>
 */

/**
 * Base package
 * 
 * package: mmod-panel
 * sub-package: lib.mmod.position
 * author:  Richard B. Winters <a href='mailto:rik@mmogp.com'>rik AT mmogp DOT com</a>
 * copyright: 2011-2015 Massively Modified, Inc.
 * license: Apache, Version 2.0 <http://www.apache.org/licenses/LICENSE-2.0>
 */

// Dependencies
const main = imports.ui.main;
const lang = imports.lang;
const clutter = imports.gi.Clutter;

/**
 * Modifier for the panel in order to move it either to the top or the bottom
 * and applying it a custom style with CSS
 * 
 * @param styleClassName Class name to be used for styling, must be defined in
 *                       in the stylesheet
 * @type styleClassName String
 */
function PanelModifier(styleClassName) {
    this.box = main.panel.actor.get_parent();
    this.clock = main.panel._centerBox.get_child_at_index(0);
    this.realize = -1;
    this.original_y = 0;
    this.modifiedStyleClass = styleClassName;
}

/**
 * Allow to place the panel on top of the primary monitor
 */
PanelModifier.prototype.placeToTop = function() {
    this.box.set_y(main.layoutManager.primaryMonitor.y);
}

/**
 * Allow to place the panel at the bottom of the primary monitor
 */
PanelModifier.prototype.placeToBottom = function() {
    this.box.set_y(main.layoutManager.primaryMonitor.height - this.box.get_height());
}

/**
 * Allow to place the panel at a preferred position, by default to the bottom
 */
PanelModifier.prototype.placeToPreferred = function() {this.placeToBottom();}

PanelModifier.prototype.placeToOriginal = function() {
    this.box.set_y(this.original_y);
}

PanelModifier.prototype._moveClockToRight = function() {
    main.panel._centerBox.remove_child(this.clock);
    main.panel._rightBox.add_child(this.clock);
}

PanelModifier.prototype._moveClockToCenter = function() {
    main.panel._rightBox.remove_child(this.clock);
    main.panel._centerBox.add_child(this.clock);
}

/**
 * Apply modifications to the panel
 */
PanelModifier.prototype.modifyPanel = function() {
    main.panel._addStyleClassName(this.modifiedStyleClass);
    this.placeToPreferred();
    this._moveClockToRight();
}

/**
 * Reverse any modifications made to the panel
 */
PanelModifier.prototype.unmodifyPanel = function() {
    main.panel._removeStyleClassName(this.modifiedStyleClass);
    this.placeToOriginal();
    this._moveClockToCenter();
}

/**
 * Callback function to move the panel to a selected position upon realization
 * of the panel
 */
PanelModifier.prototype.onRealization = function() {
    if(this.realize > 0) {
        this.box.disconnect(this.realize);
        this.realize = 0;
    }
    
    this.modifyPanel();
}

/**
 * Enable the position modifier
 */
PanelModifier.prototype.enable = function()
{
    this.original_y = this.box.get_y();

    // Connect to signal of new allocated box which is called whenever an 
    // update in form of allocation is done to an actor, in this case the 
    // panel's box
    this.box.connect(
        'allocation-changed',
        lang.bind(this, this.placeToPreferred));
    
    // Handle realize if applicable
    if(this.realize < 0) {
        // Shell/Extension has just initialized
        this.realize = this.box.connect('realize',
                                        lang.bind(this, this.onRealization));
    }

    if(this.realize >= 0) {
        this.modifyPanel();
    }
}

/**
 * Disable upon destruction
 */
PanelModifier.prototype.disable = function() {
    this.unmodifyPanel();
    this.realize = 0;
}
