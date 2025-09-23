import React from 'react';
import { PieceType, Color } from '../types/chess';
import './PromotionModal.css';

interface PromotionModalProps {
  isOpen: boolean;
  color: Color;
  onSelect: (pieceType: PieceType) => void;
}

const PromotionModal: React.FC<PromotionModalProps> = ({ isOpen, color, onSelect }) => {
  if (!isOpen) return null;

  const pieces: { type: PieceType; symbol: string; name: string }[] = [
    { type: 'queen', symbol: color === 'white' ? '♕' : '♛', name: '皇后' },
    { type: 'rook', symbol: color === 'white' ? '♖' : '♜', name: '車' },
    { type: 'bishop', symbol: color === 'white' ? '♗' : '♝', name: '象' },
    { type: 'knight', symbol: color === 'white' ? '♘' : '♞', name: '馬' }
  ];

  return (
    <div className="promotion-overlay">
      <div className="promotion-modal">
        <h3>選擇升變棋子</h3>
        <div className="promotion-options">
          {pieces.map(piece => (
            <button
              key={piece.type}
              className="promotion-option"
              onClick={() => onSelect(piece.type)}
            >
              <div className="piece-symbol">{piece.symbol}</div>
              <div className="piece-name">{piece.name}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PromotionModal;
