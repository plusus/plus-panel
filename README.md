# PLUS-Panel
Extension for gnome-shell to skin the panel for the debian-based PLUS GNU/Linux distribution

## Dependencies
### To build
gnome-common devscripts

### To execute
gnome-menus gir1.2-gmenu-3.0

## To increment the version
* Add an entry in debian/changelog (mandatory)
* Change the version in build_package.sh
* Change the version in configure.ac at line: AC_INIT(pluspanel, <YOUR_VERSION>)

## How to build debian package
Run the build script
./build_package.sh

## How to build locally
In the project root:

./autogen.sh

make

## To install
Once the project is built, install it with:

make install
