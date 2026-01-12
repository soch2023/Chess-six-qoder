/**
 * Ziffi Chess 主程序入口
 * 初始化游戏并处理全局事件
 */

// 全局游戏实例
let gameController;

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', function() {
    initializeGame();
});

function initializeGame() {
    try {
        // 创建游戏控制器实例
        gameController = new GameController();
        
        // 设置默认难度为3（高手级别）
        gameController.setDifficulty(3);
        
        // 初始化PWA功能
        initializePWA();
        
        // 初始化触摸事件处理
        initializeTouchEvents();
        
        // 添加测试功能
        initializeTestFunctions();
        
        console.log('Ziffi Chess 游戏初始化完成');
    } catch (error) {
        console.error('Ziffi Chess 初始化失败:', error);
        alert('游戏初始化失败，请刷新页面重试');
    }
}

function initializeTestFunctions() {
    // 添加测试按钮和功能
    const testSection = document.createElement('div');
    testSection.id = 'test-section';
    testSection.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0,0,0,0.7);
        padding: 10px;
        border-radius: 5px;
        z-index: 1000;
        font-size: 12px;
    `;
    
    testSection.innerHTML = `
        <div><button onclick="gameController.flipBoard()">翻转棋盘</button></div>
        <div><button onclick="gameController.swapSides()">交换角色</button></div>
        <div><button onclick="gameController.undoMove()">撤销</button></div>
        <div><button onclick="gameController.redoMove()">重做</button></div>
        <div><button onclick="gameController.newGame()">新游戏</button></div>
        <div><button onclick="gameController.saveCurrentGame()">保存游戏</button></div>
    `;
    
    // 只在开发模式下显示测试按钮
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        document.body.appendChild(testSection);
    }
}

function initializePWA() {
    // 注册Service Worker以实现离线功能
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                    console.log('SW registered: ', registration);
                })
                .catch((registrationError) => {
                    console.log('SW registration failed: ', registrationError);
                });
        });
    }
}

function initializeTouchEvents() {
    // 为移动设备添加触摸优化
    const board = document.getElementById('chess-board');
    
    if (board) {
        // 添加触摸事件监听器以改善移动设备体验
        board.addEventListener('touchstart', handleTouchStart, false);
        board.addEventListener('touchmove', handleTouchMove, false);
        board.addEventListener('touchend', handleTouchEnd, false);
        
        // 防止触摸时的默认行为（如缩放）
        board.addEventListener('touchstart', function(e) {
            if (e.touches.length > 1) {
                e.preventDefault(); // 防止多点触控缩放
            }
        }, { passive: false });
        
        // 解决点击和触摸事件冲突
        let isTouchDevice = false;
        
        document.addEventListener('touchstart', function() {
            isTouchDevice = true;
        }, { passive: true });
        
        document.addEventListener('mousemove', function() {
            if (!isTouchDevice) {
                // 在非触摸设备上启用鼠标事件
            }
        }, { passive: true });
    }
}

// 触摸事件处理变量
let touchStartX = 0;
let touchStartY = 0;

function handleTouchStart(event) {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
}

function handleTouchMove(event) {
    // 防止页面滚动
    if (event.target.closest('.chess-board')) {
        event.preventDefault();
    }
}

function handleTouchEnd(event) {
    // 可以添加滑动手势支持
    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;
    
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;
    
    // 可以根据滑动方向添加特殊功能
    // 例如：向左滑动撤销，向右滑动重做
    if (Math.abs(diffX) > Math.abs(diffY)) {
        // 主要是水平滑动
        if (Math.abs(diffX) > 50) { // 滑动距离足够大
            if (diffX > 0) {
                // 向左滑动 - 撤销
                console.log("向左滑动: 撤销移动");
                // gameController.undoMove(); // 可以启用此功能
            } else {
                // 向右滑动 - 重做
                console.log("向右滑动: 重做移动");
                // gameController.redoMove(); // 可以启用此功能
            }
        }
    }
}

// 处理离线/在线状态变化
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

function updateOnlineStatus() {
    const status = navigator.onLine ? '在线' : '离线';
    console.log(`网络状态: ${status}`);
    
    // 对于非在线对战模式，即使离线也可以正常游戏
    if (!navigator.onLine) {
        const onlineMode = ['online-two-player'].includes(gameController?.gameMode);
        if (onlineMode) {
            alert('检测到离线状态，只有非在线模式可以继续游戏');
        }
    }
}

// 处理页面可见性变化
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('页面已隐藏');
        // 可以在这里暂停游戏计时器等
    } else {
        console.log('页面变为可见');
        // 可以在这里恢复游戏
    }
});

// 处理键盘快捷键
document.addEventListener('keydown', (event) => {
    // 检查游戏控制器是否存在
    if (!gameController) return;
    
    // Ctrl+Z 或 Cmd+Z 撤销
    if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        event.preventDefault();
        gameController.undoMove();
    }
    
    // Ctrl+Shift+Z 或 Cmd+Shift+Z 重做
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'Z') {
        event.preventDefault();
        gameController.redoMove();
    }
    
    // R键新游戏
    if (event.key === 'r' || event.key === 'R') {
        event.preventDefault(); // 防止页面刷新
        if (confirm('确定要开始新游戏吗？')) {
            gameController.newGame();
        }
    }
    
    // F键翻转棋盘
    if (event.key === 'f' || event.key === 'F') {
        event.preventDefault();
        gameController.flipBoard();
    }
    
    // S键交换角色
    if (event.key === 's' || event.key === 'S') {
        event.preventDefault();
        gameController.swapSides();
    }
    
    // D键显示调试信息
    if (event.key === 'd' || event.key === 'D') {
        if (gameController && gameController.engine) {
            console.log('当前游戏状态:', gameController.engine.getGameState());
            console.log('当前玩家:', gameController.engine.getCurrentPlayer());
            console.log('移动计数:', gameController.engine.getMoveCount());
        }
    }
});

// 处理窗口大小变化（响应式设计）- 使用节流优化
window.addEventListener('resize', throttle(updateLayout, 250));

function updateLayout() {
    // 在窗口大小变化时调整布局
    // 可以根据需要重新渲染棋盘或其他元素
    if (gameController) {
        // 确保棋盘适应新尺寸
        setTimeout(() => {
            gameController.renderBoard();
        }, 100);
    }
}

// 节流函数，避免频繁触发
function throttle(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
        if (!timeout) {
            func(...args);
            timeout = setTimeout(later, wait);
        }
    };
}

// 防抖函数，避免频繁触发
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 页面卸载前的清理工作
window.addEventListener('beforeunload', (event) => {
    // 如果需要在页面关闭前保存游戏状态，可以在这里处理
    // 例如，将游戏状态保存到localStorage
    
    // 检查是否有未保存的游戏进度
    if (gameController && gameController.gameActive) {
        event.preventDefault();
        event.returnValue = '您确定要离开游戏吗？当前进度可能会丢失。';
    }
});

// 页面完全加载后的额外初始化
window.addEventListener('load', () => {
    // 确保页面完全加载后再执行一些初始化
    console.log('Ziffi Chess 页面完全加载');
    
    // 检测是否支持PWA安装
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        // 阻止自动提示
        e.preventDefault();
        // 存储事件以备后用
        deferredPrompt = e;
        
        // 显示安装按钮或类似UI
        showInstallButton(deferredPrompt);
    });
    
    function showInstallButton(promptEvent) {
        // 创建一个按钮让用户手动触发安装
        const installBtn = document.createElement('button');
        installBtn.textContent = '安装Ziffi Chess';
        installBtn.id = 'install-button';
        installBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 10px 15px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            z-index: 1000;
            display: none;
        `;
        
        installBtn.addEventListener('click', async () => {
            // 显示安装横幅
            promptEvent.prompt();
            // 等待用户响应
            const { outcome } = await promptEvent.userChoice;
            if (outcome === 'accepted') {
                console.log('用户接受了安装');
            } else {
                console.log('用户拒绝了安装');
            }
            // 隐藏按钮
            installBtn.style.display = 'none';
        });
        
        document.body.appendChild(installBtn);
    }
});

// 添加功能测试函数
function runFunctionalTests() {
    console.log('开始运行功能测试...');
    
    // 测试1: 检查游戏引擎是否存在
    if (window.ChessEngine) {
        console.log('✓ 游戏引擎存在');
    } else {
        console.error('✗ 游戏引擎不存在');
    }
    
    // 测试2: 检查游戏控制器是否存在
    if (window.GameController) {
        console.log('✓ 游戏控制器存在');
    } else {
        console.error('✗ 游戏控制器不存在');
    }
    
    // 测试3: 检查在线游戏管理器是否存在
    if (window.OnlineGameManager) {
        console.log('✓ 在线游戏管理器存在');
    } else {
        console.log('- 在线游戏管理器不存在（可选）');
    }
    
    // 测试4: 检查PWA功能
    if ('serviceWorker' in navigator) {
        console.log('✓ Service Worker 支持');
    } else {
        console.log('- Service Worker 不支持');
    }
    
    if ('Notification' in window) {
        console.log('✓ 通知API支持');
    }
    
    if ('PushManager' in window) {
        console.log('✓ Push API支持');
    }
    
    // 测试5: 检查本地存储
    if ('localStorage' in window) {
        console.log('✓ LocalStorage支持');
    } else {
        console.error('✗ LocalStorage不支持');
    }
    
    if ('indexedDB' in window) {
        console.log('✓ IndexedDB支持');
    }
    
    // 测试6: 检查触摸事件
    if ('ontouchstart' in window) {
        console.log('✓ 触摸事件支持');
    } else {
        console.log('- 触摸事件不支持（桌面设备）');
    }
    
    console.log('功能测试完成');
}

// 页面加载后运行测试
window.addEventListener('load', runFunctionalTests);

// 添加全局错误处理
window.addEventListener('error', function(e) {
    console.error('全局错误:', e.error);
    // 可以在这里添加错误报告逻辑
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('未处理的Promise拒绝:', e.reason);
    // 可以在这里添加错误报告逻辑
});

// 为黑方棋子添加CSS类
function applyBlackPieceStyle() {
    // 这个函数确保黑方棋子有适当的样式
    // 实际的样式已在CSS中定义为.black-piece类
}

// 页面加载完成后应用样式
document.addEventListener('DOMContentLoaded', applyBlackPieceStyle);
