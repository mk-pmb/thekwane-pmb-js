#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-


function unspam () {
  export LANG{,UAGE}=en_US.UTF-8  # make error messages search engine-friendly
  local SELFPATH="$(readlink -m "$BASH_SOURCE"/..)"
  cd "$SELFPATH" || return $?

  local LINT_FILES=(
    ../*.js*
    ../*/*.js*
    ../../imapfetch-collect/*.js*
    )
  jsl "${LINT_FILES[@]}" || return $?

  nodejs unspam.js |& tee unspam.log.tmp
  mv -- unspam.log{.tmp,}

  return 0
}










[ "$1" == --lib ] && return 0; unspam "$@"; exit $?
