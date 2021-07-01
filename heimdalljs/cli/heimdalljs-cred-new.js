#!/usr/bin/env node
const {program} = require("commander");
const {Credential} = require("../src/credential.js");
const fs = require("fs/promises");
const { utils } = require("ffjavascript");
const {stringifyBigInts } = utils;
const {getPublicKey} = require("../src/crypto/key");
const {merklePoseidon} = require("../src/crypto/poseidon.js");
const {signPoseidon} = require("../circomlib/eddsa.js");

program
    .requiredOption("-a, --attributes <attributes>", "Path to a the attributes of the credential " +
        "as json array file")
    .requiredOption("-i, --id <Number>", "Id of the credential")
    .requiredOption("-p, --publicKey <Path>", "Path to the public key of the holder")
    .requiredOption("-e, --expiration <Number>", "Expiration time in days")
    .requiredOption("-t, --type <String>", "Type of the credential")
    .requiredOption("--delegatable <Number>", "Is the credential delegatable?", "0")
    .requiredOption("-r, --registry <String>", "Link to the revocation registry")
    .requiredOption("-s, --secretKey <Path>", "Path to the secret key of the issuer")
    .option("-d, --destination <Path>", "Path for storing the credential",
        "./credential.json");

program.action((options) => {
    generateCredential().then( (res) => {
          fs.writeFile(options.destination, JSON.stringify(stringifyBigInts(res))).catch(console.log);
        }
    ).catch(console.log);
});
program.parse(process.argv);

async function generateCredential() {
    try {
        const options = program.opts();
        let exp = new Date().getTime() + (Number(options.expiration) * 864e5 );
        let attr = await fs.readFile(options.attributes, "utf8");
        let publicKey = await fs.readFile(options.publicKey,  "utf8");
        let secretKey = await fs.readFile(options.secretKey, "utf8");
        secretKey = secretKey.split("\n")[0];
        let cred = new Credential(
            JSON.parse(attr),
            options.id,
            JSON.parse(publicKey),
            exp,
            options.type,
            options.delegatable,
            options.registry,
            secretKey,
            merklePoseidon,
            signPoseidon,
            getPublicKey
        );
        return Promise.resolve(cred);
    } catch (err) {
        return Promise.reject(err);
    }
}