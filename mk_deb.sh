#!/bin/sh

VERSION="2.0-0"

pkg .

mkdir -p ./elfmem_${VERSION}_amd64/DEBIAN
cp ./.deb/control ./elfmem_${VERSION}_amd64/DEBIAN

mkdir -p ./elfmem_${VERSION}_amd64/usr/local/bin
cp ./dist/elfmem ./elfmem_${VERSION}_amd64/usr/local/bin
ln -s ./elfmem ./elfmem_${VERSION}_amd64/usr/local/bin/armmem
ln -s ./elfmem ./elfmem_${VERSION}_amd64/usr/local/bin/espmem

dpkg-deb --build --root-owner-group elfmem_${VERSION}_amd64

rm -rf ./elfmem_${VERSION}_amd64
