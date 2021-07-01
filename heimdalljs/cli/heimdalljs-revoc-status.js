#!/usr/bin/env node
const {program} = require("commander");
const fs = require("fs/promises");
const {pushGit} = require("../src/util");
const { exec } = require("child_process");
const {RevocationRegistry} = require("../src/revocation.js");
const {merklePoseidon} = require("../src/crypto/poseidon.js");
const {signPoseidon} = require("../circomlib/eddsa.js");

program.arguments("<index>")
    .option("-d, --destination <Path>", "Path for storing the revocation file",
        "./revocation_registry.json");

const updateRegistry = async (index, options) => {
    try {
        let registry = await fs.readFile(options.destination, "utf8");
        let r = new RevocationRegistry(undefined, merklePoseidon, undefined, JSON.parse(registry).tree);
        return Promise.resolve(r.getRevoked(index));
    } catch (err) {
        return Promise.reject(err);
    }
};

program.action((index, options) => {
    updateRegistry(index, options).then(console.log).catch(console.log);
});

program.parse(process.argv);

