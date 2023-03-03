import axios from "axios";
import { State, StateSchema } from "./schema";
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
    saveData = <TData>(dirName: string, data: TData) =>
      fs.writeFileSync(
        path.join(resultsDir, dirName, "index.json"),
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
  saveData(stateDir, state);
  for (let lga of lgas) {
    const lgaDir = path.join(stateDir, normalize(`${lga.lga_id}-${lga.name}`));
    createDirectory(lgaDir);
    saveData(lgaDir, lga);
    const wards = assert(data.find((row) => row.lga._id === lga._id)).wards;
    for (let ward of wards) {
      const wardDir = path.join(
        lgaDir,
        normalize(`${ward.ward_id}-${ward.name}`)
      );
      createDirectory(wardDir);
      saveData(wardDir, ward);
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
