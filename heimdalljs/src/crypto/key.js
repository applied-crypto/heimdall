const seedrandom = require('seedrandom');

const {prv2pub} = require('../../circomlib/eddsa.js');
/**
 * Generates new random secret key based on Math.random()
 * @returns {string}
 */
const newKey = (seed) => {
    let rng = seedrandom(seed);
    return BigInt(Math.floor(rng() * Math.pow(10, 64))).toString();
};

/**
 * Generates public key from secret
 * @param sk {String} secret key
 * @returns {[String]}
 */
const getPublicKey = (sk) => {
    return prv2pub(sk);
};

module.exports = {newKey, getPublicKey};
module.exports.Key = {newKey, getPublicKey};