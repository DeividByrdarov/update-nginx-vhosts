#!/usr/bin/env node
const fs = require("fs-extra")
const path = require("path")
const inquirer = require("inquirer")

const cwd = process.cwd()
;(async () => {
  const { templatePath } = await inquirer.prompt([
    {
      type: "input",
      name: "templatePath",
      default: "/etc/nginx/sites-available/template",
      message: "Enter a template file path: ",
    },
  ])

  const files = await fs.readdir(cwd)
  fs.readFile(templatePath, "utf8", async (err, template) => {
    if (err) {
      if (err.code === "ENOENT") {
        console.log("File not found!")
        return
      }
      throw err
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
