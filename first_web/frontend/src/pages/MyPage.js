import React, { useEffect, useState } from 'react';
import api from '../services/api'; // Axios 인스턴스 (토큰 자동 포함)
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

function MyPage() {
  const [favorites, setFavorites] = useState([]);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRemove = async (companyName) => {
    try {
      await api.delete(`/favorites/${encodeURIComponent(companyName)}`);
      setFavorites((prev) => prev.filter((c) => c !== companyName));
    } catch (err) {
      console.error('즐겨찾기 삭제 실패:', err);
      alert('즐겨찾기 해제 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        // 사용자 정보 확인
        const meRes = await api.get('/me');
        setEmail(meRes.data.email);

        // 즐겨찾기 목록 가져오기
        const favRes = await api.get('/favorites');
        setFavorites(favRes.data);
      } catch (err) {
        console.error('마이페이지 로딩 실패:', err);
        setError('로그인이 필요합니다.');
        localStorage.removeItem('token');
        navigate('/login');
      }
    };

    fetchFavorites();
  }, [navigate]);

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">마이페이지</h2>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <p className="mb-6 text-gray-600">이메일: <strong>{email}</strong></p>
  
      {/* 🎯 즐겨찾기 + 종목추천 나란히 배치 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* ⭐ 즐겨찾기 박스 */}
        <div className="w-full p-5 rounded-2xl border border-blue-100 bg-blue-50 shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)]">
          <h3 className="text-lg font-bold text-blue-800 mb-4">⭐ 즐겨찾기 기업</h3>
          {favorites.length === 0 ? (
            <p className="text-gray-400">아직 즐겨찾기한 기업이 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {favorites.map((company, idx) => (
                <li
                  key={idx}
                  className="flex justify-between items-center px-4 py-2 rounded-lg bg-white border border-blue-200 shadow-sm hover:bg-blue-50 transition"
                >
                  <span
                    className="text-blue-800 font-medium cursor-pointer hover:underline"
                    onClick={() => navigate(`/company/${encodeURIComponent(company)}/financials`)}
                  >
                    {company}
                  </span>
                  <button
                    onClick={() => handleRemove(company)}
                    className="text-blue-500 hover:text-blue-700 text-sm font-semibold transition-colors duration-200"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
  
        {/* 📈 종목 추천 박스 */}
        <div
          className="w-full p-5 rounded-2xl border border-blue-100 bg-blue-50 shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)] cursor-pointer hover:bg-blue-100 transition-colors"
          onClick={() => navigate('/recommendation')}
        >
          <h3 className="text-lg font-bold text-blue-800 mb-2">📈 종목 추천</h3>
          <p className="text-sm text-gray-500 mb-4">
            당신의 투자 스타일에 맞는 종목을 추천해드립니다.
          </p>
        </div>
      </div>
    </div>
  );
}

export default MyPage;
