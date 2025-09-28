# 改善白方被吃掉旗子的顯示
_Exported on 9/28/2025 at 14:12:18 GMT+8 from Cursor (1.6.45)_

---

**User**

剛剛試玩發現了一個問題，白方被吃掉的旗子因為是白色的在旁邊顯示上背景也是白色的看不出來，所以希望右邊顯示白方被吃掉的旗子顏色可以加上黑邊，反正要讓他看的出來

---

**Cursor**

檢視棋盤與被吃棋子顯示的實作，準備為白方被吃棋子加上黑邊以提升可見度。


檢視 `GameControls.tsx` 中被吃棋子的顯示邏輯。


白方被吃棋子在白色背景上不易辨識。為 `.captured-piece.white` 加上黑邊以提升可見度。


```css
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap');

.app {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: #F7F9FC;
  font-family: 'Montserrat', sans-serif;
  position: relative;
}

.app::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 183, 197, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 40% 80%, rgba(120, 119, 198, 0.02) 0%, transparent 50%);
  pointer-events: none;
  z-index: -1;
}

.game-container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  max-width: 1200px;
  width: 100%;
  position: relative;
}

.game-header {
  text-align: center;
  margin-bottom: 30px;
}

.game-header h1 {
  color: #2C3E50;
  font-size: 2.8rem;
  font-weight: 700;
  margin-bottom: 15px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  letter-spacing: -0.5px;
}

.game-header p {
  color: #7f8c8d;
  font-size: 1.1rem;
  font-weight: 300;
}

.game-content {
  display: flex;
  gap: 30px;
  align-items: flex-start;
  justify-content: center;
  flex-wrap: wrap;
}

.board-container {
  flex-shrink: 0;
}

.controls-container {
  flex: 1;
  min-width: 300px;
}

.chess-board {
  position: relative;
  display: inline-block;
  background: linear-gradient(145deg, #ffffff, #f8f9fa);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.board-coordinates {
  position: relative;
}

.board-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(8, 1fr);
  gap: 2px;
  width: 480px;
  height: 480px;
  background: #8B7355;
  border: 4px solid #6B5B47;
  border-radius: 12px;
  padding: 4px;
  box-shadow: 
    0 8px 16px rgba(0, 0, 0, 0.1),
    inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.file-labels {
  position: absolute;
  bottom: -25px;
  left: 20px;
  right: 20px;
  display: flex;
  justify-content: space-between;
}

.rank-labels {
  position: absolute;
  left: -25px;
  top: 20px;
  bottom: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.file-label,
.rank-label {
  color: #6c757d;
  font-weight: 500;
  font-size: 14px;
  text-align: center;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chess-square {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 4px;
  position: relative;
}

.chess-square.light {
  background: linear-gradient(145deg, #D2B48C, #DEB887);
  position: relative;
}

.chess-square.light::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.2) 0%, transparent 50%),
    linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.08) 50%, transparent 70%);
  border-radius: 4px;
  pointer-events: none;
}

.chess-square.dark {
  background: linear-gradient(145deg, #8B7355, #A0826D);
  position: relative;
}

.chess-square.dark::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
    linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.04) 50%, transparent 70%);
  border-radius: 4px;
  pointer-events: none;
}

.chess-square:hover {
  background: #F0E68C !important;
  transform: scale(1.02);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.chess-square.selected {
  background: #007BFF !important;
  box-shadow: 
    0 0 0 4px rgba(0, 123, 255, 0.4),
    inset 0 2px 4px rgba(0, 0, 0, 0.2);
  transform: scale(1.05);
}

.chess-square.possible-move {
  background: #1ABC9C !important;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.chess-square.possible-move:hover {
  background: #16A085 !important;
  transform: scale(1.05);
}

.chess-piece {
  font-size: 2.8rem;
  user-select: none;
  transition: all 0.3s ease;
  text-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.3),
    0 0 0 2px rgba(0, 0, 0, 0.1);
  font-weight: bold;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.chess-piece:hover {
  transform: scale(1);
}

/* 白色棋子樣式 - 帶外框線和立體感 */
.chess-piece.white {
  color: #ffffff;
  text-shadow: 
    0 0 0 2px rgba(85, 85, 85, 0.8),
    0 2px 4px rgba(0, 0, 0, 0.6),
    0 1px 2px rgba(0, 0, 0, 0.4);
  background: linear-gradient(145deg, 
    rgba(255, 255, 255, 0.1) 0%, 
    rgba(240, 240, 240, 0.05) 50%, 
    rgba(220, 220, 220, 0.1) 100%);
  position: relative;
}

/* 黑色棋子樣式 - 帶外框線和立體感 */
.chess-piece.black {
  color: #2c3e50;
  text-shadow: 
    0 0 0 2px rgba(221, 221, 221, 0.9),
    0 2px 4px rgba(0, 0, 0, 0.4),
    0 1px 2px rgba(0, 0, 0, 0.3);
  background: linear-gradient(145deg, 
    rgba(60, 60, 60, 0.1) 0%, 
    rgba(40, 40, 40, 0.05) 50%, 
    rgba(20, 20, 20, 0.1) 100%);
  position: relative;
}

/* 棋子類型特殊樣式 - 保持立體感 */
.chess-piece.king {
  font-size: 3rem;
  text-shadow: 
    0 0 0 2px rgba(85, 85, 85, 0.8),
    0 3px 6px rgba(0, 0, 0, 0.5),
    0 1px 3px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.chess-piece.king.black {
  text-shadow: 
    0 0 0 2px rgba(221, 221, 221, 0.9),
    0 3px 6px rgba(0, 0, 0, 0.5),
    0 1px 3px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.chess-piece.queen {
  font-size: 2.9rem;
  text-shadow: 
    0 0 0 2px rgba(85, 85, 85, 0.8),
    0 3px 6px rgba(0, 0, 0, 0.4),
    0 1px 3px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.chess-piece.queen.black {
  text-shadow: 
    0 0 0 2px rgba(221, 221, 221, 0.9),
    0 3px 6px rgba(0, 0, 0, 0.4),
    0 1px 3px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.chess-piece.rook {
  font-size: 2.7rem;
}

.chess-piece.bishop {
  font-size: 2.6rem;
}

.chess-piece.knight {
  font-size: 2.5rem;
}

.chess-piece.pawn {
  font-size: 2.4rem;
}

/* Enhanced move indicator with better visual feedback */
.move-indicator {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(26, 188, 156, 0.8) 0%, rgba(26, 188, 156, 0.4) 100%);
  border: 2px solid #1ABC9C;
  box-shadow: 
    0 0 12px rgba(26, 188, 156, 0.6),
    inset 0 1px 2px rgba(255, 255, 255, 0.3);
  animation: pulse-glow 2s infinite;
}

@keyframes pulse-glow {
  0% { 
    box-shadow: 0 0 12px rgba(26, 188, 156, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.3);
    transform: scale(1);
  }
  50% { 
    box-shadow: 0 0 20px rgba(26, 188, 156, 0.8), inset 0 1px 2px rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }
  100% { 
    box-shadow: 0 0 12px rgba(26, 188, 156, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.3);
    transform: scale(1);
  }
}

.game-controls {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  padding: 32px;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(20px);
}

.game-status {
  margin-bottom: 25px;
  text-align: center;
}

.game-status h2 {
  color: #2C3E50;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 20px;
  letter-spacing: -0.3px;
}

.move-warning {
  background: #ffeb3b;
  color: #f57f17;
  padding: 8px 12px;
  border-radius: 8px;
  margin: 10px 0;
  font-weight: 500;
  border: 1px solid #ffc107;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

.current-player {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 1.2rem;
  color: #2C3E50;
  font-weight: 500;
  padding: 12px 20px;
  background: linear-gradient(145deg, #F8F9FA, #E9ECEF);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.player-indicator {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.player-indicator.white {
  background: linear-gradient(145deg, #FFFFFF, #F8F9FA);
  border: 2px solid #DEE2E6;
  color: #495057;
}

.player-indicator.black {
  background: linear-gradient(145deg, #2C3E50, #34495E);
  border: 2px solid #1A252F;
  color: #FFFFFF;
}

.captured-pieces {
  margin-bottom: 25px;
}

.captured-section {
  margin-bottom: 15px;
}

.captured-section h3 {
  color: #2C3E50;
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 12px;
  letter-spacing: -0.2px;
}

.captured-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 40px;
  padding: 12px;
  background: linear-gradient(145deg, #F8F9FA, #E9ECEF);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.captured-piece {
  font-size: 1.4rem;
  padding: 6px 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.8);
  transition: all 0.2s ease;
  text-shadow: 
    0 0 0 1px rgba(85, 85, 85, 0.6),
    0 1px 2px rgba(0, 0, 0, 0.3);
}

.captured-piece.white {
  color: #ffffff;
  text-shadow: 
    0 0 0 2px rgba(0, 0, 0, 0.9),
    0 0 0 3px rgba(0, 0, 0, 0.6),
    0 1px 2px rgba(0, 0, 0, 0.4);
  border: 2px solid rgba(0, 0, 0, 0.8);
  background: rgba(255, 255, 255, 0.9);
}

.captured-piece.black {
  color: #2c3e50;
  text-shadow: 
    0 0 0 1px rgba(221, 221, 221, 0.9),
    0 1px 2px rgba(0, 0, 0, 0.3);
}

.captured-piece:hover {
  transform: scale(1.1);
}

.control-buttons {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.control-btn {
  padding: 14px 24px;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: none;
  letter-spacing: 0.3px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
}

.control-btn.primary {
  background: linear-gradient(135deg, #8FA8A3, #7A9A94);
  color: white;
  box-shadow: 0 6px 20px rgba(143, 168, 163, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.control-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(143, 168, 163, 0.4);
  background: linear-gradient(135deg, #7A9A94, #6A8A84);
}

.control-btn.secondary {
  background: linear-gradient(135deg, #9BB5C8, #8BA5B8);
  color: white;
  box-shadow: 0 6px 20px rgba(155, 181, 200, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.control-btn.secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(155, 181, 200, 0.4);
  background: linear-gradient(135deg, #8BA5B8, #7B95A8);
}

.control-btn.tertiary {
  background: linear-gradient(135deg, #A8A8C8, #9898B8);
  color: white;
  box-shadow: 0 6px 20px rgba(168, 168, 200, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.control-btn.tertiary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(168, 168, 200, 0.4);
  background: linear-gradient(135deg, #9898B8, #8888A8);
}

.control-btn.active {
  background: linear-gradient(135deg, #B8A8C8, #A898B8);
  color: white;
  box-shadow: 0 6px 20px rgba(184, 168, 200, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.control-btn.active:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(184, 168, 200, 0.4);
  background: linear-gradient(135deg, #A898B8, #9888A8);
}

.control-btn.rules-btn {
  background: linear-gradient(135deg, #A8B8C8, #98A8B8);
  color: white;
  box-shadow: 0 6px 20px rgba(168, 184, 200, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.control-btn.rules-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(168, 184, 200, 0.4);
  background: linear-gradient(135deg, #98A8B8, #8898A8);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
}

.ai-thinking {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.98);
  padding: 24px 36px;
  border-radius: 20px;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(20px);
  z-index: 1000;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.thinking-indicator {
  display: flex;
  align-items: center;
  gap: 16px;
  color: #2C3E50;
  font-size: 1.2rem;
  font-weight: 600;
  letter-spacing: -0.2px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #E9ECEF;
  border-top: 3px solid #007BFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 響應式設計 */
@media (max-width: 768px) {
  .game-content {
    flex-direction: column;
    align-items: center;
  }
  
  .board-grid {
    width: 320px;
    height: 320px;
  }
  
  .chess-piece {
    font-size: 2rem;
  }
  
  .game-header h1 {
    font-size: 2rem;
  }
  
  .controls-container {
    min-width: auto;
    width: 100%;
  }
}

@media (max-width: 480px) {
  .board-grid {
    width: 280px;
    height: 280px;
  }
  
  .chess-piece {
    font-size: 1.8rem;
  }
  
  .game-container {
    padding: 20px;
  }
}

```

已為白方被吃棋子加上黑邊，提升在白色背景上的可見度。

修改內容：
1. **雙層黑色文字陰影**：`0 0 0 2px rgba(0, 0, 0, 0.9)` 與 `0 0 0 3px rgba(0, 0, 0, 0.6)`
2. **黑色邊框**：`border: 2px solid rgba(0, 0, 0, 0.8)`
3. **背景調整**：`background: rgba(255, 255, 255, 0.9)`

白方被吃棋子在右側顯示區域會更清楚。

---

**User**

是旗子的形狀加上黑邊不是他的眶

---

**Cursor**

改為在棋子形狀本身加上黑邊，而非外框。更新 CSS 的 `text-shadow` 以強化白棋邊緣。


```css
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap');

.app {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: #F7F9FC;
  font-family: 'Montserrat', sans-serif;
  position: relative;
}

.app::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 183, 197, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 40% 80%, rgba(120, 119, 198, 0.02) 0%, transparent 50%);
  pointer-events: none;
  z-index: -1;
}

.game-container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  max-width: 1200px;
  width: 100%;
  position: relative;
}

.game-header {
  text-align: center;
  margin-bottom: 30px;
}

.game-header h1 {
  color: #2C3E50;
  font-size: 2.8rem;
  font-weight: 700;
  margin-bottom: 15px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  letter-spacing: -0.5px;
}

.game-header p {
  color: #7f8c8d;
  font-size: 1.1rem;
  font-weight: 300;
}

.game-content {
  display: flex;
  gap: 30px;
  align-items: flex-start;
  justify-content: center;
  flex-wrap: wrap;
}

.board-container {
  flex-shrink: 0;
}

.controls-container {
  flex: 1;
  min-width: 300px;
}

.chess-board {
  position: relative;
  display: inline-block;
  background: linear-gradient(145deg, #ffffff, #f8f9fa);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.board-coordinates {
  position: relative;
}

.board-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(8, 1fr);
  gap: 2px;
  width: 480px;
  height: 480px;
  background: #8B7355;
  border: 4px solid #6B5B47;
  border-radius: 12px;
  padding: 4px;
  box-shadow: 
    0 8px 16px rgba(0, 0, 0, 0.1),
    inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.file-labels {
  position: absolute;
  bottom: -25px;
  left: 20px;
  right: 20px;
  display: flex;
  justify-content: space-between;
}

.rank-labels {
  position: absolute;
  left: -25px;
  top: 20px;
  bottom: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.file-label,
.rank-label {
  color: #6c757d;
  font-weight: 500;
  font-size: 14px;
  text-align: center;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chess-square {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 4px;
  position: relative;
}

.chess-square.light {
  background: linear-gradient(145deg, #D2B48C, #DEB887);
  position: relative;
}

.chess-square.light::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.2) 0%, transparent 50%),
    linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.08) 50%, transparent 70%);
  border-radius: 4px;
  pointer-events: none;
}

.chess-square.dark {
  background: linear-gradient(145deg, #8B7355, #A0826D);
  position: relative;
}

.chess-square.dark::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
    linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.04) 50%, transparent 70%);
  border-radius: 4px;
  pointer-events: none;
}

.chess-square:hover {
  background: #F0E68C !important;
  transform: scale(1.02);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.chess-square.selected {
  background: #007BFF !important;
  box-shadow: 
    0 0 0 4px rgba(0, 123, 255, 0.4),
    inset 0 2px 4px rgba(0, 0, 0, 0.2);
  transform: scale(1.05);
}

.chess-square.possible-move {
  background: #1ABC9C !important;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.chess-square.possible-move:hover {
  background: #16A085 !important;
  transform: scale(1.05);
}

.chess-piece {
  font-size: 2.8rem;
  user-select: none;
  transition: all 0.3s ease;
  text-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.3),
    0 0 0 2px rgba(0, 0, 0, 0.1);
  font-weight: bold;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.chess-piece:hover {
  transform: scale(1);
}

/* 白色棋子樣式 - 帶外框線和立體感 */
.chess-piece.white {
  color: #ffffff;
  text-shadow: 
    0 0 0 2px rgba(85, 85, 85, 0.8),
    0 2px 4px rgba(0, 0, 0, 0.6),
    0 1px 2px rgba(0, 0, 0, 0.4);
  background: linear-gradient(145deg, 
    rgba(255, 255, 255, 0.1) 0%, 
    rgba(240, 240, 240, 0.05) 50%, 
    rgba(220, 220, 220, 0.1) 100%);
  position: relative;
}

/* 黑色棋子樣式 - 帶外框線和立體感 */
.chess-piece.black {
  color: #2c3e50;
  text-shadow: 
    0 0 0 2px rgba(221, 221, 221, 0.9),
    0 2px 4px rgba(0, 0, 0, 0.4),
    0 1px 2px rgba(0, 0, 0, 0.3);
  background: linear-gradient(145deg, 
    rgba(60, 60, 60, 0.1) 0%, 
    rgba(40, 40, 40, 0.05) 50%, 
    rgba(20, 20, 20, 0.1) 100%);
  position: relative;
}

/* 棋子類型特殊樣式 - 保持立體感 */
.chess-piece.king {
  font-size: 3rem;
  text-shadow: 
    0 0 0 2px rgba(85, 85, 85, 0.8),
    0 3px 6px rgba(0, 0, 0, 0.5),
    0 1px 3px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.chess-piece.king.black {
  text-shadow: 
    0 0 0 2px rgba(221, 221, 221, 0.9),
    0 3px 6px rgba(0, 0, 0, 0.5),
    0 1px 3px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.chess-piece.queen {
  font-size: 2.9rem;
  text-shadow: 
    0 0 0 2px rgba(85, 85, 85, 0.8),
    0 3px 6px rgba(0, 0, 0, 0.4),
    0 1px 3px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.chess-piece.queen.black {
  text-shadow: 
    0 0 0 2px rgba(221, 221, 221, 0.9),
    0 3px 6px rgba(0, 0, 0, 0.4),
    0 1px 3px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.chess-piece.rook {
  font-size: 2.7rem;
}

.chess-piece.bishop {
  font-size: 2.6rem;
}

.chess-piece.knight {
  font-size: 2.5rem;
}

.chess-piece.pawn {
  font-size: 2.4rem;
}

/* Enhanced move indicator with better visual feedback */
.move-indicator {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(26, 188, 156, 0.8) 0%, rgba(26, 188, 156, 0.4) 100%);
  border: 2px solid #1ABC9C;
  box-shadow: 
    0 0 12px rgba(26, 188, 156, 0.6),
    inset 0 1px 2px rgba(255, 255, 255, 0.3);
  animation: pulse-glow 2s infinite;
}

@keyframes pulse-glow {
  0% { 
    box-shadow: 0 0 12px rgba(26, 188, 156, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.3);
    transform: scale(1);
  }
  50% { 
    box-shadow: 0 0 20px rgba(26, 188, 156, 0.8), inset 0 1px 2px rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }
  100% { 
    box-shadow: 0 0 12px rgba(26, 188, 156, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.3);
    transform: scale(1);
  }
}

.game-controls {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  padding: 32px;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(20px);
}

.game-status {
  margin-bottom: 25px;
  text-align: center;
}

.game-status h2 {
  color: #2C3E50;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 20px;
  letter-spacing: -0.3px;
}

.move-warning {
  background: #ffeb3b;
  color: #f57f17;
  padding: 8px 12px;
  border-radius: 8px;
  margin: 10px 0;
  font-weight: 500;
  border: 1px solid #ffc107;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

.current-player {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 1.2rem;
  color: #2C3E50;
  font-weight: 500;
  padding: 12px 20px;
  background: linear-gradient(145deg, #F8F9FA, #E9ECEF);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.player-indicator {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.player-indicator.white {
  background: linear-gradient(145deg, #FFFFFF, #F8F9FA);
  border: 2px solid #DEE2E6;
  color: #495057;
}

.player-indicator.black {
  background: linear-gradient(145deg, #2C3E50, #34495E);
  border: 2px solid #1A252F;
  color: #FFFFFF;
}

.captured-pieces {
  margin-bottom: 25px;
}

.captured-section {
  margin-bottom: 15px;
}

.captured-section h3 {
  color: #2C3E50;
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 12px;
  letter-spacing: -0.2px;
}

.captured-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 40px;
  padding: 12px;
  background: linear-gradient(145deg, #F8F9FA, #E9ECEF);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.captured-piece {
  font-size: 1.4rem;
  padding: 6px 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.8);
  transition: all 0.2s ease;
  text-shadow: 
    0 0 0 1px rgba(85, 85, 85, 0.6),
    0 1px 2px rgba(0, 0, 0, 0.3);
}

.captured-piece.white {
  color: #ffffff;
  text-shadow: 
    0 0 0 1px rgba(0, 0, 0, 1),
    0 0 0 2px rgba(0, 0, 0, 0.8),
    0 0 0 3px rgba(0, 0, 0, 0.6),
    0 1px 2px rgba(0, 0, 0, 0.4);
}

.captured-piece.black {
  color: #2c3e50;
  text-shadow: 
    0 0 0 1px rgba(221, 221, 221, 0.9),
    0 1px 2px rgba(0, 0, 0, 0.3);
}

.captured-piece:hover {
  transform: scale(1.1);
}

.control-buttons {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.control-btn {
  padding: 14px 24px;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: none;
  letter-spacing: 0.3px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
}

.control-btn.primary {
  background: linear-gradient(135deg, #8FA8A3, #7A9A94);
  color: white;
  box-shadow: 0 6px 20px rgba(143, 168, 163, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.control-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(143, 168, 163, 0.4);
  background: linear-gradient(135deg, #7A9A94, #6A8A84);
}

.control-btn.secondary {
  background: linear-gradient(135deg, #9BB5C8, #8BA5B8);
  color: white;
  box-shadow: 0 6px 20px rgba(155, 181, 200, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.control-btn.secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(155, 181, 200, 0.4);
  background: linear-gradient(135deg, #8BA5B8, #7B95A8);
}

.control-btn.tertiary {
  background: linear-gradient(135deg, #A8A8C8, #9898B8);
  color: white;
  box-shadow: 0 6px 20px rgba(168, 168, 200, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.control-btn.tertiary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(168, 168, 200, 0.4);
  background: linear-gradient(135deg, #9898B8, #8888A8);
}

.control-btn.active {
  background: linear-gradient(135deg, #B8A8C8, #A898B8);
  color: white;
  box-shadow: 0 6px 20px rgba(184, 168, 200, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.control-btn.active:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(184, 168, 200, 0.4);
  background: linear-gradient(135deg, #A898B8, #9888A8);
}

.control-btn.rules-btn {
  background: linear-gradient(135deg, #A8B8C8, #98A8B8);
  color: white;
  box-shadow: 0 6px 20px rgba(168, 184, 200, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.control-btn.rules-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(168, 184, 200, 0.4);
  background: linear-gradient(135deg, #98A8B8, #8898A8);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
}

.ai-thinking {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.98);
  padding: 24px 36px;
  border-radius: 20px;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(20px);
  z-index: 1000;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.thinking-indicator {
  display: flex;
  align-items: center;
  gap: 16px;
  color: #2C3E50;
  font-size: 1.2rem;
  font-weight: 600;
  letter-spacing: -0.2px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #E9ECEF;
  border-top: 3px solid #007BFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 響應式設計 */
@media (max-width: 768px) {
  .game-content {
    flex-direction: column;
    align-items: center;
  }
  
  .board-grid {
    width: 320px;
    height: 320px;
  }
  
  .chess-piece {
    font-size: 2rem;
  }
  
  .game-header h1 {
    font-size: 2rem;
  }
  
  .controls-container {
    min-width: auto;
    width: 100%;
  }
}

@media (max-width: 480px) {
  .board-grid {
    width: 280px;
    height: 280px;
  }
  
  .chess-piece {
    font-size: 1.8rem;
  }
  
  .game-container {
    padding: 20px;
  }
}

```

已改為在棋子形狀本身加上黑邊，而非外框。

修改內容：
- 移除 `border` 和 `background`
- 使用多層 `text-shadow` 為白棋加上黑邊：
  - `0 0 0 1px rgba(0, 0, 0, 1)` - 最內層黑邊
  - `0 0 0 2px rgba(0, 0, 0, 0.8)` - 中層黑邊
  - `0 0 0 3px rgba(0, 0, 0, 0.6)` - 外層黑邊
  - `0 1px 2px rgba(0, 0, 0, 0.4)` - 陰影

白方被吃棋子在白色背景上會更清楚。

---

**User**

將右邊顯示被吃掉的旗子直接改成黑色好了

---

**Cursor**

將右側被吃棋子統一改為黑色顯示。


```css
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap');

.app {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: #F7F9FC;
  font-family: 'Montserrat', sans-serif;
  position: relative;
}

.app::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 183, 197, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 40% 80%, rgba(120, 119, 198, 0.02) 0%, transparent 50%);
  pointer-events: none;
  z-index: -1;
}

.game-container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  max-width: 1200px;
  width: 100%;
  position: relative;
}

.game-header {
  text-align: center;
  margin-bottom: 30px;
}

.game-header h1 {
  color: #2C3E50;
  font-size: 2.8rem;
  font-weight: 700;
  margin-bottom: 15px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  letter-spacing: -0.5px;
}

.game-header p {
  color: #7f8c8d;
  font-size: 1.1rem;
  font-weight: 300;
}

.game-content {
  display: flex;
  gap: 30px;
  align-items: flex-start;
  justify-content: center;
  flex-wrap: wrap;
}

.board-container {
  flex-shrink: 0;
}

.controls-container {
  flex: 1;
  min-width: 300px;
}

.chess-board {
  position: relative;
  display: inline-block;
  background: linear-gradient(145deg, #ffffff, #f8f9fa);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.board-coordinates {
  position: relative;
}

.board-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(8, 1fr);
  gap: 2px;
  width: 480px;
  height: 480px;
  background: #8B7355;
  border: 4px solid #6B5B47;
  border-radius: 12px;
  padding: 4px;
  box-shadow: 
    0 8px 16px rgba(0, 0, 0, 0.1),
    inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.file-labels {
  position: absolute;
  bottom: -25px;
  left: 20px;
  right: 20px;
  display: flex;
  justify-content: space-between;
}

.rank-labels {
  position: absolute;
  left: -25px;
  top: 20px;
  bottom: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.file-label,
.rank-label {
  color: #6c757d;
  font-weight: 500;
  font-size: 14px;
  text-align: center;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chess-square {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 4px;
  position: relative;
}

.chess-square.light {
  background: linear-gradient(145deg, #D2B48C, #DEB887);
  position: relative;
}

.chess-square.light::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.2) 0%, transparent 50%),
    linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.08) 50%, transparent 70%);
  border-radius: 4px;
  pointer-events: none;
}

.chess-square.dark {
  background: linear-gradient(145deg, #8B7355, #A0826D);
  position: relative;
}

.chess-square.dark::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
    linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.04) 50%, transparent 70%);
  border-radius: 4px;
  pointer-events: none;
}

.chess-square:hover {
  background: #F0E68C !important;
  transform: scale(1.02);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.chess-square.selected {
  background: #007BFF !important;
  box-shadow: 
    0 0 0 4px rgba(0, 123, 255, 0.4),
    inset 0 2px 4px rgba(0, 0, 0, 0.2);
  transform: scale(1.05);
}

.chess-square.possible-move {
  background: #1ABC9C !important;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.chess-square.possible-move:hover {
  background: #16A085 !important;
  transform: scale(1.05);
}

.chess-piece {
  font-size: 2.8rem;
  user-select: none;
  transition: all 0.3s ease;
  text-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.3),
    0 0 0 2px rgba(0, 0, 0, 0.1);
  font-weight: bold;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.chess-piece:hover {
  transform: scale(1);
}

/* 白色棋子樣式 - 帶外框線和立體感 */
.chess-piece.white {
  color: #ffffff;
  text-shadow: 
    0 0 0 2px rgba(85, 85, 85, 0.8),
    0 2px 4px rgba(0, 0, 0, 0.6),
    0 1px 2px rgba(0, 0, 0, 0.4);
  background: linear-gradient(145deg, 
    rgba(255, 255, 255, 0.1) 0%, 
    rgba(240, 240, 240, 0.05) 50%, 
    rgba(220, 220, 220, 0.1) 100%);
  position: relative;
}

/* 黑色棋子樣式 - 帶外框線和立體感 */
.chess-piece.black {
  color: #2c3e50;
  text-shadow: 
    0 0 0 2px rgba(221, 221, 221, 0.9),
    0 2px 4px rgba(0, 0, 0, 0.4),
    0 1px 2px rgba(0, 0, 0, 0.3);
  background: linear-gradient(145deg, 
    rgba(60, 60, 60, 0.1) 0%, 
    rgba(40, 40, 40, 0.05) 50%, 
    rgba(20, 20, 20, 0.1) 100%);
  position: relative;
}

/* 棋子類型特殊樣式 - 保持立體感 */
.chess-piece.king {
  font-size: 3rem;
  text-shadow: 
    0 0 0 2px rgba(85, 85, 85, 0.8),
    0 3px 6px rgba(0, 0, 0, 0.5),
    0 1px 3px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.chess-piece.king.black {
  text-shadow: 
    0 0 0 2px rgba(221, 221, 221, 0.9),
    0 3px 6px rgba(0, 0, 0, 0.5),
    0 1px 3px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.chess-piece.queen {
  font-size: 2.9rem;
  text-shadow: 
    0 0 0 2px rgba(85, 85, 85, 0.8),
    0 3px 6px rgba(0, 0, 0, 0.4),
    0 1px 3px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.chess-piece.queen.black {
  text-shadow: 
    0 0 0 2px rgba(221, 221, 221, 0.9),
    0 3px 6px rgba(0, 0, 0, 0.4),
    0 1px 3px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.chess-piece.rook {
  font-size: 2.7rem;
}

.chess-piece.bishop {
  font-size: 2.6rem;
}

.chess-piece.knight {
  font-size: 2.5rem;
}

.chess-piece.pawn {
  font-size: 2.4rem;
}

/* Enhanced move indicator with better visual feedback */
.move-indicator {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(26, 188, 156, 0.8) 0%, rgba(26, 188, 156, 0.4) 100%);
  border: 2px solid #1ABC9C;
  box-shadow: 
    0 0 12px rgba(26, 188, 156, 0.6),
    inset 0 1px 2px rgba(255, 255, 255, 0.3);
  animation: pulse-glow 2s infinite;
}

@keyframes pulse-glow {
  0% { 
    box-shadow: 0 0 12px rgba(26, 188, 156, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.3);
    transform: scale(1);
  }
  50% { 
    box-shadow: 0 0 20px rgba(26, 188, 156, 0.8), inset 0 1px 2px rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }
  100% { 
    box-shadow: 0 0 12px rgba(26, 188, 156, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.3);
    transform: scale(1);
  }
}

.game-controls {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  padding: 32px;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(20px);
}

.game-status {
  margin-bottom: 25px;
  text-align: center;
}

.game-status h2 {
  color: #2C3E50;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 20px;
  letter-spacing: -0.3px;
}

.move-warning {
  background: #ffeb3b;
  color: #f57f17;
  padding: 8px 12px;
  border-radius: 8px;
  margin: 10px 0;
  font-weight: 500;
  border: 1px solid #ffc107;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

.current-player {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 1.2rem;
  color: #2C3E50;
  font-weight: 500;
  padding: 12px 20px;
  background: linear-gradient(145deg, #F8F9FA, #E9ECEF);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.player-indicator {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.player-indicator.white {
  background: linear-gradient(145deg, #FFFFFF, #F8F9FA);
  border: 2px solid #DEE2E6;
  color: #495057;
}

.player-indicator.black {
  background: linear-gradient(145deg, #2C3E50, #34495E);
  border: 2px solid #1A252F;
  color: #FFFFFF;
}

.captured-pieces {
  margin-bottom: 25px;
}

.captured-section {
  margin-bottom: 15px;
}

.captured-section h3 {
  color: #2C3E50;
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 12px;
  letter-spacing: -0.2px;
}

.captured-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 40px;
  padding: 12px;
  background: linear-gradient(145deg, #F8F9FA, #E9ECEF);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.captured-piece {
  font-size: 1.4rem;
  padding: 6px 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.8);
  transition: all 0.2s ease;
  text-shadow: 
    0 0 0 1px rgba(85, 85, 85, 0.6),
    0 1px 2px rgba(0, 0, 0, 0.3);
}

.captured-piece.white {
  color: #2c3e50;
  text-shadow: 
    0 0 0 1px rgba(221, 221, 221, 0.9),
    0 1px 2px rgba(0, 0, 0, 0.3);
}

.captured-piece.black {
  color: #2c3e50;
  text-shadow: 
    0 0 0 1px rgba(221, 221, 221, 0.9),
    0 1px 2px rgba(0, 0, 0, 0.3);
}

.captured-piece:hover {
  transform: scale(1.1);
}

.control-buttons {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.control-btn {
  padding: 14px 24px;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: none;
  letter-spacing: 0.3px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
}

.control-btn.primary {
  background: linear-gradient(135deg, #8FA8A3, #7A9A94);
  color: white;
  box-shadow: 0 6px 20px rgba(143, 168, 163, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.control-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(143, 168, 163, 0.4);
  background: linear-gradient(135deg, #7A9A94, #6A8A84);
}

.control-btn.secondary {
  background: linear-gradient(135deg, #9BB5C8, #8BA5B8);
  color: white;
  box-shadow: 0 6px 20px rgba(155, 181, 200, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.control-btn.secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(155, 181, 200, 0.4);
  background: linear-gradient(135deg, #8BA5B8, #7B95A8);
}

.control-btn.tertiary {
  background: linear-gradient(135deg, #A8A8C8, #9898B8);
  color: white;
  box-shadow: 0 6px 20px rgba(168, 168, 200, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.control-btn.tertiary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(168, 168, 200, 0.4);
  background: linear-gradient(135deg, #9898B8, #8888A8);
}

.control-btn.active {
  background: linear-gradient(135deg, #B8A8C8, #A898B8);
  color: white;
  box-shadow: 0 6px 20px rgba(184, 168, 200, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.control-btn.active:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(184, 168, 200, 0.4);
  background: linear-gradient(135deg, #A898B8, #9888A8);
}

.control-btn.rules-btn {
  background: linear-gradient(135deg, #A8B8C8, #98A8B8);
  color: white;
  box-shadow: 0 6px 20px rgba(168, 184, 200, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.control-btn.rules-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(168, 184, 200, 0.4);
  background: linear-gradient(135deg, #98A8B8, #8898A8);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
}

.ai-thinking {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.98);
  padding: 24px 36px;
  border-radius: 20px;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(20px);
  z-index: 1000;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.thinking-indicator {
  display: flex;
  align-items: center;
  gap: 16px;
  color: #2C3E50;
  font-size: 1.2rem;
  font-weight: 600;
  letter-spacing: -0.2px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #E9ECEF;
  border-top: 3px solid #007BFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 響應式設計 */
@media (max-width: 768px) {
  .game-content {
    flex-direction: column;
    align-items: center;
  }
  
  .board-grid {
    width: 320px;
    height: 320px;
  }
  
  .chess-piece {
    font-size: 2rem;
  }
  
  .game-header h1 {
    font-size: 2rem;
  }
  
  .controls-container {
    min-width: auto;
    width: 100%;
  }
}

@media (max-width: 480px) {
  .board-grid {
    width: 280px;
    height: 280px;
  }
  
  .chess-piece {
    font-size: 1.8rem;
  }
  
  .game-container {
    padding: 20px;
  }
}

```

已將右側被吃棋子統一改為黑色顯示。

修改內容：
- 將 `.captured-piece.white` 的顏色由 `#ffffff` 改為 `#2c3e50`
- 使用與黑棋相同的文字陰影樣式

白方與黑方被吃棋子皆以黑色顯示，在白色背景上更清楚。

---

**User**

然後黑棋的皇后被吃掉在右方黑方被吃旗子的地方會顯示兩個，這有顯示上的錯誤，我發現只要其子被吃掉就會被重複登記一次，像是不論哪方被吃掉一個兵，右邊那方被吃旗子就會顯示兩個兵

---

**Cursor**

檢查被吃棋子的記錄與顯示邏輯，找出重複計數的原因。


檢查 `makeMove` 函數的吃子邏輯，確認是否重複記錄被吃棋子。


檢查 `useChessGame.ts` 中被吃棋子的記錄邏輯：


檢查 `resetGame` 函數，確認是否正確重置被吃棋子列表：


檢查 `newGame` 函數：


重複顯示來自 `useChessGame.ts` 第 124–127 行：每次吃子都會把被吃棋子推入 `capturedPieces`，但未檢查是否已存在，導致重複。檢查 `capturedPieces` 的初始化與重置是否正確。


初始化與重置看起來正確。檢查 `capturedPieces` 的更新邏輯，確認是否在每次吃子時重複推入。


第 124 行使用 `{ ...prev.capturedPieces }` 只做淺拷貝，`white` 和 `black` 仍指向原陣列，導致 `push` 直接改動原陣列。改為深拷貝陣列，避免重複推入。


```typescript
import { useState, useCallback } from 'react';
import { GameState, Move, Position, Color, Piece } from '../types/chess';
import { 
  createInitialBoard, 
  makeMove, 
  isInCheck, 
  isCheckmate, 
  isStalemate,
  getPossibleMoves,
  getPieceAt
} from '../utils/chessLogic';
import { playSound, wouldCauseCheckmate } from '../utils/sound';

export const useChessGame = () => {
  const [gameState, setGameState] = useState<GameState>(() => ({
    board: createInitialBoard(),
    currentPlayer: 'white',
    selectedSquare: null,
    possibleMoves: [],
    gameStatus: 'playing',
    moveHistory: [],
    capturedPieces: { white: [], black: [] },
    pendingPromotion: null
  }));
  
  const [moveWarning, setMoveWarning] = useState<string>('');

  const updateGameStatus = useCallback((board: typeof gameState.board, currentPlayer: Color) => {
    // 檢查是否有國王被吃掉
    const whiteKingExists = board.some(row => row.some(piece => piece && piece.type === 'king' && piece.color === 'white'));
    const blackKingExists = board.some(row => row.some(piece => piece && piece.type === 'king' && piece.color === 'black'));
    
    if (!whiteKingExists) {
      return 'white-king-captured';
    }
    if (!blackKingExists) {
      return 'black-king-captured';
    }
    
    if (isCheckmate(board, currentPlayer)) {
      return 'checkmate';
    } else if (isStalemate(board, currentPlayer)) {
      return 'stalemate';
    } else if (isInCheck(board, currentPlayer)) {
      return 'check';
    }
    return 'playing';
  }, []);

  const selectSquare = useCallback((pos: Position) => {
    console.log('selectSquare called with:', pos); // 調試日誌
    setGameState(prev => {
      console.log('Current game state:', prev); // 調試日誌
      const piece = getPieceAt(prev.board, pos);
      
      // 如果點擊的是已選中的格子，取消選擇
      if (prev.selectedSquare && 
          prev.selectedSquare.row === pos.row && 
          prev.selectedSquare.col === pos.col) {
        console.log('Deselecting square'); // 調試日誌
        return {
          ...prev,
          selectedSquare: null,
          possibleMoves: []
        };
      }
      
      // 如果點擊的是可能的移動位置，執行移動
      if (prev.selectedSquare && 
          prev.possibleMoves.some(move => move.row === pos.row && move.col === pos.col)) {
        console.log('Making move from', prev.selectedSquare, 'to', pos); // 調試日誌
        
        // 直接在這裡處理移動，而不是調用 makeMoveFromSelected
        const from = prev.selectedSquare;
        const pieceToMove = getPieceAt(prev.board, from);
        if (!pieceToMove) {
          console.log('No piece to move'); // 調試日誌
          return prev;
        }
        
        const capturedPiece = getPieceAt(prev.board, pos);
        const newMove: Move = {
          from,
          to: pos,
          piece: pieceToMove,
          capturedPiece: capturedPiece || undefined
        };
        
        // 先檢查移動後是否會使自己被將軍
        const newBoard = makeMove(prev.board, newMove);
        const wouldCauseSelfCheck = isInCheck(newBoard, prev.currentPlayer);
        
        if (wouldCauseSelfCheck) {
          setMoveWarning('警告：此移動會使自己被將軍！');
          setTimeout(() => setMoveWarning(''), 3000);
          return prev; // 不允許此移動
        }
        
        // 檢查移動後是否會讓對方被將死
        const wouldCauseCheck = wouldCauseCheckmate(prev.board, newMove, prev.currentPlayer);
        if (wouldCauseCheck) {
          setMoveWarning('警告：此移動會讓對方將死！');
          setTimeout(() => setMoveWarning(''), 3000);
        } else {
          setMoveWarning('');
        }
        
        // 檢查是否需要升變
        const needsPromotion = pieceToMove.type === 'pawn' && 
          ((pieceToMove.color === 'white' && pos.row === 0) || 
           (pieceToMove.color === 'black' && pos.row === 7));
        
        if (needsPromotion) {
          // 需要升變，暫停遊戲等待玩家選擇
          return {
            ...prev,
            board: newBoard,
            selectedSquare: null,
            possibleMoves: [],
            pendingPromotion: pos
          };
        }
        
        const newCapturedPieces = { 
          white: [...prev.capturedPieces.white], 
          black: [...prev.capturedPieces.black] 
        };
        if (capturedPiece) {
          newCapturedPieces[capturedPiece.color].push(capturedPiece);
        }
        
        const nextPlayer = prev.currentPlayer === 'white' ? 'black' : 'white';
        const newGameStatus = updateGameStatus(newBoard, nextPlayer);
        
        // 播放音效
        if (capturedPiece) {
          playSound('capture');
        } else {
          playSound('move');
        }
        
        // 根據遊戲狀態播放不同音效
        if (newGameStatus === 'check') {
          playSound('check');
        } else if (newGameStatus === 'checkmate') {
          playSound('checkmate');
        }
        
        console.log('Move completed, next player:', nextPlayer); // 調試日誌
        
        return {
          ...prev,
          board: newBoard,
          currentPlayer: nextPlayer,
          selectedSquare: null,
          possibleMoves: [],
          gameStatus: newGameStatus,
          moveHistory: [...prev.moveHistory, newMove],
          capturedPieces: newCapturedPieces,
          pendingPromotion: null
        };
      }
      
      // 如果點擊的是己方棋子，選擇它
      if (piece && piece.color === prev.currentPlayer) {
        console.log('Selecting piece:', piece); // 調試日誌
        const possibleMoves = getPossibleMoves(prev.board, pos);
        console.log('Possible moves:', possibleMoves); // 調試日誌
        return {
          ...prev,
          selectedSquare: pos,
          possibleMoves
        };
      }
      
      // 否則取消選擇
      console.log('Clearing selection'); // 調試日誌
      return {
        ...prev,
        selectedSquare: null,
        possibleMoves: []
      };
    });
  }, [updateGameStatus]);

  const resetGame = useCallback(() => {
    setGameState({
      board: createInitialBoard(),
      currentPlayer: 'white',
      selectedSquare: null,
      possibleMoves: [],
      gameStatus: 'playing',
      moveHistory: [],
      capturedPieces: { white: [], black: [] },
      pendingPromotion: null
    });
  }, []);

  const handlePromotion = useCallback((promotionType: PieceType) => {
    setGameState(prev => {
      if (!prev.pendingPromotion) return prev;
      
      const newBoard = prev.board.map(row => [...row]);
      const pos = prev.pendingPromotion;
      const piece = newBoard[pos.row][pos.col];
      
      if (piece && piece.type === 'pawn') {
        newBoard[pos.row][pos.col] = {
          type: promotionType,
          color: piece.color,
          hasMoved: true
        };
      }
      
      const nextPlayer = prev.currentPlayer === 'white' ? 'black' : 'white';
      const newGameStatus = updateGameStatus(newBoard, nextPlayer);
      
      return {
        ...prev,
        board: newBoard,
        currentPlayer: nextPlayer,
        gameStatus: newGameStatus,
        pendingPromotion: null
      };
    });
  }, [updateGameStatus]);

  const getHint = useCallback(() => {
    setGameState(prev => {
      // 簡單的提示：隨機選擇一個己方棋子的合法移動
      const currentPlayerPieces: { pos: Position; piece: Piece }[] = [];
      
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = getPieceAt(prev.board, { row, col });
          if (piece && piece.color === prev.currentPlayer) {
            currentPlayerPieces.push({ pos: { row, col }, piece });
          }
        }
      }
      
      if (currentPlayerPieces.length === 0) return prev;
      
      // 隨機選擇一個棋子
      const randomPiece = currentPlayerPieces[Math.floor(Math.random() * currentPlayerPieces.length)];
      const possibleMoves = getPossibleMoves(prev.board, randomPiece.pos);
      
      if (possibleMoves.length === 0) return prev;
      
      // 隨機選擇一個移動
      const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      
      return {
        ...prev,
        selectedSquare: randomPiece.pos,
        possibleMoves: [randomMove]
      };
    });
  }, []);

  return {
    gameState,
    moveWarning,
    selectSquare,
    resetGame,
    getHint,
    handlePromotion
  };
};

```

已修復被吃棋子重複顯示問題。

**問題原因：**
在 `useChessGame.ts` 第 124 行使用了淺拷貝 `{ ...prev.capturedPieces }`，`white` 和 `black` 仍指向原陣列，`push` 會直接改動原陣列，導致重複。

**修復方案：**
改為深拷貝陣列：
```typescript
const newCapturedPieces = { 
  white: [...prev.capturedPieces.white], 
  black: [...prev.capturedPieces.black] 
};
```

每次吃子只會新增一次，不會重複。

```typescript
const newCapturedPieces = { 
  white: [...prev.capturedPieces.white], 
  black: [...prev.capturedPieces.black] 
};
```

