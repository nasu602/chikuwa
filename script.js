// 画面切り替え用の関数
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// 確認画面を表示
function showConfirmation() {
    document.getElementById('confirm-screen').classList.add('active');
}

// 確認画面を非表示
function hideConfirmation() {
    document.getElementById('confirm-screen').classList.remove('active');
}

// キャンセルメッセージを表示
function showCancelMessage() {
    document.getElementById('cancel-screen').classList.add('active');
}

// キャンセルメッセージを非表示
function hideCancelMessage() {
    document.getElementById('cancel-screen').classList.remove('active');
}

// 回転操作を開始
function startSpinning() {
    hideConfirmation();
    showScreen('spin-screen');
    initRotationControl();
}

// 回転コントロールの初期化
function initRotationControl() {
    const touchArea = document.getElementById('touch-area');
    const arrowIndicator = document.getElementById('arrow-indicator');
    const progressCircle = document.getElementById('progress-circle');
    const drumGroup = document.getElementById('drum-group-spin');
    const handleGroup = document.getElementById('handle-spin');
    
    let isDragging = false;
    let startAngle = 0;
    let currentAngle = 0;
    let totalRotation = 0;
    let lastAngle = 0;
    const targetRotation = 360; // 1回転 = 360度
    const circumference = 2 * Math.PI * 70; // 円周
    
    progressCircle.style.strokeDasharray = circumference;
    progressCircle.style.strokeDashoffset = circumference;
    
    // 中心座標を取得
    function getCenter() {
        const rect = touchArea.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    }
    
    // 角度を計算
    function getAngle(x, y) {
        const center = getCenter();
        const dx = x - center.x;
        const dy = y - center.y;
        let angle = Math.atan2(dy, dx) * (180 / Math.PI);
        return angle;
    }
    
    // ドラッグ開始
    function startDrag(e) {
        isDragging = true;
        const pos = getPosition(e);
        startAngle = getAngle(pos.x, pos.y);
        lastAngle = startAngle;
        touchArea.style.cursor = 'grabbing';
    }
    
    // ドラッグ中
    function drag(e) {
        if (!isDragging) return;
        
        const pos = getPosition(e);
        const newAngle = getAngle(pos.x, pos.y);
        
        // 角度の差分を計算（-180〜180の範囲で正規化）
        let delta = newAngle - lastAngle;
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;
        
        // 時計回りの場合のみ加算
        if (delta > 0) {
            totalRotation += delta;
        }
        
        lastAngle = newAngle;
        currentAngle = newAngle;
        
        // 矢印を回転
        arrowIndicator.style.transform = `rotate(${currentAngle + 90}deg)`;
        
        // 進捗を更新
        const progress = Math.min(totalRotation / targetRotation, 1);
        const offset = circumference * (1 - progress);
        progressCircle.style.strokeDashoffset = offset;
        
        // ガラポンのドラムも連動して回転
        if (drumGroup) {
            drumGroup.style.transform = `rotate(${totalRotation}deg)`;
            drumGroup.style.transformOrigin = '200px 170px';
        }
        if (handleGroup) {
            // ハンドルの回転
            const handleCircle = handleGroup.querySelector('circle');
            if (handleCircle) {
                handleCircle.style.transform = `rotate(${totalRotation * 2}deg)`;
                handleCircle.style.transformOrigin = 'center';
            }
        }
        
        // 1回転完了したら玉を出す
        if (totalRotation >= targetRotation) {
            isDragging = false;
            completeSpin();
        }
    }
    
    // ドラッグ終了
    function endDrag() {
        isDragging = false;
        touchArea.style.cursor = 'grab';
    }
    
    // タッチ/マウス位置を取得
    function getPosition(e) {
        if (e.touches) {
            return {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
        }
        return {
            x: e.clientX,
            y: e.clientY
        };
    }
    
    // イベントリスナーを設定
    touchArea.addEventListener('mousedown', startDrag);
    touchArea.addEventListener('mousemove', drag);
    touchArea.addEventListener('mouseup', endDrag);
    touchArea.addEventListener('mouseleave', endDrag);
    
    touchArea.addEventListener('touchstart', startDrag, { passive: true });
    touchArea.addEventListener('touchmove', drag, { passive: true });
    touchArea.addEventListener('touchend', endDrag);
}

// 回転完了時の処理
function completeSpin() {
    // 玉が出る画面に切り替え
    showScreen('ball-screen');
    
    // 要素を取得
    const ballComing = document.getElementById('ball-coming');
    const ballArrived = document.getElementById('ball-arrived');
    const wonderingText = document.getElementById('wondering-text');
    
    // リセット
    ballComing.classList.remove('animate');
    ballArrived.classList.remove('show');
    wonderingText.classList.remove('show');
    ballComing.style.animation = 'none';
    ballArrived.style.animation = 'none';
    wonderingText.style.animation = 'none';
    ballComing.offsetHeight; // リフロー
    
    // ステップ1: 玉がガラポンから出る（2秒）
    ballComing.classList.add('animate');
    
    // ステップ2: 2秒後に大きな玉が転がってくる（3秒）
    setTimeout(() => {
        ballArrived.classList.add('show');
        
        // ステップ3: 玉が到着後（3秒後）に「何等かな…」を表示
        setTimeout(() => {
            wonderingText.classList.add('show');
            
            // ステップ4: 2秒後に結果画面表示
            setTimeout(() => {
                showResult();
            }, 2000);
        }, 3000);
    }, 2000);
}

// 結果を表示
function showResult() {
    showScreen('result-screen');
    
    // 効果音を模擬（振動がある場合）
    if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 200]);
    }
}

// ゲームをリセット
function resetGame() {
    // 回転の状態をリセット
    const drumGroup = document.getElementById('drum-group-spin');
    const progressCircle = document.getElementById('progress-circle');
    const arrowIndicator = document.getElementById('arrow-indicator');
    const ballComing = document.getElementById('ball-coming');
    const ballArrived = document.getElementById('ball-arrived');
    const wonderingText = document.getElementById('wondering-text');
    
    if (drumGroup) {
        drumGroup.style.transform = 'rotate(0deg)';
    }
    if (progressCircle) {
        const circumference = 2 * Math.PI * 70;
        progressCircle.style.strokeDashoffset = circumference;
    }
    if (arrowIndicator) {
        arrowIndicator.style.transform = 'rotate(0deg)';
    }
    if (ballComing) {
        ballComing.classList.remove('animate');
        ballComing.style.animation = 'none';
    }
    if (ballArrived) {
        ballArrived.classList.remove('show');
        ballArrived.style.animation = 'none';
    }
    if (wonderingText) {
        wonderingText.classList.remove('show');
        wonderingText.style.animation = 'none';
    }
    
    showScreen('main-screen');
}

// ページ読み込み完了時
document.addEventListener('DOMContentLoaded', () => {
    // メイン画面を表示
    showScreen('main-screen');
    
    // ガラポンのホバーエフェクト
    const garapon = document.querySelector('.garapon');
    if (garapon) {
        garapon.addEventListener('mouseenter', () => {
            garapon.style.filter = 'drop-shadow(0 15px 40px rgba(255, 215, 0, 0.5))';
        });
        garapon.addEventListener('mouseleave', () => {
            garapon.style.filter = 'drop-shadow(0 10px 30px rgba(0, 0, 0, 0.4))';
        });
    }
});

