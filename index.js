#!/usr/bin/env node
const fs = require("fs-extra")
const path = require("path")
const inquirer = require("inquirer")
const colors = require("colors")

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
        console.log("File not found!".red)
        return
      }
      throw err
    }
    const directory = "/etc/nginx/sites-available"
    if (!fs.existsSync(directory)) {
      console.log("Nginx has not been installed.".red)
      return
    }

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

    for (let name of files) {
      if (fs.statSync(path.join(cwd, name)).isDirectory()) {
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
        console.log(newTemplate)
        console.log("-----------------------------------")
      }
    }
  })
})()
