include "../../lib/metaData.circom"
include "../../lib/contentData.circom"
include "../../lib/circomlib/circuits/comparators.circom"
include "../../lib/circomlib/circuits/poseidon.circom"

template GenericPresentation(depth, revocationDepth) {
	/*
	* Private Inputs
	*/
	// Meta
	signal private input pathMeta[depth];
	signal private input lemmaMeta[depth + 2];
	signal private input meta[8]; //Fixed Size of meta attributes in each credential
	signal private input signatureMeta[3];
	signal private input pathRevocation[revocationDepth];
	signal private input lemmaRevocation[revocationDepth + 2];
	signal private input revocationLeaf;
	signal private input signChallenge[3];
	signal private input issuerPK[2];
	// Content
	signal input attributes[8];
	signal input attributesHash[8]; 
	/* Specific Input Here */
	/*
	* Public Inputs
	*/
	// Meta
	signal input challenge;
	signal input expiration;
	signal output type; 
	signal output revocationRoot;
	signal output revocationRegistry;
	signal output revoked;
	signal output linkBack;
	signal output delegatable;
	// Content
	/* Specific Output Here */

	/*
	* Meta Calculations
	*/
	// Begin - Check Meta Integrity
	component checkMetaDataIntegrity = CheckMetaDataIntegrity(depth);

	checkMetaDataIntegrity.lemma[0] <== lemmaMeta[0];
	checkMetaDataIntegrity.lemma[depth + 1] <== lemmaMeta[depth + 1];
	checkMetaDataIntegrity.issuerPK[0] <== issuerPK[0];
	checkMetaDataIntegrity.issuerPK[1] <== issuerPK[1];

	checkMetaDataIntegrity.signature[0] <== signatureMeta[0];
	checkMetaDataIntegrity.signature[1] <== signatureMeta[1];
	checkMetaDataIntegrity.signature[2] <== signatureMeta[2];

	for(var i = 0; i < 8; i++) {
		checkMetaDataIntegrity.meta[i] <== meta[i];
	}

	for(var i = 0; i < depth; i++) {
		checkMetaDataIntegrity.path[i] <== pathMeta[i];
		checkMetaDataIntegrity.lemma[i + 1] <== lemmaMeta[i + 1];
	}
	revocationRegistry <== checkMetaDataIntegrity.revocationRegistry;
	// End - Check Meta Integrity

	type <== checkMetaDataIntegrity.type;
	revocationRoot <== lemmaRevocation[revocationDepth + 1];
	delegatable <== checkMetaDataIntegrity.delegatable;

	// Begin - Check Expiration
	component checkExpiration = CheckExpiration();
	checkExpiration.expirationCredential <== checkMetaDataIntegrity.expiration;
	checkExpiration.expirationPresentation <== expiration;
	// End - Check Expiration

	// Begin - Check Revocation
	component checkRevocation = CheckRevocation(revocationDepth);
	checkRevocation.id <== checkMetaDataIntegrity.id;
	checkRevocation.revocationLeaf <== revocationLeaf;
	checkRevocation.lemma[0] <== lemmaRevocation[0];
	checkRevocation.lemma[revocationDepth + 1] <== lemmaRevocation[revocationDepth + 1];
	for(var i = 0; i < revocationDepth; i++) {
		checkRevocation.path[i] <== pathRevocation[i];
		checkRevocation.lemma[i + 1] <== lemmaRevocation[i + 1];
	}
	revocationRoot <== checkRevocation.revocationRoot;
	revoked <== checkRevocation.revoked;
	// End - Check Revocation

	//Begin - Link Back
	component getLinkBack = Link();
	getLinkBack.challenge <== challenge;
	getLinkBack.pk[0] <== checkMetaDataIntegrity.issuerPK[0];
	getLinkBack.pk[1] <== checkMetaDataIntegrity.issuerPK[1];
	linkBack <== getLinkBack.out;
	// End - Link Back
	

	//Begin - Holder Binding
	component checkHolderBinding = CheckHolderBinding();
	checkHolderBinding.signChallenge[0] <== signChallenge[0];
	checkHolderBinding.signChallenge[1] <== signChallenge[1];
	checkHolderBinding.signChallenge[2] <== signChallenge[2];
	checkHolderBinding.challenge <== challenge;
	checkHolderBinding.holderPK[0] <== checkMetaDataIntegrity.holderPK[0];
	checkHolderBinding.holderPK[1] <== checkMetaDataIntegrity.holderPK[1];
	//End - Holder Binding

	/*
	* Content Calculations
	*/
	component merkleTree = MerkleTree(3);

	component isEqual[8];
	component hash[8];
	signal tmp[8];
	for(var i = 0; i < 8; i++) {
		isEqual[i] = IsEqual();
		hash[i] = Poseidon(1);
		isEqual[i].in[0] <== attributes[i];
		isEqual[i].in[1] <== attributesHash[i];
		hash[i].inputs[0] <== attributes[i];
		tmp[1] <== (1 - isEqual[i].out) * hash[i].out;
		attributesHash[i] === tmp[i] + isEqual[i].out * attributes[i];
		merkleTree.data[i] <== attributesHash[0];
	}

	merkleTree.root === lemmaMeta[4];

	/* Specific Code Here */

}

component main = GenericPresentation(4, 13);
