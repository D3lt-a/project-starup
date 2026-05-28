#!/usr/bin/env node

const path = require("path")
const prompts = require('prompts');
const fs = require('fs-extra');

async function main() {
    const response = await prompts({
        type: "text",
        name: "projectName",
        message: "Project name",
        initial: "project-startup"
    });

    const projectName = response.projectName?.trim();
    if (!projectName) process.exit(1);

    const targetDir = path.resolve(process.cwd(), projectName);
    const templateDir = path.resolve(__dirname, "../template");

    if (await fs.pathExists(targetDir)) {
        console.error(`Folder already exists: ${projectName}`);
        process.exit(1);
    }

    await fs.copy(templateDir, targetDir);
    console.log(`Created ${projectName}`);
    console.log(`Next: cd ${projectName} && npm install && npm run dev`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});