# Nu Git

A simple Git auto-backup plugin for [Obsidian](https://obsidian.md/). Executes git commands through [Nushell](https://www.nushell.sh/), inheriting your shell environment for authentication.

## Why?

[Obsidian Git](https://github.com/Vinzent03/obsidian-git) calls the `git` binary directly via `child_process.spawn()`. This means it inherits the Obsidian (Electron) process environment, not your shell environment. If your git authentication depends on tools initialized in your shell profile — such as `gh auth setup-git` via [mise](https://mise.jdx.dev/) in Nushell's `env.nu` — Obsidian Git cannot access those credentials when launched from the desktop.

Nu Git runs all git commands through `nu -c "..."`, which loads your Nushell environment (including mise, credential helpers, SSH agent, etc.) on every invocation. It also provides `index.lock` conflict prevention and a minimal feature set focused on auto-backup.

## Features

- Auto commit + push on file changes (with configurable debounce)
- Auto pull on startup
- `index.lock` conflict detection and stale lock cleanup
- Manual commands via Command Palette: Backup now, Commit, Push, Pull
- Status bar showing sync state (click to backup immediately)

## Prerequisites

- [Nushell](https://www.nushell.sh/) installed and `nu` available in PATH
- Git installed
- Vault inside a Git repository

## Installation

1. Install [BRAT](https://github.com/TfTHacker/obsidian42-brat) from Community plugins if you haven't already
2. Open Command Palette (`Ctrl/Cmd + P`) and run **BRAT: Add a beta plugin**
3. Enter `ryoooo/nu-git-obsidian` and select Add Plugin
4. Enable **Nu Git** in Settings → Community plugins

## Configuration

Edit `data.json` in the plugin directory directly. No settings UI.

| Key | Default | Description |
|-----|---------|-------------|
| `debounceSeconds` | `30` | Seconds to wait after file changes before auto-backup |
| `autoPush` | `true` | Automatically push after commit |
| `nuPath` | `"nu"` | Path to Nushell binary |
| `staleLockThresholdMs` | `120000` | Auto-remove `index.lock` older than this (ms) |
