#!/usr/bin/env node
const {program} = require("commander");
const fs = require("fs/promises");
const {PolygonPresentation} = require("../src/presentation/polygon");
const {parsePolygon} = require("./util");
const {poseidonHash} = require("../src/crypto/poseidon");
const {DelegationPresentation} = require("../src/presentation/delegation");
const {stringifyBigInts} = require("../src/util");
const {getSecretKey, getRevocationTree} = require("./util");
const {merklePoseidon} = require("../src/crypto/poseidon.js");
const {signPoseidon} = require("../circomlib/eddsa.js");


program.arguments("<index>")
    .option("-d, --destination <Path>", "Path for storing the revocation file",
        "./presentation.json")
    .option("-r, --revocation <Path>", "If empty, the registry will be downloaded from given source")
    .option("--credential <Path>", "Path to the credential", "./credential.json")
    .option("-e, --expiration <Number>", "Expiration time in days")
    .option("-c, --challenge <Number>", "Challenge from the verifier")
    .option("-s, --secretKey <Number>", "Secret key of the holder")
    .option("-p, --polygon <Path>", "A JSON array of the polygon")
    .option("-i, --issuerPK", "Show public key of issuer");


const generatePolygon = async (index, options) => {
    try {
        let credential = JSON.parse(await fs.readFile(options.credential, "utf8"));
        let revocationTree = await getRevocationTree(options.revocation, credential.attributes[4]);
        let expiration = new Date().getTime() + options.expiration * 864e5;
        if (expiration > Number(credential.attributes[5]))
            return Promise.reject("Expiration of the presentation cannot be after the credentials");
        let secretKey = await getSecretKey(options.secretKey);
        let polyJSON = JSON.parse(await fs.readFile(options.polygon, "utf8"));
        let presentation = new PolygonPresentation(
            credential,
            expiration,
            revocationTree,
            options.challenge,
            secretKey,
            options.issuerPK,
            signPoseidon,
            merklePoseidon,
            Number(index),
            parsePolygon(polyJSON)
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
    generatePolygon(index, options).then(res => {
        fs.writeFile(options.destination, JSON.stringify(stringifyBigInts(res)))
            .then(res => {process.exit();})
            .catch(console.log);
    }).catch(console.log);
});

program.parse(process.argv);