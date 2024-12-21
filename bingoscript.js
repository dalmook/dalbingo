// bingoscript.js

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('settings-form');
    const bingoContainer = document.getElementById('bingo-container');
    const messageDiv = document.getElementById('message');
    const linesStatus = document.getElementById('lines-status');
    const targetLinesDisplay = document.getElementById('target-lines-display');
    const completedLinesDisplay = document.getElementById('completed-lines-display');
    const canvas = document.getElementById('bingo-lines');
    const ctx = canvas.getContext('2d');

    let boardSize = 5;
    let numberRange = 75;
    let targetLines = 1;
    let bingoNumbers = [];
    let markedCells = new Set();
    let linesCompleted = 0;
    let completedLineTypes = new Set(); // To track which lines have been completed

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        // Reset previous game state
        bingoContainer.innerHTML = '';
        messageDiv.classList.add('hidden');
        linesStatus.classList.add('hidden');
        markedCells.clear();
        linesCompleted = 0;
        completedLineTypes.clear();
        completedLinesDisplay.textContent = linesCompleted;
        targetLinesDisplay.textContent = targetLines;

        // Reset canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Get user inputs
        boardSize = parseInt(document.getElementById('board-size').value);
        numberRange = parseInt(document.getElementById('number-range').value);
        targetLines = parseInt(document.getElementById('target-lines').value);

        // Validate inputs
        if (boardSize * boardSize > numberRange) {
            alert('빙고판의 셀 수가 숫자 범위보다 클 수 없습니다.');
            return;
        }

        // Generate bingo numbers
        generateBingoNumbers();

        // Create bingo grid
        createBingoGrid();

        // Display lines status
        linesStatus.classList.remove('hidden');
    });

    function generateBingoNumbers() {
        const numbers = Array.from({ length: numberRange }, (_, i) => i + 1);
        shuffleArray(numbers);
        bingoNumbers = numbers.slice(0, boardSize * boardSize);
    }

    function createBingoGrid() {
        bingoContainer.style.gridTemplateColumns = `repeat(${boardSize}, 60px)`;
        bingoContainer.style.gridTemplateRows = `repeat(${boardSize}, 60px)`;

        bingoNumbers.forEach((num, index) => {
            const cell = document.createElement('div');
            cell.classList.add('bingo-cell');
            cell.textContent = num;
            cell.dataset.index = index;
            cell.addEventListener('click', () => handleCellClick(cell, index));
            bingoContainer.appendChild(cell);
        });

        // Resize canvas to match bingo grid
        setTimeout(() => { // Delay to ensure grid is rendered
            canvas.width = bingoContainer.clientWidth;
            canvas.height = bingoContainer.clientHeight;
            canvas.style.width = `${bingoContainer.clientWidth}px`;
            canvas.style.height = `${bingoContainer.clientHeight}px`;
        }, 100);
    }

    function handleCellClick(cell, index) {
        if (markedCells.has(index)) return;

        // Mark the cell
        cell.classList.add('marked');
        markedCells.add(index);

        checkForLines();

        if (linesCompleted >= targetLines) {
            showMessage('축하합니다! 목표를 달성했습니다!');
        }
    }

    function checkForLines() {
        const grid = Array.from(bingoContainer.children);
        const gridArray = [];
        for (let i = 0; i < boardSize; i++) {
            gridArray[i] = [];
            for (let j = 0; j < boardSize; j++) {
                gridArray[i][j] = grid[i * boardSize + j].classList.contains('marked');
            }
        }

        let newLines = 0;
        let linesToDraw = [];

        // Check rows
        gridArray.forEach((row, rowIndex) => {
            if (row.every(cell => cell)) {
                const lineKey = `row-${rowIndex}`;
                if (!completedLineTypes.has(lineKey)) {
                    newLines++;
                    linesToDraw.push({ type: 'row', index: rowIndex });
                    completedLineTypes.add(lineKey);
                }
            }
        });

        // Check columns
        for (let col = 0; col < boardSize; col++) {
            let column = gridArray.map(row => row[col]);
            if (column.every(cell => cell)) {
                const lineKey = `col-${col}`;
                if (!completedLineTypes.has(lineKey)) {
                    newLines++;
                    linesToDraw.push({ type: 'col', index: col });
                    completedLineTypes.add(lineKey);
                }
            }
        }

        // Check diagonals
        let diag1 = gridArray.map((row, idx) => row[idx]);
        if (diag1.every(cell => cell)) {
            const lineKey = `diag1`;
            if (!completedLineTypes.has(lineKey)) {
                newLines++;
                linesToDraw.push({ type: 'diag1' });
                completedLineTypes.add(lineKey);
            }
        }

        let diag2 = gridArray.map((row, idx) => row[boardSize - idx - 1]);
        if (diag2.every(cell => cell)) {
            const lineKey = `diag2`;
            if (!completedLineTypes.has(lineKey)) {
                newLines++;
                linesToDraw.push({ type: 'diag2' });
                completedLineTypes.add(lineKey);
            }
        }

        // Update lines completed
        if (newLines > 0) {
            linesCompleted += newLines;
            completedLinesDisplay.textContent = linesCompleted;

            // Draw lines
            linesToDraw.forEach(line => drawLine(line));
        }
    }

    function drawLine(line) {
        const cellSize = 60; // As defined in CSS

        switch (line.type) {
            case 'row':
                drawHorizontalLine(line.index);
                break;
            case 'col':
                drawVerticalLine(line.index);
                break;
            case 'diag1':
                drawDiagonalLine(1);
                break;
            case 'diag2':
                drawDiagonalLine(2);
                break;
            default:
                break;
        }
    }

    function drawHorizontalLine(rowIndex) {
        const cellSize = 60;
        const startX = 0;
        const startY = rowIndex * cellSize + cellSize / 2;
        const endX = boardSize * cellSize;
        const endY = startY;

        ctx.strokeStyle = 'red';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }

    function drawVerticalLine(colIndex) {
        const cellSize = 60;
        const startX = colIndex * cellSize + cellSize / 2;
        const startY = 0;
        const endX = startX;
        const endY = boardSize * cellSize;

        ctx.strokeStyle = 'red';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }

    function drawDiagonalLine(type) {
        const cellSize = 60;
        if (type === 1) { // Top-left to bottom-right
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(boardSize * cellSize, boardSize * cellSize);
            ctx.stroke();
        } else if (type === 2) { // Top-right to bottom-left
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(boardSize * cellSize, 0);
            ctx.lineTo(0, boardSize * cellSize);
            ctx.stroke();
        }
    }

    function showMessage(text) {
        messageDiv.textContent = text;
        messageDiv.classList.remove('hidden');
    }

    // Utility function to shuffle an array
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
});
