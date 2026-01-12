/**
 * Ziffi Chess 引擎 - 实现国际象棋核心逻辑和Ziffi规则
 * 支持6步格式、2分钟限时等特殊规则
 */
class ChessEngine {
    constructor() {
        // 棋盘表示 - 8x8数组
        this.board = Array(8).fill().map(() => Array(8).fill(null));
        // 当前玩家 ('w' = 白方, 'b' = 黑方)
        this.currentPlayer = 'w';
        // 游戏步数计数器（Ziffi规则：每方最多6步）
        this.moveCount = { w: 0, b: 0 };
        // 游戏开始的初始位置（Ziffi规则：中期开局）
        this.initialPosition = [
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, 'bR', 'bN', 'bB', 'bQ', 'bK', null],
            [null, null, 'bP', 'bP', 'bP', null, null, null],
            [null, null, 'wP', 'wP', 'wP', null, null, null],
            [null, null, 'wR', 'wN', 'wB', 'wQ', 'wK', null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null]
        ];
        // 棋子符号映射
        this.pieceSymbols = {
            'wK': '♔', 'wQ': '♕', 'wR': '♖', 'wB': '♗', 'wN': '♘', 'wP': '♙',
            'bK': '♚', 'bQ': '♛', 'bR': '♜', 'bB': '♝', 'bN': '♞', 'bP': '♟'
        };
        // 将游戏初始化为Ziffi规则的中期开局
        this.resetGame();
    }

    // 重置游戏到Ziffi规则的中期开局
    resetGame() {
        // 复制初始位置到当前棋盘
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                this.board[row][col] = this.initialPosition[row][col];
            }
        }
        
        // 重置游戏状态
        this.currentPlayer = 'w';
        this.moveCount = { w: 0, b: 0 };
        this.gameOver = false;
        this.winner = null;
        this.moveHistory = [];
        this.capturedPieces = { w: [], b: [] };
        this.isFlipped = false; // 棋盘是否翻转
    }

    // 获取棋盘状态（考虑翻转）
    getBoard(isFlipped = false) {
        if (!isFlipped) {
            return this.board;
        }
        
        // 如果棋盘翻转，则返回翻转后的棋盘
        const flippedBoard = Array(8).fill().map(() => Array(8).fill(null));
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                flippedBoard[row][col] = this.board[7 - row][7 - col];
            }
        }
        return flippedBoard;
    }

    // 获取当前玩家
    getCurrentPlayer() {
        return this.currentPlayer;
    }

    // 获取当前步数
    getMoveCount(player = null) {
        if (player) {
            return this.moveCount[player];
        }
        return { ...this.moveCount };
    }

    // 检查是否达到Ziffi规则的6步限制
    isMoveLimitReached(player = null) {
        if (player) {
            return this.moveCount[player] >= 6;
        }
        return this.moveCount.w >= 6 && this.moveCount.b >= 6;
    }

    // 检查位置是否在棋盘内
    isValidPosition(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    // 获取指定位置的棋子
    getPiece(row, col) {
        if (!this.isValidPosition(row, col)) return null;
        return this.board[row][col];
    }

    // 检查棋子颜色
    isPieceColor(piece, color) {
        return piece && piece[0] === color;
    }

    // 检查是否为敌方棋子
    isEnemyPiece(piece, player) {
        return piece && piece[0] !== player;
    }

    // 检查是否为己方棋子
    isOwnPiece(piece, player) {
        return piece && piece[0] === player;
    }

    // 生成所有合法移动
    generateValidMoves(fromRow, fromCol) {
        const piece = this.getPiece(fromRow, fromCol);
        if (!piece) return [];

        const pieceType = piece[1];
        const player = piece[0];
        const moves = [];

        switch (pieceType) {
            case 'P': // 兵
                moves.push(...this.getPawnMoves(fromRow, fromCol, player));
                break;
            case 'R': // 车
                moves.push(...this.getRookMoves(fromRow, fromCol, player));
                break;
            case 'N': // 马
                moves.push(...this.getKnightMoves(fromRow, fromCol, player));
                break;
            case 'B': // 象
                moves.push(...this.getBishopMoves(fromRow, fromCol, player));
                break;
            case 'Q': // 后
                moves.push(...this.getQueenMoves(fromRow, fromCol, player));
                break;
            case 'K': // 王
                moves.push(...this.getKingMoves(fromRow, fromCol, player));
                break;
        }

        // 过滤掉会导致被将军的移动
        return moves.filter(move => {
            return this.isMoveSafe(fromRow, fromCol, move.toRow, move.toCol);
        });
    }

    // 获取兵的移动
    getPawnMoves(row, col, player) {
        const moves = [];
        const direction = player === 'w' ? -1 : 1; // 白方向上(-1)，黑方向下(+1)
        const startRow = player === 'w' ? 6 : 1;

        // 向前移动一格
        if (this.isValidPosition(row + direction, col) && !this.getPiece(row + direction, col)) {
            moves.push({ toRow: row + direction, toCol: col, type: 'move' });

            // 在初始位置可以向前移动两格
            if (row === startRow && !this.getPiece(row + 2 * direction, col)) {
                moves.push({ toRow: row + 2 * direction, toCol: col, type: 'move' });
            }
        }

        // 吃子（对角线）
        for (const offset of [-1, 1]) {
            const newRow = row + direction;
            const newCol = col + offset;
            if (this.isValidPosition(newRow, newCol)) {
                const targetPiece = this.getPiece(newRow, newCol);
                if (targetPiece && this.isEnemyPiece(targetPiece, player)) {
                    moves.push({ toRow: newRow, toCol: newCol, type: 'capture' });
                }
            }
        }

        // 吃过路兵（En Passant）- 在Ziffi规则中可能不常用，但仍实现
        // TODO: 实现过路兵逻辑

        return moves;
    }

    // 获取车的移动
    getRookMoves(row, col, player) {
        const moves = [];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // 上、下、左、右

        for (const [dRow, dCol] of directions) {
            let r = row + dRow;
            let c = col + dCol;

            while (this.isValidPosition(r, c)) {
                const piece = this.getPiece(r, c);
                
                if (!piece) {
                    // 空格，可以移动
                    moves.push({ toRow: r, toCol: c, type: 'move' });
                } else if (this.isEnemyPiece(piece, player)) {
                    // 敌方棋子，可以吃掉
                    moves.push({ toRow: r, toCol: c, type: 'capture' });
                    break;
                } else {
                    // 己方棋子，不能通过
                    break;
                }

                r += dRow;
                c += dCol;
            }
        }

        return moves;
    }

    // 获取马的移动
    getKnightMoves(row, col, player) {
        const moves = [];
        // 马走日字形的所有方向
        const knightMoves = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];

        for (const [dRow, dCol] of knightMoves) {
            const newRow = row + dRow;
            const newCol = col + dCol;

            if (this.isValidPosition(newRow, newCol)) {
                const piece = this.getPiece(newRow, newCol);
                
                if (!piece || this.isEnemyPiece(piece, player)) {
                    const moveType = piece ? 'capture' : 'move';
                    moves.push({ toRow: newRow, toCol: newCol, type: moveType });
                }
            }
        }

        return moves;
    }

    // 获取象的移动
    getBishopMoves(row, col, player) {
        const moves = [];
        const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]]; // 四个对角线方向

        for (const [dRow, dCol] of directions) {
            let r = row + dRow;
            let c = col + dCol;

            while (this.isValidPosition(r, c)) {
                const piece = this.getPiece(r, c);
                
                if (!piece) {
                    // 空格，可以移动
                    moves.push({ toRow: r, toCol: c, type: 'move' });
                } else if (this.isEnemyPiece(piece, player)) {
                    // 敌方棋子，可以吃掉
                    moves.push({ toRow: r, toCol: c, type: 'capture' });
                    break;
                } else {
                    // 己方棋子，不能通过
                    break;
                }

                r += dRow;
                c += dCol;
            }
        }

        return moves;
    }

    // 获取后的移动
    getQueenMoves(row, col, player) {
        // 后 = 车 + 象
        return [
            ...this.getRookMoves(row, col, player),
            ...this.getBishopMoves(row, col, player)
        ];
    }

    // 获取王的移动
    getKingMoves(row, col, player) {
        const moves = [];
        // 王可以移动到周围8个位置
        const kingMoves = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];

        for (const [dRow, dCol] of kingMoves) {
            const newRow = row + dRow;
            const newCol = col + dCol;

            if (this.isValidPosition(newRow, newCol)) {
                const piece = this.getPiece(newRow, newCol);
                
                if (!piece || this.isEnemyPiece(piece, player)) {
                    const moveType = piece ? 'capture' : 'move';
                    moves.push({ toRow: newRow, toCol: newCol, type: moveType });
                }
            }
        }

        // TODO: 实现王车易位（Castling）

        return moves;
    }

    // 检查移动是否安全（不会导致被将军）
    isMoveSafe(fromRow, fromCol, toRow, toCol) {
        // 暂时执行移动
        const originalPiece = this.board[fromRow][fromCol];
        const targetPiece = this.board[toRow][toCol];
        
        this.board[toRow][toCol] = originalPiece;
        this.board[fromRow][fromCol] = null;

        // 检查移动后是否被将军
        const inCheck = this.isInCheck(this.currentPlayer);

        // 撤销移动
        this.board[fromRow][fromCol] = originalPiece;
        this.board[toRow][toCol] = targetPiece;

        return !inCheck;
    }

    // 检查指定颜色是否被将军
    isInCheck(player) {
        // 找到王的位置
        let kingRow, kingCol;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece === player + 'K') {
                    kingRow = row;
                    kingCol = col;
                    break;
                }
            }
        }

        if (kingRow === undefined || kingCol === undefined) {
            return false; // 如果没有找到王，返回false（这应该是错误状态）
        }

        // 检查是否有敌方棋子可以攻击到王
        const opponent = player === 'w' ? 'b' : 'w';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece[0] === opponent) {
                    const pieceType = piece[1];
                    let isAttacking = false;

                    // 检查敌方棋子是否能攻击到王
                    switch (pieceType) {
                        case 'P':
                            isAttacking = this.isPawnAttacking(row, col, kingRow, kingCol, opponent);
                            break;
                        case 'R':
                            isAttacking = this.isRookAttacking(row, col, kingRow, kingCol, opponent);
                            break;
                        case 'N':
                            isAttacking = this.isKnightAttacking(row, col, kingRow, kingCol);
                            break;
                        case 'B':
                            isAttacking = this.isBishopAttacking(row, col, kingRow, kingCol, opponent);
                            break;
                        case 'Q':
                            isAttacking = this.isQueenAttacking(row, col, kingRow, kingCol, opponent);
                            break;
                        case 'K':
                            isAttacking = this.isKingAttacking(row, col, kingRow, kingCol);
                            break;
                    }

                    if (isAttacking) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    // 检查兵是否在攻击位置
    isPawnAttacking(fromRow, fromCol, toRow, toCol, pawnColor) {
        const direction = pawnColor === 'w' ? -1 : 1;
        return toRow === fromRow + direction && Math.abs(toCol - fromCol) === 1;
    }

    // 检查车是否在攻击位置
    isRookAttacking(fromRow, fromCol, toRow, toCol, color) {
        if (fromRow !== toRow && fromCol !== toCol) return false;
        
        // 检查路径上是否有阻挡
        if (fromRow === toRow) {
            const startCol = Math.min(fromCol, toCol) + 1;
            const endCol = Math.max(fromCol, toCol);
            for (let col = startCol; col < endCol; col++) {
                if (this.board[fromRow][col]) return false;
            }
        } else {
            const startRow = Math.min(fromRow, toRow) + 1;
            const endRow = Math.max(fromRow, toRow);
            for (let row = startRow; row < endRow; row++) {
                if (this.board[row][fromCol]) return false;
            }
        }
        
        return true;
    }

    // 检查马是否在攻击位置
    isKnightAttacking(fromRow, fromCol, toRow, toCol) {
        const rowDiff = Math.abs(fromRow - toRow);
        const colDiff = Math.abs(fromCol - toCol);
        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
    }

    // 检查象是否在攻击位置
    isBishopAttacking(fromRow, fromCol, toRow, toCol, color) {
        const rowDiff = Math.abs(fromRow - toRow);
        const colDiff = Math.abs(fromCol - toCol);
        if (rowDiff !== colDiff) return false;

        // 检查对角路径上是否有阻挡
        const rowDir = fromRow < toRow ? 1 : -1;
        const colDir = fromCol < toCol ? 1 : -1;
        
        let r = fromRow + rowDir;
        let c = fromCol + colDir;
        
        while (r !== toRow && c !== toCol) {
            if (this.board[r][c]) return false;
            r += rowDir;
            c += colDir;
        }
        
        return true;
    }

    // 检查后是否在攻击位置
    isQueenAttacking(fromRow, fromCol, toRow, toCol, color) {
        // 后 = 车 + 象
        return this.isRookAttacking(fromRow, fromCol, toRow, toCol, color) || 
               this.isBishopAttacking(fromRow, fromCol, toRow, toCol, color);
    }

    // 检查王是否在攻击位置
    isKingAttacking(fromRow, fromCol, toRow, toCol) {
        const rowDiff = Math.abs(fromRow - toRow);
        const colDiff = Math.abs(fromCol - toCol);
        return rowDiff <= 1 && colDiff <= 1 && (rowDiff + colDiff > 0);
    }

    // 执行移动
    makeMove(fromRow, fromCol, toRow, toCol, promotionPiece = null) {
        const piece = this.getPiece(fromRow, fromCol);
        if (!piece) return false;

        // 验证移动是否合法
        const validMoves = this.generateValidMoves(fromRow, fromCol);
        const isValidMove = validMoves.some(move => 
            move.toRow === toRow && move.toCol === toCol
        );

        if (!isValidMove) {
            return false;
        }

        // 记录移动前的状态以支持撤销
        const moveRecord = {
            fromRow,
            fromCol,
            toRow,
            toCol,
            movedPiece: piece,
            capturedPiece: this.board[toRow][toCol],
            currentPlayer: this.currentPlayer,
            moveCount: { ...this.moveCount }
        };

        // 执行移动
        const capturedPiece = this.board[toRow][toCol];
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;

        // 处理吃子
        if (capturedPiece) {
            this.capturedPieces[this.currentPlayer].push(capturedPiece);
        }

        // 处理兵升变
        if (piece[1] === 'P') {
            const promotionRow = piece[0] === 'w' ? 0 : 7; // 白兵到第0行，黑兵到第7行
            if (toRow === promotionRow) {
                this.board[toRow][toCol] = promotionPiece || (piece[0] + 'Q'); // 默认升后
            }
        }

        // 记录移动历史
        this.moveHistory.push(moveRecord);

        // 更新步数
        this.moveCount[this.currentPlayer]++;

        // 检查是否达到Ziffi规则的6步限制
        if (this.isMoveLimitReached()) {
            this.gameOver = true;
            // 根据棋子价值判断胜负
            this.winner = this.calculateWinner();
        }

        // 切换玩家
        this.currentPlayer = this.currentPlayer === 'w' ? 'b' : 'w';

        return true;
    }

    // 撤销上一步移动
    undoMove() {
        if (this.moveHistory.length === 0) {
            return false;
        }

        const lastMove = this.moveHistory.pop();
        
        // 恢复棋盘状态
        this.board[lastMove.fromRow][lastMove.fromCol] = lastMove.movedPiece;
        this.board[lastMove.toRow][lastMove.toCol] = lastMove.capturedPiece;

        // 恢复游戏状态
        this.currentPlayer = lastMove.currentPlayer;
        this.moveCount = { ...lastMove.moveCount };

        // 恢复被捕获的棋子（如果有的话）
        if (lastMove.capturedPiece) {
            // 从捕获列表中移除最后一个捕获的棋子
            this.capturedPieces[this.currentPlayer].pop();
        }

        // 游戏状态恢复
        this.gameOver = false;
        this.winner = null;

        return true;
    }

    // 重做上一步撤销的移动
    redoMove() {
        // 由于我们没有专门的redo栈，这里简化处理
        // 实际项目中应该实现完整的撤销/重做系统
        // 目前暂时返回false，后续可完善
        return false;
    }

    // 计算Ziffi Chess规则下的获胜者
    calculateWinner() {
        // 在Ziffi Chess中，6步结束后计算棋子价值来决定胜负
        let whiteValue = 0;
        let blackValue = 0;

        // 棋子价值定义
        const pieceValues = {
            'P': 1, // 兵
            'N': 3, // 马
            'B': 3, // 象
            'R': 5, // 车
            'Q': 9, // 后
            'K': 0  // 王（不算价值）
        };

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece) {
                    const value = pieceValues[piece[1]] || 0;
                    if (piece[0] === 'w') {
                        whiteValue += value;
                    } else {
                        blackValue += value;
                    }
                }
            }
        }

        // 加上捕获的棋子价值
        for (const captured of this.capturedPieces.w) {
            whiteValue += pieceValues[captured[1]] || 0;
        }
        for (const captured of this.capturedPieces.b) {
            blackValue += pieceValues[captured[1]] || 0;
        }

        if (whiteValue > blackValue) {
            return 'w';
        } else if (blackValue > whiteValue) {
            return 'b';
        } else {
            return null; // 平局
        }
    }

    // 获取游戏状态
    getGameState() {
        return {
            board: this.getBoard(this.isFlipped),
            currentPlayer: this.currentPlayer,
            moveCount: this.getMoveCount(),
            gameOver: this.gameOver,
            winner: this.winner,
            moveHistory: [...this.moveHistory],
            isFlipped: this.isFlipped
        };
    }

    // 翻转棋盘
    toggleFlip() {
        this.isFlipped = !this.isFlipped;
        return this.isFlipped;
    }

    // 交换玩家角色
    swapSides() {
        // 交换棋盘上的所有棋子颜色
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece) {
                    const color = piece[0];
                    const type = piece[1];
                    this.board[row][col] = (color === 'w' ? 'b' : 'w') + type;
                }
            }
        }
        
        // 交换当前玩家
        this.currentPlayer = this.currentPlayer === 'w' ? 'b' : 'w';
        
        // 交换双方的移动计数
        const tempCount = this.moveCount.w;
        this.moveCount.w = this.moveCount.b;
        this.moveCount.b = tempCount;
        
        // 交换捕获的棋子
        const tempCaptured = [...this.capturedPieces.w];
        this.capturedPieces.w = [...this.capturedPieces.b];
        this.capturedPieces.b = tempCaptured;
        
        // 交换移动历史中的玩家信息（简化处理）
        for (const move of this.moveHistory) {
            move.currentPlayer = move.currentPlayer === 'w' ? 'b' : 'w';
        }
    }

    // 获取棋子符号
    getPieceSymbol(piece) {
        return this.pieceSymbols[piece] || '';
    }

    // AI移动 - 根据难度实现不同的策略
    getAIMove(player, difficulty) {
        // 首先获取所有可能的移动
        const allPossibleMoves = this.getAllPossibleMoves(player);
        
        // 如果没有可能的移动，返回null
        if (allPossibleMoves.length === 0) {
            return null;
        }
        
        // 根据难度选择策略
        let selectedMove;
        
        switch(difficulty) {
            case 0: // 600 ELO - 非常简单
                selectedMove = this.getVeryEasyMove(player, allPossibleMoves);
                break;
            case 1: // 1000 ELO - 简单
                selectedMove = this.getEasyMove(player, allPossibleMoves);
                break;
            case 2: // 1400 ELO - 中等
                selectedMove = this.getMediumMove(player, allPossibleMoves);
                break;
            case 3: // 1800 ELO - 困难
                selectedMove = this.minimaxRoot(player, 2, allPossibleMoves);
                break;
            case 4: // 2200 ELO - 专家
                selectedMove = this.minimaxRoot(player, 3, allPossibleMoves);
                break;
            case 5: // 2800 ELO - 大师
                selectedMove = this.minimaxRoot(player, 4, allPossibleMoves);
                break;
            default:
                selectedMove = this.minimaxRoot(player, 3, allPossibleMoves);
        }
        
        // 如果AI策略返回无效移动，返回第一个可能的移动
        return selectedMove || allPossibleMoves[0];
    }

    // 更新各个难度级别的函数以接受可能移动列表
    getVeryEasyMove(player, allPossibleMoves) {
        // 600 ELO - 经常犯错，有时会放弃好位置的棋子
        // 10%概率故意走坏棋
        if (Math.random() < 0.1) {
            // 随机选择一个可能不是最好的移动
            return allPossibleMoves[Math.floor(Math.random() * allPossibleMoves.length)];
        }
        
        // 90%概率还是会选择相对好的移动
        return this.evaluateAndSelectMove(allPossibleMoves, player, 0.2);
    }

    getEasyMove(player, allPossibleMoves) {
        // 1000 ELO - 会吃子，但不会考虑太多步数
        // 优先选择能吃子的移动
        const captureMoves = allPossibleMoves.filter(move => move.type === 'capture');
        if (captureMoves.length > 0 && Math.random() < 0.7) {
            // 70%概率选择吃子移动
            return captureMoves[Math.floor(Math.random() * captureMoves.length)];
        }
        
        // 否则选择一般移动
        return allPossibleMoves[Math.floor(Math.random() * allPossibleMoves.length)];
    }

    getMediumMove(player, allPossibleMoves) {
        // 1400 ELO - 会考虑防守和进攻
        // 评估所有移动的价值
        let bestMove = allPossibleMoves[0];
        let bestScore = -Infinity;
        
        for (const move of allPossibleMoves) {
            const score = this.evaluateMove(move, player, 2); // 深度2
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        return bestMove;
    }

    // 修正minimaxRoot函数以接受可能移动列表
    minimaxRoot(player, depth, allPossibleMoves = null) {
        // 如果没有传入可能的移动，计算它们
        const moves = allPossibleMoves || this.getAllPossibleMoves(player);
        
        if (moves.length === 0) {
            return null;
        }

        if (depth <= 0) {
            // 如果深度为0，返回评估最佳的移动
            let bestMove = moves[0];
            let bestScore = -Infinity;
            
            for (const move of moves) {
                const score = this.evaluateMove(move, player, 0);
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
            }
            
            return bestMove;
        }

        let bestMove = moves[0];
        let bestScore = -Infinity;

        for (const move of moves) {
            // 模拟移动
            const originalPiece = this.board[move.fromRow][move.fromCol];
            const targetPiece = this.board[move.toRow][move.toCol];
            
            this.board[move.toRow][move.toCol] = originalPiece;
            this.board[move.fromRow][move.fromCol] = null;

            // 为对手更新玩家
            const opponent = player === 'w' ? 'b' : 'w';
            
            // 递归调用minimax
            const result = this.minimax(
                opponent,
                depth - 1,
                false, // 下一层是最小化层
                -Infinity,
                Infinity
            );

            // 恢复移动
            this.board[move.fromRow][move.fromCol] = originalPiece;
            this.board[move.toRow][move.toCol] = targetPiece;

            if (result.score > bestScore) {
                bestScore = result.score;
                bestMove = move;
            }
        }

        return bestMove;
    }
    
    // 修正minimax函数
    minimax(player, depth, isMaximizing = true, alpha = -Infinity, beta = Infinity) {
        if (depth === 0) {
            // 返回当前位置评估
            return {
                score: this.evaluatePosition(player),
                fromRow: null,
                fromCol: null,
                toRow: null,
                toCol: null
            };
        }

        const moves = this.getAllPossibleMoves(player);
        if (moves.length === 0) {
            // 没有合法移动，返回当前位置评估
            return {
                score: this.evaluatePosition(player),
                fromRow: null,
                fromCol: null,
                toRow: null,
                toCol: null
            };
        }

        let bestMove = moves[0];
        let bestScore = isMaximizing ? -Infinity : Infinity;

        for (const move of moves) {
            // 模拟移动
            const originalPiece = this.board[move.fromRow][move.fromCol];
            const targetPiece = this.board[move.toRow][move.toCol];
            
            this.board[move.toRow][move.toCol] = originalPiece;
            this.board[move.fromRow][move.fromCol] = null;

            // 递归调用minimax
            const opponent = player === 'w' ? 'b' : 'w';
            const result = this.minimax(
                opponent,
                depth - 1,
                !isMaximizing,
                alpha,
                beta
            );

            // 恢复移动
            this.board[move.fromRow][move.fromCol] = originalPiece;
            this.board[move.toRow][move.toCol] = targetPiece;

            if (isMaximizing) {
                if (result.score > bestScore) {
                    bestScore = result.score;
                    bestMove = move;
                }
                alpha = Math.max(alpha, bestScore);
            } else {
                if (result.score < bestScore) {
                    bestScore = result.score;
                    bestMove = move;
                }
                beta = Math.min(beta, bestScore);
            }

            // Alpha-beta剪枝
            if (beta <= alpha) {
                break;
            }
        }

        return { score: bestScore, ...bestMove };
    }
}

// 导出ChessEngine类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChessEngine;
}