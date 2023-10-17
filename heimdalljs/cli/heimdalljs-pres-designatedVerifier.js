#!/usr/bin/env node
const { program } = require("commander");
const fs = require("fs/promises");
const { poseidonHash } = require("../src/crypto/poseidon");
const { DesignatedVerifierPresentation } = require("../src/presentation/designatedVerifier");
const { stringifyBigInts } = require("../src/util");
const { getSecretKey, getRevocationTree } = require("./util");
const { merklePoseidon } = require("../src/crypto/poseidon.js");
const { signPoseidon } = require("../circomlib/eddsa.js");

program.arguments("<index>")
    .option("-d, --destination <Path>", "Path for storing the presentation file",
        "./presentation.json")
    .option("-r, --revocation <Path>", "If empty, the registry will be downloaded from given source")
    .option("--credential <Path>", "Path to the credential", "./credential.json")
    .option("-e, --expiration <Number>", "Expiration time in days")
    .option("-c, --challenge <Number>", "Challenge from the verifier")
    .option("-s, --secretKey <Number>", "Secret key of the holder")
    .option("-i, --issuerPK", "Show public key of issuer")
    .option("-i, --verifierPK <Path>", "Public key of verifier")
    .option("-i, --possessionVerifierSK", "I have the SK of the verifier")
    .option("-i, --verifierSK <Number>", "Secret key of issuer");

const generatePresentationDesignatedVerifier = async (index, options) => {
    try {
        let credential = JSON.parse(await fs.readFile(options.credential, "utf8"));

        let revocationTree = await getRevocationTree(options.revocation, credential.attributes[4]);

        let expiration = new Date().getTime() + options.expiration * 864e5;
        let verifierPK = JSON.parse(await fs.readFile(options.verifierPK, "utf8"));

        if (expiration > Number(credential.attributes[5]))
            return Promise.reject("Expiration of the presentation cannot be after the credentials");
        let secretKey = await getSecretKey(options.secretKey);
        let verifierSK = await getSecretKey(options.verifierSK);
        let presentation = new DesignatedVerifierPresentation(
            credential,
            expiration,
            revocationTree,
            options.challenge,
            secretKey,
            options.issuerPK,
            signPoseidon,
            merklePoseidon,
            Number(index),
            verifierSK,
            verifierPK,
            options.possessionVerifierSK
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
    generatePresentationDesignatedVerifier(index, options).then(res => {
        fs.writeFile(options.destination, JSON.stringify(stringifyBigInts(res)))
            .then(() => { process.exit(); })
            .catch(console.log);
    }).catch((error) => { console.log(error); process.exit(); });
});

program.parse(process.argv);