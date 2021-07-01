#!/bin/bash

CHALLENGE=1234

echo "Generate keys"
heimdalljs key new ca > ca_sk.txt
heimdalljs key new issuer > issuer_sk.txt
heimdalljs key pub < issuer_sk.txt > issuer_pk.json
heimdalljs key new holder > holder_sk.txt
heimdalljs key pub < holder_sk.txt > holder_pk.json

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
  --type RegistryOffice \
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
# https://nominatim.openstreetmap.org/ui/search.html?q=bayern&dedupe=1&limit=1&polygon_threshold=0.1
cat <<EOM >$(pwd)/polygon.json
[[10.4544399,47.5557964],[11.2698847,47.3975653],[11.6361799,47.5945549],[12.2039614,47.6067646],
[12.2570286,47.7430345],[12.7811652,47.6738182],[13.0066207,47.4643842],[13.0807484,47.6870338],[12.9052586,47.7234349],
[13.0033609,47.8500223],[12.7581257,48.1260686],[13.329798,48.3235141],[13.5089626,48.5905995],[13.730512,48.5147674],
[13.8395518,48.771618],[12.6555517,49.4347994],[12.4005551,49.7538049],[12.5476758,49.920496],[11.9349229,50.4236526],
[11.5194652,50.3739938],[11.3467213,50.5214416],[11.2531027,50.2678525],[10.8304723,50.3927122],[10.7174795,50.2043467],
[10.1062239,50.5632937],[9.5013397,50.2431399],[9.5130437,50.0943483],[8.9763497,50.0497851],[9.1505794,49.7427032],
[9.0664847,49.6022936],[9.4061438,49.6454555],[9.2956877,49.7404603],[9.4224965,49.789454],[9.7999073,49.730973],
[9.8117746,49.5556982],[10.1212713,49.5110265],[10.1248147,49.1988368],[10.4568403,48.9204496],[10.4951298,48.6871989],
[10.2687047,48.7035845],[10.3120672,48.522946],[9.9674293,48.3742096],[10.1407065,48.0977316],[10.1301574,47.6768474],
[9.840425,47.677494],[9.550566,47.5371757],[9.9704798,47.5458589],[10.2323482,47.2705791],[10.4544399,47.5557964]]
EOM
echo "Generate the presentation of the attribute"
heimdalljs pres polygon 14 \
  --expiration 100 \
  --challenge $CHALLENGE \
  --credential cred_holder.json \
  --destination pres_polygon.json \
  --secretKey holder_sk.txt \
  --polygon polygon.json
echo "Verify the delegation presentation"
heimdalljs verify pres_delegation.json
echo "Verify the attribute presentation"
heimdalljs verify pres_polygon.json
