import fs from "fs"
import path from "path"
import { faker } from "@faker-js/faker"

import { status } from "./data"

const tasks = Array.from({ length: 100 }, () => ({
  id: `TASK-${faker.number.int({ min: 1000, max: 9999 })}`,
  title: faker.hacker.phrase().replace(/^./, (letter) => letter.toUpperCase()),
  status: faker.helpers.arrayElement(status).value,
}))

fs.writeFileSync(
  path.join(__dirname, "tasks.json"),
  JSON.stringify(tasks, null, 2)
)

console.log("✅ Tasks data generated.")