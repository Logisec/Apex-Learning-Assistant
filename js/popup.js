document.addEventListener('DOMContentLoaded', async function () {
    const statusElement = document.getElementById('status');
    const findAnswerButton = document.getElementById('findAnswer');
    const findSubmitButton = document.getElementById('findSubmit');
    const submitAnswerButton = document.getElementById('submitAnswer');
    const solveAllButton = document.getElementById('solveAll');
    const autoSubmitDelayInput = document.getElementById('autoSubmitDelay');
    const autoAdvanceCheckbox = document.getElementById('autoAdvance');
    const saveSettingsButton = document.getElementById('saveSettings');

    loadSettings();

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentUrl = tabs[0]?.url || '';
    const isApexPage = currentUrl.includes('tutorials2.apexvs.com');

    if (!isApexPage) {
        disableButtons();
        showNotApexPageMessage();
        return;
    }

    chrome.tabs.sendMessage(tabs[0].id, { action: "getStatus" }, function (response) {
        if (response && response.status) {
            statusElement.textContent = response.status;
        }
    });

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.type === "status") {
            statusElement.textContent = request.message;
        }
    });

    findAnswerButton.addEventListener('click', function () {
        sendMessageToContentScript("findAnswer");
        statusElement.textContent = "Finding answer...";
    });

    findSubmitButton.addEventListener('click', function () {
        sendMessageToContentScript("findSubmit");
        statusElement.textContent = "Finding and submitting...";
    });

    submitAnswerButton.addEventListener('click', function () {
        sendMessageToContentScript("submitAnswer");
        statusElement.textContent = "Submitting answer...";
    });

    solveAllButton.addEventListener('click', function () {
        if (confirm("This will automatically solve all questions in the assessment. Continue?")) {
            sendMessageToContentScript("solveAll");
            statusElement.textContent = "Auto-solving all questions...";
        }
    });

    saveSettingsButton.addEventListener('click', function () {
        saveSettings();
    });

    function loadSettings() {
        chrome.storage.local.get('settings', function (data) {
            if (data.settings) {
                autoSubmitDelayInput.value = data.settings.autoSolveDelay || 6000;
                autoAdvanceCheckbox.checked = data.settings.autoAdvance !== false;
            }
        });
    }

    function saveSettings() {
        const settings = {
            autoSolveDelay: parseInt(autoSubmitDelayInput.value) || 6000,
            autoAdvance: autoAdvanceCheckbox.checked
        };

        chrome.storage.local.set({ settings }, function () {
            saveSettingsButton.textContent = "✓ Saved";
            saveSettingsButton.style.backgroundColor = "#0f9d58";

            setTimeout(() => {
                saveSettingsButton.innerHTML = '<i class="bi bi-save"></i> Save Settings';
                saveSettingsButton.style.backgroundColor = "#4285f4";
            }, 2000);
        });
    }

    function sendMessageToContentScript(action) {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { action: action });
        });
    }

    function disableButtons() {
        const buttons = document.querySelectorAll('.action-button');
        buttons.forEach(button => {
            button.disabled = true;
            button.title = "Only works on Apex Learning pages";
        });
    }

    function showNotApexPageMessage() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'disabled-message';
        messageDiv.innerHTML = '<i class="bi bi-exclamation-triangle"></i> Not an Apex Learning page';

        statusElement.parentNode.insertAdjacentElement('afterend', messageDiv);
        statusElement.textContent = "Extension disabled";
    }
});