# Folder Homepage for Obsidian

This plugin improves navigation in Obsidian by treating folders like notes. When you click a folder title in the File Explorer, it automatically opens a "homepage" note for that folder.

## Features

* **Seamless Navigation:** Click a folder title to expand it AND open its homepage in a new tab.
* **Smart Detection:** Checks for files in priority order (e.g., `Folder/Folder.md`, then `Folder/README.md`).
* **Auto-Create:** Option to automatically create a homepage file if one doesn't exist when you click the folder.
* **Non-Destructive:** Does not interfere with standard Obsidian collapse/expand behavior.

## Usage

1.  Click any **closed** folder in the File Explorer.
2.  The folder will expand.
3.  If a matching homepage file exists inside, it will open in the main view.

## Settings

* **Homepage Filenames:** Define a list of filenames to look for (e.g., `README.md, index.md`).
* **Match Folder Name:** If enabled, looks for a file with the same name as the folder (e.g., `Journal/Journal.md`).
* **Create if not exists:** If enabled, clicking a folder without a homepage will create one automatically using your preferred naming convention.