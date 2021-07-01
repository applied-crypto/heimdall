const {stringifyBigInts} = require("../util");
const {PresentationTypes} = require("./presentation");
const {AttributePresentation} = require("./attribute");

class DelegationPresentation extends AttributePresentation {
    constructor(
        cred,
        expiration,
        revocationLeaves,
        challenge,
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
            undefined,
            issuerPK,
            signatureGenerator,
            treeGenerator,
            index
        );

        this.type = PresentationTypes.delegation;
        this.output.content = {
            type: cred.attributes[index]
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
                8,
                9,
                hasher
            );

            this.output.content.linkForth = this.publicSignals[6];
            res &&= hasher([this.output.content.type]).toString() === this.publicSignals[7];
            this.output.content.position = 0;
            for (let i = 0; i < 4; i++) {
                this.output.content.position += (2 ** i) * this.publicSignals[10 + i];
            }
            res &&= copy === JSON.stringify(this);
            return Promise.resolve(res);
        } catch (err) {
            return Promise.reject(err);
        }
    }
}

module.exports = {DelegationPresentation};