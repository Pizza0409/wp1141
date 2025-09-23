import React from 'react';
import { Piece, Position } from '../types/chess';

interface ChessPieceProps {
  piece: Piece | null;
  position: Position;
  isSelected: boolean;
  isPossibleMove: boolean;
  onClick: (position: Position) => void;
}

const ChessPiece: React.FC<ChessPieceProps> = ({ 
  piece, 
  position, 
  isSelected, 
  isPossibleMove, 
  onClick 
}) => {
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

  const isLightSquare = (position.row + position.col) % 2 === 0;

  return (
    <div
      className={`chess-square ${isLightSquare ? 'light' : 'dark'} ${
        isSelected ? 'selected' : ''
      } ${isPossibleMove ? 'possible-move' : ''}`}
      onClick={() => onClick(position)}
    >
      {piece && (
        <div className={`chess-piece ${piece.color} ${piece.type}`}>
          {getPieceSymbol(piece)}
        </div>
      )}
      {isPossibleMove && !piece && (
        <div className="move-indicator" />
      )}
    </div>
  );
};

export default ChessPiece;
