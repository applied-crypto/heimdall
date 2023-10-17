#!/bin/bash

CHALLENGE=1234

echo "Generate keys"
heimdalljs key new issuer>issuer_sk.txt
heimdalljs key pub <issuer_sk.txt >issuer_pk.json
heimdalljs key new holder >holder_sk.txt
heimdalljs key pub <holder_sk.txt >holder_pk.json
heimdalljs key new verifier >verifier_sk.txt
heimdalljs key pub <verifier_sk.txt >verifier_pk.json

echo "Writing attributes for the credential of the holder"
cat <<EOM >$(pwd)/attr_issuer.json
[
	"John",
	"Jones",
	"male",
	"843995700",
	"blue",
	"180",
	"115703781",
	"499422598"
]
EOM

echo "Creating credential of the holder by the issuer"
heimdalljs cred new \
  --attributes attr_issuer.json \
  --id 1234501 \
  --publicKey holder_pk.json \
  --expiration 365 \
  --type IdentityCard \
  --delegatable 0 \
  --registry https://gitlab.fit.fraunhofer.de/matthias.babel/heimdall-revocation/-/raw/master/ \
  --secretKey issuer_sk.txt \
  --destination cred_holder.json

echo "Holder does not know the SK of issuer"
heimdalljs pres designatedVerifier 10 \
  --expiration 100 \
  --challenge $CHALLENGE \
  --credential cred_holder.json \
  --destination pres_attribute.json \
  --secretKey holder_sk.txt \
  --verifierSK holder_sk.txt \
  --verifierPK verifier_pk.json \
  --issuerPK 

heimdalljs verify pres_attribute.json


# create manipulated certificate
echo "Please duplicate the file 'credential_holder.json', \
 rename it to 'credential_holder_manipulated.json', and manipulate the signature."
read -p  "Press any key to proceed..."

echo "Holder knows SK of issuer"

heimdalljs pres designatedVerifier 10 \
  --expiration 100 \
  --challenge $CHALLENGE \
  --credential cred_holder_manipulated.json \
  --destination pres_attribute.json \
  --secretKey holder_sk.txt \
  --verifierSK verifier_sk.txt \
  --verifierPK verifier_pk.json \
  --issuerPK \
  --possessionVerifierSK

heimdalljs verify pres_attribute.json

echo "Holder does not now SK of issuer"
heimdalljs pres designatedVerifier 10 \
  --expiration 100 \
  --challenge $CHALLENGE \
  --credential cred_holder_manipulated.json \
  --destination pres_attribute.json \
  --secretKey holder_sk.txt \
  --verifierSK holder_sk.txt \
  --verifierPK verifier_pk.json \
  --issuerPK \
  --possessionVerifierSK

