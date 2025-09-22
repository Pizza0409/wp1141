import React from 'react';
import { Board, Position } from '../types/chess';
import ChessPiece from './ChessPiece';

interface ChessBoardProps {
  board: Board;
  selectedSquare: Position | null;
  possibleMoves: Position[];
  onSquareClick: (position: Position) => void;
}

const ChessBoard: React.FC<ChessBoardProps> = ({
  board,
  selectedSquare,
  possibleMoves,
  onSquareClick
}) => {
  const renderBoard = () => {
    const squares = [];
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const position = { row, col };
        const piece = board[row][col];
        const isSelected = selectedSquare?.row === row && selectedSquare?.col === col;
        const isPossibleMove = possibleMoves.some(
          move => move.row === row && move.col === col
        );
        
        squares.push(
          <ChessPiece
            key={`${row}-${col}`}
            piece={piece}
            position={position}
            isSelected={isSelected}
            isPossibleMove={isPossibleMove}
            onClick={onSquareClick}
          />
        );
      }
    }
    
    return squares;
  };

  return (
    <div className="chess-board">
      <div className="board-coordinates">
        <div className="file-labels">
          {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(letter => (
            <div key={letter} className="file-label">{letter}</div>
          ))}
        </div>
        <div className="rank-labels">
          {[8, 7, 6, 5, 4, 3, 2, 1].map(number => (
            <div key={number} className="rank-label">{number}</div>
          ))}
        </div>
      </div>
      <div className="board-grid">
        {renderBoard()}
      </div>
    </div>
  );
};

export default ChessBoard;
