# NO AUTH
GET /tor
params: none
response: { torAddress: string }


# Product Key AUTH
POST /register
params: { pubkey: string, productKey: string }
response: no content


# STANDARD AUTH
GET /
params: none
response: S9Server

GET apps/installed
params: none
response: InstalledApp[]

GET apps/available
params: none
response: AvailableApp[]

POST apps/install
params: { name: string }
response: InstalledApp