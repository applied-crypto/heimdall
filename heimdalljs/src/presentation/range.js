const {AttributePresentation} = require("./attribute");
const {stringifyBigInts} = require("../util");
const {PresentationTypes, Presentation} = require("./presentation");

class RangePresentation extends AttributePresentation {
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
        lowerBound,
        upperBound
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
        this.type = PresentationTypes.range;
        this.privateInput.upperBound = upperBound;
        this.privateInput.lowerBound = lowerBound;
        this.privateInput.attribute = cred.attributes[index];
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
            this.output.content = {
                position: 0
            };
            for (let i = 0; i < 4; i++) {
                this.output.content.position += (2 ** i) * this.publicSignals[9 + i];
            }
            this.output.content.upperBound = this.publicSignals[13];
            this.output.content.lowerBound = this.publicSignals[14];
            this.output.content.inbound = Number(this.publicSignals[6]) === 1;
            res &&= copy === JSON.stringify(this);
            return Promise.resolve(res);
        } catch (err) {
            return Promise.reject(err);
        }
    }
}

module.exports = {RangePresentation};