import React, { useState, useEffect, useCallback } from 'react';
import { useChessGame } from './hooks/useChessGame';
import { useAI } from './utils/ai';
import ChessBoard from './components/ChessBoard';
import GameControls from './components/GameControls';
import GameRules from './components/GameRules';
import PromotionModal from './components/PromotionModal';
import GameOverModal from './components/GameOverModal';
import { Move, Color, PieceType } from './types/chess';
import './App.css';

const App: React.FC = () => {
  const { gameState, moveWarning, selectSquare, resetGame, getHint, handlePromotion } = useChessGame();
  const { makeAIMove } = useAI();
  const [isAIMode, setIsAIMode] = useState(true);
  const [isAITurn, setIsAITurn] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);

  // AI 移動處理
  useEffect(() => {
    if (isAIMode && isAITurn && gameState.currentPlayer === 'black' && (gameState.gameStatus === 'playing' || gameState.gameStatus === 'check')) {
      const handleAIMove = async () => {
        try {
          const aiMove = await makeAIMove(gameState.board, 'black');
          if (aiMove) {
            // 直接執行 AI 移動
            selectSquare(aiMove.from);
            setTimeout(() => {
              selectSquare(aiMove.to);
            }, 200);
          } else {
            // AI 沒有合法移動，可能是被將死或僵局
            console.log('AI 沒有合法移動，遊戲可能結束');
            setIsAITurn(false);
          }
        } catch (error) {
          console.error('AI 移動錯誤:', error);
          setIsAITurn(false);
        }
      };
      
      handleAIMove();
    }
  }, [isAIMode, isAITurn, gameState.currentPlayer, gameState.gameStatus, makeAIMove, selectSquare]);

  const handleSquareClick = useCallback((position: { row: number; col: number }) => {
    // 遊戲結束後不允許移動棋子
    if (gameState.gameStatus === 'checkmate' || 
        gameState.gameStatus === 'stalemate' || 
        gameState.gameStatus === 'white-king-captured' || 
        gameState.gameStatus === 'black-king-captured') {
      return;
    }
    
    if (isAIMode && gameState.currentPlayer === 'black') {
      return; // AI 模式下黑方（AI）不能手動操作
    }
    selectSquare(position);
  }, [isAIMode, gameState.currentPlayer, gameState.gameStatus, selectSquare]);

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

  const handleShowRules = useCallback(() => {
    setShowRules(true);
  }, []);

  const handleCloseRules = useCallback(() => {
    setShowRules(false);
  }, []);

  const handlePromotionSelect = useCallback((pieceType: PieceType) => {
    handlePromotion(pieceType);
  }, [handlePromotion]);

  const handleCloseGameOver = useCallback(() => {
    setShowGameOver(false);
  }, []);

  const handleNewGameFromModal = useCallback(() => {
    resetGame();
    setIsAITurn(false);
    setShowGameOver(false);
  }, [resetGame]);

  // 當輪到黑方且是 AI 模式時，設置 AI 回合
  useEffect(() => {
    if (isAIMode && gameState.currentPlayer === 'black' && (gameState.gameStatus === 'playing' || gameState.gameStatus === 'check')) {
      setIsAITurn(true);
    } else if (gameState.currentPlayer === 'white') {
      // 輪到白方時，重置 AI 回合
      setIsAITurn(false);
    }
  }, [isAIMode, gameState.currentPlayer, gameState.gameStatus]);

  // 監聽遊戲狀態變化，確保 AI 回合正確重置
  useEffect(() => {
    if (gameState.currentPlayer === 'white') {
      setIsAITurn(false);
    }
  }, [gameState.currentPlayer]);

  // 監聽遊戲結束狀態和將軍狀態
  useEffect(() => {
    if (gameState.gameStatus === 'checkmate' || 
        gameState.gameStatus === 'stalemate' || 
        gameState.gameStatus === 'white-king-captured' || 
        gameState.gameStatus === 'black-king-captured' ||
        gameState.gameStatus === 'check') {
      setShowGameOver(true);
    }
  }, [gameState.gameStatus]);

  return (
    <div className="app">
      <div className="game-container">
        <div className="game-header">
          <h1>國際象棋遊戲</h1>
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
              onShowRules={handleShowRules}
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
      
      <GameRules 
        isOpen={showRules} 
        onClose={handleCloseRules} 
      />
      
      <PromotionModal
        isOpen={gameState.pendingPromotion !== null}
        color={gameState.currentPlayer}
        onSelect={handlePromotionSelect}
      />
      
      <GameOverModal
        isOpen={showGameOver}
        gameStatus={gameState.gameStatus}
        currentPlayer={gameState.currentPlayer}
        onNewGame={handleNewGameFromModal}
        onClose={handleCloseGameOver}
      />
    </div>
  );
};

export default App;
