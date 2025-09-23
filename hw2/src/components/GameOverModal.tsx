import React from 'react';
import { Color } from '../types/chess';
import './GameOverModal.css';

interface GameOverModalProps {
  isOpen: boolean;
  gameStatus: 'checkmate' | 'stalemate' | 'white-king-captured' | 'black-king-captured' | 'check' | 'playing';
  currentPlayer: Color;
  onNewGame: () => void;
  onClose: () => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({ 
  isOpen, 
  gameStatus, 
  currentPlayer, 
  onNewGame, 
  onClose 
}) => {
  if (!isOpen) return null;

  const getGameOverMessage = () => {
    switch (gameStatus) {
      case 'checkmate':
        const winner = currentPlayer === 'white' ? '黑方' : '白方';
        return {
          title: '🎉 將死！',
          message: `${winner} 獲勝！`,
          description: '對方的國王無法逃脫攻擊',
          isGameOver: true
        };
      case 'check':
        const checkedPlayer = currentPlayer === 'white' ? '白方' : '黑方';
        return {
          title: '⚠️ 將軍！',
          message: `${checkedPlayer} 被將軍`,
          description: '國王正在被攻擊，請立即解除威脅',
          isGameOver: false
        };
      case 'stalemate':
        return {
          title: '🤝 和棋！',
          message: '遊戲結束',
          description: '當前玩家無法移動且未被將軍',
          isGameOver: true
        };
      case 'white-king-captured':
        return {
          title: '🏆 遊戲結束！',
          message: '黑方獲勝！',
          description: '白方國王被吃掉',
          isGameOver: true
        };
      case 'black-king-captured':
        return {
          title: '🏆 遊戲結束！',
          message: '白方獲勝！',
          description: '黑方國王被吃掉',
          isGameOver: true
        };
      case 'playing':
        return {
          title: '🎮 遊戲進行中',
          message: '遊戲繼續',
          description: '遊戲正在進行中',
          isGameOver: false
        };
      default:
        return {
          title: '🎮 遊戲結束',
          message: '未知結果',
          description: '',
          isGameOver: true
        };
    }
  };

  const gameOverInfo = getGameOverMessage();

  return (
    <div className="game-over-overlay" onClick={onClose}>
      <div className="game-over-modal" onClick={(e) => e.stopPropagation()}>
        <div className="game-over-content">
          <div className="game-over-icon">
            {gameOverInfo.title}
          </div>
          <h2 className="game-over-title">{gameOverInfo.message}</h2>
          <p className="game-over-description">{gameOverInfo.description}</p>
          
          <div className="game-over-actions">
            {gameOverInfo.isGameOver && (
              <button 
                className="game-over-btn primary" 
                onClick={onNewGame}
              >
                🎮 新遊戲
              </button>
            )}
            <button 
              className="game-over-btn secondary" 
              onClick={onClose}
            >
              {gameOverInfo.isGameOver ? '✖️ 關閉' : '✓ 知道了'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameOverModal;
