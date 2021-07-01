#!/bin/bash

CHALLENGE=1234

echo "Generate keys"
heimdalljs key new ca>ca_sk.txt
heimdalljs key new issuer>issuer_sk.txt
heimdalljs key pub <issuer_sk.txt >issuer_pk.json
heimdalljs key new holder >holder_sk.txt
heimdalljs key pub <holder_sk.txt >holder_pk.json

echo "Writing attributes for the credential of the issuer"
cat <<EOM >$(pwd)/attr_issuer.json
[
  "IdentityCard",
  "Passport",
  "BirthCertificate",
  "RegistrationCertificate",
  "",
  "",
  "",
  ""
]
EOM
echo "Creating credential of the issuer by the CA"
heimdalljs cred new --attributes attr_issuer.json \
  --id 1234500 \
  --publicKey issuer_pk.json \
  --expiration 365 \
  --type RegistrationOffice \
  --delegatable 1 \
  --registry https://gitlab.fit.fraunhofer.de/matthias.babel/heimdall-revocation/-/raw/master/ \
  --secretKey ca_sk.txt \
  --destination cred_issuer.json
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
echo "Generate the delegation - the presentation of the issuers credential"
heimdalljs pres delegation 8 \
  --expiration 100 \
  --challenge $CHALLENGE \
  --credential cred_issuer.json \
  --destination pres_delegation.json \
  --issuerPK
echo "Generate the presentation of the attribute"
heimdalljs pres attribute 10 \
  --expiration 100 \
  --challenge $CHALLENGE \
  --credential cred_holder.json \
  --destination pres_attribute.json \
  --secretKey holder_sk.txt
echo "Verify the delegation presentation"
heimdalljs verify pres_delegation.json
echo "Verify the attribute presentation"
heimdalljs verify pres_attribute.json
