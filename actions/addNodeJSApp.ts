import fs from "fs-extra"
import path from "path"
import inquirer from "inquirer"
import { createVhost, restartNginx } from "../utils/helpers"

const addNodeJSApp = async () => {
  try {
    const template = await fs.readFile(
      path.join(__dirname, "..", "templates", "nodejs-template"),
      "utf8"
    )
    const { name, port } = await inquirer.prompt([
      {
        type: "input",
        message:
          "Enter full subdomain of the project (example: test.example.com)",
        name: "name",
      },
      {
        type: "input",
        message: "Enter the port of the running app",
        name: "port",
      },
    ])

    let newTemplate = "" + template

    newTemplate = newTemplate.split("$!{name}").join(name)
    newTemplate = newTemplate.split("$!{port}").join(port)

    createVhost(newTemplate, name)

    restartNginx()
  } catch (error) {
    console.log(error)
  }
}

export default addNodeJSApp
