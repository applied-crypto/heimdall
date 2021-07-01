#!/usr/bin/env node
const {program} = require("commander");

program.command("delegation", "Generate a delegation presentation")
    .command("attribute", "Generate a delegation presentation")
    .command("polygon", "Generate a polygon presentation")
    .command("range", "Generate a range presentation");

program.action(() => {
    program.help();
});

program.parse(process.argv);
