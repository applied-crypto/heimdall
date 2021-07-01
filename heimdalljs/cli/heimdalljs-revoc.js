#!/usr/bin/env node
const {program} = require("commander");
program
    .command("new", "Generate a new revocation registry")
    .command("update", "Reads secret key from std input and returns corresponding public one")
    .command("status", "Checks if id is revoked");

program.action(() => {
    program.help();
});
program.parse(process.argv);