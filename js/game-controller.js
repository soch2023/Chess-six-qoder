/**
 * Ziffi Chess 游戏控制器
 * 管理游戏状态、用户交互和AI逻辑
 */
class GameController {
    constructor() {
        this.engine = new ChessEngine();
        this.gameMode = null; // 'human-vs-engine', 'engine-vs-engine', 'local-two-player', 'online-two-player'
        this.difficulty = 3; // 默认难度（高手级别）
        this.selectedSquare = null;
        this.validMoves = [];
        this.gameActive = false;
        this.isFlipped = false;
        this.undoStack = []; // 存储可撤销的步骤
        this.redoStack = []; // 存储可重做的步骤
        this.playerColors = { human: 'w', ai: 'b' }; // 默认人类执白
        
        this.initEventListeners();
        this.renderBoard();
    }

    initEventListeners() {
        // 游戏模式选择
        document.getElementById('human-vs-engine').addEventListener('click', () => this.setGameMode('human-vs-engine'));
        document.getElementById('engine-vs-engine').addEventListener('click', () => this.setGameMode('engine-vs-engine'));
        document.getElementById('local-two-player').addEventListener('click', () => this.setGameMode('local-two-player'));
        document.getElementById('online-two-player').addEventListener('click', () => this.setGameMode('online-two-player'));
        
        // 难度选择
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setDifficulty(parseInt(e.target.dataset.level));
            });
        });
        
        // 游戏控制按钮
        document.getElementById('flip-board').addEventListener('click', () => this.flipBoard());
        document.getElementById('swap-sides').addEventListener('click', () => this.swapSides());
        document.getElementById('undo-move').addEventListener('click', () => this.undoMove());
        document.getElementById('redo-move').addEventListener('click', () => this.redoMove());
        document.getElementById('new-game').addEventListener('click', () => this.newGame());
        document.getElementById('back-to-menu').addEventListener('click', () => this.backToMenu());
        
        // 加载游戏功能
        document.getElementById('load-game-btn').addEventListener('click', () => {
            const gameId = document.getElementById('load-game-id').value.trim();
            if (gameId) {
                this.loadGame(gameId);
            }
        });
        
        // 在线游戏按钮
        document.getElementById('join-room').addEventListener('click', () => this.joinOnlineGame());
        document.getElementById('create-room').addEventListener('click', () => this.createOnlineGame());
    }

    // 返回主菜单功能
    backToMenu() {
        if (this.gameActive && !confirm('返回主菜单将结束当前游戏，确定要继续吗？')) {
            return;
        }
        
        // 隐藏游戏界面，显示模式选择界面
        document.getElementById('game-mode-selection').classList.remove('hidden');
        document.getElementById('online-game-setup').classList.add('hidden');
        document.getElementById('game-board-container').classList.add('hidden');
        
        // 重置游戏状态
        this.gameActive = false;
        this.gameMode = null;
        this.selectedSquare = null;
        this.validMoves = [];
        
        // 隐藏难度选择
        document.getElementById('difficulty-selection').classList.add('hidden');
    }

    setGameMode(mode) {
        this.gameMode = mode;
        
        // 显示/隐藏相应的UI元素
        document.getElementById('game-mode-selection').classList.add('hidden');
        document.getElementById('online-game-setup').classList.toggle('hidden', mode !== 'online-two-player');
        document.getElementById('game-board-container').classList.remove('hidden');
        
        // 对于人机对战模式，显示难度选择
        const showDifficulty = mode === 'human-vs-engine';
        document.getElementById('difficulty-selection').classList.toggle('hidden', !showDifficulty);
        
        // 开始游戏
        this.startGame();
    }

    setDifficulty(level) {
        this.difficulty = level;
        
        // 更新难度按钮的视觉状态
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.level) === level);
        });
        
        // 如果已经在游戏中，应用新的难度设置
        if (this.gameActive) {
            this.updateGameStatus();
        }
    }

    startGame() {
        this.engine.resetGame();
        this.gameActive = true;
        this.selectedSquare = null;
        this.validMoves = [];
        this.updateGameStatus();
        this.renderBoard();
        
        // 如果是AI对战模式，启动AI回合
        if (this.gameMode === 'engine-vs-engine') {
            setTimeout(() => this.aiTurn(), 1000);
        } else if (this.gameMode === 'human-vs-engine' && this.engine.getCurrentPlayer() !== this.playerColors.human) {
            // 如果AI先手
            setTimeout(() => this.aiTurn(), 1000);
        }
    }

    newGame() {
        this.startGame();
    }

    updateGameStatus() {
        const currentPlayer = this.engine.getCurrentPlayer();
        const moveCount = this.engine.getMoveCount();
        const gameState = this.engine.getGameState();
        
        // 更新当前玩家显示
        document.getElementById('current-player').textContent = 
            `当前: ${currentPlayer === 'w' ? '白方' : '黑方'}`;
        
        // 更新步数显示（Ziffi规则：每方最多6步）
        document.getElementById('move-counter').textContent = 
            `步数: ${moveCount[currentPlayer]}/6`;
        
        // 更新游戏信息
        let message = '游戏正在进行中...';
        if (this.engine.isMoveLimitReached()) {
            if (this.engine.winner) {
                message = `${this.engine.winner === 'w' ? '白方' : '黑方'}胜利！`;
            } else {
                message = '平局！双方棋子价值相等';
            }
        }
        document.getElementById('game-message').textContent = message;
        
        // 更新计时器（简化版，实际应用中需要实现倒计时）
        document.getElementById('timer').textContent = '时间: 2:00';
    }

    renderBoard() {
        const boardElement = document.getElementById('chess-board');
        boardElement.innerHTML = '';
        
        // 使用当前翻转状态获取棋盘
        const board = this.engine.getBoard(this.isFlipped);
        const currentPlayer = this.engine.getCurrentPlayer();
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const squareElement = document.createElement('div');
                squareElement.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                squareElement.dataset.row = row;
                squareElement.dataset.col = col;
                
                const piece = board[row][col];
                if (piece) {
                    const pieceElement = document.createElement('div');
                    pieceElement.className = `piece ${piece.startsWith('b') ? 'black-piece' : ''}`; // 为黑方棋子添加黑色样式
                    pieceElement.textContent = this.engine.getPieceSymbol(piece);
                    pieceElement.dataset.piece = piece;
                    
                    // 添加点击事件
                    pieceElement.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.handleSquareClick(row, col);
                    });
                    
                    squareElement.appendChild(pieceElement);
                }
                
                // 添加点击事件到整个方格
                squareElement.addEventListener('click', () => {
                    this.handleSquareClick(row, col);
                });
                
                // 高亮选中的方格和有效移动
                if (this.selectedSquare && this.selectedSquare.row === row && this.selectedSquare.col === col) {
                    squareElement.classList.add('selected');
                }
                
                if (this.validMoves.some(move => move.toRow === row && move.toCol === col)) {
                    const move = this.validMoves.find(move => move.toRow === row && move.toCol === col);
                    squareElement.classList.add(move.type === 'capture' ? 'valid-capture' : 'valid-move');
                }
                
                boardElement.appendChild(squareElement);
            }
        }
    }

    handleSquareClick(row, col) {
        // 如果游戏结束，不响应点击
        if (this.engine.gameOver) return;
        
        // 如果是AI回合且不是人机对战模式，不响应点击
        const currentPlayer = this.engine.getCurrentPlayer();
        if (this.gameMode === 'engine-vs-engine' ||
            (this.gameMode === 'human-vs-engine' && currentPlayer !== this.playerColors.human)) {
            return;
        }
        
        const piece = this.engine.getPiece(row, col);
        
        // 如果点击的是已经选中的方格，取消选择
        if (this.selectedSquare && this.selectedSquare.row === row && this.selectedSquare.col === col) {
            this.selectedSquare = null;
            this.validMoves = [];
            this.renderBoard();
            return;
        }
        
        // 如果当前有选中方格，尝试移动
        if (this.selectedSquare) {
            const moveResult = this.attemptMove(
                this.selectedSquare.row,
                this.selectedSquare.col,
                row,
                col
            );
            
            if (moveResult) {
                // 移动成功，清除选择
                this.selectedSquare = null;
                this.validMoves = [];
                this.updateGameStatus();
                this.renderBoard();
                
                // 如果是人机对战模式，且轮到AI行动
                if (this.gameMode === 'human-vs-engine' && 
                    this.engine.getCurrentPlayer() !== this.playerColors.human &&
                    !this.engine.gameOver) {
                    setTimeout(() => this.aiTurn(), 500);
                }
            } else {
                // 移动失败，保持原选择或选择新棋子
                if (piece && this.engine.isOwnPiece(piece, currentPlayer)) {
                    this.selectPiece(row, col);
                } else {
                    this.selectedSquare = null;
                    this.validMoves = [];
                    this.renderBoard();
                }
            }
            return;
        }
        
        // 如果点击的是己方棋子，选择它
        if (piece && this.engine.isOwnPiece(piece, currentPlayer)) {
            this.selectPiece(row, col);
        }
    }

    selectPiece(row, col) {
        this.selectedSquare = { row, col };
        this.validMoves = this.engine.generateValidMoves(row, col);
        this.renderBoard();
    }

    attemptMove(fromRow, fromCol, toRow, toCol) {
        // 检查移动是否在有效移动列表中
        const isValidMove = this.validMoves.some(move => 
            move.toRow === toRow && move.toCol === toCol
        );
        
        if (!isValidMove) {
            return false;
        }
        
        // 记录当前状态以支持撤销
        this.saveStateForUndo();
        
        // 执行移动
        const moveSuccess = this.engine.makeMove(fromRow, fromCol, toRow, toCol);
        
        if (moveSuccess) {
            // 清空重做栈，因为进行了新的移动
            this.redoStack = [];
        }
        
        return moveSuccess;
    }

    saveStateForUndo() {
        // 保存当前游戏状态以供撤销，添加深度克隆防止引用问题
        this.undoStack.push({
            board: JSON.parse(JSON.stringify(this.engine.board)),
            currentPlayer: this.engine.currentPlayer,
            moveCount: {...this.engine.moveCount},
            moveHistory: [...this.engine.moveHistory],
            capturedPieces: {
                w: [...this.engine.capturedPieces.w],
                b: [...this.engine.capturedPieces.b]
            },
            gameOver: this.engine.gameOver,
            winner: this.engine.winner,
            selectedSquare: this.selectedSquare ? {...this.selectedSquare} : null,
            validMoves: [...this.validMoves.map(move => ({...move}))],
            isFlipped: this.engine.isFlipped
        });
        
        // 限制撤销栈大小以节省内存
        if (this.undoStack.length > 50) {
            this.undoStack.shift(); // 移除最早的记录
        }
    }

    undoMove() {
        if (this.undoStack.length === 0) {
            console.log("无法撤销更多步数");
            return false;
        }
        
        // 将当前状态保存到重做栈
        this.redoStack.push({
            board: JSON.parse(JSON.stringify(this.engine.board)),
            currentPlayer: this.engine.currentPlayer,
            moveCount: {...this.engine.moveCount},
            moveHistory: [...this.engine.moveHistory],
            capturedPieces: {
                w: [...this.engine.capturedPieces.w],
                b: [...this.engine.capturedPieces.b]
            },
            gameOver: this.engine.gameOver,
            winner: this.engine.winner,
            selectedSquare: this.selectedSquare ? {...this.selectedSquare} : null,
            validMoves: [...this.validMoves.map(move => ({...move}))],
            isFlipped: this.engine.isFlipped
        });
        
        // 限制重做栈大小
        if (this.redoStack.length > 50) {
            this.redoStack.shift();
        }
        
        // 恢复上一个状态
        const prevState = this.undoStack.pop();
        this.engine.board = JSON.parse(JSON.stringify(prevState.board));
        this.engine.currentPlayer = prevState.currentPlayer;
        this.engine.moveCount = {...prevState.moveCount};
        this.engine.moveHistory = [...prevState.moveHistory];
        this.engine.capturedPieces = {
            w: [...prevState.capturedPieces.w],
            b: [...prevState.capturedPieces.b]
        };
        this.engine.gameOver = prevState.gameOver;
        this.engine.winner = prevState.winner;
        this.engine.isFlipped = prevState.isFlipped; // 确保翻转状态也被恢复
        
        this.selectedSquare = prevState.selectedSquare ? {...prevState.selectedSquare} : null;
        this.validMoves = [...prevState.validMoves.map(move => ({...move}))];
        
        this.updateGameStatus();
        this.renderBoard();
        
        return true;
    }

    redoMove() {
        if (this.redoStack.length === 0) {
            console.log("无法重做更多步数");
            return false;
        }
        
        // 将当前状态保存到撤销栈
        this.undoStack.push({
            board: JSON.parse(JSON.stringify(this.engine.board)),
            currentPlayer: this.engine.currentPlayer,
            moveCount: {...this.engine.moveCount},
            moveHistory: [...this.engine.moveHistory],
            capturedPieces: {
                w: [...this.engine.capturedPieces.w],
                b: [...this.engine.capturedPieces.b]
            },
            gameOver: this.engine.gameOver,
            winner: this.engine.winner,
            selectedSquare: this.selectedSquare ? {...this.selectedSquare} : null,
            validMoves: [...this.validMoves.map(move => ({...move}))],
            isFlipped: this.engine.isFlipped
        });
        
        // 限制撤销栈大小
        if (this.undoStack.length > 50) {
            this.undoStack.shift();
        }
        
        // 恢复下一个状态
        const nextState = this.redoStack.pop();
        this.engine.board = JSON.parse(JSON.stringify(nextState.board));
        this.engine.currentPlayer = nextState.currentPlayer;
        this.engine.moveCount = {...nextState.moveCount};
        this.engine.moveHistory = [...nextState.moveHistory];
        this.engine.capturedPieces = {
            w: [...nextState.capturedPieces.w],
            b: [...nextState.capturedPieces.b]
        };
        this.engine.gameOver = nextState.gameOver;
        this.engine.winner = nextState.winner;
        this.engine.isFlipped = nextState.isFlipped; // 确保翻转状态也被恢复
        
        this.selectedSquare = nextState.selectedSquare ? {...nextState.selectedSquare} : null;
        this.validMoves = [...nextState.validMoves.map(move => ({...move}))];
        
        this.updateGameStatus();
        this.renderBoard();
        
        return true;
    }

    flipBoard() {
        this.isFlipped = this.engine.toggleFlip();
        this.renderBoard();
    }

    // 修正交换角色功能 - 只交换执棋方，不翻转棋盘
    swapSides() {
        // 只交换当前玩家和颜色配置，不改变棋盘上的棋子位置
        this.engine.currentPlayer = this.engine.currentPlayer === 'w' ? 'b' : 'w';
        
        // 交换玩家颜色配置
        this.playerColors = {
            human: this.playerColors.human === 'w' ? 'b' : 'w',
            ai: this.playerColors.ai === 'w' ? 'b' : 'w'
        };
        
        this.updateGameStatus();
        this.renderBoard();
    }

    aiTurn() {
        if (!this.gameActive || this.engine.gameOver) return;
        
        // 显示AI正在思考
        document.getElementById('engine-thinking').classList.remove('hidden');
        
        // 根据游戏模式确定AI颜色
        let aiColor;
        if (this.gameMode === 'engine-vs-engine') {
            aiColor = this.engine.getCurrentPlayer(); // 轮到谁就是哪个AI
        } else if (this.gameMode === 'human-vs-engine') {
            aiColor = this.playerColors.human === 'w' ? 'b' : 'w';
        } else {
            // 其他模式不需要AI行动
            document.getElementById('engine-thinking').classList.add('hidden');
            return;
        }
        
        // 如果当前不是AI的回合，退出
        if (this.engine.getCurrentPlayer() !== aiColor) {
            document.getElementById('engine-thinking').classList.add('hidden');
            return;
        }
        
        // 使用setTimeout来模拟AI思考时间，并确保UI更新
        setTimeout(() => {
            const aiMove = this.engine.getAIMove(aiColor, this.difficulty);
            
            if (aiMove) {
                // 记录当前状态以支持撤销
                this.saveStateForUndo();
                
                // 执行AI移动
                const moveSuccess = this.engine.makeMove(
                    aiMove.fromRow,
                    aiMove.fromCol,
                    aiMove.toRow,
                    aiMove.toCol
                );
                
                if (moveSuccess) {
                    // 清空重做栈
                    this.redoStack = [];
                    
                    // 更新游戏状态和界面
                    this.updateGameStatus();
                    this.renderBoard();
                    
                    // 检查游戏是否结束
                    if (!this.engine.gameOver) {
                        // 如果是双AI对战，安排下一个AI行动
                        if (this.gameMode === 'engine-vs-engine') {
                            setTimeout(() => this.aiTurn(), 1000);
                        }
                    }
                }
            }
            
            // 隐藏AI思考提示
            document.getElementById('engine-thinking').classList.add('hidden');
        }, 500 + Math.random() * 500); // 添加一些随机时间使AI行为更自然
    }

    joinOnlineGame() {
        const roomId = document.getElementById('room-id').value.trim();
        if (!roomId) {
            alert('请输入房间ID');
            return;
        }
        
        // 这里应该连接到在线服务
        // 简化实现：假设连接成功
        console.log(`尝试加入房间: ${roomId}`);
        this.startGame();
    }

    createOnlineGame() {
        // 生成随机房间ID
        const roomId = Math.random().toString(36).substring(2, 10).toUpperCase();
        document.getElementById('room-id').value = roomId;
        console.log(`创建房间: ${roomId}`);
        this.startGame();
    }
}

// 新增：在线游戏管理器
class OnlineGameManager {
    constructor() {
        this.socket = null;
        this.roomId = null;
        this.isConnected = false;
        this.opponentConnected = false;
    }

    // 连接到在线游戏服务器
    connectToServer(roomId, playerName) {
        // 模拟连接过程 - 实际实现中这里会使用WebSocket
        return new Promise((resolve, reject) => {
            // 模拟网络延迟
            setTimeout(() => {
                console.log(`连接到房间 ${roomId} 成功`);
                this.roomId = roomId;
                this.isConnected = true;
                this.opponentConnected = false; // 初始时对手未连接
                
                // 模拟对手连接（在真实实现中，这会在对手加入时触发）
                setTimeout(() => {
                    this.opponentConnected = true;
                    this.onOpponentJoined();
                }, 2000);
                
                resolve(true);
            }, 1000);
        });
    }

    // 发送移动到服务器
    sendMove(moveData) {
        if (!this.isConnected || !this.opponentConnected) {
            console.warn('尚未连接到对手，无法发送移动');
            return false;
        }

        // 模拟通过网络发送移动数据
        console.log('发送移动到服务器:', moveData);
        
        // 在实际实现中，这里会通过WebSocket发送数据
        // this.socket.emit('move', moveData);
        
        return true;
    }

    // 接收来自对手的移动
    receiveMove(moveData) {
        console.log('接收到来自对手的移动:', moveData);
        // 在实际实现中，这会由WebSocket事件触发
        // 在模拟中，我们不会实际调用这个方法
    }

    // 对手加入房间
    onOpponentJoined() {
        console.log('对手已加入房间');
        // 更新UI状态
        document.getElementById('game-message').textContent = '对手已加入，游戏即将开始！';
        
        // 在真实实现中，这里会通知游戏控制器
        if (window.gameController) {
            // 如果是房主，让房主先走
            if (this.isRoomOwner()) {
                window.gameController.updateGameStatus();
            }
        }
    }

    // 检查是否为房主
    isRoomOwner() {
        // 在实际实现中，这会通过服务器验证
        // 模拟：第一个加入的人是房主
        return true;
    }

    // 离开房间
    leaveRoom() {
        if (this.isConnected) {
            console.log(`离开房间 ${this.roomId}`);
            this.isConnected = false;
            this.opponentConnected = false;
            this.roomId = null;
        }
    }

    // 检查对手是否在线
    isOpponentOnline() {
        return this.opponentConnected;
    }
}

// 扩展GameController以支持在线游戏
Object.assign(GameController.prototype, {
    async joinOnlineGame() {
        const roomId = document.getElementById('room-id').value.trim();
        if (!roomId) {
            alert('请输入房间ID');
            return;
        }
        
        // 创建在线游戏管理器
        this.onlineManager = new OnlineGameManager();
        
        try {
            // 连接到在线服务
            const connected = await this.onlineManager.connectToServer(roomId, 'Player');
            
            if (connected) {
                console.log(`成功加入房间: ${roomId}`);
                this.startOnlineGame();
            }
        } catch (error) {
            console.error('连接到房间失败:', error);
            alert('连接到房间失败，请检查房间ID是否正确');
        }
    },

    createOnlineGame() {
        // 生成随机房间ID
        const roomId = Math.random().toString(36).substring(2, 10).toUpperCase();
        document.getElementById('room-id').value = roomId;
        console.log(`创建房间: ${roomId}`);
        
        // 创建在线游戏管理器
        this.onlineManager = new OnlineGameManager();
        
        // 模拟创建房间的过程
        setTimeout(() => {
            this.startOnlineGame();
        }, 500);
    },

    startOnlineGame() {
        this.engine.resetGame();
        this.gameActive = true;
        this.selectedSquare = null;
        this.validMoves = [];
        this.updateGameStatus();
        this.renderBoard();
        
        // 设置在线游戏特定的状态
        if (this.onlineManager && this.onlineManager.isRoomOwner()) {
            // 房主通常是先手方
            this.playerColors = { human: 'w', opponent: 'b' };
        } else {
            // 加入者是后手方
            this.playerColors = { human: 'b', opponent: 'w' };
        }
        
        // 开始在线游戏
        document.getElementById('game-message').textContent = '在线游戏已开始，等待对手...';
    },

    // 在线游戏中的移动处理
    attemptOnlineMove(fromRow, fromCol, toRow, toCol) {
        if (!this.onlineManager || !this.onlineManager.isOpponentOnline()) {
            alert('对手尚未连接，无法进行在线游戏');
            return false;
        }

        // 检查是否是当前玩家的回合
        const currentPlayer = this.engine.getCurrentPlayer();
        const humanColor = this.playerColors.human;
        
        if (currentPlayer !== humanColor) {
            alert('等待对手移动...');
            return false;
        }

        // 检查移动是否在有效移动列表中
        const isValidMove = this.validMoves.some(move => 
            move.toRow === toRow && move.toCol === toCol
        );
        
        if (!isValidMove) {
            return false;
        }
        
        // 记录当前状态以支持撤销
        this.saveStateForUndo();
        
        // 执行移动
        const moveSuccess = this.engine.makeMove(fromRow, fromCol, toRow, toCol);
        
        if (moveSuccess) {
            // 发送移动到服务器
            const moveData = {
                fromRow,
                fromCol, 
                toRow,
                toCol,
                roomId: this.onlineManager.roomId,
                player: this.playerColors.human
            };
            
            this.onlineManager.sendMove(moveData);
            
            // 清空重做栈，因为进行了新的移动
            this.redoStack = [];
            
            // 更新游戏状态和界面
            this.updateGameStatus();
            this.renderBoard();
            
            return true;
        }
        
        return false;
    }
});

// 扩展GameController以支持云存储
Object.assign(GameController.prototype, {
    // 保存游戏到云端（使用KV存储模拟）
    async saveGameToCloud(gameId, gameData) {
        try {
            // 在实际实现中，这里会调用Cloudflare Workers KV
            // 模拟实现使用localStorage作为替代
            const cloudData = {
                ...gameData,
                savedAt: new Date().toISOString(),
                gameId: gameId
            };
            
            // 模拟API调用延迟
            await new Promise(resolve => setTimeout(resolve, 300));
            
            localStorage.setItem(`ziffi_chess_game_${gameId}`, JSON.stringify(cloudData));
            console.log(`游戏已保存到云端: ${gameId}`);
            
            return { success: true, gameId: gameId };
        } catch (error) {
            console.error('保存游戏到云端失败:', error);
            return { success: false, error: error.message };
        }
    },

    // 从云端加载游戏
    async loadGameFromCloud(gameId) {
        try {
            // 在实际实现中，这里会从Cloudflare Workers KV获取数据
            // 模拟实现从localStorage获取
            const gameData = localStorage.getItem(`ziffi_chess_game_${gameId}`);
            
            // 模拟API调用延迟
            await new Promise(resolve => setTimeout(resolve, 300));
            
            if (gameData) {
                const parsedData = JSON.parse(gameData);
                console.log(`从云端加载游戏: ${gameId}`);
                return { success: true, gameData: parsedData };
            } else {
                return { success: false, error: '游戏不存在' };
            }
        } catch (error) {
            console.error('从云端加载游戏失败:', error);
            return { success: false, error: error.message };
        }
    },

    // 保存当前游戏状态
    async saveCurrentGame() {
        if (!this.gameActive) {
            alert('没有正在进行的游戏');
            return;
        }
        
        // 生成游戏ID
        const gameId = `ziffi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // 准备游戏数据
        const gameData = {
            gameState: this.engine.getGameState(),
            gameMode: this.gameMode,
            difficulty: this.difficulty,
            playerColors: this.playerColors,
            createdAt: new Date().toISOString()
        };
        
        // 保存到云端
        const result = await this.saveGameToCloud(gameId, gameData);
        
        if (result.success) {
            alert(`游戏已保存！游戏ID: ${gameId}`);
            console.log(`游戏保存成功，ID: ${gameId}`);
        } else {
            alert('游戏保存失败');
            console.error('游戏保存失败:', result.error);
        }
        
        return result;
    },

    // 加载游戏
    async loadGame(gameId) {
        const result = await this.loadGameFromCloud(gameId);
        
        if (result.success) {
            const gameData = result.gameData;
            
            // 恢复游戏状态
            this.engine.board = JSON.parse(JSON.stringify(gameData.gameState.board));
            this.engine.currentPlayer = gameData.gameState.currentPlayer;
            this.engine.moveCount = {...gameData.gameState.moveCount};
            this.engine.gameOver = gameData.gameState.gameOver;
            this.engine.winner = gameData.gameState.winner;
            this.engine.moveHistory = [...gameData.gameState.moveHistory];
            this.engine.capturedPieces = {
                w: [...gameData.gameState.capturedPieces.w],
                b: [...gameData.gameState.capturedPieces.b]
            };
            
            this.gameMode = gameData.gameMode;
            this.difficulty = gameData.difficulty;
            this.playerColors = gameData.playerColors;
            this.gameActive = true;
            this.selectedSquare = null;
            this.validMoves = [];
            
            this.updateGameStatus();
            this.renderBoard();
            
            alert(`游戏已加载: ${gameId}`);
            console.log(`游戏加载成功: ${gameId}`);
        } else {
            alert(`加载游戏失败: ${result.error}`);
            console.error('游戏加载失败:', result.error);
        }
        
        return result;
    }
});
