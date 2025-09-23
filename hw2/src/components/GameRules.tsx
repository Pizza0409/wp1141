import React, { useState } from 'react';
import './GameRules.css';

interface GameRulesProps {
  isOpen: boolean;
  onClose: () => void;
}

const GameRules: React.FC<GameRulesProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'pieces' | 'rules' | 'special'>('pieces');

  if (!isOpen) return null;

  const pieceRules = [
    {
      name: '國王',
      symbol: '♔',
      description: '可以朝任何方向移動一格',
      details: '不能移動到會被攻擊的位置。被攻擊時稱為「將軍」，無法逃脫將軍時稱為「將死」'
    },
    {
      name: '皇后',
      symbol: '♕',
      description: '可以朝任何方向移動任意格數',
      details: '結合了車和象的移動方式，是棋盤上最強的棋子'
    },
    {
      name: '車',
      symbol: '♖',
      description: '可以水平或垂直移動任意格數',
      details: '不能斜向移動，可以進行「王車易位」'
    },
    {
      name: '象',
      symbol: '♗',
      description: '只能斜向移動任意格數',
      details: '白象只能在白格，黑象只能在黑格，不能跳過其他棋子'
    },
    {
      name: '馬',
      symbol: '♘',
      description: '移動方式為「日」字形（2+1 或 1+2）',
      details: '是唯一可以跳過其他棋子的棋子，移動時不受路徑阻擋'
    },
    {
      name: '兵',
      symbol: '♙',
      description: '向前移動一格，不能後退',
      details: '第一次移動可以選擇移動一格或兩格，吃子時只能斜向吃子，到達對方底線可以升變'
    }
  ];

  const specialRules = [
    {
      title: '王車易位',
      description: '國王和車之間沒有其他棋子，且都沒有移動過，國王沒有被將軍時，國王移動兩格，車移動到國王旁邊'
    },
    {
      title: '兵的升變',
      description: '兵到達對方底線時必須升變為皇后、車、象或馬，通常選擇升變為皇后'
    },
    {
      title: '吃過路兵',
      description: '當對方兵第一次移動兩格時，如果經過我方兵的攻擊範圍，我方兵可以斜向吃掉對方兵'
    }
  ];

  return (
    <div className="rules-overlay" onClick={onClose}>
      <div className="rules-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rules-header">
          <h2>國際象棋規則</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="rules-tabs">
          <button 
            className={`tab-btn ${activeTab === 'pieces' ? 'active' : ''}`}
            onClick={() => setActiveTab('pieces')}
          >
            棋子移動
          </button>
          <button 
            className={`tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
            onClick={() => setActiveTab('rules')}
          >
            基本規則
          </button>
          <button 
            className={`tab-btn ${activeTab === 'special' ? 'active' : ''}`}
            onClick={() => setActiveTab('special')}
          >
            特殊規則
          </button>
        </div>

        <div className="rules-content">
          {activeTab === 'pieces' && (
            <div className="pieces-section">
              <h3>棋子移動方式</h3>
              <div className="pieces-grid">
                {pieceRules.map((piece, index) => (
                  <div key={index} className="piece-card">
                    <div className="piece-symbol">{piece.symbol}</div>
                    <div className="piece-info">
                      <h4>{piece.name}</h4>
                      <p className="piece-description">{piece.description}</p>
                      <p className="piece-details">{piece.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="basic-rules-section">
              <h3>基本遊戲規則</h3>
              <div className="rules-list">
                <div className="rule-item">
                  <h4>🎯 遊戲目標</h4>
                  <p>將死對方的國王，即讓對方的國王無法逃脫攻擊</p>
                </div>
                <div className="rule-item">
                  <h4>♟️ 棋盤設置</h4>
                  <p>8x8 共 64 個方格，白方在下方，黑方在上方，每方各有 16 個棋子</p>
                </div>
                <div className="rule-item">
                  <h4>🔄 輪流下棋</h4>
                  <p>白方先下，然後雙方輪流移動棋子，每次只能移動一個棋子</p>
                </div>
                <div className="rule-item">
                  <h4>⚔️ 吃子規則</h4>
                  <p>移動到對方棋子所在位置即可吃掉該棋子，被吃掉的棋子從棋盤上移除</p>
                </div>
                <div className="rule-item">
                  <h4>🏁 遊戲結束</h4>
                  <p>將死、和棋（無法移動且未被將軍）或一方認輸</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'special' && (
            <div className="special-rules-section">
              <h3>特殊規則</h3>
              <div className="special-rules-list">
                {specialRules.map((rule, index) => (
                  <div key={index} className="special-rule-item">
                    <h4>{rule.title}</h4>
                    <p>{rule.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameRules;
