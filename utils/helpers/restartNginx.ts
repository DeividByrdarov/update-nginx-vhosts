import { exec } from "child_process"

const restartNginx = () => {
  console.log("Restarting Nginx...".yellow)
  exec("service nginx restart", err => {
    if (err) throw err

    console.log("Nginx restarted... Go check your new HOSTS 😉".green)
  })
}

export default restartNginx
