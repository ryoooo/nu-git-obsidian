# deploy.nu - Build and deploy to Obsidian vault
def main [] {
  let vault_plugin_dir = "C:/Users/ryoki/Documents/Obsidian/ryoooo/.obsidian/plugins/nu-git"

  print "Building..."
  pnpm build

  print $"Deploying to ($vault_plugin_dir)..."
  mkdir $vault_plugin_dir
  cp main.js $vault_plugin_dir
  cp manifest.json $vault_plugin_dir

  print "Done. Reload Obsidian to apply changes."
}
