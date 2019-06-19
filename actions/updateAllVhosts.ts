import fs from "fs-extra"
import path from "path"
import inquirer from "inquirer"
import {
  askForTemplate,
  nginxInstalled,
  replacePlaceholders,
  createVhost,
  restartNginx,
  deleteHosts,
} from "../utils/helpers"
import { cwd } from "../utils/constants"

const updateAllVhosts = async () => {
  const { templatePath } = await askForTemplate()
  const { deleteVhosts } = await inquirer.prompt([
    {
      type: "confirm",
      name: "deleteVhosts",
      message: "Should we delete all vHosts except the default one?",
      default: true,
    },
  ])

  const files = await fs.readdir(cwd)
  fs.readFile(templatePath, "utf8", async (err, template) => {
    if (err) {
      if (err.code === "ENOENT") {
        console.log("\nFile not found!\n".red)
        return
      }
      throw err
    }

    if (!nginxInstalled()) {
      return
    }

    if (deleteVhosts) {
      const availableDirectory =
        "/" + path.join("etc", "nginx", "sites-available")
      const enabledDirectory = "/" + path.join("etc", "nginx", "sites-enabled")

      deleteHosts(availableDirectory)
      deleteHosts(enabledDirectory)
    }

    for (let name of files) {
      if (fs.statSync(path.join(cwd, name)).isDirectory()) {
        const newTemplate = await replacePlaceholders(template, name)

        await createVhost(newTemplate, name)
      }
    }

    restartNginx()
  })
}

export default updateAllVhosts
