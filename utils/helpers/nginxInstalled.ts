import fs from "fs-extra"
import path from "path"

const nginxInstalled = () => {
  const enabledDirectory = "/" + path.join("etc", "nginx", "sites-available")

  if (!fs.existsSync(enabledDirectory)) {
    console.log("\nNginx has not been installed.\n".red)
    return 0
  }

  return 1
}

export default nginxInstalled
