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
            console.log("Analyzing assessment data to find the correct answer(s)...");

            const correctAnswers = [];
            
            if (data.QuestionTypeName === "FillInBlank") {
                console.log("Processing Fill in the Blank question type");
                
                if (data.Flow && data.Flow.FlowContents && data.Flow.FlowContents.length > 0) {
                    const contentContainer = data.Flow.FlowContents.find(item => item.FlowContents);
                    
                    if (contentContainer && contentContainer.FlowContents) {
                        let dropdownIndex = 0;
                        
                        for (const flowItem of contentContainer.FlowContents) {
                            if (flowItem.FlowContents) {
                                for (const optionGroup of flowItem.FlowContents) {
                                    if (optionGroup.Answers) {
                                        for (const answer of optionGroup.Answers) {
                                            if (answer.Responses && answer.Responses.length > 0) {
                                                for (const response of answer.Responses) {
                                                    if (response.FeedBacks && 
                                                        response.FeedBacks.some(fb => fb.RefId === "correct_fb")) {
                                                        console.log(`Found correct answer for dropdown ${dropdownIndex}:`, answer.AssessmentAnswerId);
                                                        correctAnswers.push({
                                                            dropdownIndex,
                                                            correctAnswerId: answer.AssessmentAnswerId,
                                                            correctAnswerText: answer.AnswerText
                                                        });
                                                        break;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                
                                dropdownIndex++;
                            }
                        }
                    }
                }
            } else {
                if (data.Flow && data.Flow.FlowContents) {
                    for (const flowContent of data.Flow.FlowContents) {
                        if (flowContent.Answers) {
                            for (const answer of flowContent.Answers) {
                                if (answer.Responses && answer.Responses.length > 0) {
                                    for (const response of answer.Responses) {
                                        if (response.FeedBacks && 
                                            response.FeedBacks.some(fb => fb.RefId === "correct_fb")) {
                                            correctAnswers.push({
                                                dropdownIndex: 0,
                                                correctAnswerId: answer.AssessmentAnswerId,
                                                correctAnswerText: answer.AnswerText
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                
                if (correctAnswers.length === 0 && data.Flow && data.Flow.FlowContents) {
                    for (const flowContent of data.Flow.FlowContents) {
                        if (flowContent.Answers) {
                            for (const answer of flowContent.Answers) {
                                if (answer.IsCorrect === true) {
                                    correctAnswers.push({
                                        dropdownIndex: 0,
                                        correctAnswerId: answer.AssessmentAnswerId,
                                        correctAnswerText: answer.AnswerText
                                    });
                                }
                            }
                        }
                    }
                }
            }
            
            if (correctAnswers.length === 0 && data.QuestionTypeName === "FillInBlank") {
                console.log("Attempting direct analysis of nested structure...");
                
                const findResponsesWithCorrectFeedback = (obj, dropdownIndex = 0) => {
                    if (!obj) return;
                    
                    if (obj.AssessmentAnswerId && obj.Responses && obj.Responses.length > 0) {
                        for (const response of obj.Responses) {
                            if (response.FeedBacks && 
                                response.FeedBacks.some(fb => fb.RefId === "correct_fb")) {
                                console.log(`Found correct answer at dropdown ${dropdownIndex}:`, obj.AssessmentAnswerId);
                                correctAnswers.push({
                                    dropdownIndex,
                                    correctAnswerId: obj.AssessmentAnswerId,
                                    correctAnswerText: obj.AnswerText
                                });
                            }
                        }
                        return;
                    }
                    
                    if (Array.isArray(obj)) {
                        let currDropdownIndex = dropdownIndex;
                        for (let i = 0; i < obj.length; i++) {
                            if (obj[i].FlowContents) {
                                findResponsesWithCorrectFeedback(obj[i], currDropdownIndex);

                                if (obj[i].FlowContents.some(subItem => subItem.Answers)) {
                                    currDropdownIndex++;
                                }
                            } else {
                                findResponsesWithCorrectFeedback(obj[i], currDropdownIndex);
                            }
                        }
                    } else if (obj && typeof obj === 'object') {
                        for (const key in obj) {
                            findResponsesWithCorrectFeedback(obj[key], dropdownIndex);
                        }
                    }
                };
                
                findResponsesWithCorrectFeedback(data);
            }

            if (correctAnswers.length > 0) {
                console.log(`Found ${correctAnswers.length} correct answer(s)!`);
                correctAnswers.forEach((answer, index) => {
                    console.log(`Answer ${index + 1}:`, answer);
                });
                return correctAnswers;
            }

            console.log("Could not find any correct answers in the response.");
            return null;
        } catch (error) {
            console.error("Error analyzing assessment data:", error);
            return null;
        }
    },

    selectCorrectAnswer: async function (correctAnswers) {
        try {
            if (!correctAnswers) return false;
            
            const answers = Array.isArray(correctAnswers) ? correctAnswers : [correctAnswers];
            
            if (answers.length === 0) {
                console.error("No answers to select");
                return false;
            }

            console.log(`Attempting to select ${answers.length} answer(s)...`);
            
            const dropdowns = document.querySelectorAll('.dd-container');
            const isDropdownQuestion = dropdowns.length > 0;
            
            if (isDropdownQuestion) {
                console.log(`Found ${dropdowns.length} dropdowns, handling as dropdown question`);
                
                const dropdownMap = new Map();
                
                for (let i = 0; i < dropdowns.length; i++) {
                    const dropdown = dropdowns[i];
                    const dropdownId = dropdown.id;
                    
                    let index = i;
                    if (dropdownId) {
                        const match = dropdownId.match(/dropdown(\d+)/);
                        if (match && match[1]) {
                            index = parseInt(match[1]) - 1;
                        }
                    }
                    
                    dropdownMap.set(index, dropdown);
                }
                
                let successCount = 0;
                
                for (const answer of answers) {
                    const answerId = answer.correctAnswerId;
                    const dropdownIndex = answer.dropdownIndex;
                    
                    console.log(`Selecting answer for dropdown index ${dropdownIndex}: ${answerId}`);
                    
                    const dropdown = dropdownMap.get(dropdownIndex);
                    
                    if (dropdown) {
                        console.log(`Processing dropdown ${dropdownIndex + 1} with answer ID: ${answerId}`);
                        
                        const ddSelect = dropdown.querySelector('.dd-select');
                        if (ddSelect) {
                            ddSelect.click();
                            await ApexUtils.sleep(200);
                            
                            const option = dropdown.querySelector(`.dd-option[data-val="${answerId}"]`);
                            if (option) {
                                console.log(`Found matching option for dropdown ${dropdownIndex + 1}, clicking...`);
                                option.click();
                                await ApexUtils.sleep(200);
                                successCount++;
                            } else {
                                console.error(`Could not find option with data-val="${answerId}" in dropdown ${dropdownIndex + 1}`);
                                ddSelect.click();
                            }
                        }
                    } else {
                        console.error(`Could not find dropdown element for index ${dropdownIndex}`);
                    }
                }
                
                return successCount > 0;
            } else {
                const firstAnswer = answers[0];
                const answerId = firstAnswer.correctAnswerId || firstAnswer;
                
                console.log(`Handling as radio question with answer ID: ${answerId}`);
                
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
            }

            console.error("Could not find any way to select the answer(s)");
            return false;
        } catch (error) {
            console.error("Error selecting answer:", error);
            return false;
        }
    }
};