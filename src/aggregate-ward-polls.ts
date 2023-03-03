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
