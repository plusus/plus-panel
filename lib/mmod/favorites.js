/**
 * package: plus-panel
 * sub-package: lib.mmod.favorites
 * author: Samuel Longchamps <samuel.longchamps@usherbrooke.ca>
 * license: LiLiQ-P, Version 1.1 <https://www.forge.gouv.qc.ca/participez/licence-logicielle/licence-libre-du-quebec-liliq-in-english/quebec-free-and-open-source-licence-%C2%96-permissive-liliq-p-v1-1/>
 */


/**
 * Base package
 * 
 * package: mmod-panel
 * sub-package: lib.mmod.favorites
 * author:  Richard B. Winters <a href='mailto:rik@mmogp.com'>rik AT mmogp DOT com</a>
 * copyright: 2011-2015 Massively Modified, Inc.
 * license: Apache, Version 2.0 <http://www.apache.org/licenses/LICENSE-2.0>
 */


// Deps
const shell = imports.gi.Shell;
const clttr = imports.gi.Clutter;
const st = imports.gi.St;
const meta = imports.gi.Meta;
const Tweener = imports.ui.tweener;

const main = imports.ui.main;

const favs = imports.ui.appFavorites;
const adisp = imports.ui.appDisplay;
const dnd = imports.ui.dnd;
const dash = imports.ui.dash;

const lang = imports.lang;

const FADE_TIME = 0.25;

let Me = null;

/**
 * Favorites modification allows for the display of favorite and running apps on the panel, and allows the end user
 * to manage the favorite apps included in the display, their order, etc.; as if managing favorites in the overview.
 *
 * @since 0.1.0
 */
function mod() {

    this.appSystem = null;
    this.panelBox = main.panel.actor.get_parent();
    this.container = main.panel._leftBox;
    this.appMenu = null;

    this.box = null;
    
    this.workId = null;

    this.loaded = null;
    this.active = null;

    this.connections = null;

    this.list = null;
    this.previous = null;
    this.favorites = null;
    this.running = null;
    this.displayed = [];

    this.dragCancelled = false;
    this.dragMonitor = null;

    this.active = false;
    this.initialized = false;
    this.iconSize = 32;

	Me = this;
}


/**
 * Method to initialize the display of favorites and/or running apps on the panel
 *
 * @args none
 *
 * @return void
 *
 * @since 0.1.0
 */
mod.prototype.enable = function() {
    this.box = new st.BoxLayout({
        name: 'favoritesBox'
    });

    this.displayed = [];

    if(!this.workId) {
        // This asks Gnome to defer invocation of this method 
        // until it will not affect normal system operations
        this.workId = main.initializeDeferredWork(this.box,
                                                  lang.bind(this, this.update));
    }

    this.appSystem = shell.AppSystem.get_default();
    this.active = true;

    // We must force an update regardless if deferred work is initialized
    this.update();

    this.appMenu = this.container.get_child_at_index(3);
    this._moveAppMenuToRight();
    
}

mod.prototype._moveAppMenuToRight = function() {
    this.container.remove_child(this.appMenu);
    main.panel._rightBox.insert_child_at_index(this.appMenu, 0);
}

mod.prototype._moveAppMenuToLeft = function() {
    main.panel._rightBox.remove_child(this.appMenu);
    this.container.add_child(this.appMenu);
}


/**
 * Method to disable modification(s) to the panel
 *
 * @args none
 *
 * @return void
 *
 * @since 0.1.0
 */
mod.prototype.destroy = function() {
    if( this.active )
    {
        this._moveAppMenuToLeft();
        
        // Disconnect any signals so we aren't causing problems
        this.disconnect();

        // Nullify oalist if necessary
        if( this.previous )
        {
            this.previous = null
        }

        // Remove the list of favorite apps
        if( this.list )
        {
            this.list = null;
        }

        // Our list of favorite and running apps to display can be destroyed now
        if( this.displayed )
        {
            for( let i in this.displayed )
            {
                // Remove the actor (array of favorites to be displayed) from the favorite container
                //this.alaunch.remove_actor( this.inDisplay[o].icon.actor );
                this.displayed[i].icon.actor.destroy();
                this.displayed[i].icon = null;
            }

            this.displayed = null;
        }

        // Remove the container used to display the array of favorite apps on the panel
        if( this.loaded )
        {
            this.container.remove_child( this.box );
            this.loaded = false;
        }

        // Now delete our list of favorites
        if( this.favorites )
        {
            this.favorites = null;
        }

        // The list of running apps
        if( this.running )
        {
            this.running = null;
        }

        if( this.appSystem )
        {
            this.appSystem = null;
        }

        // The box
        if( this.box )
        {
            this.box.destroy();
            this.box = null;
        }

        // And finally the workId since we'll need to get a new one
        if( this.workId )
        {
            this.workId = null;
        }

        this.active = false;
        this.initialized = false;
    }
}

mod.prototype._loadContainer = function() {
    if(!this.loaded) {
        // Insert at second position, after the Application button
        this.container.insert_child_at_index(this.box, 2);
        
        // Connect to the signals that are needed in order to properly reload 
        // the list of favorite/running apps at various times
        this.connect();

        this.loaded = true;
    }
}

/**
 * Compute the list of applications to be displayed, both favorite and running
 */
mod.prototype._updateApplicationList = function() {
    this.list = [];

    // First get the current map of favorites
    let favorites = favs.getAppFavorites().getFavoriteMap();

    // Add the stored/registered favorites to the list
    for(let id in favorites) {
        this.list.push(favorites[id]);
    }

    // Do the same for any running apps if applicable
    let running = this.appSystem.get_running();
    for(let i = 0; i < running.length; ++i) {
        if(!(running[i].get_id() in favorites)) {
            this.list.push(running[i]);
        }
    }    
}

mod.prototype._clearApplications = function() {
    this.previous = this.displayed;

    // Remove all actors from the box
    for(let i = 0; i < this.displayed.length; ++i) {
        this.box.remove_actor(this.displayed[i].icon.actor);
    }
    this.displayed = null;
    this.displayed = [];
}

mod.prototype._createApplicationItem = function(application, index) {
    let appIcon = new adisp.AppIcon(application, {showLabel: true});
    appIcon.icon.setIconSize(this.iconSize);
    
    this.displayed.push({
        app: application,
        icon: appIcon,
        pos: index
    });
	
    // Setup dnd handlers in the AppIcon container
    // TODO: Fix drag-n-drop
    appIcon.icon.handleDragOver = this.handleDragOver;
    appIcon.icon.acceptDrop = this.acceptDrop;
	
    // Immediately add the new actor the the app launch container
    this.box.add_actor(appIcon.actor);

    // Once the actor is on the stage let's start messing with its theme in order to avoid error
    let button = this.box.get_child_at_index(index);

    // Size of container
    button.set_size(2*this.iconSize, 2*this.iconSize);
}

/**
 * Query the cache for an application item already created for a given 
 * application. An index allows for a first guess at the position which will
 * be right most of the time.
 */
mod.prototype._getApplicationItemFromCache = function(app, index) {
    if(!this.initialized) {
        // There can't be anything in the cache if the module isn't initialized
        return null;
    }
    
    let previousItem = this.previous[index];
   
    if(previousItem && previousItem.app == app) {
        return previousItem;
    } else {
        for(let previousIter of this.previous) {
            if(previousIter.app == app) {
                return previousIter;
            }
        }
    }

    return null;
}

/**
 * Method to update the display of favorites and/or running apps on the panel
 *
 * @args none
 *
 * @return void
 *
 * @since 0.1.0
 */
mod.prototype.update = function() {
    // Load the container to be displayed even prior to adding children to 
    // it in order to avoid get_theme_node() errors
    this._loadContainer();

    // Get the list of applications to display
    this._updateApplicationList();

    this._clearApplications();

    for(let i = 0; i < this.list.length; ++i) {
        let app = this.list[i];
        let item = this._getApplicationItemFromCache(app, i);

        if(item != null) {
            item.pos = i;
            this.displayed.push(item);
            this.box.add_actor(this.displayed[i].icon.actor);
        } else {
            this._createApplicationItem(app, i);
        }
    }

    // Once this method has been called, the module is considered initialized
    this.initialized = true;
}


/**
 * Method to requeue deferred work for the gnome-shell
 *
 * @args none
 *
 * @return void
 *
 * @since 0.1.0
 */
mod.prototype.queueUpdate = function()
{
   if(this.workId) {
       main.queueDeferredWork(this.workId);
   }
}


/**
 * Method to initialize event handlers for signals related to the display of 
 * favorites on the panel
 *
 * @args none
 * @return void
 * @since 0.1.0
 */
mod.prototype.connect = function()
{
    this.connections = [
        [
            this.appSystem,
            this.appSystem.connect(
                'installed-changed',
                lang.bind(
                    this,
                    function() {
                        favs.getAppFavorites().reload();
                        this.queueUpdate();
                    }
                )
            )
        ],
        [
            favs.getAppFavorites(), favs.getAppFavorites().connect( 'changed', lang.bind( this, this.queueUpdate ) )
        ],
        [
            this.appSystem, this.appSystem.connect( 'app-state-changed', lang.bind( this, this.queueUpdate ) )
        ],
        [
            main.overview, main.overview.connect( 'item-drag-begin', lang.bind( this, this.onDragBegin ) )
        ],
        [
            main.overview, main.overview.connect( 'item-drag-end', lang.bind( this, this.onDragEnd ) )
        ],
        [
            main.overview, main.overview.connect( 'item-drag-cancelled', lang.bind( this, this.onDragCancelled ) )
        ],
        [
            main.overview,
            main.overview.connect('showing',
                                  lang.bind(this, this.onOverviewShowing))
        ],
        [
            main.overview,
            main.overview.connect('hidden',
                                  lang.bind(this, this.onOverviewHidden))
        ]
    ];
}

/**
 * Method to remove the display of favorites from the panel
 *
 * @args none
 *
 * @return void
 *
 * @since 0.1.0
 */
mod.prototype.disconnect = function() {
    if(this.connections) {
        for(let i = 0; i < this.connections.length; i++) {
            this.connections[i][0].disconnect(this.connections[i][1]);
        }
        this.connections = null;
    }
}

mod.prototype.onOverviewShowing = function() {
    if(this.loaded) {
        Tweener.addTween(this.box, {
            opacity: 0,
            time: 0.25,
            transition: "easeOutQuad",
            onCompleteScope: this,
            onComplete: function() {
                this.box.hide();
            }
         });
    }
}

mod.prototype.onOverviewHidden = function() {
    if(this.loaded) {
        this.box.show();
        Tweener.addTween(this.box, {
            opacity: 255,
            time: 0.25
        });
    }
}

/**
 * Drag and Drop handler for item-drag-begin event
 *
 * @args none
 *
 * @return void
 *
 * @since 0.1.0
 */
mod.prototype.onDragBegin = function()
{
    this.panelBox.raise( global.top_window_group );
    this.dragCancelled = false;
    this.dragMonitor =
    {
        dragMotion: lang.bind( this, this.onDragMotion )
    };
    dnd.addDragMonitor( this.dragMonitor );
};


/**
 * Drag and Drop handler for item-drag-cancelled event
 *
 * @args none
 *
 * @return void
 *
 * @since 0.1.0
 */
mod.prototype.onDragCancelled = function()
{
    this.dragCancelled = true;
    this.endDrag();
};


/**
 * Drag and Drop handler for item-drag-end event
 *
 * @args none
 *
 * @return none
 *
 * @since 0.1.0
 */
mod.prototype.onDragEnd = function()
{
    if( this.dragCancelled )
    {
        return;
    }

    this.endDrag();
};


/**
 * Method to processes post-drag tasks
 *
 * @args none
 *
 * @return void
 *
 * @since 0.1.0
 */

mod.prototype.endDrag = function()
{
    // Remove placeholder(s) from the alaunch
    let children = this.box.get_children();
    for( let i in children )
    {
        if( children[i].has_style_class_name instanceof Function )
        {
            if( children[i].has_style_class_name( 'dash-item-container' ) )
            {
                this.box.get_child_at_index( i ).destroy();
            }
        }
    }

    // Free up additional memory
    for( let child in this.displayed )
    {
        if( child && child.icon && child.icon.placeholder )
        {
            child.icon.placeholder.destroy();
            child.icon.placeholder = null;

            if( child.icon.placeholderPos )
            {
                child.icon.placeholderPos = null;
            }
        }
    }

    dnd.removeDragMonitor( this.dragMonitor );


    this.panelBox.lower( main.messageTray.actor.get_parent() );
};


/**
 * Drag and Drop handler for DragMonitor events
 *
 * @param de    DragEvent   Defines params specific to the drag event
 *
 * @return dnd.DragMotionResult
 *
 * @since 0.1.0
 */

mod.prototype.onDragMotion = function( de )
{
    let app = dash.getAppFromSource( de.source );
    if( !app )
    {
        return dnd.DragMotionResult.CONTINUE;
    }

    return dnd.DragMotionResult.CONTINUE;
};


/**
 * Drag and Drop handler for DragMonitor events
 *
 * @param s     Defines the source object
 * @param a     Defines the dragged actor
 * @param x     Defines the x position of the mouse(source) within the target
 * @param y     Defines the y position of the mouse(source) within the target
 * @param t     Defines the time of the event
 *
 * @return dnd.DragMotionResult
 *
 * @since 0.1.0
 */
mod.prototype.handleDragOver = function( s, a, x, y, t )
{
    /*if( !this.settings.get_boolean( 'display-favorites-enabled' ) )
    {
        return dnd.DragMotionResult.NO_DROP;
    }*/

    let app = dash.getAppFromSource( s );
    if( !app || app.is_window_backed() )
    {
        return dnd.DragMotionResult.NO_DROP;
    }

    let favorites = favs.getAppFavorites().getFavorites();

    let cafavPos = favorites.indexOf( app );
    let ctfavPos = favorites.indexOf( this.app );

    if( ctfavPos == -1 )
    {
        // If the dragged actor (cafavPos) is not in the list of favorites (-1), the move is not allowed

        // If the target actor (ctfavPos) is not in the list of favorites (-1 ), the move is not allowed

        return dnd.DragMotionResult.NO_DROP;
    }

    let move = false;
    if( cafavPos > -1 )
    {
        move = true;
    }


    // Otherwise the dragged item can be moved to the target position, let's put a placeholder there which
    // will display until the drag is ended or the dragged actor is moved to another position.

    // Since this could be that extended drag to a new position, let's test to see if we have any placeholders
    // in the alaunch that need to be removed:
    let children = a.get_parent().get_children();                                   // The parent is UIGroup
    let panelBoxIndex = children.indexOf( main.panel.actor.get_parent() );          // Get the index of the panelBox
    let panelBox = a.get_parent().get_child_at_index( panelBoxIndex );              // To get a handle to the panelBox

    // Next we figure out which index the favoritesBox should be within the leftBox of the panel
    let favoritesBoxIndex = 1;
    /*if( !this.settings.get_boolean( 'favorites-before-preferences' ) )
    {
        favoritesBoxIndex = 2;
    }*/

    // And get a handle to our favorites box. We had to go through all this trouble because handleDragOver belongs to the
    // app-well-icon, and not to our favorites modification; making this.box and this.container unavailable to us.
    let favoritesBox = panelBox.get_child_at_index( 0 ).get_child_at_index( 0 ).get_child_at_index( favoritesBoxIndex );

    // Now go ahead and remove all found placeholders
    for( let i = 0; i < favoritesBox.get_n_children(); i++ )
    {
        let child = favoritesBox.get_child_at_index( i );
        if( child.has_style_class_name instanceof Function )
        {
            if( child.has_style_class_name( 'dash-item-container' ) )
            {
                child.destroy();
            }
        }
    }

    // And create a new placeholder (moving just leads to need to iterate again anyhow to remove any extras)
    this.placeholder = null;
    this.placeholderPos = null;

    // This is a check to ensure we're actually making a move, and also
    // allows us to configure where the placeholder will go so the item
    // is moved to the appropriate 'side' of the target actor.
    if( cafavPos < ctfavPos )
    {
        this.placeholderPos = ctfavPos + 1;
    }
    else
    {   // We can't let == work.
        if( cafavPos > ctfavPos )
        {
            this.placeholderPos = ctfavPos;
        }
        else
        {
            return dnd.DragMotionResult.NO_DROP;
        }
    }

    // If we're going to display a placeholder
    if( this.placeholderPos !== null )
    {
        this.placeholder = new dash.DragPlaceholderItem();
        this.placeholder.child.set_width( 12 );
        this.placeholder.child.set_height( 36 );

        // Insert it at the target position
        favoritesBox.insert_child_at_index( this.placeholder, this.placeholderPos );

        // Then show it once it's on the stage to avoid errors
        this.placeholder.show( true );
    }

    if( move )
    {
        return dnd.DragMotionResult.MOVE_DROP;
    }

    return dnd.DragMotionResult.COPY_DROP;
};


/**
 * Drag and Drop handler for DragMonitor events
 *
 * @param s     Defines the source object
 * @param a     Defines the dragged actor
 * @param x     Defines the x position of the mouse(source) within the target
 * @param y     Defines the y position of the mouse(source) within the target
 * @param t     Defines the time of the event
 *
 * @return dnd.DragMotionResult | boolean
 *
 * @since 0.1.0
 */
mod.prototype.acceptDrop = function( s, a, x, y, t )
{
    /*if( !this.settings.get_boolean( 'display-favorites-enabled' ) )
    {
        return true;
    }*/

    let app = dash.getAppFromSource( s );
	let dest = null;
	let app2 = null;
    if( !app || app.is_window_backed() )
    {
        return false;
    }

    let favorites = favs.getAppFavorites().getFavorites();

    let cafavPos = favorites.indexOf( app );
    let ctfavPos = favorites.indexOf( this.app );

	for(let i = 0; i < Me.displayed.length; ++i) {
		if(this == Me.displayed[i].icon.icon){
			dest = Me.displayed[i];
    		app2 = dash.getAppFromSource(dest.icon);
			ctfavPos = favorites.indexOf( app2 );
		}
    }
	
    let move = false;
    if( ctfavPos == -1 )
    {
        // If the target actor (ctfavPos) is not in the list of favorites (-1 ), the move or addition is not handled by steward
        return false;
    }
    if( cafavPos > -1 )
    {
        // As long as the dragged actor (cafavPos) is in the list of favorites (> -1), its a move (if we've gotten this far, anyhow)
        move = true;
    }


    // Let's see if the user meant to make a move or addition, but first we'll return true if it is being dropped someplace without
    // a placeholder since that would mean we put it back to its original position
    //if( !this.placeholder )
    //{
    //    return true;
    //}

    // Let's get the id of the application
    let id = app.get_id();

    // And actually manipulate our favorites list accordingly
    meta.later_add
    (
        meta.LaterType.BEFORE_REDRAW,
        lang.bind
        (
            this,
            function()
            {
                let favorites = favs.getAppFavorites();
                if( move )
                {
                    favorites.moveFavoriteToPos( id, ctfavPos );
                }
                else
                {
                    favorites.addFavoriteAtPos( id, ctfavPos );
                }
            }
        )
    );

    return false;
};