const {stringifyBigInts} = require("./src/util")
const {Key} = require('./src/crypto/key')
const {Credential} = require('./src/credential')
const {merklePoseidon} = require('./src/crypto/poseidon.js')
const {signPoseidon} = require('./circomlib/eddsa.js')
const {RevocationRegistry} = require('./src/revocation.js')
const {AttributePresentation} = require("./src/presentation/attribute");

module.exports = {
    Key,
    stringifyBigInts,
    Credential,
    merklePoseidon,
    signPoseidon,
    RevocationRegistry,
    AttributePresentation
}