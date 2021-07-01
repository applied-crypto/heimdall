#!/usr/bin/env node
const {program} = require("commander");
const {getPublicKey} = require("../src/crypto/key.js");
const readline = require("readline");
const {stringifyBigInts} = require("../src/util");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

program
    .action(() => {
        rl.on("line", function (line) {
            console.log(JSON.stringify(stringifyBigInts(getPublicKey(line))));
        });
    });

program.parse(process.argv);