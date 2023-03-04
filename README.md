# INEC Presidential Elections 2023 Results

Aggregated in [a Google Sheet](https://docs.google.com/spreadsheets/d/1YOFqQ-DYZR7xYuNSGhwkmqbT8_6pKqL9Ty1-eU47ZYw/edit#gid=0).

## What questions are attempted with this data project?

- [x] Make it easy to view all polling unit voting records in a [spreadsheet](https://docs.google.com/spreadsheets/d/1YOFqQ-DYZR7xYuNSGhwkmqbT8_6pKqL9Ty1-eU47ZYw/edit#gid=0).
- [x] We found that some polling units have multiple documents uploaded, stored under `old_documents` in the `results/*/*/*/polling-units.json` files.
  - [ ] How many polling units have this?
  - [ ] What is the nature of these documents? Perhaps, they were blurry on initial upload, so had to be re-uploaded?
  - [ ] By how much do they differ from the currently uploaded document in content or date/time?
- [ ] Now that the elections is over, can we detect that new data is been added to the INEC's servers even if such data is back-dated?
- [x] The Labour party is litigating to ensure that only electoral results uploaded from the polling unit as per Electoral Act 2022, is considered by INEC during the result collation.
  - [x] How close can we get to determining how many polling units will be affected? E.g. we do not know where the BVAS uploads from, but we can filter by date/time of upload.

## How are results arranged?

All results are in the [results](./results/) folder, which is arranged as:

- state
  - lga
    - ward
      - `polling-units.csv`
      - `polling-units.json`
      - `ward.json`
    - `lga.json`
  - `state.json`
- `ward-feb-25th-valid-uploads-stats.csv`

## How is data sourced?

All data is sourced from public URLs of INEC's servers. That these URLs are public means that they do not exist behind an authentication layer.

Examples are:

- https://lv001-g.inecelectionresults.ng/api/v1/elections/63f8f25b594e164f8146a213/pus?ward=5f0f3f5c8f77bb3acad0afe8 which responds with data about polling-units of the Shiyar Galadima ward, in Talata Mafara LGA of Zamfara state.
  - [Shiyar Galadima Ward Data backup](./results/37-zamfara/3874-talata-mafara/26309-shiyar-galadima/ward.json)
  - [Shiyar Galadima Polling Units Data backup](./results/37-zamfara/3874-talata-mafara/26309-shiyar-galadima/polling-units.json)
- https://lv001-g.inecelectionresults.ng/api/v1/elections/63f8f25b594e164f8146a213/lga/state/37 which responds with data about Zamfara state.
  - [Zamfare State Data backup](./results/37-zamfara/state.json)
