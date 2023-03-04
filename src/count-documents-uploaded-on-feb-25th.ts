/**
 * This script counts the number of documents 
 * - uploaded on Feb 25th, 2023
 * - uploaded after Feb 25th, 2023
 * - still pending upload as at the time of running this script, which can be found by inspecting the resulting CSV file.
 * 
 * The script also calculates the following statistics for the documents uploaded after Feb 25th, 2023:
 * - min offset
 * - max offset
 * - avg offset
 * - median offset
 * 
 * The offset is the difference in seconds between the document's updated_at timestamp and 0000Hrs on Feb 26th, 2023.
 * 
 * The results can be viewed at https://docs.google.com/spreadsheets/d/1YOFqQ-DYZR7xYuNSGhwkmqbT8_6pKqL9Ty1-eU47ZYw/edit#gid=1232981512
 * 
 */

import fs from "fs";
import path from "path";
import fg from "fast-glob";
import { PollingUnitListSchema, WardSchema } from "./schema";
import { differenceInSeconds, parseISO } from "date-fns";
import { json2csv } from "json-2-csv";
import { assert } from "./utils/assert.utils";

const resultsDir = path.join(__dirname, "..", "results");

export async function countDocumentsUploadedOnFeb25th() {
  const jsonFilePaths = await fg(["*/*/*/polling-units.json"], {
    absolute: true,
    cwd: resultsDir,
  });
  const wardStats: WardUploadStats[] = [];
  const totalFilesCount = jsonFilePaths.length;
  let count = 0;
  for (let filePath of jsonFilePaths) {
    count++;
    const json = require(filePath);
    const data = PollingUnitListSchema.parse(json);
    const wardFilePath = path.join(path.dirname(filePath), "ward.json");
    const wardJson = require(wardFilePath);
    const ward = WardSchema.parse(wardJson);
    const wardStat: WardUploadStats = {
      state: ward.state_name,
      lga: ward.lga_name,
      ward: ward.name,
      polling_unit_uploads: {
        pending: 0,
        total: data.length,
        valid: 0,
        invalid: {
          total: 0,
          offset: {
            min: 0,
            max: 0,
            avg: 0,
            median: 0,
          },
        },
      },
    };
    const offsets = data.map((row) =>
      row.document?.updated_at
        ? differenceInSeconds(
            new Date(row.document?.updated_at),
            parseISO("2023-02-26T00:00:00.00Z"),
          )
        : Number.MAX_SAFE_INTEGER
    );
    const validOffsets = offsets.filter(
      (offset) => offset < 0 && offset !== Number.MAX_SAFE_INTEGER
    );
    const pendingOffsets = offsets.filter(
      (offset) => offset === Number.MAX_SAFE_INTEGER
    );
    const invalidOffsets = offsets.filter(
      (offset) => offset >= 0 && offset !== Number.MAX_SAFE_INTEGER
    );
    wardStat.polling_unit_uploads.valid = validOffsets.length;
    wardStat.polling_unit_uploads.pending = pendingOffsets.length;
    wardStat.polling_unit_uploads.invalid.total = invalidOffsets.length;
    wardStat.polling_unit_uploads.invalid.offset.min = invalidOffsets.length
      ? Math.min(...invalidOffsets)
      : 0;
    wardStat.polling_unit_uploads.invalid.offset.max = invalidOffsets.length
      ? Math.max(...invalidOffsets)
      : 0;
    wardStat.polling_unit_uploads.invalid.offset.avg = invalidOffsets.length
      ? invalidOffsets.reduce((a, b) => a + b, 0) /
        wardStat.polling_unit_uploads.invalid.total
      : 0;
    const midpoint =
      invalidOffsets.length % 2 === 0
        ? invalidOffsets.length / 2
        : (invalidOffsets.length - 1) / 2;
    wardStat.polling_unit_uploads.invalid.offset.median = invalidOffsets.length
      ? invalidOffsets.sort()[midpoint]
      : 0;
    wardStats.push(wardStat);
    
    // console.log(ward.state_name, ward.lga_name, ward.name, wardStat.polling_unit_uploads.invalid);

    // console.log(JSON.stringify(wardStat, null, 2));
    console.log(count, "of", totalFilesCount);
  }
  const csvFilePath = path.join(
    resultsDir,
    "ward-feb-25th-valid-uploads-stats.csv"
  );
  json2csv(
    wardStats.sort(
      (a, b) =>
        a.state.localeCompare(b.state) ||
        a.lga.localeCompare(b.lga) ||
        a.ward.localeCompare(b.ward)
    ),
    async (err, csv) => {
      if (err) {
        return console.error(err);
      }
      await fs.promises.writeFile(csvFilePath, assert(csv));
    },
    {
      emptyFieldValue: "",
      keys: [
        "state",
        "lga",
        "ward",
        "polling_unit_uploads.total",
        "polling_unit_uploads.pending",
        "polling_unit_uploads.valid",
        "polling_unit_uploads.invalid.total",
        "polling_unit_uploads.invalid.offset.min",
        "polling_unit_uploads.invalid.offset.max",
        "polling_unit_uploads.invalid.offset.avg",
        "polling_unit_uploads.invalid.offset.median",
      ],
    }
  );
}

type WardUploadStats = {
  state: string;
  lga: string;
  ward: string;
  polling_unit_uploads: {
    pending: number;
    total: number;
    valid: number;
    invalid: {
      total: number;
      offset: { min: number; max: number; avg: number; median: number };
    };
  };
};

if (require.main === module) {
  (async () => {
    // console.log(
    //     differenceInSeconds(
    //         new Date("2023-02-28T20:29:49.204Z"),
    //         parseISO("2023-02-26T00:00:00.00Z"),
    //       )
    // )
    await countDocumentsUploadedOnFeb25th();
  })();
}
