import fs from "fs-extra"
import path from "path"
import inquirer from "inquirer"
import { cwd } from "../utils/constants"
import {
  askForTemplate,
  replacePlaceholders,
  createVhost,
  restartNginx,
} from "../utils/helpers"

const selectFolderForVhost = async () => {
  const files = await fs.readdir(cwd)
  const choices = []

  for (const file of files) {
    if (fs.statSync(path.join(cwd, file)).isDirectory()) {
      choices.push(file)
    }
  }

  const { name } = await inquirer.prompt<{ name: string }>([
    {
      type: "list",
      name: "name",
      message: "Select project that you want to add to vHosts",
      choices,
    },
  ])

  const { templatePath } = await askForTemplate()

  fs.readFile(templatePath, "utf8", async (err, template) => {
    if (err) {
      if (err.code === "ENOENT") {
        console.log("\nFile not found!\n".red)
        return
      }
      throw err
    }

    const newTemplate = await replacePlaceholders(template, name)

    await createVhost(newTemplate, name)

    restartNginx()
  })
}

export default selectFolderForVhost
