#!/usr/bin/env node
const fs = require("fs-extra")
const path = require("path")
const inquirer = require("inquirer")
const exec = require("child_process").exec

require("colors")

const cwd = process.cwd()
;(async () => {
  const { templatePath } = await inquirer.prompt([
    {
      type: "input",
      name: "templatePath",
      default: "/etc/nginx/template",
      message: "Enter a template file path: ",
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

    const availableDirectory = "/etc/nginx/sites-available"
    const enabledDirectory = "/etc/nginx/sites-enabled"

    if (!fs.existsSync(enabledDirectory)) {
      console.log("\nNginx has not been installed.\n".red)
      return
    }

    deleteHosts(availableDirectory)
    deleteHosts(enabledDirectory)

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
})()

const createVhost = async (template, name) => {
  const vhostFile = "/" + path.join("etc", "nginx", "sites-available", name)
  fs.writeFileSync(vhostFile, template)
  console.log(`\nCreated vHost ${name}`.green)
  fs.symlinkSync(
    vhostFile,
    "/" + path.join("etc", "nginx", "sites-enabled", name)
  )
  console.log(`Created symlink for vHost ${name}`.green)
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
