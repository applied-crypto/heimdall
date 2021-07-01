const {AttributePresentation} = require("./attribute");
const {stringifyBigInts} = require("../util");
const {PresentationTypes, Presentation} = require("./presentation");

class PolygonPresentation extends AttributePresentation {
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
        polygon
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
        this.type = PresentationTypes.polygon;
        this.privateInput.vertx = polygon.vertx;
        this.privateInput.verty = polygon.verty;
        this.privateInput.location = [cred.attributes[index], cred.attributes[index + 1]];
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
            this.output.content.vertx = [];
            this.output.content.verty = [];
            for (let i = 0; i < 50; i++) {
                this.output.content.vertx.push(this.publicSignals[i + 13 ]);
                this.output.content.verty.push(this.publicSignals[i + 13 + 50]);
            }
            this.output.content.inbound = Number(this.publicSignals[6]) === 1;
            res &&= copy === JSON.stringify(this);
            return Promise.resolve(res);
        } catch (err) {
            return Promise.reject(err);
        }
    }
}

module.exports = {PolygonPresentation};