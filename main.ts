import { App, Plugin, PluginSettingTab, Setting, TFile, Notice, WorkspaceLeaf, FileView } from 'obsidian';


interface FolderHomepageSettings {
    homepageNames: string[];
    matchFolderName: boolean;
    autoCreate: boolean;
}

const DEFAULT_SETTINGS: FolderHomepageSettings = {
    homepageNames: ['README.md', 'homepage.md', 'index.md'],
    matchFolderName: true,
    autoCreate: false
}

export default class ObsHomepagesPlugin extends Plugin {
    settings: FolderHomepageSettings;
    clickLock: boolean = false;

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new FolderHomepageSettingTab(this.app, this));

        this.app.workspace.onLayoutReady(() => {
            this.registerFolderClickListeners();
        });

        this.registerEvent(
            this.app.workspace.on('layout-change', () => {
                this.registerFolderClickListeners();
            })
        );
        console.debug("obsHomepages Plugin loaded.");
    }

    onunload() {
        this.cleanUp();
        console.debug("obsHomepages Plugin unloaded.");
    }

    cleanUp() {
        const fileExplorerLeaves = this.app.workspace.getLeavesOfType('file-explorer');
        for (const leaf of fileExplorerLeaves) {
            const container = leaf.view.containerEl;
            if (container) {
                container.classList.remove('folder-homepage-hooked');
            }
        }
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    registerFolderClickListeners() {
        const fileExplorerLeaves = this.app.workspace.getLeavesOfType('file-explorer');
        for (const leaf of fileExplorerLeaves) {
            const container = leaf.view.containerEl;
            if (container.classList.contains('folder-homepage-hooked')) {
                continue;
            }
            this.registerDomEvent(container, 'click', (evt: MouseEvent) => {
                this.handleExplorerClick(evt).catch(( error ) => {
                    console.debug( 'obsHomepages: Error handling folder click:', error );
                });
            });
            container.classList.add('folder-homepage-hooked');
        }
    }

    async handleExplorerClick(evt: MouseEvent) {
        if (this.clickLock) return;

        const target = evt.target as HTMLElement;
        const folderTitleEl = target.closest('.nav-folder-title');

        if (!folderTitleEl) return;
        const folderContainer = folderTitleEl.parentElement;
        if (!folderContainer) return;

        // Ensure we are not clicking the arrow to toggle
        if (target.classList.contains('nav-folder-collapse-indicator')) return;

        // Apply lock to prevent rapid firing/race conditions
        this.clickLock = true;

        try {
            const folderPath = folderTitleEl.getAttribute('data-path');
            if (!folderPath) return;

            await this.openHomepageForFolder(folderPath);
        } finally {
            // Debounce release of the lock
            setTimeout(() => {
                this.clickLock = false;
            }, 300);
        }
    }

    getHomepageCandidates(folderPath: string, folderName: string): string[] {
        const candidates: string[] = [];
        if (this.settings.matchFolderName) {
            candidates.push(`${folderPath}/${folderName}.md`);
        }
        for (const name of this.settings.homepageNames) {
            candidates.push(`${folderPath}/${name}`);
        }
        return candidates;
    }

    async openHomepageForFolder(folderPath: string) {
        const folderName = folderPath.split('/').pop() || 'Untitled';
        const candidates = this.getHomepageCandidates(folderPath, folderName);

        // 1. Try to find an existing file
        for (const filePath of candidates) {
            const file = this.app.vault.getAbstractFileByPath(filePath);
            if (file instanceof TFile) {
                await this.activateFile(file);
                return;
            }
        }

        // 2. If no file found, check auto-create
        if (this.settings.autoCreate) {
            await this.createHomepage(folderPath, folderName, candidates);
        }
    }

    async activateFile(file: TFile) {
        // Check if file is already open in any leaf
        let leafToUse: WorkspaceLeaf | null = null;

        this.app.workspace.iterateAllLeaves((leaf) => {
            if (leafToUse) return; // Found one already
            if (leaf.view instanceof FileView && leaf.view.file && leaf.view.file.path === file.path) {
                leafToUse = leaf;
            }
        });

        if (leafToUse) {
            this.app.workspace.setActiveLeaf(leafToUse, { focus: true });
        } else {
            // Open in new tab if not found
            const newLeaf = this.app.workspace.getLeaf('tab');
            await newLeaf.openFile(file, { active: true });
        }
    }

    async createHomepage(folderPath: string, folderName: string, candidates: string[]) {
        // Use the first candidate as the target path for creation
        // This unifies the priority logic with the reading logic
        if (candidates.length === 0) return;

        const newFilePath = candidates[0];

        try {
            const newFile = await this.app.vault.create(newFilePath, `# ${folderName}\n`);
            new Notice(`Created homepage: ${newFilePath}`);
            await this.activateFile(newFile);
        } catch (error) {
            console.error("Failed to create homepage:", error);
            new Notice(`Failed to create homepage at ${newFilePath}. Check console for details.`);
        }
    }
}

class FolderHomepageSettingTab extends PluginSettingTab {
    plugin: ObsHomepagesPlugin;

    constructor(app: App, plugin: ObsHomepagesPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        new Setting( containerEl )
            .setName( 'obsHomepages settings' )
            .setHeading();

        new Setting( containerEl )
            .setName('Homepage filenames')
            .setDesc('Priority list of filenames to check (comma separated).')
            .addTextArea(text => text
                .setPlaceholder('README.md, homepage.md, index.md')
                .setValue(this.plugin.settings.homepageNames.join(', '))
                .onChange(async (value) => {
                    // Basic validation: filter empty strings after split
                    const names = value
                        .split(',')
                        .map(s => s.trim())
                        .filter(s => s.length > 0 && !s.includes('/') && !s.includes('\\')); // Prevent path traversal or invalid chars roughly

                    if (names.length !== value.split(',').filter(s => s.trim().length > 0).length) {
                        new Notice("Some filenames contained invalid characters and were ignored.");
                    }

                    this.plugin.settings.homepageNames = names;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Match folder name')
            .setDesc('Look for "Folder/Folder.md" first.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.matchFolderName)
                .onChange(async (value) => {
                    this.plugin.settings.matchFolderName = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Create if not exists')
            .setDesc('If no homepage is found, automatically create one using the highest priority name.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoCreate)
                .onChange(async (value) => {
                    this.plugin.settings.autoCreate = value;
                    await this.plugin.saveSettings();
                }));
    }
}
