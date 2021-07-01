const path = require("path");
const fs = require("fs");
const snarkjs = require("snarkjs");
const {performance} = require("perf_hooks");
const {MAX_LEAF_SIZE} = require('../revocation');
const {META_SIZE} = require('../credential');

class Presentation {
    type
    privateInput
    output
    proof
    publicSignals

    /**
     * Generates the meta part of a presentation
     * @param expiration {Number}
     * @param cred {{signature: {S: string, R8: [string, string], pk: [string, string]}, root: string, attributes}}
     * @param revocationTree {MerkleTree}
     * @param challenge {string}
     * @param sk {string}
     * @param issuerPK {boolean}
     * @param signatureGenerator {Function}
     * @param treeGenerator {Function}
     */
    constructor(
        cred,
        expiration,
        revocationTree,
        challenge,
        sk,
        issuerPK,
        signatureGenerator,
        treeGenerator
    ) {
        if (new.target === Presentation) {
            throw new TypeError("Cannot construct Presentation instances directly");
        }
        let tree = treeGenerator(cred.attributes);
        let proofMeta = tree.generateProof(0);
        this.privateInput = {};
        this.privateInput.pathMeta = proofMeta.path;
        this.privateInput.lemmaMeta = proofMeta.lemma;
        this.privateInput.meta = [];
        this.privateInput.expiration = expiration;
        // Only numbers get in the circuit, if string, then hashed
        for (let i = 0; i < META_SIZE; i++) {
            let attr = cred.attributes[i];
            if (Number.isInteger(attr) || /^\d+$/.test(attr)) {
                this.privateInput.meta.push(attr);
            } else {
                this.privateInput.meta.push(tree.data[i]);
            }
        }
        this.privateInput.signatureMeta = [cred.signature.R8[0], cred.signature.R8[1], cred.signature.S];
        this.privateInput.issuerPK = [cred.signature.pk[0], cred.signature.pk[1]];
        let positionRevocationTree = Math.floor(cred.attributes[0] / Number(MAX_LEAF_SIZE));
        let proofRevocation = revocationTree.generateProof(positionRevocationTree);
        this.privateInput.pathRevocation = proofRevocation.path;
        this.privateInput.lemmaRevocation = proofRevocation.lemma;
        this.privateInput.revocationLeaf = revocationTree.leaves[positionRevocationTree];
        this.privateInput.challenge = challenge;
        if (typeof sk !== 'undefined') {
            let signChallenge = signatureGenerator(sk, BigInt(challenge));
            this.privateInput.signChallenge = [signChallenge.R8[0], signChallenge.R8[1], signChallenge.S];
        }
        this.output = {};
        this.output.meta = {
            type: cred.attributes[1],
            revocationRegistry: cred.attributes[4],
        };
        if (issuerPK) {
            this.output.meta.issuerPK = cred.signature.pk;
        }
        this.output.content = {};
    }

    static restore(presentation) {
        let pres = Object.create(this.prototype);
        pres.type = presentation.type;
        pres.privateInput = presentation.privateInput;
        pres.output = presentation.output;
        pres.proof = presentation.proof;
        pres.publicSignals = presentation.publicSignals;
        return pres;
    }

    async generate() {
        let root = path.join(process.mainModule.paths[0].split("node_modules")[0].slice(0, -1), "../");
        let t0 = performance.now();
        const {proof, publicSignals} = await snarkjs.groth16.fullProve(
            this.privateInput,
            path.join(root, "zkp", this.type, "circuit.wasm"),
            path.join(root, "zkp", this.type, "circuit_final.zkey")
        );
        let t1 = performance.now();
        console.log("Prove took " + (t1 - t0) + " milliseconds.");

        this.proof = proof;
        this.publicSignals = publicSignals;

        let res = await this.verifyProof();

        // Overwriting private input
        this.privateInput = {};

        if (res === true) {
            return Promise.resolve(true);
        } else {
            return Promise.reject(false);
        }
    }

    async verifyProof() {
        let root = path.join(process.mainModule.paths[0].split("node_modules")[0].slice(0, -1), "../");
        const vKey = JSON.parse(fs.readFileSync(path.join(root, "zkp", this.type, "verification_key.json")));

        let res = await snarkjs.groth16.verify(vKey, this.publicSignals, this.proof).catch(err => console.error(err));
        if (res === true) {
            return Promise.resolve(true);
        } else {
            return Promise.reject(false);
        }
    }

    /**
     * Verifies the meta attributes from the proof
     * @param typeIndex {Number}
     * @param revocationRootIndex {Number}
     * @param revokedIndex {Number}
     * @param revocationRegistryHashIndex
     * @param linkBackIndex {Number}
     * @param delegatableIndex {Number}
     * @param challengeIndex {Number}
     * @param expirationIndex {Number}
     * @param hasher {Function}
     * @returns {Promise<boolean>}
     */
    async verifyMeta(
        typeIndex,
        revocationRootIndex,
        revocationRegistryHashIndex,
        revokedIndex,
        linkBackIndex,
        delegatableIndex,
        challengeIndex,
        expirationIndex,
        hasher
    ) {
        // Checks if meta type hash from public signal is the same like in public input
        let res = hasher([this.output.meta.type]).toString() === this.publicSignals[typeIndex];
        // Reads revocation root from public signal
        this.output.meta.revocationRoot = this.publicSignals[revocationRootIndex];
        //res &&= BigInt(revocationRoot) === BigInt(this.output.meta.revocationRoot)
        // Checks if revocationRegistry of public input corresponds to hash of public signals
        res &&= hasher([this.output.meta.revocationRegistry]).toString() ===
            this.publicSignals[revocationRegistryHashIndex];
        this.output.meta.revoked = Number(this.publicSignals[revokedIndex]) === 1;
        this.output.meta.delegatable = Number(this.publicSignals[delegatableIndex]) === 1;
        this.output.meta.linkBack = this.publicSignals[linkBackIndex];
        this.output.meta.challenge = this.publicSignals[challengeIndex];
        this.output.meta.expiration = this.publicSignals[expirationIndex];
        if (typeof this.output.meta.issuerPK !== "undefined") {
            res &&= hasher([
                this.output.meta.challenge,
                this.output.meta.issuerPK[0],
                this.output.meta.issuerPK[1]
            ]).toString() === this.output.meta.linkBack;
        }
        return Promise.resolve(res);
    }
}

const PresentationTypes = Object.freeze({
    "delegation": "delegation",
    "attribute": "attribute",
    "polygon": "polygon",
    "range": "range"
});

module.exports = {Presentation, PresentationTypes};