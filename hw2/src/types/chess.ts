export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
export type Color = 'white' | 'black';

export interface Piece {
  type: PieceType;
  color: Color;
  hasMoved?: boolean;
}

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  capturedPiece?: Piece;
  promotion?: PieceType;
}

export type Board = (Piece | null)[][];

export interface GameState {
  board: Board;
  currentPlayer: Color;
  selectedSquare: Position | null;
  possibleMoves: Position[];
  gameStatus: 'playing' | 'check' | 'checkmate' | 'stalemate' | 'white-king-captured' | 'black-king-captured';
  moveHistory: Move[];
  capturedPieces: { white: Piece[]; black: Piece[] };
  pendingPromotion: Position | null;
}
