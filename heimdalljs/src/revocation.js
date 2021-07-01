const REVOC_TREE_DEPTH = 13;
const MAX_LEAF_SIZE = 252n;

class RevocationRegistry {
    tree
    signatureGenerator = () => {}
    constructor(sk, merkleTreeGenerator, signatureGenerator, old = undefined) {
        if (typeof old === "undefined") {
            let leaves = new Array(Math.pow(2, REVOC_TREE_DEPTH)).fill(0n);
            this.tree = merkleTreeGenerator(leaves);
        } else {
            this.tree = merkleTreeGenerator([], old);
        }
        if (typeof sk !== "undefined") {
            this.signature = signatureGenerator(sk.toString(), this.tree.root.toString());
        }
    }

    /**
     * Toggls revocation for given id
     * @param id
     */
    update = (id, sk = undefined) => {
        if (BigInt(id) >= 2n ** BigInt(REVOC_TREE_DEPTH) * MAX_LEAF_SIZE) throw "Id not in the tree";
        let indexLeaf = BigInt(id) / MAX_LEAF_SIZE;
        let indexBit = BigInt(id) % MAX_LEAF_SIZE;
        if ((BigInt(this.tree.leaves[indexLeaf]) / 2n ** indexBit) % 2n === 1n ) {
            this.tree.update(indexLeaf, BigInt(this.tree.leaves[indexLeaf]) - 2n ** indexBit);
        } else {
            this.tree.update(indexLeaf, BigInt(this.tree.leaves[indexLeaf]) + 2n ** indexBit);
        }
        if (typeof sk !== "undefined")
            this.signature = this.signatureGenerator(sk.toString(), this.tree.root.toString());
    }

    get leaves() {
        return this.tree.leaves;
    }

    /**
     * Returns if id is revoked
     * @param index
     * @returns {boolean}
     */
    getRevoked(id) {
        if (BigInt(id) >= 2n ** BigInt(REVOC_TREE_DEPTH) * MAX_LEAF_SIZE) throw "Id not in the tree";
        let positionTree = BigInt(id) / MAX_LEAF_SIZE;
        let positionLeaf = BigInt(id) % MAX_LEAF_SIZE;
        return (BigInt(this.tree.leaves[positionTree]) / 2n ** positionLeaf) % 2n === 1n;
    }
}

module.exports = {RevocationRegistry, REVOC_TREE_DEPTH, MAX_LEAF_SIZE};