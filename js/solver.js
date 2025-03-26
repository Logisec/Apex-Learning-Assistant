const ApexSolver = {
    solveApexQuestion: async function () {
        try {
            console.log("Starting Apex assessment solver...");
            ApexUtils.updateStatus("Starting solver...");

            const assessmentInfo = ApexAssessment.extractAssessmentInfo();
            if (!assessmentInfo) {
                console.error("Failed to extract assessment information from the page");
                ApexUtils.updateStatus("Failed to get assessment info");
                return null;
            }

            console.log("Assessment information:", assessmentInfo);

            ApexUtils.updateStatus("Fetching answer data...");
            const assessmentData = await ApexAssessment.fetchAssessmentData(
                assessmentInfo.moduleGuid,
                assessmentInfo.unitGuid,
                assessmentInfo.assessmentType
            );

            if (!assessmentData) {
                console.error("Failed to fetch assessment data");
                ApexUtils.updateStatus("Failed to fetch data");
                return null;
            }

            ApexUtils.updateStatus("Analyzing response...");
            const correctAnswerInfo = ApexAssessment.findCorrectAnswer(assessmentData);
            if (!correctAnswerInfo) {
                console.error("Failed to identify the correct answer");
                ApexUtils.updateStatus("No correct answer found");
                return null;
            }

            console.log("Correct answer found:", correctAnswerInfo);

            ApexUtils.updateStatus("Selecting answer...");
            const selected = await ApexAssessment.selectCorrectAnswer(correctAnswerInfo.correctAnswerId);

            if (selected) {
                console.log("✅ Answer selected successfully!");
                ApexUtils.updateStatus("Answer selected!");
                ApexUtils.enableSubmitButton();
            } else {
                console.log("❌ Failed to select the answer automatically. Try manual selection.");
                ApexUtils.updateStatus("Selection failed - try manually");
            }

            return correctAnswerInfo;
        } catch (error) {
            console.error("Error in solveApexQuestion:", error);
            ApexUtils.updateStatus("Error: " + error.message);
            return null;
        }
    },

    solveSingleQuestion: async function (autoSubmit = false) {
        try {
            console.log("Solving single question...");
            ApexUtils.updateStatus("Finding answer...");

            const result = await this.solveApexQuestion();

            if (!result) {
                console.error("Failed to solve question");
                ApexUtils.updateStatus("Failed to find answer");
                return false;
            }

            ApexUtils.updateStatus("Answer found and selected!");

            if (autoSubmit) {
                setTimeout(() => {
                    ApexUtils.updateStatus("Submitting answer...");
                    if (ApexUtils.submitAnswer()) {
                        ApexUtils.updateStatus("Submitted successfully!");
                    } else {
                        ApexUtils.updateStatus("Submit failed");
                    }
                }, 1000);
            }

            return true;
        } catch (error) {
            console.error("Error in solveSingleQuestion:", error);
            ApexUtils.updateStatus("Error solving question");
            return false;
        }
    },

    autoSolveAllQuestions: function () {
        console.log("Starting automatic solve mode for all questions...");
        ApexUtils.updateStatus("Starting auto-solve all...");

        let questionCount = 0;

        chrome.storage.local.get('settings', function (data) {
            const delay = data.settings?.autoSolveDelay || 6000;

            const solverInterval = setInterval(async function () {
                questionCount++;
                console.log(`Solving question ${questionCount}...`);
                ApexUtils.updateStatus(`Solving Q${questionCount}...`);

                try {
                    await ApexSolver.solveApexQuestion();

                    ApexUtils.updateStatus(`Submitting Q${questionCount}...`);
                    ApexUtils.submitAnswer();
                } catch (error) {
                    console.error("Error solving question:", error);
                    ApexUtils.updateStatus(`Error on Q${questionCount}`);
                }
            }, delay);

            ApexUI.createStopButton(solverInterval);

            return solverInterval;
        });
    }
};