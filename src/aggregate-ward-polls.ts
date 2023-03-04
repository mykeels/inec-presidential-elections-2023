/**
 * This script crawls through all results/[state]/[lga]/[ward]/polling-units.csv files,
 * and aggregates them by state.
 *
 * The output is a single file, results/[state]/polling-units.csv
 *
 * https://docs.google.com/spreadsheets/d/1YOFqQ-DYZR7xYuNSGhwkmqbT8_6pKqL9Ty1-eU47ZYw/edit#gid=0
 */

import fs from "fs";
import path from "path";
import fg from "fast-glob";

const resultsDir = path.join(__dirname, "..", "results");

export async function aggregateWards(stateDir: string) {
  const csvFilePaths = await fg(["*/*/polling-units.csv"], {
    absolute: true,
    cwd: stateDir,
  });
  const stateCSV = csvFilePaths
    .map((filePath) => fs.readFileSync(filePath, "utf8"))
    .map((content, i) =>
      i > 0 ? content.split("\n").slice(1).join("\n") : content
    )
    .join("\n\n");

  fs.writeFileSync(path.join(stateDir, "polling-units.csv"), stateCSV, "utf8");
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
