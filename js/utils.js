const ApexUtils = {
    updateStatus: function (message) {
        console.log("Status:", message);
        const statusElement = document.getElementById('apexHelperStatus');
        if (statusElement) {
            statusElement.textContent = message;
        }

        chrome.runtime.sendMessage({ type: "status", message: message });
    },

    extractGuid: function (str) {
        if (!str) return null;

        const guidMatch = str.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
        return guidMatch ? guidMatch[1] : null;
    },

    enableSubmitButton: function () {
        const submitButton = document.getElementById("submitButton");
        if (submitButton && submitButton.disabled) {
            console.log("Enabling submit button...");
            submitButton.disabled = false;
            submitButton.removeAttribute("disabled");
        }
    },

    submitAnswer: function () {
        const submitButton = document.getElementById("submitButton");
        if (submitButton) {
            console.log("Submitting answer...");
            submitButton.click();
            return true;
        }

        const nextButton = document.getElementById("nextQuestionButton");
        if (nextButton) {
            console.log("Clicking next question button...");
            nextButton.click();
            return true;
        }

        console.error("Could not find submit or next buttons");
        return false;
    },

    goToNextQuestion: function () {
        const nextButton = document.getElementById("nextQuestionButton");
        if (nextButton) {
            console.log("Going to next question...");
            nextButton.click();
            return true;
        }
        return false;
    },

    sleep: function (ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};