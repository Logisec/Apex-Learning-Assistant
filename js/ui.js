const ApexUI = {
    createControlPanel: async function () {
        if (document.getElementById('apexHelperPanel')) return;

        try {
            const response = await fetch(chrome.runtime.getURL('panel.html'));
            const html = await response.text();

            const panelContainer = document.createElement('div');
            panelContainer.id = 'apexHelperPanelContainer';
            panelContainer.innerHTML = html;

            document.body.appendChild(panelContainer);

            this.setupEventListeners();

            console.log("Control panel created successfully");
        } catch (error) {
            console.error("Error creating control panel:", error);
        }
    },

    setupEventListeners: function () {
        const findButton = document.getElementById('apexHelperFind');
        if (findButton) {
            findButton.addEventListener('click', async function () {
                await ApexSolver.solveSingleQuestion(false);
            });
        }

        const findSubmitButton = document.getElementById('apexHelperFindSubmit');
        if (findSubmitButton) {
            findSubmitButton.addEventListener('click', async function () {
                await ApexSolver.solveSingleQuestion(true);
            });
        }

        const submitButton = document.getElementById('apexHelperSubmit');
        if (submitButton) {
            submitButton.addEventListener('click', function () {
                ApexUtils.updateStatus('Submitting...');
                const result = ApexUtils.submitAnswer();
                ApexUtils.updateStatus(result ? 'Submitted!' : 'Submit failed');
            });
        }

        const nextButton = document.getElementById('apexHelperNext');
        if (nextButton) {
            nextButton.addEventListener('click', function () {
                ApexUtils.updateStatus('Going to next...');
                const result = ApexUtils.goToNextQuestion();
                if (!result) {
                    ApexUtils.updateStatus('Next button not found');
                }
            });
        }

        const solveAllButton = document.getElementById('apexHelperSolveAll');
        if (solveAllButton) {
            solveAllButton.addEventListener('click', function () {
                if (confirm("This will automatically solve all questions in the assessment. Continue?")) {
                    ApexSolver.autoSolveAllQuestions();
                }
            });
        }

        const closeButton = document.getElementById('apexHelperClose');
        if (closeButton) {
            closeButton.addEventListener('click', function () {
                const panel = document.getElementById('apexHelperPanel');
                if (panel) {
                    panel.style.display = 'none';
                    ApexUI.createMinimizedButton();
                }
            });
        }
    },

    createMinimizedButton: function () {
        if (document.getElementById('apexHelperShow')) return;

        const showButton = document.createElement('button');
        showButton.id = 'apexHelperShow';
        showButton.innerHTML = '<i class="bi bi-brain"></i>';
        showButton.title = 'Show Apex Helper';
        showButton.className = 'apex-helper-show-button';

        showButton.addEventListener('click', function () {
            const panel = document.getElementById('apexHelperPanel');
            if (panel) {
                panel.style.display = 'flex';
                showButton.remove();
            }
        });

        document.body.appendChild(showButton);
    },

    setupKeyboardShortcuts: function () {
        console.log("Setting up keyboard shortcuts...");

        document.addEventListener('keydown', async function (event) {
            if (event.altKey && event.key === 'a') {
                console.log("Keyboard shortcut: Alt+A - Finding and selecting answer");
                await ApexSolver.solveApexQuestion();
            }

            if (event.altKey && event.key === 's') {
                console.log("Keyboard shortcut: Alt+S - Submitting answer");
                ApexUtils.submitAnswer();
            }

            if (event.altKey && event.key === 'n') {
                console.log("Keyboard shortcut: Alt+N - Next question");
                ApexUtils.goToNextQuestion();
            }

            if (event.altKey && event.key === 'q') {
                console.log("Keyboard shortcut: Alt+Q - Auto-solve all questions");
                if (confirm("This will automatically solve all questions. Continue?")) {
                    ApexSolver.autoSolveAllQuestions();
                }
            }
        });

        console.log("Keyboard shortcuts active");
    },

    updateQuestionCounter: function () {
        const questionCounterElement = document.getElementById('apexHelperQuestionCounter');
        const currentQuestionText = document.getElementById('currentQuestionCount');

        if (questionCounterElement && currentQuestionText) {
            questionCounterElement.textContent = currentQuestionText.textContent.trim();
        }
    },

    createStopButton: function (intervalId) {
        const solveAllButton = document.getElementById('apexHelperSolveAll');
        const existingStopButton = document.getElementById('apexHelperStopSolving');

        if (existingStopButton) {
            existingStopButton.remove();
        }

        if (solveAllButton) {
            const stopButton = document.createElement('button');
            stopButton.id = 'apexHelperStopSolving';
            stopButton.innerHTML = '<i class="bi bi-stop-fill"></i> Stop Auto-Solving';
            stopButton.className = 'apex-helper-button apex-helper-stop-button';

            stopButton.addEventListener('click', function () {
                if (intervalId) {
                    clearInterval(intervalId);
                    ApexUtils.updateStatus("Auto-solving stopped");
                    this.remove();
                }
            });

            solveAllButton.insertAdjacentElement('afterend', stopButton);
        }
    }
};