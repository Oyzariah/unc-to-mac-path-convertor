//Server root folder on Windows
const BASE_1 = "\\\\TINA2-PC\\Users\\Other Share File";
//Mapped server root folder on Windows
const BASE_2 = "A:";
//Server root folder on macOS
const BASE_3 = "/Volumes/Users/Other Share File";

let currentFinalPath = "";
let currentTargetType = 0;

async function processPath(targetType) {
    const outputEl = document.getElementById("output");
    const statusEl = document.getElementById("status");
    const openBtn = document.getElementById("open-btn");

    // Hide open button whenever a new conversion starts
    openBtn.style.display = "none";

    try {
        const clipboardText = await navigator.clipboard.readText();

        const inputPath = clipboardText
            .trim()
            .replace(/^["']|["']$/g, "");

        if (!inputPath) {
            showError("Clipboard is empty");
            return;
        }

        let relativePath = "";
        let detectedType = 0;

        if (inputPath.startsWith(BASE_1)) {
            detectedType = 1;
            relativePath = inputPath.substring(BASE_1.length);
        } else if (inputPath.startsWith(BASE_2)) {
            detectedType = 2;
            relativePath = inputPath.substring(BASE_2.length);
        } else if (inputPath.startsWith(BASE_3)) {
            detectedType = 3;
            relativePath = inputPath.substring(BASE_3.length);
        } else {
            showError("Unknown path format", inputPath);
            return;
        }

        relativePath = relativePath.replace(/^[\\\/]+/, "");

        let finalPath = "";
        if (targetType === 1) {
            finalPath = `${BASE_1}\\${relativePath.replace(/\//g, "\\")}`;
        } else if (targetType === 2) {
            finalPath = `${BASE_2}\\${relativePath.replace(/\//g, "\\")}`;
        } else if (targetType === 3) {
            finalPath = `${BASE_3}/${relativePath.replace(/\\/g, "/")}`;
        }

        if (relativePath === "") {
            if (targetType === 1) finalPath = BASE_1;
            if (targetType === 2) finalPath = BASE_2 + "\\";
            if (targetType === 3) finalPath = BASE_3;
        }

        // Store current path and type for the "Open" button
        currentFinalPath = finalPath;
        currentTargetType = targetType;

        outputEl.textContent = finalPath;
        outputEl.style.color = "#e0e0e0";

        await navigator.clipboard.writeText(finalPath);

        statusEl.textContent = `Copied to clipboard`;
        statusEl.style.color = "#4ade80";

        // Setup and reveal the dynamic open button
        if (targetType === 3) {
            openBtn.textContent = "Open in Finder";
        } else {
            openBtn.textContent = "Open in Explorer";
        }
        openBtn.style.display = "block";

    } catch (err) {
        console.error(err);
        showError(
            "Failed to read clipboard. Please ensure you have granted clipboard permissions.",
        );
    }
}

function showError(statusMsg, pathMsg = "") {
    const outputEl = document.getElementById("output");
    const statusEl = document.getElementById("status");
    const openBtn = document.getElementById("open-btn");

    openBtn.style.display = "none"; // Ensure button stays hidden on error

    outputEl.innerText = pathMsg;
    outputEl.style.color = "#ff6b6b";

    statusEl.textContent = statusMsg;
    statusEl.style.color = "#ff6b6b";
}

// Listen for clicks on the Open Button
document.getElementById("open-btn").addEventListener("click", () => {
    // Check if the user agent contains 'electron'
    const isElectron = /electron/i.test(navigator.userAgent);
    
    if (!isElectron) {
        // Trigger browser prompt if not in Electron app
        alert("For installed app only");
        return;
    }

    // If running in Electron, execute the system command
    try {
        // Method A: If Node integration is enabled in your Electron main.js
        if (typeof require !== 'undefined') {
            const { exec } = require('child_process');
            // Use 'open' for macOS (3), 'explorer' for Windows (1 & 2)
            const command = currentTargetType === 3 
                ? `open "${currentFinalPath}"` 
                : `explorer "${currentFinalPath}"`;
            
            exec(command);
        } 
        // Method B: If using contextBridge (the modern, secure Electron way)
        else if (window.electronAPI && window.electronAPI.openPath) {
            window.electronAPI.openPath(currentFinalPath, currentTargetType);
        } else {
            alert("Electron environment detected, but API is not configured properly.");
        }
    } catch (err) {
        console.error("Failed to open path:", err);
        alert("Error opening path.");
    }
});