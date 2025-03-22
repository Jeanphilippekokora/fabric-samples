/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const chaincodeQA = require('./lib/chaincodeQA');

module.exports.chaincodeQA = chaincodeQA;
module.exports.contracts = [chaincodeQA];
