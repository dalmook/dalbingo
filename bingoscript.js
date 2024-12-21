// bingoscript.js

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('settings-form');
    const settingsScreen = document.getElementById('settings-screen');
    const gameScreen = document.getElementById('game-screen');
    const bingoContainer = document.getElementById('bingo-container');
    const messageDiv = document.getElementById('message');
    const targetLinesDisplay = document.getElementById('target-lines-display');
    const completedLinesDisplay = document.getElementById('completed-lines-display');
    const firstButton = document.getElementById('first-button');
    const refreshButton = document.getElementById('refresh-button');
    const boardSizeInput = document.getElementById('board-size');
    const numberRangeInput = document.getElementById('number-range');
    const targetLinesInput = document.getElementById('target-lines');

    // 기본 설정 값
    const DEFAULT_BOARD_SIZE = 5;
    const DEFAULT_NUMBER_RANGE = 25;
    const DEFAULT_TARGET_LINES = 3;

    let boardSize = DEFAULT_BOARD_SIZE;
    let numberRange = DEFAULT_NUMBER_RANGE;
    let targetLines = DEFAULT_TARGET_LINES;
    let bingoNumbers = [];
    let markedCells = new Set();
    let linesCompleted = 0;
    let completedLineTypes = new Set(); // 줄의 완성 여부를 추적

    // 초기 설정 화면 표시
    showScreen('settings');

    // 초기 설정 화면의 입력 필드 초기화
    initializeSettingsFields();

    // 폼 제출 이벤트 리스너
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        startGame();
    });

    // "처음으로" 버튼 이벤트 리스너
    firstButton.addEventListener('click', () => {
        resetToDefaultSettings();
        showScreen('settings');
    });

    // "새로고침" 버튼 이벤트 리스너
    refreshButton.addEventListener('click', () => {
        initializeGame();
    });

    // 빙고판 크기 변경 시 숫자 범위 자동 조정 및 목표 줄수 최대값 설정
    boardSizeInput.addEventListener('input', () => {
        const newBoardSize = parseInt(boardSizeInput.value);
        if (isNaN(newBoardSize) || newBoardSize < 3) {
            numberRangeInput.min = 9; // 최소 숫자 범위 (3x3 빙고판)
            numberRangeInput.value = 9;
        } else {
            const newMin = newBoardSize * newBoardSize;
            numberRangeInput.min = newMin;
            numberRangeInput.value = Math.max(parseInt(numberRangeInput.value), newMin);
        }

        // 목표 줄수 최대값 설정 (2 * boardSize + 2)
        const newMaxTargetLines = 2 * newBoardSize + 2;
        targetLinesInput.max = newMaxTargetLines;
        // 현재 목표 줄수가 새로운 최대값을 초과하면 조정
        if (parseInt(targetLinesInput.value) > newMaxTargetLines) {
            targetLinesInput.value = newMaxTargetLines;
        }
    });

    // 목표 줄수 입력 실시간 제한
    targetLinesInput.addEventListener('input', () => {
        const currentValue = parseInt(targetLinesInput.value);
        const maxTargetLines = parseInt(targetLinesInput.max);
        if (currentValue > maxTargetLines) {
            targetLinesInput.value = maxTargetLines;
        }
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

    function initializeSettingsFields() {
        // 기본값 설정
        boardSizeInput.value = DEFAULT_BOARD_SIZE;
        numberRangeInput.value = DEFAULT_NUMBER_RANGE;
        targetLinesInput.value = DEFAULT_TARGET_LINES;

        // 숫자 범위 최소값과 목표 줄수 최대값 설정
        numberRangeInput.min = DEFAULT_BOARD_SIZE * DEFAULT_BOARD_SIZE; // 5x5 빙고판일 경우 25
        numberRangeInput.max = 100;

        const maxTargetLines = 2 * DEFAULT_BOARD_SIZE + 2; // 12
        targetLinesInput.max = maxTargetLines;
    }

    function resetToDefaultSettings() {
        boardSize = DEFAULT_BOARD_SIZE;
        numberRange = DEFAULT_NUMBER_RANGE;
        targetLines = DEFAULT_TARGET_LINES;

        initializeSettingsFields();
    }

    function startGame() {
        // 설정 화면의 값을 가져오기
        boardSize = parseInt(boardSizeInput.value);
        numberRange = parseInt(numberRangeInput.value);
        targetLines = parseInt(targetLinesInput.value);

        // 유효성 검사
        if (boardSize * boardSize > numberRange) {
            alert('빙고판의 셀 수가 숫자 범위보다 클 수 없습니다.');
            return;
        }

        // 목표 줄수의 최대값 계산
        const maxTargetLines = 2 * boardSize + 2;
        if (targetLines > maxTargetLines) {
            alert(`목표 줄수는 최대 ${maxTargetLines}까지 설정할 수 있습니다.`);
            targetLinesInput.value = maxTargetLines;
            targetLines = maxTargetLines;
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

        // 숫자 생성 및 빙고판 생성
        generateBingoNumbers();
        createBingoGrid();
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
        let linesToMark = [];

        // 행 체크
        gridArray.forEach((row, rowIndex) => {
            if (row.every(cell => cell)) {
                const lineKey = `row-${rowIndex}`;
                if (!completedLineTypes.has(lineKey)) {
                    newLines++;
                    linesToMark.push({ type: 'row', index: rowIndex });
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
                    linesToMark.push({ type: 'col', index: col });
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
                linesToMark.push({ type: 'diag1' });
                completedLineTypes.add(lineKey);
            }
        }

        let diag2 = gridArray.map((row, idx) => row[boardSize - idx - 1]);
        if (diag2.every(cell => cell)) {
            const lineKey = `diag2`;
            if (!completedLineTypes.has(lineKey)) {
                newLines++;
                linesToMark.push({ type: 'diag2' });
                completedLineTypes.add(lineKey);
            }
        }

        // 줄 업데이트
        if (newLines > 0) {
            linesCompleted += newLines;
            completedLinesDisplay.textContent = linesCompleted;

            // 줄을 시각적으로 표시
            linesToMark.forEach(line => {
                markLine(line);
            }
            );
        }
    }

    function markLine(line) {
        const grid = Array.from(bingoContainer.children);
        switch (line.type) {
            case 'row':
                for (let col = 0; col < boardSize; col++) {
                    const cellIndex = line.index * boardSize + col;
                    grid[cellIndex].classList.add('completed');
                }
                break;
            case 'col':
                for (let row = 0; row < boardSize; row++) {
                    const cellIndex = row * boardSize + line.index;
                    grid[cellIndex].classList.add('completed');
                }
                break;
            case 'diag1':
                for (let i = 0; i < boardSize; i++) {
                    const cellIndex = i * boardSize + i;
                    grid[cellIndex].classList.add('completed');
                }
                break;
            case 'diag2':
                for (let i = 0; i < boardSize; i++) {
                    const cellIndex = i * boardSize + (boardSize - i - 1);
                    grid[cellIndex].classList.add('completed');
                }
                break;
            default:
                break;
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
