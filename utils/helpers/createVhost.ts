import fs from "fs-extra"
import path from "path"
import { nginxInstalled } from "."

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

export default createVhost
