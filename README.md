# Apex Helper

A Chrome extension that helps solve Apex Learning assessments automatically.

## Features

- Automatically finds and selects correct answers for Apex Learning assessments
- One-click solution for answering individual questions
- Auto-solve mode for completing entire assessments
- Keyboard shortcuts for quick actions
- Clean and intuitive user interface

## Installation

### From Source
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the downloaded folder
5. The extension will now be installed and ready to use

## Usage

When on an Apex Learning assessment page, the Apex Helper panel will appear in the bottom right corner. You can:

- Click "Find Answer" to automatically detect and select the correct answer
- Click "Find & Submit" to find the answer and submit it
- Click "Submit Answer" to submit the currently selected answer
- Click "Next" to go to the next question
- Click "Auto-Solve All Questions" to automatically solve all questions in the assessment

### Keyboard Shortcuts

- `Alt+A` - Find Answer
- `Alt+S` - Submit Answer
- `Alt+N` - Next Question
- `Alt+Q` - Auto-Solve All Questions

## How It Works

Apex Helper works by analyzing the page, extracting necessary information, and making API calls to Apex Learning's servers to retrieve the correct answers. It then automatically selects the correct answer on the page.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This extension is for educational purposes only. Use at your own risk and responsibility.
