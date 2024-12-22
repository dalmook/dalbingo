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
    const categorySelect = document.getElementById('category');

    // 기본 설정 값
    const DEFAULT_BOARD_SIZE = 5;
    const DEFAULT_NUMBER_RANGE = 25;
    const DEFAULT_TARGET_LINES = 3;

    let boardSize = DEFAULT_BOARD_SIZE;
    let numberRange = DEFAULT_NUMBER_RANGE;
    let targetLines = DEFAULT_TARGET_LINES;
    let selectedCategory = null;
    let bingoData = [];
    let markedCells = new Set();
    let linesCompleted = 0;
    let completedLineTypes = new Set(); // 줄의 완성 여부를 추적

    // **추가된 부분: 현재 사용 중인 usableData를 저장하는 변수**
    let currentUsableData = [];

    // 초기 설정 화면 표시
    showScreen('settings');

    // 초기 설정 화면의 입력 필드 초기화
    initializeSettingsFields();

    // 카테고리 로드
    loadCategories();

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

    // **수정된 부분: "새로고침" 버튼 이벤트 리스너**
    refreshButton.addEventListener('click', () => {
        if (currentUsableData.length === 0) {
            alert('게임이 시작되지 않았습니다. 먼저 게임을 시작하세요.');
            return;
        }
        initializeGame(currentUsableData);
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
            targetLines = newMaxTargetLines;
        }
    });

    // 목표 줄수 입력 실시간 제한
    targetLinesInput.addEventListener('input', () => {
        const currentValue = parseInt(targetLinesInput.value);
        const maxTargetLines = parseInt(targetLinesInput.max);
        if (currentValue > maxTargetLines) {
            targetLinesInput.value = maxTargetLines;
            targetLines = maxTargetLines;
        }
    });

    // 함수: 카테고리 로드
    function loadCategories() {
        fetch('bingodata.json')
            .then(response => response.json())
            .then(data => {
                const categories = data.categories;
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.name;
                    option.textContent = category.name;
                    categorySelect.appendChild(option);
                });
            })
            .catch(error => {
                console.error('Error loading categories:', error);
                alert('카테고리 데이터를 로드하는 데 실패했습니다.');
            });
    }

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
        selectedCategory = null;
        categorySelect.value = "";

        initializeSettingsFields();

        // **추가된 부분: 이전 게임 데이터 초기화**
        bingoContainer.innerHTML = '';
        messageDiv.classList.add('d-none');
        markedCells.clear();
        linesCompleted = 0;
        completedLineTypes.clear();
        completedLinesDisplay.textContent = linesCompleted;
        currentUsableData = [];
    }

    function startGame() {
        // 설정 화면의 값을 가져오기
        selectedCategory = categorySelect.value;
        boardSize = parseInt(boardSizeInput.value);
        numberRange = parseInt(numberRangeInput.value);
        targetLines = parseInt(targetLinesInput.value);

        // 유효성 검사
        if (!selectedCategory) {
            alert('카테고리를 선택하세요.');
            return;
        }

        if (selectedCategory === '숫자' && boardSize * boardSize > numberRange) {
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

        // 빙고 데이터 로드
        loadBingoData(selectedCategory)
            .then(() => {
                // 숫자 범위에 따른 데이터 필터링 (숫자 카테고리에만 적용)
                let usableData = bingoData;
                if (selectedCategory === '숫자') {
                    usableData = bingoData.filter(item => item.index >= 1 && item.index <= numberRange);
                    if (usableData.length < boardSize * boardSize) {
                        alert(`숫자 범위가 너무 작아 빙고판을 생성할 수 없습니다. 숫자 범위를 늘려주세요.`);
                        return;
                    }
                }

                // **추가된 부분: currentUsableData에 저장**
                currentUsableData = usableData;

                // 목표 줄수 및 완료된 줄수 표시 업데이트
                targetLinesDisplay.textContent = targetLines;
                completedLinesDisplay.textContent = linesCompleted;

                // 게임 화면 표시
                showScreen('game');

                // 게임 초기화
                initializeGame(usableData);
            })
            .catch(error => {
                console.error('Error loading bingo data:', error);
                alert('빙고 데이터를 로드하는 데 실패했습니다.');
            });
    }

    function loadBingoData(categoryName) {
        return fetch('bingodata.json')
            .then(response => response.json())
            .then(data => {
                const categories = data.categories;
                const category = categories.find(cat => cat.name === categoryName);
                if (!category) {
                    throw new Error(`카테고리 "${categoryName}"를 찾을 수 없습니다.`);
                }
                bingoData = category.data;
            });
    }

    function initializeGame(usableData) {
        // 이전 게임 상태 초기화
        bingoContainer.innerHTML = '';
        messageDiv.classList.add('d-none');
        markedCells.clear();
        linesCompleted = 0;
        completedLineTypes.clear();
        completedLinesDisplay.textContent = linesCompleted;

        // 빙고판 생성
        createBingoGrid(usableData);
    }

    function resetGame() {
        initializeGame();
    }

    function createBingoGrid(usableData) {
        // 빙고판 그리드 설정
        bingoContainer.style.gridTemplateColumns = `repeat(${boardSize}, 1fr)`;
        bingoContainer.style.gridTemplateRows = `repeat(${boardSize}, 1fr)`;

        // 빙고 데이터에서 무작위로 선택
        const shuffledData = shuffleArray([...usableData]);
        const selectedBingoNumbers = shuffledData.slice(0, boardSize * boardSize);

        selectedBingoNumbers.forEach((item, index) => {
            const cell = document.createElement('div');
            cell.classList.add('bingo-cell');
            cell.textContent = item.value;
            cell.dataset.index = index;
            cell.addEventListener('click', () => handleCellClick(cell, index));
            bingoContainer.appendChild(cell);
        });
    }

    function handleCellClick(cell, index) {
        if (markedCells.has(index)) {
            // 이미 마킹된 셀을 다시 클릭하면 언마킹
            cell.classList.remove('marked');
            markedCells.delete(index);
            // 관련된 완성된 줄이 있는지 확인하고 업데이트
            updateLinesOnUnmark(index);
        } else {
            // 마킹되지 않은 셀을 클릭하면 마킹
            cell.classList.add('marked');
            markedCells.add(index);
            // 줄 확인
            checkForLines();
            // 목표 줄수 달성 시 메시지 표시
            if (linesCompleted >= targetLines) {
                showMessage('축하합니다! 목표를 달성했습니다!');
            }
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

        // 대각선 체크 (좌상-우하)
        let diag1 = gridArray.map((row, idx) => row[idx]);
        if (diag1.every(cell => cell)) {
            const lineKey = `diag1`;
            if (!completedLineTypes.has(lineKey)) {
                newLines++;
                linesToMark.push({ type: 'diag1' });
                completedLineTypes.add(lineKey);
            }
        }

        // 대각선 체크 (우상-좌하)
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

    function updateLinesOnUnmark(index) {
        const grid = Array.from(bingoContainer.children);
        const gridArray = [];
        for (let i = 0; i < boardSize; i++) {
            gridArray[i] = [];
            for (let j = 0; j < boardSize; j++) {
                gridArray[i][j] = grid[i * boardSize + j].classList.contains('marked');
            }
        }

        let linesToUnmark = [];

        // 해당 셀이 속한 행
        const rowIndex = Math.floor(index / boardSize);
        const rowLineKey = `row-${rowIndex}`;
        if (completedLineTypes.has(rowLineKey) && !gridArray[rowIndex].every(cell => cell)) {
            linesToUnmark.push(rowLineKey);
            console.log(`Unmarking line: ${rowLineKey}`);
        }

        // 해당 셀이 속한 열
        const colIndex = index % boardSize;
        const colLineKey = `col-${colIndex}`;
        let column = gridArray.map(row => row[colIndex]);
        if (completedLineTypes.has(colLineKey) && !column.every(cell => cell)) {
            linesToUnmark.push(colLineKey);
            console.log(`Unmarking line: ${colLineKey}`);
        }

        // 해당 셀이 속한 대각선 (좌상-우하)
        if (rowIndex === colIndex) {
            const diag1LineKey = `diag1`;
            let diag1 = gridArray.map((row, idx) => row[idx]);
            if (completedLineTypes.has(diag1LineKey) && !diag1.every(cell => cell)) {
                linesToUnmark.push(diag1LineKey);
                console.log(`Unmarking line: ${diag1LineKey}`);
            }
        }

        // 해당 셀이 속한 대각선 (우상-좌하)
        if (rowIndex + colIndex === boardSize - 1) {
            const diag2LineKey = `diag2`;
            let diag2 = gridArray.map((row, idx) => row[boardSize - idx - 1]);
            if (completedLineTypes.has(diag2LineKey) && !diag2.every(cell => cell)) {
                linesToUnmark.push(diag2LineKey);
                console.log(`Unmarking line: ${diag2LineKey}`);
            }
        }

        // Remove 'completed' class and update counts for lines that are no longer complete
        linesToUnmark.forEach(lineKey => {
            removeCompletedLine(lineKey);
        });
    }

    function removeCompletedLine(lineKey) {
        const grid = Array.from(bingoContainer.children);
        switch (lineKey.split('-')[0]) {
            case 'row':
                const rowIdx = parseInt(lineKey.split('-')[1]);
                for (let col = 0; col < boardSize; col++) {
                    const cellIndex = rowIdx * boardSize + col;
                    grid[cellIndex].classList.remove('completed');
                }
                break;
            case 'col':
                const colIdx = parseInt(lineKey.split('-')[1]);
                for (let row = 0; row < boardSize; row++) {
                    const cellIndex = row * boardSize + colIdx;
                    grid[cellIndex].classList.remove('completed');
                }
                break;
            case 'diag1':
                for (let i = 0; i < boardSize; i++) {
                    const cellIndex = i * boardSize + i;
                    grid[cellIndex].classList.remove('completed');
                }
                break;
            case 'diag2':
                for (let i = 0; i < boardSize; i++) {
                    const cellIndex = i * boardSize + (boardSize - i - 1);
                    grid[cellIndex].classList.remove('completed');
                }
                break;
            default:
                break;
        }

        // 줄 타입 제거 및 카운트 감소
        completedLineTypes.delete(lineKey);
        linesCompleted--;
        completedLinesDisplay.textContent = linesCompleted;

        // 목표 줄수 달성 메시지 숨기기 (필요 시)
        if (linesCompleted < targetLines) {
            messageDiv.classList.add('d-none');
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
        return array;
    }
});
