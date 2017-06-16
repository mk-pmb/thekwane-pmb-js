/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var EX = {};


EX.deepCopyJSON = function (src) { return JSON.parse(JSON.stringify(src)); };


EX.replaceFalseyValuesWithDeepCopy = function (dest, src) {
  Object.keys(src).forEach(function (k) {
    if (dest[k]) { return; }
    dest[k] = EX.deepCopyJSON(src[k]);
  });
  return dest;
};





























module.exports = EX;
