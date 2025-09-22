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
    capturedPieces: { white: [], black: [] }
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
        
        // 檢查移動後是否會被 Checkmate
        const wouldCauseCheck = wouldCauseCheckmate(prev.board, newMove, prev.currentPlayer);
        if (wouldCauseCheck) {
          setMoveWarning('警告：此移動會讓對方將死！');
          setTimeout(() => setMoveWarning(''), 3000);
        } else {
          setMoveWarning('');
        }
        
        const newBoard = makeMove(prev.board, newMove);
        
        const newCapturedPieces = { ...prev.capturedPieces };
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
          capturedPieces: newCapturedPieces
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
      capturedPieces: { white: [], black: [] }
    });
  }, []);

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
    getHint
  };
};
