import tsparser from "@typescript-eslint/parser";
import obsidianmd from "eslint-plugin-obsidianmd";
import tseslint from "@typescript-eslint/eslint-plugin";

export default [
    {
        files: ["**/*.ts"],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                project: "./tsconfig.json"
            },
        },
        plugins: {
            "@typescript-eslint": tseslint,
            obsidianmd,
        },
        rules: {
            ...obsidianmd.configs.recommended.rules,
        },
    },
];
