const ApexAssessment = {
    extractAssessmentInfo: function () {
        try {
            console.log("Extracting assessment information from the page...");

            const assessmentItemIndex = document.getElementById("AssessmentItemIndex")?.value;
            const assessmentAttemptItemId = document.getElementById("AssessmentAttemptItemId")?.value;
            const assessmentType = document.getElementById("AssessmentType")?.value;

            const url = window.location.href;
            let moduleGuid = null;
            let unitGuid = null;

            const unitGuidMatch = url.match(/Unit\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
            if (unitGuidMatch && unitGuidMatch[1]) {
                unitGuid = unitGuidMatch[1];
            } else {
                const guidMatches = url.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/gi);
                if (guidMatches && guidMatches.length > 0) {
                    unitGuid = guidMatches[0];
                }
            }

            const images = document.querySelectorAll('img');
            for (const img of images) {
                const src = img.getAttribute('src');
                if (src) {
                    const imgGuid = ApexUtils.extractGuid(src);
                    if (imgGuid) {
                        moduleGuid = imgGuid;
                        break;
                    }
                }
            }

            let assessmentTypeName = "";
            if (url.includes("Pretest")) {
                assessmentTypeName = "Pretest";
            } else if (url.includes("Posttest")) {
                assessmentTypeName = "Posttest";
            } else if (url.includes("Practice")) {
                assessmentTypeName = "Practice";
            }

            return {
                assessmentItemIndex,
                assessmentAttemptItemId,
                assessmentType,
                assessmentTypeName,
                moduleGuid,
                unitGuid
            };
        } catch (error) {
            console.error("Error extracting assessment info:", error);
            return null;
        }
    },

    fetchAssessmentData: async function (moduleGuid, unitGuid, assessmentType) {
        try {
            console.log(`Fetching assessment data for unit ${unitGuid}...`);

            let assessmentTypeName = "Posttest";
            if (assessmentType === "1") {
                assessmentTypeName = "Pretest";
            } else if (assessmentType === "2") {
                assessmentTypeName = "Practice";
            } else if (assessmentType === "3") {
                assessmentTypeName = "Posttest";
            }

            const apiUrl = `https://tutorials2.apexvs.com/api/Assessment/StartOrResumeSummativeAssessment/${unitGuid}/${assessmentTypeName}`;

            const response = await fetch(apiUrl, {
                headers: {
                    "accept": "application/json, text/javascript, */*; q=0.01",
                    "accept-language": "en-US,en;q=0.9",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin",
                    "x-requested-with": "XMLHttpRequest"
                },
                referrer: "https://tutorials2.apexvs.com/Tutorial/App",
                referrerPolicy: "strict-origin-when-cross-origin",
                body: null,
                method: "GET",
                mode: "cors",
                credentials: "include"
            });

            if (!response.ok) {
                console.error("API response error:", response.status, response.statusText);
                return null;
            }

            const data = await response.json();
            console.log("Assessment data retrieved successfully");
            return data;
        } catch (error) {
            console.error("Error fetching assessment data:", error);
            return null;
        }
    },

    findCorrectAnswer: function (data) {
        try {
            console.log("Analyzing assessment data to find the correct answer...");

            let correctAnswerId = null;
            let correctAnswerText = null;
            let correctAnswerIndex = -1;

            if (data.Flow && data.Flow.FlowContents) {
                for (let index = 0; index < data.Flow.FlowContents.length; index++) {
                    const flowContent = data.Flow.FlowContents[index];
                    if (flowContent.Answers) {
                        for (const answer of flowContent.Answers) {
                            if (answer.Responses && answer.Responses.length > 0) {
                                for (const response of answer.Responses) {
                                    if (response.FeedBacks && response.FeedBacks.length > 0) {
                                        for (const feedback of response.FeedBacks) {
                                            if (feedback.RefId === "correct_fb") {
                                                correctAnswerId = answer.AssessmentAnswerId;
                                                correctAnswerText = answer.AnswerText;
                                                correctAnswerIndex = index;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if (!correctAnswerId && data.Flow && data.Flow.FlowContents) {
                for (let index = 0; index < data.Flow.FlowContents.length; index++) {
                    const flowContent = data.Flow.FlowContents[index];
                    if (flowContent.Answers) {
                        for (const answer of flowContent.Answers) {
                            if (answer.IsCorrect === true) {
                                correctAnswerId = answer.AssessmentAnswerId;
                                correctAnswerText = answer.AnswerText;
                                correctAnswerIndex = index;
                            }
                        }
                    }
                }
            }

            if (correctAnswerId) {
                console.log("Found correct answer!");
                console.log("Answer ID:", correctAnswerId);
                console.log("Answer Index:", correctAnswerIndex);

                return {
                    correctAnswerId,
                    correctAnswerText,
                    correctAnswerIndex
                };
            }

            console.log("Could not find the correct answer in the response.");
            return null;
        } catch (error) {
            console.error("Error analyzing assessment data:", error);
            return null;
        }
    },

    selectCorrectAnswer: async function (answerId) {
        try {
            console.log(`Attempting to select answer with ID: ${answerId}`);

            let answerElement = document.querySelector(`[data-answerid="${answerId}"]`);
            if (answerElement) {
                const distractorElement = answerElement.closest('.distractor');
                if (distractorElement) {
                    const radioInput = distractorElement.querySelector('input[type="radio"]');
                    if (radioInput) {
                        console.log("Found radio input for the correct answer, clicking...");
                        radioInput.click();
                        return true;
                    }
                }
            }

            const radioInput = document.getElementById(`id_${answerId}`);
            if (radioInput) {
                console.log("Found radio input by ID, clicking...");
                radioInput.click();
                return true;
            }

            const spanElement = document.getElementById(answerId);
            if (spanElement) {
                const parentLabel = spanElement.closest('label');
                if (parentLabel) {
                    const radioInput = parentLabel.querySelector('input[type="radio"]');
                    if (radioInput) {
                        console.log("Found radio input through span element, clicking...");
                        radioInput.click();
                        return true;
                    }
                }
            }

            console.log("Trying to select by index (fallback method)...");
            const allRadioInputs = document.querySelectorAll('.distractor input[type="radio"]');
            if (allRadioInputs.length > 0) {
                const letterMatch = answerId.match(/[A-D]$/i);
                if (letterMatch) {
                    const letter = letterMatch[0].toUpperCase();
                    const index = letter.charCodeAt(0) - 'A'.charCodeAt(0);
                    if (index >= 0 && index < allRadioInputs.length) {
                        console.log(`Using letter-based index: ${index} (${letter})`);
                        allRadioInputs[index].click();
                        return true;
                    }
                }

                const numberMatch = answerId.match(/(\d+)$/);
                if (numberMatch) {
                    const index = parseInt(numberMatch[1]) % allRadioInputs.length;
                    console.log(`Using number-based index: ${index}`);
                    allRadioInputs[index].click();
                    return true;
                }

                console.log("Using first option as last resort");
                allRadioInputs[0].click();
                return true;
            }

            console.error("Could not find any way to select the answer");
            return false;
        } catch (error) {
            console.error("Error selecting answer:", error);
            return false;
        }
    }
};