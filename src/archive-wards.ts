import fs from "fs";
import path from "path";
import fg from "fast-glob";
import axios from "axios";
import { json2csv } from "json-2-csv";

import { PollingUnitSchema, Ward, WardSchema } from "./schema";
import { assert } from "./utils/assert.utils";

const resultsDir = path.join(__dirname, "..", "results");

const archiveWard = async (
  ward: Ward,
  dirName: string,
  {
    saveData = <TData>(fileName: string, data: TData) =>
      fs.writeFileSync(fileName, JSON.stringify(data, null, 2)),
  } = {}
) => {
  const jsonFilePath = path.join(dirName, "polling-units.json");
  const csvFilePath = path.join(dirName, "polling-units.csv");

  if (fs.existsSync(jsonFilePath) && fs.existsSync(csvFilePath)) {
    return;
  }

  console.log(
    "Archiving",
    "State",
    ward.state_name,
    "LGA",
    ward.lga_name,
    ward.name
  );
  const res = await axios.get(
    `https://lv001-g.inecelectionresults.ng/api/v1/elections/63f8f25b594e164f8146a213/pus?ward=${ward._id}`
  );
  const data = PollingUnitSchema.parse(res.data).data;
  const pollingUnits = data.map((row) => ({
    ...row.polling_unit,
    state_name: ward.state_name,
    lga_name: ward.lga_name,
    ward_name: ward.name,
    document: row.document,
    old_documents: row.old_documents,
    has_old_documents: !!row.old_documents?.length,
  }));
  saveData(jsonFilePath, pollingUnits);
  json2csv(
    pollingUnits,
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
        "document.url",
        "has_old_documents",
      ],
    }
  );
};

export async function archiveWards() {
  const wardFilePaths = await fg(["*/*/*/ward.json"], {
    absolute: true,
    cwd: path.join(resultsDir),
  });
  const batchSize = 16;
  let count = 0;
  const totalCount = wardFilePaths.length;
  while (wardFilePaths.length) {
    const batch = wardFilePaths.splice(0, batchSize);
    await Promise.all(
      batch.map((filePath) => {
        const res = require(filePath);
        const ward = WardSchema.parse(res);
        return archiveWard(ward, path.dirname(filePath));
      })
    );
    count++;
    console.log(
      `===================${
        ((count * batchSize) / totalCount) * 100
      }%===================`
    );
  }
}

if (require.main === module) {
  (async () => {
    archiveWards();
  })();
}
