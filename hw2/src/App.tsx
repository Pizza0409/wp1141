import React, { useState, useEffect, useCallback } from 'react';
import { useChessGame } from './hooks/useChessGame';
import { useAI } from './utils/ai';
import ChessBoard from './components/ChessBoard';
import GameControls from './components/GameControls';
import { Move, Color } from './types/chess';
import './App.css';

const App: React.FC = () => {
  const { gameState, moveWarning, selectSquare, resetGame, getHint } = useChessGame();
  const { makeAIMove } = useAI();
  const [isAIMode, setIsAIMode] = useState(true);
  const [isAITurn, setIsAITurn] = useState(false);

  // AI 移動處理
  useEffect(() => {
    if (isAIMode && isAITurn && gameState.gameStatus === 'playing') {
      const handleAIMove = async () => {
        try {
          const aiMove = await makeAIMove(gameState.board, gameState.currentPlayer);
          if (aiMove) {
            // 直接執行 AI 移動
            selectSquare(aiMove.from);
            setTimeout(() => {
              selectSquare(aiMove.to);
            }, 200);
          }
        } catch (error) {
          console.error('AI 移動錯誤:', error);
        } finally {
          setIsAITurn(false);
        }
      };
      
      handleAIMove();
    }
  }, [isAIMode, isAITurn, gameState.currentPlayer, gameState.gameStatus, makeAIMove, selectSquare]);

  const handleSquareClick = useCallback((position: { row: number; col: number }) => {
    if (isAIMode && gameState.currentPlayer === 'black') {
      return; // AI 模式下黑方不能手動操作
    }
    selectSquare(position);
  }, [isAIMode, gameState.currentPlayer, selectSquare]);

  const handleReset = useCallback(() => {
    resetGame();
    setIsAITurn(false);
  }, [resetGame]);

  const handleNewGame = useCallback(() => {
    resetGame();
    setIsAITurn(false);
  }, [resetGame]);

  const handleHint = useCallback(() => {
    if (isAIMode && gameState.currentPlayer === 'black') {
      return; // AI 模式下不給黑方提示
    }
    getHint();
  }, [isAIMode, gameState.currentPlayer, getHint]);

  const handleToggleAI = useCallback(() => {
    setIsAIMode(!isAIMode);
    setIsAITurn(false);
  }, [isAIMode]);

  // 當輪到黑方且是 AI 模式時，設置 AI 回合
  useEffect(() => {
    if (isAIMode && gameState.currentPlayer === 'black' && gameState.gameStatus === 'playing') {
      setIsAITurn(true);
    }
  }, [isAIMode, gameState.currentPlayer, gameState.gameStatus]);

  return (
    <div className="app">
      <div className="game-container">
        <div className="game-header">
          <h1>國際象棋遊戲</h1>
          <p>使用 React TypeScript 開發的象棋遊戲</p>
        </div>
        
        <div className="game-content">
          <div className="board-container">
            <ChessBoard
              board={gameState.board}
              selectedSquare={gameState.selectedSquare}
              possibleMoves={gameState.possibleMoves}
              onSquareClick={handleSquareClick}
            />
          </div>
          
          <div className="controls-container">
            <GameControls
              currentPlayer={gameState.currentPlayer}
              gameStatus={gameState.gameStatus}
              capturedPieces={gameState.capturedPieces}
              onReset={handleReset}
              onHint={handleHint}
              onNewGame={handleNewGame}
              isAIMode={isAIMode}
              onToggleAI={handleToggleAI}
              moveWarning={moveWarning}
            />
          </div>
        </div>
        
        {isAITurn && (
          <div className="ai-thinking">
            <div className="thinking-indicator">
              <span>AI 正在思考...</span>
              <div className="spinner"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
