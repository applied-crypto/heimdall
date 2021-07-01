include "../../lib/metaData.circom"
include "../../lib/contentData.circom"

template PolygonPresentation(depth, revocationDepth, polygonSize) {
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
		signal private input lemma[depth + 2];
		signal private input location[2];
		/*
		* Public Inputs
		*/
		// Meta
		signal input challenge; //7
		signal input expiration; //8
		signal output type; //0
		signal output revocationRoot; //1
		signal output revocationRegistry //2
		signal output revoked; //3
		signal output linkBack; //4
		signal output delegatable; //5
		// Content
		signal input path[depth]; // 9..12
		signal input vertx[polygonSize]; //13..62
		signal input verty[polygonSize]; //63..120
		signal output inbound; //6
		/*
		* Meta calculations
		*/
		// Begin – Check Meta Integrity
		component checkMetaDataIntegrity = CheckMetaDataIntegrity(depth);

		checkMetaDataIntegrity.lemma[0] <== lemmaMeta[0];
		checkMetaDataIntegrity.lemma[depth + 1] <== lemmaMeta[depth + 1];
		checkMetaDataIntegrity.issuerPK[0] <== issuerPK[0];
		checkMetaDataIntegrity.issuerPK[1] <== issuerPK[1];

		checkMetaDataIntegrity.signatureMeta[0] <== signatureMeta[0];
		checkMetaDataIntegrity.signatureMeta[1] <== signatureMeta[1];
		checkMetaDataIntegrity.signatureMeta[2] <== signatureMeta[2];

		for(var i = 0; i < 8; i++) {
			checkMetaDataIntegrity.meta[i] <== meta[i];
		}

		for(var i = 0; i < depth; i++) {
			checkMetaDataIntegrity.path[i] <== pathMeta[i];
			checkMetaDataIntegrity.lemma[i + 1] <== lemmaMeta[i + 1];
		}
		revocationRegistry <== checkMetaDataIntegrity.revocationRegistry;
		// End – Check Meta Integrity

		type <== checkMetaDataIntegrity.type;
		revocationRoot <== lemmaRevocation[revocationDepth + 1];
		delegatable <== checkMetaDataIntegrity.delegatable;

		// Begin – Check expiration
		component checkExpiration = CheckExpiration();
		checkExpiration.expirationCredential <== checkMetaDataIntegrity.expiration;
		checkExpiration.expirationPresentation <== expiration;
		// End – Check expiration

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
		// End – Check Revocation

		//Begin - Link Back
		component getLinkBack = Link();
		getLinkBack.challenge <== challenge;
		getLinkBack.pk[0] <== issuerPK[0];
		getLinkBack.pk[1] <== issuerPK[1];
		linkBack <== getLinkBack.out;
		// End - Link Back

		/*
		* Content calculations
		*/
		component polygon = CheckPolygon(polygonSize, depth);

		for(var i = 0; i < polygonSize; i++) {
			polygon.vertx[i] <== vertx[i];
			polygon.verty[i] <== verty[i];
		}		

		polygon.lemma[0] <== lemma[0];
    	polygon.lemma[depth + 1] <== lemma[depth + 1];

    	for (var i = 0; i < depth; i++) {
            polygon.path[i] <== path[i];
            polygon.lemma[i + 1] <== lemma[i + 1];
   		}	

		polygon.location[0] <== location[0];
		polygon.location[1] <== location[1];
		polygon.credentialRoot <== checkMetaDataIntegrity.credentialRoot;

		inbound <== polygon.inbound;
}

component main = PolygonPresentation(4, 13, 50);
