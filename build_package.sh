#!/bin/bash -e

##############################################################
# CONFIGURATION

## Build config
BUILD_PATH="./builddeb"

## Package config
PACKAGE_NAME='pluspanel'
VERSION='1.0'

## Debian specific config (DO NOT MODIFY)
SRC_EXT='.tar.gz'
DEB_ORIG_EXT='.orig.tar.gz'

DEBIAN_FOLDER='debian'

SRC_SEP='-'
DEB_SEP='_'

UPSTREAM_PKG=$PACKAGE_NAME$SRC_SEP$VERSION
UPSTREAM_SRC_FILENAME=$UPSTREAM_PKG$SRC_EXT
ORIG_PKG_FILENAME=$PACKAGE_NAME$DEB_SEP$VERSION$DEB_ORIG_EXT

##############################################################
# BUILD SCRIPT

echo 'Build path: '$BUILD_PATH
echo '  Upstream package: '$UPSTREAM_PKG
echo '  Upstream source archive to build: '$UPSTREAM_SRC_FILENAME
echo '  Original archive : '$ORIG_PKG_FILENAME

echo '### Begin build'

# Create build folder
rm -rf $BUILD_PATH
mkdir -p $BUILD_PATH

# Create the upstream source package
./autogen.sh
make distcheck

# Create the debian package hierarchy
mv $UPSTREAM_SRC_FILENAME $BUILD_PATH/$ORIG_PKG_FILENAME
tar xf $BUILD_PATH/$ORIG_PKG_FILENAME -C $BUILD_PATH
cp -r $DEBIAN_FOLDER $BUILD_PATH/$UPSTREAM_PKG/
cd $BUILD_PATH/$UPSTREAM_PKG/

# Build the debian package
debuild -us -uc

echo '### Build successful!'
echo 'The .deb file is available at'
echo $BUILD_PATH
