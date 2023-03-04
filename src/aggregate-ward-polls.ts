/**
 * This script crawls through all results/[state]/[lga]/[ward]/polling-units.csv files,
 * and aggregates them by state.
 *
 * The output is a single file, results/[state]/polling-units.csv, sorted by state, lga, ward, polling unit.
 *
 * https://docs.google.com/spreadsheets/d/1YOFqQ-DYZR7xYuNSGhwkmqbT8_6pKqL9Ty1-eU47ZYw/edit#gid=0
 */

import fs from "fs";
import path from "path";
import fg from "fast-glob";

import { PollingUnitListSchema } from "./schema";
import { json2csv } from "json-2-csv";
import { assert } from "./utils/assert.utils";

const resultsDir = path.join(__dirname, "..", "results");

type WardAggregate = {
  state_name: string;
  lga_name: string;
  ward_name: string;
  name: string;
  pu_code: string;
  document?: string;
  uploaded_at?: string;
  has_old_documents: boolean;
  json_url: string;
};

export async function aggregateWards(stateDir: string) {
  const jsonFilePaths = await fg(["*/*/polling-units.json"], {
    cwd: stateDir,
  });
  const aggregates: WardAggregate[] = [];
  const stateDirBaseName = path.basename(stateDir);
  console.log(stateDirBaseName);
  for (let filePath of jsonFilePaths) {
    const json = require(path.join(stateDir, filePath));
    const pollingUnits = PollingUnitListSchema.parse(json);
    for (let pu of pollingUnits) {
      aggregates.push({
        state_name: pu.state_name,
        lga_name: pu.lga_name,
        ward_name: pu.ward_name,
        name: pu.name,
        pu_code: pu.pu_code,
        document: pu.document?.url,
        has_old_documents: pu.has_old_documents,
        uploaded_at: pu.document?.updated_at,
        json_url: [
          `https://raw.githubusercontent.com/mykeels/inec-presidential-elections-2023/master/results`,
          path.join(stateDirBaseName, filePath).replace(/\\/g, "/"),
        ].join("/"),
      });
    }
  }
  aggregates.sort(
    (a, b) =>
      a.state_name.localeCompare(b.state_name) ||
      a.lga_name.localeCompare(b.lga_name) ||
      a.ward_name.localeCompare(b.ward_name) ||
      a.name.localeCompare(b.name) ||
      a.pu_code.localeCompare(b.pu_code)
  );

  const csvFilePath = path.join(stateDir, "polling-units.csv");

  json2csv(
    aggregates,
    async (err, csv) => {
      if (err) {
        return console.error(err);
      }
      await fs.promises.writeFile(csvFilePath, assert(csv));
    },
    {
      emptyFieldValue: "",
      keys: [
        "state_name",
        "lga_name",
        "ward_name",
        "name",
        "pu_code",
        "document",
        "uploaded_at",
        "has_old_documents",
        "json_url",
      ],
    }
  );
}

export async function processStates() {
  const stateDirs = fs
    .readdirSync(resultsDir, {
      withFileTypes: true,
    })
    .filter((i) => i.isDirectory())
    .map((i) => path.join(resultsDir, i.name));

  for (const stateDir of stateDirs) {
    console.log(stateDir);
    await aggregateWards(stateDir);
  }
}

if (require.main === module) {
  (async () => {
    processStates();
  })();
}
