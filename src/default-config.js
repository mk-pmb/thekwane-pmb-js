/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

module.exports = {

  autotls: 'required',

  scanCriteria: [ 'UNSEEN' ],

  fetchOpts: {
    markSeen: false,
    struct: true,
    envelope: true,
    size: true,
    bodies: [ 'HEADER', 'TEXT' ],
  },

  mailProcConcurrencyLimit: 1,



};
