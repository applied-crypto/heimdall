const {stringifyBigInts} = require("../util");
const {PresentationTypes, Presentation} = require("./presentation");

class AttributePresentation extends Presentation {
    constructor(
        cred,
        expiration,
        revocationLeaves,
        challenge,
        sk,
        issuerPK,
        signatureGenerator,
        treeGenerator,
        index
    ) {
        super(
            cred,
            expiration,
            revocationLeaves,
            challenge,
            sk,
            issuerPK,
            signatureGenerator,
            treeGenerator);
        this.type = PresentationTypes.attribute;
        let tree = treeGenerator(cred.attributes);
        let proof = tree.generateProof(index);
        this.privateInput.lemma = proof.lemma;
        this.privateInput.path = proof.path;
        this.output.content = {
            attribute: cred.attributes[index]
        };

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
            res &&= copy === JSON.stringify(this);
            return Promise.resolve(res);
        } catch (err) {
            return Promise.reject(err);
        }
    }
}

module.exports = {AttributePresentation};