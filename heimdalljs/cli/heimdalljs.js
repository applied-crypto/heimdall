#!/usr/bin/env node
const path = require("path");
global.appRoot = path.resolve(__dirname);

const { program } = require("commander");

program.command("key", "Managing private public key");
program.command("cred", "Managing credentials");
program.command("revoc", "Managing revocation registry");
program.command("pres", "Creating credential presentations");
program.command("verify", "Verifies presentation");

program.action(() => {
    program.help();
});

program.parse(process.argv);