let currentFinalPath = "";
let currentTargetType = 0;

// Auto-populate the drive letter dropdown when the app opens
document.addEventListener("DOMContentLoaded", () => {
    const select = document.getElementById("drive-letter");
    for (let i = 65; i <= 90; i++) {
        const letter = String.fromCharCode(i);
        if (letter === 'C') continue; // Exclude C drive

        const option = document.createElement("option");
        option.value = letter + ":";
        option.textContent = letter + ":\\";

        if (letter === 'A') option.selected = true; // Default to A
        select.appendChild(option);
    }
});

async function processPath(targetType) {
    const outputEl = document.getElementById("output");
    const statusEl = document.getElementById("status");
    const openBtn = document.getElementById("open-btn");

    // Use visibility instead of display
    openBtn.style.visibility = "hidden";

    // --- DYNAMIC BASE CALCULATION ---
    const serverInput = document.getElementById("server-input").value.trim();
    let mappedPathInput = document.getElementById("mapped-path").value.trim();
    const driveLetter = document.getElementById("drive-letter").value;

    // Safety check: Prevent conversion if Server Name is blank
    if (!serverInput) {
        showError("Please enter a Server Name");
        return;
    }

    if (!mappedPathInput) {
        mappedPathInput = serverInput;
    }

    const BASE_1 = mappedPathInput;
    const BASE_2 = driveLetter;

    let sharePath = "";
    if (mappedPathInput.toLowerCase().startsWith(serverInput.toLowerCase())) {
        sharePath = mappedPathInput.substring(serverInput.length);
    } else {
        sharePath = mappedPathInput;
    }

    sharePath = sharePath.replace(/\\/g, "/");
    if (sharePath && !sharePath.startsWith("/")) {
        sharePath = "/" + sharePath;
    }

    const BASE_3 = "/Volumes" + sharePath;
    // --------------------------------

    try {
        const clipboardText = await navigator.clipboard.readText();
        const inputPath = clipboardText.trim().replace(/^["']|["']$/g, "");

        if (!inputPath) {
            showError("Clipboard is empty");
            return;
        }

        let relativePath = "";
        let detectedType = 0;

        if (inputPath.toLowerCase().startsWith(BASE_1.toLowerCase())) {
            detectedType = 1;
            relativePath = inputPath.substring(BASE_1.length);
        } else if (inputPath.toLowerCase().startsWith(BASE_2.toLowerCase())) {
            detectedType = 2;
            relativePath = inputPath.substring(BASE_2.length);
        } else if (inputPath.toLowerCase().startsWith(BASE_3.toLowerCase())) {
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

        currentFinalPath = finalPath;
        currentTargetType = targetType;

        outputEl.textContent = finalPath;
        outputEl.style.color = "#e0e0e0";

        await navigator.clipboard.writeText(finalPath);

        statusEl.textContent = `Copied to clipboard`;
        statusEl.style.color = "#4ade80";

        if (targetType === 3) {
            openBtn.textContent = "Open in Finder";
        } else {
            openBtn.textContent = "Open in Explorer";
        }

        // Show button securely without layout shift
        openBtn.style.visibility = "visible";

    } catch (err) {
        console.error(err);
        showError("Failed to read clipboard. Please ensure you have granted clipboard permissions.");
    }
}

function showError(statusMsg, pathMsg = "") {
    const outputEl = document.getElementById("output");
    const statusEl = document.getElementById("status");
    const openBtn = document.getElementById("open-btn");

    openBtn.style.visibility = "hidden"; // Keep hidden on error
    outputEl.innerText = pathMsg;
    outputEl.style.color = "#ff6b6b";
    statusEl.textContent = statusMsg;
    statusEl.style.color = "#ff6b6b";
}

// Add this function anywhere in your script.js
function closeModal() {
    document.getElementById('app-modal').classList.remove('active');
}

// Replace your existing "open-btn" event listener at the bottom with this:
document.getElementById("open-btn").addEventListener("click", () => {
    const isElectron = /electron/i.test(navigator.userAgent);

    if (!isElectron) {
        // Trigger the custom modal instead of the browser alert
        document.getElementById('app-modal').classList.add('active');
        return;
    }

    try {
        if (typeof require !== 'undefined') {
            const { exec } = require('child_process');
            const command = currentTargetType === 3
                ? `open "${currentFinalPath}"`
                : `explorer "${currentFinalPath}"`;
            exec(command);
        } else if (window.electronAPI && window.electronAPI.openPath) {
            window.electronAPI.openPath(currentFinalPath, currentTargetType);
        } else {
            alert("Electron environment detected, but API is not configured properly.");
        }
    } catch (err) {
        console.error("Failed to open path:", err);
        alert("Error opening path.");
    }
});