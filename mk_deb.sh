#!/bin/sh

VERSION="1.0-1"

pkg .

mkdir -p ./armmem_${VERSION}_amd64/DEBIAN
cp ./.deb/control ./armmem_${VERSION}_amd64/DEBIAN

mkdir -p ./armmem_${VERSION}_amd64/usr/local/bin
cp ./dist/armmem ./armmem_${VERSION}_amd64/usr/local/bin

dpkg-deb --build --root-owner-group armmem_${VERSION}_amd64

rm -rf ./armmem_${VERSION}_amd64
