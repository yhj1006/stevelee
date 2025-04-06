import React, { useState, useEffect } from 'react';
import { apiRequest } from '../lib/queryClient';

interface LeaderboardEntry {
  id: number;
  playerName: string;
  score: number;
  level: number;
  createdAt: string;
}

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScore: number;
  currentLevel: number;
  onSubmitScore: (playerName: string) => void;
}

const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  currentScore,
  currentLevel,
  onSubmitScore
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen]);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest('/api/leaderboard');
      setLeaderboard(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
      setError('리더보드를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError('이름을 입력해주세요!');
      return;
    }

    setIsSubmitting(true);
    onSubmitScore(playerName);
    setSuccess(true);
    
    // Refetch the leaderboard after submission
    setTimeout(() => {
      fetchLeaderboard();
      setIsSubmitting(false);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>리더보드</h2>
        <button className="close-button" onClick={onClose}>×</button>
        
        {!success && (
          <div className="submit-score">
            <h3>당신의 점수: {currentScore} (레벨 {currentLevel})</h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="이름을 입력하세요"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
                disabled={isSubmitting}
              />
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '제출 중...' : '점수 등록하기'}
              </button>
            </form>
            {error && <p className="error">{error}</p>}
          </div>
        )}

        {success && (
          <div className="success-message">
            <p>점수가 성공적으로 등록되었습니다!</p>
          </div>
        )}
        
        <div className="leaderboard-table">
          <h3>최고 점수</h3>
          {isLoading ? (
            <p>불러오는 중...</p>
          ) : leaderboard.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>순위</th>
                  <th>플레이어</th>
                  <th>점수</th>
                  <th>레벨</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => (
                  <tr key={entry.id} className={playerName === entry.playerName && success ? 'highlighted-row' : ''}>
                    <td>{index + 1}</td>
                    <td>{entry.playerName}</td>
                    <td>{entry.score}</td>
                    <td>{entry.level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>등록된 점수가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardModal;