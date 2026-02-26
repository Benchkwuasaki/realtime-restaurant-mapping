import fs from "fs"
import path from "path"
import { faker } from "@faker-js/faker"

import { status } from "./data"

const employee = Array.from({ length: 100 }, () => ({
  id: `EMP-${faker.number.int({ min: 1000, max: 9999 })}`,
  name: faker.person.fullName(),
  position: faker.hacker.phrase().replace(/^./, (letter) => letter.toUpperCase()),
  unit: faker.hacker.phrase().replace(/^./, (letter) => letter.toUpperCase()),
  division: faker.hacker.phrase().replace(/^./, (letter) => letter.toUpperCase()),
  department: faker.hacker.phrase().replace(/^./, (letter) => letter.toUpperCase()),
  contactNumber: faker.phone.number(),
  email: faker.internet.email(),
  status: faker.helpers.arrayElement(status).value,
}))

fs.writeFileSync(
  path.join(__dirname, "employee.json"),
  JSON.stringify(employee, null, 2)
)

console.log("✅ employee data generated.")