import React from 'react';
import { Color, Piece } from '../types/chess';

interface GameControlsProps {
  currentPlayer: Color;
  gameStatus: 'playing' | 'check' | 'checkmate' | 'stalemate' | 'white-king-captured' | 'black-king-captured';
  capturedPieces: { white: Piece[]; black: Piece[] };
  onReset: () => void;
  onHint: () => void;
  onNewGame: () => void;
  isAIMode: boolean;
  onToggleAI: () => void;
  moveWarning?: string;
}

const GameControls: React.FC<GameControlsProps> = ({
  currentPlayer,
  gameStatus,
  capturedPieces,
  onReset,
  onHint,
  onNewGame,
  isAIMode,
  onToggleAI,
  moveWarning
}) => {
  const getStatusMessage = () => {
    switch (gameStatus) {
      case 'check':
        return `將軍！${currentPlayer === 'white' ? '白方' : '黑方'}被將軍`;
      case 'checkmate':
        return `將死！${currentPlayer === 'white' ? '黑方' : '白方'}獲勝`;
      case 'stalemate':
        return '和棋！';
      case 'white-king-captured':
        return '白方國王被吃掉！黑方獲勝！';
      case 'black-king-captured':
        return '黑方國王被吃掉！白方獲勝！';
      default:
        return `輪到 ${currentPlayer === 'white' ? '白方' : '黑方'} 下棋`;
    }
  };

  const getPieceSymbol = (piece: Piece): string => {
    const symbols: { [key: string]: { [key: string]: string } } = {
      white: {
        king: '♔',
        queen: '♕',
        rook: '♖',
        bishop: '♗',
        knight: '♘',
        pawn: '♙'
      },
      black: {
        king: '♚',
        queen: '♛',
        rook: '♜',
        bishop: '♝',
        knight: '♞',
        pawn: '♟'
      }
    };
    return symbols[piece.color][piece.type];
  };

  return (
    <div className="game-controls">
      <div className="game-status">
        <h2>{getStatusMessage()}</h2>
        {moveWarning && (
          <div className="move-warning">
            ⚠️ {moveWarning}
          </div>
        )}
        <div className="current-player">
          <div className={`player-indicator ${currentPlayer}`}>
            {currentPlayer === 'white' ? '⚪' : '⚫'}
          </div>
          <span>{currentPlayer === 'white' ? '白方' : '黑方'}</span>
        </div>
      </div>

      <div className="captured-pieces">
        <div className="captured-section">
          <h3>白方被吃棋子</h3>
          <div className="captured-list">
            {capturedPieces.white.map((piece, index) => (
              <span key={index} className="captured-piece white">
                {getPieceSymbol(piece)}
              </span>
            ))}
          </div>
        </div>
        <div className="captured-section">
          <h3>黑方被吃棋子</h3>
          <div className="captured-list">
            {capturedPieces.black.map((piece, index) => (
              <span key={index} className="captured-piece black">
                {getPieceSymbol(piece)}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="control-buttons">
        <button 
          className="control-btn primary" 
          onClick={onNewGame}
        >
          新遊戲
        </button>
        <button 
          className="control-btn secondary" 
          onClick={onReset}
        >
          重新開始
        </button>
        <button 
          className="control-btn tertiary" 
          onClick={onHint}
          disabled={gameStatus !== 'playing'}
        >
          提示
        </button>
        <button 
          className={`control-btn ${isAIMode ? 'active' : ''}`} 
          onClick={onToggleAI}
        >
          {isAIMode ? 'AI 模式' : '雙人模式'}
        </button>
      </div>
    </div>
  );
};

export default GameControls;
