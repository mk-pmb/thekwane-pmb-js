/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var EX;

EX = function makeDateback(cfg) {
  var days = { cur: 0,
      max:  (+cfg.daysRangeMax || 365),
      mult: (+cfg.daysRangeMult || 1),
      step: (+cfg.daysRangeStep || 1),
      };
  days.inc = function () {
    if (days.cur < days.max) {
      days.cur = Math.min(days.max, (days.cur * days.mult) + days.step);
    }
    return days;
  };
  days.criterion = function (name) {
    return [ name, new Date(Date.now() - (days.cur * EX.msecPerDay)) ];
  };
  return days;
};


EX.msecPerDay = 864e5;






























module.exports = EX;
