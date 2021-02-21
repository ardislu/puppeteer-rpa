"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const config = {
    recordingsDir: path_1.join(__dirname, '../recordings'),
    recordingsToExecute: ['test1.js', 'test2.js', 'jec-fyi.js', 'rpa-challenge.js'],
    silent: false
};
exports.default = config;
