chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "findAnswer") {
        ApexSolver.solveApexQuestion();
    } else if (request.action === "findSubmit") {
        ApexSolver.solveSingleQuestion(true);
    } else if (request.action === "submitAnswer") {
        ApexUtils.submitAnswer();
    } else if (request.action === "solveAll") {
        ApexSolver.autoSolveAllQuestions();
    } else if (request.action === "getStatus") {
        sendResponse({
            isApexPage: window.location.href.includes('tutorials2.apexvs.com'),
            status: document.getElementById('apexHelperStatus')?.textContent || "Ready"
        });
        return true;
    }

    sendResponse({ status: "success" });
    return true;
});

function initialize() {
    if (window.location.href.includes('tutorials2.apexvs.com')) {
        console.log('Apex Helper: Initializing on Apex Learning page');

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css';
        document.head.appendChild(link);

        setTimeout(() => {
            ApexUI.createControlPanel();
            ApexUI.setupKeyboardShortcuts();
            ApexUI.updateQuestionCounter();
        }, 1000);

        chrome.runtime.sendMessage({
            action: "logActivity",
            details: {
                url: window.location.href,
                timestamp: new Date().toISOString()
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', initialize);

initialize();

let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        console.log('Apex Helper: URL changed, reinitializing');
        initialize();
    }
}).observe(document, { subtree: true, childList: true });

document.addEventListener('click', function (event) {
    if (event.target.matches('#nextQuestionButton, #submitButton') ||
        event.target.closest('#nextQuestionButton, #submitButton')) {
        setTimeout(() => {
            ApexUI.updateQuestionCounter();
        }, 1000);
    }
});