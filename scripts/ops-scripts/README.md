# Operations scripts

## How to run

Create a `.env` file starting from `.env.example` and then from the parent folder (the root of this repository) execute the following command:

``` sh
npm run start:<script-to-run> -w ops-scripts
```

### Run massive activation script

Create a `csv` file inside `.data` folder, the file format should be the following:

``` csv
aUserId0
aUserId1
```

Then run the following command:

``` sh
npm run start:massive-activation -w ops-scripts
```
