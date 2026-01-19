# Architecture

Obsidian Community Plugin. Since you are building this for the community, this document is structured to help you maintain, explain, and extend the project.
Plugin Name: Folder Homepage or obsHomepages

#### Architecture Overview

Purpose
To enhance the Obsidian File Explorer navigation by automatically opening a designated "Homepage" note when a folder is expanded.
Core Philosophy
 * Non-Destructive: The plugin must not interfere with standard Obsidian file operations (renaming, moving, deleting).
 * Additive UX: The plugin only triggers additional actions (opening a tab) without stopping the native folder toggle animation.
 * State-Aware: Actions are only triggered when the user intends to explore a folder (Expansion), not when tidying up (Collapse).

