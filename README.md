# Nu Git

A simple Git auto-backup plugin for [Obsidian](https://obsidian.md/). Built as a lightweight alternative to [Obsidian Git](https://github.com/Vinzent03/obsidian-git), using [Nushell](https://www.nushell.sh/) instead of PowerShell for shell execution.

## Why?

Obsidian Git is feature-rich but relies on PowerShell on Windows. If you use Nushell as your primary shell, this is inconvenient. Obsidian Git also suffers from frequent `index.lock` conflicts when auto-commit collides with manual git operations.

Nu Git solves both problems by executing git commands through Nushell and providing only the essentials: auto-backup with lock-aware scheduling.

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

Install via [BRAT](https://github.com/TfTHacker/obsidian42-brat): add `ryoooo/nu-git-obsidian` as a beta plugin.

## Configuration

Edit `data.json` in the plugin directory directly. No settings UI.

| Key | Default | Description |
|-----|---------|-------------|
| `debounceSeconds` | `30` | Seconds to wait after file changes before auto-backup |
| `autoPush` | `true` | Automatically push after commit |
| `nuPath` | `"nu"` | Path to Nushell binary |
| `staleLockThresholdMs` | `120000` | Auto-remove `index.lock` older than this (ms) |
