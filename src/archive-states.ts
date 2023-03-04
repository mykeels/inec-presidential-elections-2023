/**
 * This script archives the data for all states, lgas, and wards in the INEC API.
 */

import axios from "axios";
import { StateSchema } from "./schema";
import fs from "fs";
import path from "path";
import { assert } from "./utils/assert.utils";

const resultsDir = path.join(__dirname, "..", "results");

const stateIds = new Array(36).fill(0).map((_, i) => i + 1);

const normalize = (str: string) =>
  str
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/-$/, "")
    .toLowerCase();

const archiveState = async (
  stateId: number,
  {
    createDirectory = (dirName: string) =>
      fs.mkdirSync(path.join(resultsDir, dirName), { recursive: true }),
    saveData = <TData>(fileName: string, data: TData) =>
      fs.writeFileSync(
        path.join(resultsDir, fileName),
        JSON.stringify(data, null, 2)
      ),
  } = {}
) => {
  const res = await axios.get(
    `https://lv001-g.inecelectionresults.ng/api/v1/elections/63f8f25b594e164f8146a213/lga/state/${stateId}`
  );
  const data = StateSchema.parse(res.data).data;
  const state = data[0].state;
  const lgas = data.map((row) => row.lga);

  console.log("Archiving", state.name);
  const stateDir = normalize(`${state.state_id}-${state.name}`);
  createDirectory(stateDir);
  saveData(path.join(stateDir, "state.json"), state);
  for (let lga of lgas) {
    const lgaDir = path.join(stateDir, normalize(`${lga.lga_id}-${lga.name}`));
    createDirectory(lgaDir);
    saveData(path.join(lgaDir, "lga.json"), lga);
    const wards = assert(data.find((row) => row.lga._id === lga._id)).wards;
    for (let ward of wards) {
      const wardDir = path.join(
        lgaDir,
        normalize(`${ward.ward_id}-${ward.name}`)
      );
      createDirectory(wardDir);
      saveData(path.join(wardDir, "ward.json"), {
        ...ward,
        state_name: state.name,
        lga_name: lga.name,
      });
    }
  }
};

export const archiveStates = async () => {
  await Promise.all(stateIds.map((id) => archiveState(id)));
};

if (require.main === module) {
  (async () => {
    archiveStates();
  })();
}
