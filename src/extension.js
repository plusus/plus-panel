/**
 * package: plus-panel
 * author: Samuel Longchamps <samuel.longchamps@usherbrooke.ca>
 * license: LiLiQ-P, Version 1.1 <https://www.forge.gouv.qc.ca/participez/licence-logicielle/licence-libre-du-quebec-liliq-in-english/quebec-free-and-open-source-licence-%C2%96-permissive-liliq-p-v1-1/>
 */

// Convenience
const extensionUtils = imports.misc.extensionUtils;
const thisExtension = extensionUtils.getCurrentExtension();
const convenience = thisExtension.imports.convenience;

// Library imports
const lib = thisExtension.imports.lib;
const appsMenu = lib.appsmenu.appsmenu;
const position = lib.mmod.position;
const applist = lib.mmod.favorites;
const nohotcorner = lib.nohotcorner.nohotcorner;

const Gio = imports.gi.Gio;
const Meta = imports.gi.Meta;
const Main = imports.ui.main;
const Shell = imports.gi.Shell;
const Lang = imports.lang;
// Translation
const appcode = 'plus-panel';
const Gettext = imports.gettext.domain(appcode);
const _ = Gettext.gettext;

let panelModifier, applicationList;

function init() {
    convenience.initTranslations(appcode);

    panelModifier = new position.PanelModifier(appcode);
    applicationList = new applist.mod();
}

function enable() {
    appsMenu.enable();

	Main.wm.addKeybinding('toggle-app-menu',
                              new Gio.Settings({ schema_id: 'org.gnome.shell.extension.keybinding' }),
                              Meta.KeyBindingFlags.NONE,
                              Shell.KeyBindingMode.NORMAL |
                              Shell.KeyBindingMode.OVERVIEW,
                              function(){
									  appsMenu.appsMenuButton.menu.toggle();
							 });

	
    panelModifier.enable();
    applicationList.enable();
    nohotcorner.enable();  

	
}

function disable() {
	//global.display.remove_keybinding(binding);
    appsMenu.disable();
    panelModifier.disable();
    applicationList.destroy();
    nohotcorner.disable();
}
