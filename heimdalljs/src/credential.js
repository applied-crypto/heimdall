const META_SIZE = 8

class Credential {
    attributes
    root
    signature
    /**
     *
     * @param attributes {Array}
     * @param id {Number}
     * @param pkHolder {[BigInt]}
     * @param expiration {Number}
     * @param credentialType {String}
     * @param delegatable {Number}
     * @param registry {String}
     * @param skIssuer {BigInt}
     * @param merkleTreeGenerator {function}
     * @param signatureGenerator {function}
     * @param publicKeyGenerator {function}
     */
    constructor(
        attributes,
        id,
        pkHolder,
        expiration,
        credentialType,
        delegatable,
        registry,
        skIssuer,
        merkleTreeGenerator,
        signatureGenerator,
        publicKeyGenerator
    ) {
        this.attributes = [
            id.toString(),
            credentialType,
            pkHolder[0],
            pkHolder[1],
            registry,
            expiration.toString(),
            delegatable.toString(),
            ""
        ];
        this.attributes = this.attributes.concat(attributes);
        let tree = merkleTreeGenerator(this.attributes);
        this.root = tree.root;
        this.signature = signatureGenerator(skIssuer, BigInt(this.root));
        this.signature.pk = publicKeyGenerator(skIssuer);
    }
}

module.exports = {Credential, META_SIZE};