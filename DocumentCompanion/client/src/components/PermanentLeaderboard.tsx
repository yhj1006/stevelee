import React, { useState, useEffect } from 'react';
import { apiRequest } from '../lib/queryClient';

interface LeaderboardEntry {
  id: number;
  playerName: string;
  score: number;
  level: number;
  createdAt: string;
}

const PermanentLeaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
    
    // Set up an interval to refresh the leaderboard every 30 seconds
    const intervalId = setInterval(fetchLeaderboard, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest('/api/leaderboard?limit=10');
      setLeaderboard(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
      setError('리더보드를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="permanent-leaderboard">
      <h2>🏆 리더보드</h2>
      
      {isLoading && <p className="loading">불러오는 중...</p>}
      
      {error && <p className="error">{error}</p>}
      
      {!isLoading && !error && (
        leaderboard.length > 0 ? (
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
                <tr key={entry.id}>
                  <td>{index + 1}</td>
                  <td>{entry.playerName}</td>
                  <td>{entry.score}</td>
                  <td>{entry.level}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-scores">등록된 점수가 없습니다.</p>
        )
      )}
    </div>
  );
};

export default PermanentLeaderboard;