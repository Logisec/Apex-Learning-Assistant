chrome.runtime.onInstalled.addListener(function () {
    console.log("Apex Helper installed");

    chrome.storage.local.get('settings', function (data) {
        if (!data.settings) {
            chrome.storage.local.set({
                settings: {
                    autoSubmit: false,
                    autoAdvance: true
                }
            });
        }
    });
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "logActivity") {
        console.log("Activity logged:", request.details);
    }

    return true;
});