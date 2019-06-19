import inquirer from "inquirer"

const askForTemplate = async () =>
  await inquirer.prompt<{ templatePath: string }>([
    {
      type: "input",
      name: "templatePath",
      default: "/etc/nginx/template",
      message: "Enter a template file path: ",
    },
  ])

export default askForTemplate
