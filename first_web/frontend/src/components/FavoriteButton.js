import React, { useEffect, useState } from 'react';
import api from '../services/api';

function FavoriteButton({ companyName }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const res = await api.get('/favorites');
        setIsFavorite(res.data.includes(companyName));
      } catch (err) {
        console.error('즐겨찾기 조회 실패:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, [companyName]);

  const toggleFavorite = async () => {
    try {
      if (isFavorite) {
        await api.delete(`/favorites/${encodeURIComponent(companyName)}`);
      } else {
        await api.post('/favorites', { companyName });
      }
      setIsFavorite(!isFavorite);
    } catch (err) {
      console.error('즐겨찾기 변경 실패:', err);
      alert('로그인이 필요합니다.');
    }
  };

  if (loading) return null;

  return (
    <button
      onClick={toggleFavorite}
      className={`flex items-center gap-1 px-3 py-1 border rounded-full text-sm transition shadow-sm ${
        isFavorite
          ? 'bg-yellow-100 text-yellow-900 border-yellow-300 hover:bg-yellow-200'
          : 'bg-white text-gray-500 border-gray-300 hover:ring-1 hover:ring-blue-300'
      }`}
    >
      {isFavorite ? '⭐ 즐겨찾기됨' : '☆ 즐겨찾기'}
    </button>
  );
}

export default FavoriteButton;
