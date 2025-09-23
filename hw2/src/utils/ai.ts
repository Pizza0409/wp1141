import { Board, Position, Piece, Color, Move } from '../types/chess';
import { 
  getPossibleMoves, 
  makeMove, 
  isInCheck, 
  getPieceAt,
  isValidPosition,
  isSquareAttacked
} from '../utils/chessLogic';

export interface AIMove {
  from: Position;
  to: Position;
  piece: Piece;
  capturedPiece?: Piece;
  score: number;
}

export const getAIMove = (board: Board, color: Color): Move | null => {
  const moves = getAllPossibleMoves(board, color);
  if (moves.length === 0) return null;
  
  // 簡單的評分系統
  const scoredMoves = moves.map(move => ({
    ...move,
    score: evaluateMove(board, move, color)
  }));
  
  // 按分數排序，選擇最佳移動
  scoredMoves.sort((a, b) => b.score - a.score);
  
  const bestMove = scoredMoves[0];
  return {
    from: bestMove.from,
    to: bestMove.to,
    piece: bestMove.piece,
    capturedPiece: bestMove.capturedPiece
  };
};

const getAllPossibleMoves = (board: Board, color: Color): AIMove[] => {
  const moves: AIMove[] = [];
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = getPieceAt(board, { row, col });
      if (piece && piece.color === color) {
        const possibleMoves = getPossibleMoves(board, { row, col });
        for (const move of possibleMoves) {
          const capturedPiece = getPieceAt(board, move);
          moves.push({
            from: { row, col },
            to: move,
            piece,
            capturedPiece: capturedPiece || undefined,
            score: 0
          });
        }
      }
    }
  }
  
  return moves;
};

const evaluateMove = (board: Board, move: AIMove, color: Color): number => {
  let score = 0;
  
  // 吃子分數
  if (move.capturedPiece) {
    score += getPieceValue(move.capturedPiece.type);
  }
  
  // 移動後檢查是否將軍
  const newBoard = makeMove(board, move);
  const enemyColor = color === 'white' ? 'black' : 'white';
  if (isInCheck(newBoard, enemyColor)) {
    score += 50; // 將軍獎勵
  }
  
  // 中心控制
  const centerBonus = getCenterControlBonus(move.to);
  score += centerBonus;
  
  // 避免被吃
  const safetyBonus = getSafetyBonus(board, move, color);
  score += safetyBonus;
  
  // 隨機性（避免 AI 過於可預測）
  score += Math.random() * 10 - 5;
  
  return score;
};

const getPieceValue = (pieceType: string): number => {
  const values: { [key: string]: number } = {
    'pawn': 10,
    'knight': 30,
    'bishop': 30,
    'rook': 50,
    'queen': 90,
    'king': 1000
  };
  return values[pieceType] || 0;
};

const getCenterControlBonus = (pos: Position): number => {
  const centerDistance = Math.abs(pos.row - 3.5) + Math.abs(pos.col - 3.5);
  return Math.max(0, 5 - centerDistance);
};

const getSafetyBonus = (board: Board, move: AIMove, color: Color): number => {
  const newBoard = makeMove(board, move);
  const enemyColor = color === 'white' ? 'black' : 'white';
  
  // 檢查移動後是否會被攻擊
  const isAttacked = isSquareAttacked(newBoard, move.to, enemyColor);
  return isAttacked ? -20 : 5;
};


export const useAI = () => {
  const makeAIMove = (board: Board, color: Color): Promise<Move | null> => {
    return new Promise((resolve) => {
      // 添加延遲以模擬思考時間
      setTimeout(() => {
        const move = getAIMove(board, color);
        resolve(move);
      }, 500 + Math.random() * 1000); // 0.5-1.5秒的隨機延遲
    });
  };
  
  return { makeAIMove };
};
