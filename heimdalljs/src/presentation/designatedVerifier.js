const { AttributePresentation } = require("./attribute");
const { stringifyBigInts } = require("../util");
const { PresentationTypes, Presentation } = require("./presentation");
const { getPublicKey } = require("../crypto/key");

class DesignatedVerifierPresentation extends AttributePresentation {
    constructor(
        cred,
        expiration,
        revocationLeaves,
        challenge,
        sk,
        issuerPK,
        signatureGenerator,
        treeGenerator,
        index,
        verifierSK,
        verifierPK,
        possessionVerifierSK
    ) {
        super(
            cred,
            expiration,
            revocationLeaves,
            challenge,
            sk,
            issuerPK,
            signatureGenerator,
            treeGenerator,
            index
        );
        this.type = PresentationTypes.designatedVerifier;
        /*let tree = treeGenerator(cred.attributes);
        let proof = tree.generateProof(index);
        this.privateInput.lemma = proof.lemma;
        this.privateInput.path = proof.path;
        this.output.content = {
            attribute: cred.attributes[index]
        };

*/
        let signChallengeDesignatedVerifier = signatureGenerator(verifierSK, BigInt(challenge));
        this.privateInput.signatureDesignatedVerifier = [signChallengeDesignatedVerifier.R8[0], signChallengeDesignatedVerifier.R8[1], signChallengeDesignatedVerifier.S];
        this.privateInput.verifierPK = getPublicKey(verifierSK);
        this.privateInput.verifierPK = verifierPK;
        // let signatureDesignatedVerifier = signatureGenerator(sk, BigInt(challenge));
        //this.privateInput.signatureDesignatedVerifier = [signatureDesignatedVerifier.R8[0], signatureDesignatedVerifier.R8[1], signatureDesignatedVerifier.S];
        this.privateInput.possessionVerifierSK = possessionVerifierSK ? 1 : 0;
    }

    async verify(hasher) {
        try {
            let copy = JSON.stringify(stringifyBigInts(this));
            let res = await this.verifyProof();
            res &&= await this.verifyMeta(
                0,
                1,
                2,
                3,
                4,
                5,
                7,
                8,
                hasher
            );
            res &&= hasher([this.output.content.attribute]).toString() === this.publicSignals[6];
            this.output.content.position = 0;
            for (let i = 0; i < 4; i++) {
                this.output.content.position += (2 ** i) * this.publicSignals[9 + i];
            }
            this.output.meta.verifierPK = [this.publicSignals[13], this.publicSignals[14]];
            res &&= copy === JSON.stringify(this);
            return Promise.resolve(res);
        } catch (err) {
            return Promise.reject(err);
        }
    }
}

module.exports = { DesignatedVerifierPresentation };
