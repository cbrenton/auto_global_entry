#!/bin/bash

crontab -l > mycron.orig
cp mycron.orig mycron
echo "PATH=/opt/local/bin:/opt/local/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/usr/X11/bin" >> mycron
echo "* * * * * /Users/$(whoami)/globalentry/spawn.sh" >> mycron
crontab mycron
rm mycron
