#!/usr/bin/env node
const {program} = require("commander");
const fs = require("fs/promises");
const {poseidonHash} = require("../src/crypto/poseidon");
const {DelegationPresentation} = require("../src/presentation/delegation");
const {stringifyBigInts} = require("../src/util");
const {getRevocationTree} = require("./util");
const {merklePoseidon} = require("../src/crypto/poseidon.js");
const {signPoseidon} = require("../circomlib/eddsa.js");


program.arguments("<index>")
    .option("-d, --destination <Path>", "Path for storing the revocation file",
        "./presentation.json")
    .option("-r, --revocation <Path>", "If empty, the registry will be downloaded from given source")
    .option("--credential <Path>", "Path to the credential", "./credential.json")
    .option("-e, --expiration <Number>", "Expiration time in days")
    .option("-c, --challenge <Number>", "Challenge from the verifier")
    .option("-i, --issuerPK", "Show public key of issuer");

const generateDelegation = async (index, options) => {
    try {
        let credential = JSON.parse(await fs.readFile(options.credential, "utf8"));
        let revocationTree = await getRevocationTree(options.revocation, credential.attributes[4]);
        let expiration = new Date().getTime() + options.expiration * 864e5;
        if (expiration > Number(credential.attributes[5]))
            return Promise.reject("Error: Expiration of the presentation cannot be after the credentials");
        let presentation = new DelegationPresentation(
            credential,
            expiration,
            revocationTree,
            options.challenge,
            options.issuerPK,
            signPoseidon,
            merklePoseidon,
            Number(index)
        );
        await presentation.generate();
        await presentation.verify(poseidonHash);
        let re = await presentation.verify(poseidonHash);
        if (re === false) return Promise.reject(re);
        return Promise.resolve(presentation);
    } catch (err) {
        return Promise.reject(err);
    }
};

program.action((index, options) => {
    generateDelegation(index, options).then(res => {
        fs.writeFile(options.destination, JSON.stringify(stringifyBigInts(res)))
            .then(res => {process.exit();})
            .catch(console.log);
    }).catch(console.log);
});

program.parse(process.argv);