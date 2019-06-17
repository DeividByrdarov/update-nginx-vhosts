#!/usr/bin/env node
const fs = require("fs-extra")
const path = require("path")
const inquirer = require("inquirer")
const exec = require("child_process").exec

require("colors")

const cwd = process.cwd()

const SELECTIONS = {
  ALL_FOLDERS: "Get all folders from current directory as vHosts",
  CHOOSE_FOLDER: "Choose folder to add as vHost",
}

const main = async () => {
  const { selection } = await inquirer.prompt([
    {
      type: "list",
      name: "selection",
      message: "What would you like to do?",
      choices: [...Object.keys(SELECTIONS).map(name => SELECTIONS[name])],
    },
  ])

  switch (selection) {
    case SELECTIONS.ALL_FOLDERS:
      updateAllVhosts()
      break
    case SELECTIONS.CHOOSE_FOLDER:
      selectFolderForVhost()
      break
    default:
      console.log("Something went wrong".red)
      break
  }
}

const selectFolderForVhost = async () => {
  const files = await fs.readdir(cwd)
  const choices = []

  for (const file of files) {
    if (fs.statSync(path.join(cwd, file)).isDirectory()) {
      choices.push(file)
    }
  }

  const { name } = await inquirer.prompt([
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
  })
}

const askForTemplate = async () =>
  await inquirer.prompt([
    {
      type: "input",
      name: "templatePath",
      default: "/etc/nginx/template",
      message: "Enter a template file path: ",
    },
  ])

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

    if (deleteHosts) {
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

    console.log("Restarting Nginx...".yellow)
    exec("service nginx restart", err => {
      if (err) throw err

      console.log("Nginx restarted... Go check your new HOSTS 😉".green)
    })
  })
}

const nginxInstalled = () => {
  const enabledDirectory = "/" + path.join("etc", "nginx", "sites-available")

  if (!fs.existsSync(enabledDirectory)) {
    console.log("\nNginx has not been installed.\n".red)
    return 0
  }

  return 1
}

const createVhost = async (template, name) => {
  if (!nginxInstalled()) {
    return
  }

  const vhostFile = "/" + path.join("etc", "nginx", "sites-available", name)
  fs.writeFileSync(vhostFile, template)
  console.log(`Created vHost ${name}`.green)
  fs.symlinkSync(
    vhostFile,
    "/" + path.join("etc", "nginx", "sites-enabled", name)
  )
  console.log(`Created symlink for vHost ${name}\n`.green)
}

const replacePlaceholders = async (template, name) => {
  const { indexFile } = await inquirer.prompt([
    {
      type: "input",
      name: "indexFile",
      default: "index.html",
      message: `Enter an index file for ${name}: `,
    },
  ])

  let newTemplate = "" + template
  const logFile = name.split(".")[0]

  newTemplate = newTemplate.split("$!{name}").join(name)
  newTemplate = newTemplate.split("$!{logFile}").join(logFile)
  newTemplate = newTemplate.split("$!{indexFile}").join(indexFile)

  return newTemplate
}

const deleteHosts = directory => {
  const hostFiles = fs.readdirSync(directory)

  for (const file of hostFiles) {
    if (file === "default") {
      console.log("Skipped deleting default vHost".green)
      continue
    }
    fs.unlink(path.join(directory, file), err => {
      if (err) throw err
    })
  }
}

main()
