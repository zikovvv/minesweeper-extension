class Minesweeper {
    constructor() {
        // Fixed cell size
        this.CELL_SIZE = 28;
        
        // DOM elements
        this.boardElement = document.getElementById('game-board');
        this.timeElement = document.getElementById('time');
        this.widthInput = document.getElementById('width');
        this.heightInput = document.getElementById('height');
        this.minesInput = document.getElementById('mines');
        this.cpsElement = document.getElementById('cps');

        // Initialize game state
        this.board = [];
        this.mineLocations = new Set();
        this.revealed = new Set();
        this.flagged = new Set();
        this.isFirstClick = true;
        this.gameOver = false;
        this.timer = null;
        this.timeElapsed = 0;
        
        // Load settings from local storage or use defaults
        this.loadSettingsFromLocalStorage();
        
        // Set initial board size immediately
        this.setGridSize();
        
        // Event listeners
        this.boardElement.addEventListener('contextmenu', e => e.preventDefault());
        document.getElementById('restart').addEventListener('click', () => {
            this.initGame();
        });

        // Initialize game
        this.initGame();
    }

    // Load settings from local storage
    loadSettingsFromLocalStorage() {
        try {
            const savedSettings = localStorage.getItem('minesweeperSettings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                this.width = settings.width || 20;
                this.height = settings.height || 20;
                
                // Update input fields with saved values
                this.widthInput.value = this.width;
                this.heightInput.value = this.height;
                this.minesInput.value = settings.mines || 40;
            } else {
                // Default values if no saved settings
                this.width = 20;
                this.height = 20;
            }
        } catch (error) {
            console.error('Error loading settings from local storage:', error);
            // Use defaults if there's an error
            this.width = 20;
            this.height = 20;
        }
    }
    
    // Save settings to local storage
    saveSettingsToLocalStorage() {
        try {
            const settings = {
                width: this.width,
                height: this.height,
                mines: this.totalMines
            };
            localStorage.setItem('minesweeperSettings', JSON.stringify(settings));
        } catch (error) {
            console.error('Error saving settings to local storage:', error);
        }
    }

    setGridSize() {
        // Set explicit grid dimensions
        this.boardElement.style.width = `${this.CELL_SIZE * this.width}px`;
        this.boardElement.style.height = `${this.CELL_SIZE * this.height}px`;
        this.boardElement.style.gridTemplateColumns = `repeat(${this.width}, ${this.CELL_SIZE}px)`;
        this.boardElement.style.gridTemplateRows = `repeat(${this.height}, ${this.CELL_SIZE}px)`;
        
        // Update window size
        const width = this.width * this.CELL_SIZE + 6;
        const height = this.height * this.CELL_SIZE + document.querySelector('.controls').offsetHeight + 8;
        
        chrome.runtime.sendMessage({
            action: 'resizeWindow',
            width: width,
            height: height + 28
        });
    }

    initGame() {
        this.width = parseInt(this.widthInput.value);
        this.height = parseInt(this.heightInput.value);
        this.totalMines = Math.min(parseInt(this.minesInput.value), 
            Math.floor(this.width * this.height * 0.85));
        
        // Save settings to local storage when game is restarted
        this.saveSettingsToLocalStorage();
        
        // Set grid size before other initialization
        this.setGridSize();
        
        // Reset game state
        this.minesInput.value = this.totalMines;
        this.board = [];
        this.mineLocations.clear();
        this.revealed.clear();
        this.flagged.clear();
        this.isFirstClick = true;
        this.gameOver = false;
        this.stopTimer();
        this.timeElapsed = 0;
        this.timeElement.textContent = '0';
        this.timeElement.parentElement.classList.remove('win', 'lose');
        this.cpsElement.textContent = '0.0';
        
        this.createBoard();
        this.renderBoard();
    }

    createBoard() {
        this.boardElement.innerHTML = '';
        
        for (let y = 0; y < this.height; y++) {
            this.board[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.board[y][x] = 0;
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                
                cell.addEventListener('click', (e) => this.handleClick(x, y));
                cell.addEventListener('dblclick', (e) => this.handleDoubleClick(x, y));
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.handleRightClick(x, y);
                });
                
                this.boardElement.appendChild(cell);
            }
        }
    }

    generateMines(firstX, firstY) {
        // Create safe zone around first click
        const safeZone = new Set();
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const newX = firstX + dx;
                const newY = firstY + dy;
                if (newX >= 0 && newX < this.width && newY >= 0 && newY < this.height) {
                    safeZone.add(`${newX},${newY}`);
                }
            }
        }

        // Place mines
        let minesToPlace = this.totalMines;
        while (minesToPlace > 0) {
            const x = Math.floor(Math.random() * this.width);
            const y = Math.floor(Math.random() * this.height);
            const key = `${x},${y}`;
            
            if (!this.mineLocations.has(key) && !safeZone.has(key)) {
                this.mineLocations.add(key);
                minesToPlace--;
                
                // Update numbers around the mine
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const newX = x + dx;
                        const newY = y + dy;
                        if (newX >= 0 && newX < this.width && 
                            newY >= 0 && newY < this.height) {
                            this.board[newY][newX]++;
                        }
                    }
                }
            }
        }
    }

    startTimer() {
        if (!this.timer) {
            this.timer = setInterval(() => {
                this.timeElapsed++;
                this.timeElement.textContent = this.timeElapsed;
                this.updateCPS();
            }, 1000);
        }
    }

    updateCPS() {
        if (this.timeElapsed > 0) {
            const cps = (this.revealed.size / this.timeElapsed).toFixed(1);
            this.cpsElement.textContent = cps;
        }
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    startCpsCounter() {
        // This method is now empty as we don't need the separate interval
    }

    stopCpsCounter() {
        // This method is now empty as we don't need the separate interval
    }

    handleClick(x, y) {
        if (this.gameOver || this.flagged.has(`${x},${y}`)) return;
        
        if (this.isFirstClick) {
            this.isFirstClick = false;
            this.generateMines(x, y);
            this.startTimer();
        }
        
        this.reveal(x, y);
    }

    handleRightClick(x, y) {
        if (this.gameOver || this.revealed.has(`${x},${y}`)) return;
        
        const key = `${x},${y}`;
        const cell = this.getCellElement(x, y);
        
        if (this.flagged.has(key)) {
            this.flagged.delete(key);
            cell.classList.remove('flagged');
        } else {
            this.flagged.add(key);
            cell.classList.add('flagged');
        }
    }

    handleDoubleClick(x, y) {
        if (this.gameOver || !this.revealed.has(`${x},${y}`)) return;
        
        const number = this.board[y][x];
        if (number === 0) return;

        // Count flags around the cell
        let flagCount = 0;
        const surroundingUnflaggedCells = [];
        
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                
                const newX = x + dx;
                const newY = y + dy;
                
                if (newX >= 0 && newX < this.width && 
                    newY >= 0 && newY < this.height) {
                    const key = `${newX},${newY}`;
                    if (this.flagged.has(key)) {
                        flagCount++;
                    } else if (!this.revealed.has(key)) {
                        surroundingUnflaggedCells.push([newX, newY]);
                    }
                }
            }
        }

        // Only reveal cells if the number of flags matches the number
        if (flagCount === number) {
            // Reveal all unflagged and unrevealed surrounding cells
            for (const [cellX, cellY] of surroundingUnflaggedCells) {
                this.reveal(cellX, cellY);
            }
        }
    }

    reveal(x, y) {
        const cellsToReveal = [[x, y]];
        
        while (cellsToReveal.length > 0) {
            const [currentX, currentY] = cellsToReveal.pop();
            const key = `${currentX},${currentY}`;
            
            if (this.revealed.has(key)) continue;
            
            // Remove flag if the cell was flagged
            if (this.flagged.has(key)) {
                this.flagged.delete(key);
                const cell = this.getCellElement(currentX, currentY);
                cell.classList.remove('flagged');
            }
            
            this.revealed.add(key);
            const cell = this.getCellElement(currentX, currentY);
            cell.classList.add('revealed');
            
            if (this.mineLocations.has(key)) {
                this.gameOver = true;
                cell.classList.add('mine');
                this.revealAllMines(currentX, currentY); // Pass the coordinates of the clicked mine
                this.stopTimer();
                this.timeElement.parentElement.classList.add('lose');
                return;
            }
            
            if (this.board[currentY][currentX] === 0) {
                // Add surrounding cells to the stack for empty spaces
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const newX = currentX + dx;
                        const newY = currentY + dy;
                        if (newX >= 0 && newX < this.width && 
                            newY >= 0 && newY < this.height &&
                            !this.revealed.has(`${newX},${newY}`)) {
                            cellsToReveal.push([newX, newY]);
                        }
                    }
                }
            } else {
                cell.textContent = this.board[currentY][currentX];
                cell.dataset.value = this.board[currentY][currentX];
            }
        }
        
        this.checkWin();
    }

    getDistance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    revealAllMines(centerX, centerY) {
        // Get all cells with their distances
        const allCells = [];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                allCells.push({
                    x,
                    y,
                    isMine: this.mineLocations.has(`${x},${y}`),
                    distance: this.getDistance(centerX, centerY, x, y)
                });
            }
        }

        // Sort cells by distance from center
        allCells.sort((a, b) => a.distance - b.distance);

        // Group cells by similar distances to create wave effect
        const waveSize = 0.5; // Smaller wave size for more distinct circles
        let waves = {};

        allCells.forEach(cell => {
            let waveIndex = Math.floor(cell.distance / waveSize);
            if (!waves[waveIndex]) waves[waveIndex] = [];
            waves[waveIndex].push(cell);
        });

        // Reveal cells in waves
        Object.keys(waves).sort((a, b) => Number(a) - Number(b)).forEach((waveIndex, i) => {
            setTimeout(() => {
                waves[waveIndex].forEach(cell => {
                    const element = this.getCellElement(cell.x, cell.y);
                    // Add a temporary animation class
                    element.classList.add('wave-reveal');
                    element.classList.add('revealed');
                    if (cell.isMine) {
                        element.classList.add('mine');
                    } else {
                        const value = this.board[cell.y][cell.x];
                        if (value > 0) {
                            element.textContent = value;
                            element.dataset.value = value;
                        }
                    }
                    // Remove animation class after effect
                    setTimeout(() => element.classList.remove('wave-reveal'), 300);
                });
            }, i * 10); // Even faster animation (10ms between waves)
        });
    }

    checkWin() {
        const totalCells = this.width * this.height;
        if (this.revealed.size === totalCells - this.mineLocations.size) {
            this.gameOver = true;
            this.stopTimer();
            this.timeElement.parentElement.classList.add('win');
        }
    }

    getCellElement(x, y) {
        return this.boardElement.children[y * this.width + x];
    }

    renderBoard() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cell = this.getCellElement(x, y);
                cell.className = 'cell';
                cell.textContent = '';
            }
        }
    }

    updateWindowSize() {
        const width = this.width * this.CELL_SIZE + 6; // Add small border padding
        const height = this.height * this.CELL_SIZE + document.querySelector('.controls').offsetHeight + 8;
        
        chrome.runtime.sendMessage({
            action: 'resizeWindow',
            width: width,
            height: height + 28 // Add Chrome title bar height
        });
    }
}

// Wait for DOM to be loaded before creating game instance
document.addEventListener('DOMContentLoaded', () => {
    const game = new Minesweeper();
});