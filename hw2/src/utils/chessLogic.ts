import { Board, Piece, Position, Move, Color, PieceType } from '../types/chess';

export const createInitialBoard = (): Board => {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // 黑方棋子
  board[0] = [
    { type: 'rook', color: 'black' },
    { type: 'knight', color: 'black' },
    { type: 'bishop', color: 'black' },
    { type: 'queen', color: 'black' },
    { type: 'king', color: 'black' },
    { type: 'bishop', color: 'black' },
    { type: 'knight', color: 'black' },
    { type: 'rook', color: 'black' }
  ];
  
  // 黑方兵
  for (let col = 0; col < 8; col++) {
    board[1][col] = { type: 'pawn', color: 'black' };
  }
  
  // 白方兵
  for (let col = 0; col < 8; col++) {
    board[6][col] = { type: 'pawn', color: 'white' };
  }
  
  // 白方棋子
  board[7] = [
    { type: 'rook', color: 'white' },
    { type: 'knight', color: 'white' },
    { type: 'bishop', color: 'white' },
    { type: 'queen', color: 'white' },
    { type: 'king', color: 'white' },
    { type: 'bishop', color: 'white' },
    { type: 'knight', color: 'white' },
    { type: 'rook', color: 'white' }
  ];
  
  return board;
};

export const isValidPosition = (pos: Position): boolean => {
  return pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8;
};

export const getPieceAt = (board: Board, pos: Position): Piece | null => {
  if (!isValidPosition(pos)) return null;
  return board[pos.row][pos.col];
};

export const isEmpty = (board: Board, pos: Position): boolean => {
  return getPieceAt(board, pos) === null;
};

export const isEnemy = (piece1: Piece | null, piece2: Piece | null): boolean => {
  if (!piece1 || !piece2) return false;
  return piece1.color !== piece2.color;
};

export const isOwnPiece = (piece: Piece | null, color: Color): boolean => {
  return piece !== null && piece.color === color;
};

export const getPossibleMoves = (board: Board, pos: Position): Position[] => {
  const piece = getPieceAt(board, pos);
  if (!piece) return [];
  
  const moves: Position[] = [];
  
  switch (piece.type) {
    case 'pawn':
      moves.push(...getPawnMoves(board, pos, piece));
      break;
    case 'rook':
      moves.push(...getRookMoves(board, pos, piece));
      break;
    case 'bishop':
      moves.push(...getBishopMoves(board, pos, piece));
      break;
    case 'queen':
      moves.push(...getQueenMoves(board, pos, piece));
      break;
    case 'king':
      moves.push(...getKingMoves(board, pos, piece));
      break;
    case 'knight':
      moves.push(...getKnightMoves(board, pos, piece));
      break;
  }
  
  return moves.filter(move => isValidPosition(move));
};

const getPawnMoves = (board: Board, pos: Position, piece: Piece): Position[] => {
  const moves: Position[] = [];
  const direction = piece.color === 'white' ? -1 : 1;
  const startRow = piece.color === 'white' ? 6 : 1;
  
  // 向前移動
  const forward = { row: pos.row + direction, col: pos.col };
  if (isValidPosition(forward) && isEmpty(board, forward)) {
    moves.push(forward);
    
    // 初始位置可以移動兩格
    if (pos.row === startRow) {
      const doubleForward = { row: pos.row + 2 * direction, col: pos.col };
      if (isValidPosition(doubleForward) && isEmpty(board, doubleForward)) {
        moves.push(doubleForward);
      }
    }
  }
  
  // 斜向吃子
  const leftDiag = { row: pos.row + direction, col: pos.col - 1 };
  const rightDiag = { row: pos.row + direction, col: pos.col + 1 };
  
  if (isValidPosition(leftDiag) && isEnemy(piece, getPieceAt(board, leftDiag))) {
    moves.push(leftDiag);
  }
  if (isValidPosition(rightDiag) && isEnemy(piece, getPieceAt(board, rightDiag))) {
    moves.push(rightDiag);
  }
  
  return moves;
};

const getRookMoves = (board: Board, pos: Position, piece: Piece): Position[] => {
  const moves: Position[] = [];
  const directions = [
    { row: -1, col: 0 }, { row: 1, col: 0 },
    { row: 0, col: -1 }, { row: 0, col: 1 }
  ];
  
  for (const dir of directions) {
    for (let i = 1; i < 8; i++) {
      const newPos = { row: pos.row + dir.row * i, col: pos.col + dir.col * i };
      if (!isValidPosition(newPos)) break;
      
      const targetPiece = getPieceAt(board, newPos);
      if (targetPiece === null) {
        moves.push(newPos);
      } else if (isEnemy(piece, targetPiece)) {
        moves.push(newPos);
        break;
      } else {
        break;
      }
    }
  }
  
  return moves;
};

const getBishopMoves = (board: Board, pos: Position, piece: Piece): Position[] => {
  const moves: Position[] = [];
  const directions = [
    { row: -1, col: -1 }, { row: -1, col: 1 },
    { row: 1, col: -1 }, { row: 1, col: 1 }
  ];
  
  for (const dir of directions) {
    for (let i = 1; i < 8; i++) {
      const newPos = { row: pos.row + dir.row * i, col: pos.col + dir.col * i };
      if (!isValidPosition(newPos)) break;
      
      const targetPiece = getPieceAt(board, newPos);
      if (targetPiece === null) {
        moves.push(newPos);
      } else if (isEnemy(piece, targetPiece)) {
        moves.push(newPos);
        break;
      } else {
        break;
      }
    }
  }
  
  return moves;
};

const getQueenMoves = (board: Board, pos: Position, piece: Piece): Position[] => {
  return [...getRookMoves(board, pos, piece), ...getBishopMoves(board, pos, piece)];
};

const getKingMoves = (board: Board, pos: Position, piece: Piece): Position[] => {
  const moves: Position[] = [];
  const directions = [
    { row: -1, col: -1 }, { row: -1, col: 0 }, { row: -1, col: 1 },
    { row: 0, col: -1 }, { row: 0, col: 1 },
    { row: 1, col: -1 }, { row: 1, col: 0 }, { row: 1, col: 1 }
  ];
  
  for (const dir of directions) {
    const newPos = { row: pos.row + dir.row, col: pos.col + dir.col };
    if (!isValidPosition(newPos)) continue;
    
    const targetPiece = getPieceAt(board, newPos);
    if (targetPiece === null || isEnemy(piece, targetPiece)) {
      moves.push(newPos);
    }
  }
  
  // 王車易位
  if (!piece.hasMoved) {
    const row = pos.row;
    
    // 短易位 (kingside)
    if (piece.color === 'white' && row === 7) {
      const kingsideRook = getPieceAt(board, { row: 7, col: 7 });
      if (kingsideRook && kingsideRook.type === 'rook' && !kingsideRook.hasMoved) {
        // 檢查中間格子是否為空
        if (isEmpty(board, { row: 7, col: 5 }) && isEmpty(board, { row: 7, col: 6 })) {
          // 檢查是否被攻擊
          if (!isSquareAttacked(board, { row: 7, col: 4 }, 'black') &&
              !isSquareAttacked(board, { row: 7, col: 5 }, 'black') &&
              !isSquareAttacked(board, { row: 7, col: 6 }, 'black')) {
            moves.push({ row: 7, col: 6 });
          }
        }
      }
    } else if (piece.color === 'black' && row === 0) {
      const kingsideRook = getPieceAt(board, { row: 0, col: 7 });
      if (kingsideRook && kingsideRook.type === 'rook' && !kingsideRook.hasMoved) {
        if (isEmpty(board, { row: 0, col: 5 }) && isEmpty(board, { row: 0, col: 6 })) {
          if (!isSquareAttacked(board, { row: 0, col: 4 }, 'white') &&
              !isSquareAttacked(board, { row: 0, col: 5 }, 'white') &&
              !isSquareAttacked(board, { row: 0, col: 6 }, 'white')) {
            moves.push({ row: 0, col: 6 });
          }
        }
      }
    }
    
    // 長易位 (queenside)
    if (piece.color === 'white' && row === 7) {
      const queensideRook = getPieceAt(board, { row: 7, col: 0 });
      if (queensideRook && queensideRook.type === 'rook' && !queensideRook.hasMoved) {
        if (isEmpty(board, { row: 7, col: 1 }) && isEmpty(board, { row: 7, col: 2 }) && isEmpty(board, { row: 7, col: 3 })) {
          if (!isSquareAttacked(board, { row: 7, col: 4 }, 'black') &&
              !isSquareAttacked(board, { row: 7, col: 2 }, 'black') &&
              !isSquareAttacked(board, { row: 7, col: 3 }, 'black')) {
            moves.push({ row: 7, col: 2 });
          }
        }
      }
    } else if (piece.color === 'black' && row === 0) {
      const queensideRook = getPieceAt(board, { row: 0, col: 0 });
      if (queensideRook && queensideRook.type === 'rook' && !queensideRook.hasMoved) {
        if (isEmpty(board, { row: 0, col: 1 }) && isEmpty(board, { row: 0, col: 2 }) && isEmpty(board, { row: 0, col: 3 })) {
          if (!isSquareAttacked(board, { row: 0, col: 4 }, 'white') &&
              !isSquareAttacked(board, { row: 0, col: 2 }, 'white') &&
              !isSquareAttacked(board, { row: 0, col: 3 }, 'white')) {
            moves.push({ row: 0, col: 2 });
          }
        }
      }
    }
  }
  
  return moves;
};

const getKnightMoves = (board: Board, pos: Position, piece: Piece): Position[] => {
  const moves: Position[] = [];
  const knightMoves = [
    { row: -2, col: -1 }, { row: -2, col: 1 },
    { row: -1, col: -2 }, { row: -1, col: 2 },
    { row: 1, col: -2 }, { row: 1, col: 2 },
    { row: 2, col: -1 }, { row: 2, col: 1 }
  ];
  
  for (const move of knightMoves) {
    const newPos = { row: pos.row + move.row, col: pos.col + move.col };
    if (!isValidPosition(newPos)) continue;
    
    const targetPiece = getPieceAt(board, newPos);
    if (targetPiece === null || isEnemy(piece, targetPiece)) {
      moves.push(newPos);
    }
  }
  
  return moves;
};

export const makeMove = (board: Board, move: Move): Board => {
  const newBoard = board.map(row => [...row]);
  newBoard[move.to.row][move.to.col] = move.piece;
  newBoard[move.from.row][move.from.col] = null;
  
  // 處理王車易位
  if (move.piece.type === 'king' && Math.abs(move.to.col - move.from.col) === 2) {
    // 王車易位
    if (move.to.col === 6) { // 短易位 (kingside)
      const rook = newBoard[move.from.row][7];
      if (rook && rook.type === 'rook') {
        newBoard[move.from.row][5] = rook;
        newBoard[move.from.row][7] = null;
      }
    } else if (move.to.col === 2) { // 長易位 (queenside)
      const rook = newBoard[move.from.row][0];
      if (rook && rook.type === 'rook') {
        newBoard[move.from.row][3] = rook;
        newBoard[move.from.row][0] = null;
      }
    }
  }
  
  return newBoard;
};

export const isInCheck = (board: Board, color: Color): boolean => {
  // 找到國王位置
  let kingPos: Position | null = null;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.type === 'king' && piece.color === color) {
        kingPos = { row, col };
        break;
      }
    }
    if (kingPos) break;
  }
  
  if (!kingPos) return false;
  
  // 檢查是否有敵方棋子可以攻擊國王
  const enemyColor = color === 'white' ? 'black' : 'white';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === enemyColor) {
        const moves = getPossibleMoves(board, { row, col });
        if (moves.some(move => move.row === kingPos!.row && move.col === kingPos!.col)) {
          return true;
        }
      }
    }
  }
  
  return false;
};

export const isCheckmate = (board: Board, color: Color): boolean => {
  if (!isInCheck(board, color)) return false;
  
  // 檢查是否有任何合法移動可以解除將軍
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        const moves = getPossibleMoves(board, { row, col });
        for (const move of moves) {
          const newBoard = makeMove(board, {
            from: { row, col },
            to: move,
            piece,
            capturedPiece: board[move.row][move.col] || undefined
          });
          if (!isInCheck(newBoard, color)) {
            return false;
          }
        }
      }
    }
  }
  
  return true;
};

export const isSquareAttacked = (board: Board, pos: Position, byColor: Color): boolean => {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === byColor) {
        const moves = getPossibleMoves(board, { row, col });
        if (moves.some(move => move.row === pos.row && move.col === pos.col)) {
          return true;
        }
      }
    }
  }
  return false;
};

export const isStalemate = (board: Board, color: Color): boolean => {
  if (isInCheck(board, color)) return false;
  
  // 檢查是否有任何合法移動
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        const moves = getPossibleMoves(board, { row, col });
        for (const move of moves) {
          const newBoard = makeMove(board, {
            from: { row, col },
            to: move,
            piece,
            capturedPiece: board[move.row][move.col] || undefined
          });
          if (!isInCheck(newBoard, color)) {
            return false;
          }
        }
      }
    }
  }
  
  return true;
};
