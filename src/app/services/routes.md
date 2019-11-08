# NO AUTH
GET /tor
params: none
response: { torAddress: string }


# SERIAL AUTH
POST /register
params: { pubkey: string, serial: string }
response: no content


# STANDARD AUTH
GET /status/shallow
params: none
response: any

GET apps/installed
params: none
response: string[]

apps/available
params: none
response: string[]