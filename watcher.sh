#!/bin/bash
CURRENT=`pwd`
BASENAME=`basename $CURRENT`
echo "current working dir {$CURRENT}"
echo "base dir name {$BASENAME}"

watcher_fake_daemon() {
    chsum1=""

    while [[ true ]]
    do
        chsum2=`find $CURRENT/js/src/ -type f -exec md5sum {} \;`
        if [[ $chsum1 != $chsum2 ]] ; then           
            make development
            chsum1=`find $CURRENT/js/src/ -type f -exec md5sum {} \;`
        fi
        sleep 10
    done
}

watcher_fake_daemon # call
