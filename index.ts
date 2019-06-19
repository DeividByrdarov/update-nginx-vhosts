#!/usr/bin/env node
import "colors"
import fs from "fs-extra"
import path from "path"
import inquirer from "inquirer"
import { exec } from "child_process"
import { updateAllVhosts, selectFolderForVhost, addNodeJSApp } from "./actions"

const cwd = process.cwd()

const SELECTIONS: { [key: string]: string } = {
  NODEJS_APP: "Add a NodeJS application as vHost",
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
    case SELECTIONS.NODEJS_APP:
      addNodeJSApp()
      break
    default:
      console.log("Something went wrong".red)
      break
  }
}

const askForTemplate = async () =>
  await inquirer.prompt<{ templatePath: string }>([
    {
      type: "input",
      name: "templatePath",
      default: "/etc/nginx/template",
      message: "Enter a template file path: ",
    },
  ])

const restartNginx = () => {
  console.log("Restarting Nginx...".yellow)
  exec("service nginx restart", err => {
    if (err) throw err

    console.log("Nginx restarted... Go check your new HOSTS 😉".green)
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

const createVhost = async (template: string, name: string) => {
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

const replacePlaceholders = async (template: string, name: string) => {
  const { indexFile } = await inquirer.prompt<{ indexFile: string }>([
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

const deleteHosts = (directory: string) => {
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
