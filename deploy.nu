# deploy.nu - Build and deploy to Obsidian vault
def main [dir?: string] {
  let dir = if $dir != null { $dir } else { $env.NU_GIT_DEPLOY_DIR }

  print "Building..."
  pnpm build

  print $"Deploying to ($dir)..."
  mkdir $dir
  cp main.js $dir
  cp manifest.json $dir

  print "Done. Reload Obsidian to apply changes."
}
