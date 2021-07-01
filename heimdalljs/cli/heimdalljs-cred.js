#!/usr/bin/env node
const { program } = require("commander");

program.command("new", "Generate a new credential");
program.parse(process.argv);