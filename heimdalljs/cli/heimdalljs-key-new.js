#!/usr/bin/env node
const { program } = require("commander");
const { newKey } = require("../src/crypto/key.js");

program.arguments("<seed>");

program.action((seed) => {
    console.log(newKey(seed));
})
program.parse(process.argv);