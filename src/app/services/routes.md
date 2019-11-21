# NO AUTH
GET /version
params: none
response: { version: string } -- e.g. "0.1.0"

GET <version>/tor
params: none
response: { torAddress: string }

# Product Key AUTH
POST <version>/register
params: { pubKey: string, productKey: string }
response: no content


# STANDARD AUTH
GET <version>/
params: none
response: S9Server

GET <version>/apps/installed
params: none
response: InstalledApp[]

GET <version>/apps/available
params: none
response: AvailableApp[]

POST <version>/apps/install
params: { name: string }
response: InstalledApp