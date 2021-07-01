#!/usr/bin/env node
const {program} = require("commander");
program
    .command("new", "Generate a new secret key")
    .command("pub", "Reads secret key from std input and returns corresponding public one");

program.action(() => {
    program.help();
});
program.parse(process.argv);