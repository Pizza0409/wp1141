import { Board, Move, Color } from '../types/chess';
import { makeMove, isCheckmate } from './chessLogic';

// 音效工具
export const playSound = (soundType: 'move' | 'capture' | 'check' | 'checkmate') => {
  try {
    // 創建音頻上下文
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // 根據音效類型生成不同的音調
    let frequency: number;
    let duration: number;
    
    switch (soundType) {
      case 'move':
        frequency = 440; // A4
        duration = 0.1;
        break;
      case 'capture':
        frequency = 660; // E5
        duration = 0.2;
        break;
      case 'check':
        frequency = 880; // A5
        duration = 0.3;
        break;
      case 'checkmate':
        frequency = 1320; // E6
        duration = 0.5;
        break;
      default:
        frequency = 440;
        duration = 0.1;
    }
    
    // 創建振盪器
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = 'sine';
    
    // 設置音量包絡
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  } catch (error) {
    console.log('音效播放失敗:', error);
  }
};

// 檢查移動後是否會被 Checkmate
export const wouldCauseCheckmate = (board: Board, move: Move, currentPlayer: Color): boolean => {
  const newBoard = makeMove(board, move);
  const nextPlayer = currentPlayer === 'white' ? 'black' : 'white';
  return isCheckmate(newBoard, nextPlayer);
};
