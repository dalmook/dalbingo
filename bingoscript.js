// bingoscript.js

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('settings-form');
    const settingsScreen = document.getElementById('settings-screen');
    const gameScreen = document.getElementById('game-screen');
    const bingoContainer = document.getElementById('bingo-container');
    const messageDiv = document.getElementById('message');
    const targetLinesDisplay = document.getElementById('target-lines-display');
    const completedLinesDisplay = document.getElementById('completed-lines-display');
    const canvas = document.getElementById('bingo-lines');
    const ctx = canvas.getContext('2d');
    const firstButton = document.getElementById('first-button');
    const refreshButton = document.getElementById('refresh-button');

    let boardSize = 5;
    let numberRange = 75;
    let targetLines = 1;
    let bingoNumbers = [];
    let markedCells = new Set();
    let linesCompleted = 0;
    let completedLineTypes = new Set(); // To track which lines have been completed
    let linesToDrawHistory = []; // 기록된 선을 저장

    // 초기 설정 화면 표시
    showScreen('settings');

    // 폼 제출 이벤트 리스너
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        startGame();
    });

    // "처음으로" 버튼 이벤트 리스너
    firstButton.addEventListener('click', () => {
        showScreen('settings');
    });

    // "새로고침" 버튼 이벤트 리스너
    refreshButton.addEventListener('click', () => {
        resetGame();
    });

    function showScreen(screen) {
        if (screen === 'settings') {
            settingsScreen.classList.remove('d-none');
            gameScreen.classList.add('d-none');
        } else if (screen === 'game') {
            settingsScreen.classList.add('d-none');
            gameScreen.classList.remove('d-none');
        }
    }

    function startGame() {
        // 설정 화면의 값을 가져오기
        boardSize = parseInt(document.getElementById('board-size').value);
        numberRange = parseInt(document.getElementById('number-range').value);
        targetLines = parseInt(document.getElementById('target-lines').value);

        // 유효성 검사
        if (boardSize * boardSize > numberRange) {
            alert('빙고판의 셀 수가 숫자 범위보다 클 수 없습니다.');
            return;
        }

        // 목표 줄수 및 완료된 줄수 표시 업데이트
        targetLinesDisplay.textContent = targetLines;
        completedLinesDisplay.textContent = linesCompleted;

        // 게임 화면 표시
        showScreen('game');

        // 게임 초기화
        initializeGame();
    }

    function initializeGame() {
        // 이전 게임 상태 초기화
        bingoContainer.innerHTML = '';
        messageDiv.classList.add('d-none');
        markedCells.clear();
        linesCompleted = 0;
        completedLineTypes.clear();
        completedLinesDisplay.textContent = linesCompleted;
        linesToDrawHistory = [];

        // 캔버스 초기화
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 숫자 생성 및 빙고판 생성
        generateBingoNumbers();
        createBingoGrid();

        // 캔버스 크기 조정
        adjustCanvasSize();

        // 창 크기 변경 시 캔버스 다시 조정 및 선 다시 그리기
        window.addEventListener('resize', handleResize);
    }

    function resetGame() {
        initializeGame();
    }

    function generateBingoNumbers() {
        const numbers = Array.from({ length: numberRange }, (_, i) => i + 1);
        shuffleArray(numbers);
        bingoNumbers = numbers.slice(0, boardSize * boardSize);
    }

    function createBingoGrid() {
        // 빙고판 그리드 설정
        bingoContainer.style.gridTemplateColumns = `repeat(${boardSize}, 1fr)`;
        bingoContainer.style.gridTemplateRows = `repeat(${boardSize}, 1fr)`;

        bingoNumbers.forEach((num, index) => {
            const cell = document.createElement('div');
            cell.classList.add('bingo-cell');
            cell.textContent = num;
            cell.dataset.index = index;
            cell.addEventListener('click', () => handleCellClick(cell, index));
            bingoContainer.appendChild(cell);
        });
    }

    function adjustCanvasSize() {
        // 빙고판의 실제 크기를 가져와 캔버스 크기 조정
        const containerWidth = bingoContainer.clientWidth;
        const containerHeight = bingoContainer.clientHeight;

        canvas.width = containerWidth;
        canvas.height = containerHeight;

        // 캔버스 CSS 크기도 동일하게 설정
        canvas.style.width = `${containerWidth}px`;
        canvas.style.height = `${containerHeight}px`;

        // 선 다시 그리기
        redrawLines();
    }

    function handleResize() {
        adjustCanvasSize();
    }

    function handleCellClick(cell, index) {
        if (markedCells.has(index)) return;

        // 셀 마킹
        cell.classList.add('marked');
        markedCells.add(index);

        // 줄 확인
        checkForLines();

        // 목표 줄수 달성 시 메시지 표시
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

        // 행 체크
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

        // 열 체크
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

        // 대각선 체크
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

        // 줄 업데이트
        if (newLines > 0) {
            linesCompleted += newLines;
            completedLinesDisplay.textContent = linesCompleted;

            // 줄 그리기 및 기록
            linesToDraw.forEach(line => {
                drawLine(line);
                linesToDrawHistory.push(line);
            });
        }
    }

    function drawLine(line) {
        // 선 그리기 로직을 배열로 저장
        drawSingleLine(line);
    }

    function drawSingleLine(line) {
        // 첫 번째 셀의 크기와 간격을 가져옵니다.
        const firstCell = bingoContainer.querySelector('.bingo-cell');
        if (!firstCell) return;

        const cellSize = firstCell.clientWidth;
        const gap = parseInt(getComputedStyle(bingoContainer).gap) || 0;

        switch (line.type) {
            case 'row':
                drawHorizontalLine(line.index, cellSize, gap);
                break;
            case 'col':
                drawVerticalLine(line.index, cellSize, gap);
                break;
            case 'diag1':
                drawDiagonalLine(1, cellSize, gap);
                break;
            case 'diag2':
                drawDiagonalLine(2, cellSize, gap);
                break;
            default:
                break;
        }
    }

    function redrawLines() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        linesToDrawHistory.forEach(line => drawSingleLine(line));
    }

    function drawHorizontalLine(rowIndex, cellSize, gap) {
        const startX = 0;
        const startY = rowIndex * (cellSize + gap) + cellSize / 2;
        const endX = boardSize * cellSize + (boardSize - 1) * gap;
        const endY = startY;

        ctx.strokeStyle = '#000'; // 검정색으로 변경
        ctx.lineWidth = 1; // 선 굵기를 1px로 조정
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }

    function drawVerticalLine(colIndex, cellSize, gap) {
        const startX = colIndex * (cellSize + gap) + cellSize / 2;
        const startY = 0;
        const endX = startX;
        const endY = boardSize * cellSize + (boardSize - 1) * gap;

        ctx.strokeStyle = '#000'; // 검정색으로 변경
        ctx.lineWidth = 1; // 선 굵기를 1px로 조정
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }

    function drawDiagonalLine(type, cellSize, gap) {
        if (type === 1) { // 좌상단 -> 우하단
            ctx.strokeStyle = '#000'; // 검정색으로 변경
            ctx.lineWidth = 1; // 선 굵기를 1px로 조정
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(boardSize * cellSize + (boardSize - 1) * gap, boardSize * cellSize + (boardSize - 1) * gap);
            ctx.stroke();
        } else if (type === 2) { // 우상단 -> 좌하단
            ctx.strokeStyle = '#000'; // 검정색으로 변경
            ctx.lineWidth = 1; // 선 굵기를 1px로 조정
            ctx.beginPath();
            ctx.moveTo(boardSize * cellSize + (boardSize - 1) * gap, 0);
            ctx.lineTo(0, boardSize * cellSize + (boardSize - 1) * gap);
            ctx.stroke();
        }
    }

    function showMessage(text) {
        messageDiv.textContent = text;
        messageDiv.classList.remove('d-none');
    }

    // 배열 섞기 함수 (Fisher-Yates 알고리즘)
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
});
