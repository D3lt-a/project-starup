#!/usr/bin/env node

const path = require("path");
const prompts = require("prompts");
const fs = require("fs-extra");

async function main() {
    const response = await prompts([
        {
            type: "text",
            name: "projectName",
            message: "Project name",
            initial: "project-startup"
        },
        {
            type: "multiselect",
            name: "logics",
            message: "Which logic folders do you want to install?",
            choices: [
                { title: "Booking", value: "Booking" },
                { title: "RBAC", value: "rbac" },
                { title: "Stocks", value: "Stocks" },
                { title: "All", value: "all" }
            ],
            hint: "Use space to select, enter to confirm"
        }
    ]);

    const projectName = response.projectName?.trim();
    if (!projectName) process.exit(1);

    const targetDir = path.resolve(process.cwd(), projectName);
    const templateDir = path.resolve(__dirname, "../template");
    const logicsDir = path.join(templateDir, "Logics");

    if (await fs.pathExists(targetDir)) {
        console.error(`Folder already exists: ${projectName}`);
        process.exit(1);
    }

    await fs.copy(templateDir, targetDir, {
        filter: (src) => {
            const rel = path.relative(templateDir, src);
            if (!rel) return true;

            if (!response.logics || response.logics.length === 0) return !rel.startsWith("Logics");

            if (response.logics.includes("all")) return true;

            if (rel.startsWith("Logics")) {
                const parts = rel.split(path.sep);
                if (parts.length >= 2) {
                    const folder = parts[1];
                    return response.logics.includes(folder);
                }
            }

            return true;
        }
    });

    if (!response.logics.includes("all")) {
        const selected = response.logics || [];
        for (const item of ["Booking", "rbac", "Stocks"]) {
            if (!selected.includes(item)) {
                await fs.remove(path.join(targetDir, "Logics", item));
            }
        }
        const logicPath = path.join(targetDir, "Logics");
        const remaining = await fs.readdir(logicPath);
        if (remaining.length === 0) {
            await fs.remove(logicPath);
        }
    }

    console.log(`Created ${projectName}`);
    console.log(`Selected logics: ${response.logics?.join(", ") || "none"}`);
    console.log(`Next: cd ${projectName} && npm install && npm run dev`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});