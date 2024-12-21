// bingoscript.js

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('settings-form');
    const settingsScreen = document.getElementById('settings-screen');
    const gameScreen = document.getElementById('game-screen');
    const bingoContainer = document.getElementById('bingo-container');
    const messageDiv = document.getElementById('message');
    const targetLinesDisplay = document.getElementById('target-lines-display');
    const completedLinesDisplay = document.getElementById('completed-lines-display');
    // 캔버스 관련 요소 제거
    // const canvas = document.getElementById('bingo-lines');
    // const ctx = canvas.getContext('2d');
    const firstButton = document.getElementById('first-button');
    const refreshButton = document.getElementById('refresh-button');

    let boardSize = 5;
    let numberRange = 75;
    let targetLines = 1;
    let bingoNumbers = [];
    let markedCells = new Set();
    let linesCompleted = 0;
    let completedLineTypes = new Set(); // To track which lines have been completed
    // 선 그리기 관련 변수 제거
    // let linesToDrawHistory = []; // 기록된 선을 저장

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
        // 선 그리기 관련 상태 초기화 제거
        // linesToDrawHistory = [];

        // 캔버스 초기화 관련 코드 제거
        /*
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        */

        // 숫자 생성 및 빙고판 생성
        generateBingoNumbers();
        createBingoGrid();

        // 캔버스 크기 조정 관련 코드 제거
        /*
        adjustCanvasSize();
        */

        // 창 크기 변경 시 캔버스 다시 조정 및 선 다시 그리기 관련 이벤트 제거
        /*
        window.addEventListener('resize', handleResize);
        */
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

    /*
    function adjustCanvasSize() {
        // 캔버스 크기 조정 관련 코드 제거
    }

    function handleResize() {
        // 캔버스 리사이즈 관련 코드 제거
    }
    */

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
            });
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
