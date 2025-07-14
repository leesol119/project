import React, { useState } from 'react';
import SurveyModal from '../components/SurveyModal';
import { mapFiltersByKeyword } from '../utils/mapFiltersByKeyword';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

function RecommendationPage() {
  const [showSurvey, setShowSurvey] = useState(false);
  const [personalityKeywords, setPersonalityKeywords] = useState([]);
  const [filters, setFilters] = useState({
    roeMin: '',
    esg: '',
    debtMax: '',
    equityRatioMin: '',
    perMax: '',
    pbrMax: '',
    dividendMin: '',
    epsPositiveOnly: false,
    allowNegativeEPS: false,
  });
  
  const COLORS = [
    'rgba(20, 61, 175, 0.92)', // blue-300
    'rgba(49, 88, 196, 0.92)', // indigo-300
    'rgba(97, 131, 224, 0.92)', // blue-200
    'rgba(114, 145, 230, 0.92)', // indigo-200
    'rgba(141, 166, 235, 0.92)', // blue-100
    'rgba(175, 195, 250, 0.92)', // indigo-100
    'rgba(210, 222, 255, 0.92)', // 가장 연한 파랑
  ];

  const [results, setResults] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scoreMap, setScoreMap] = useState({});
  const [showChart, setShowChart] = useState(false);
  const navigate = useNavigate();

  const chartData = Object.entries(scoreMap)
  .filter(([key, val]) => val > 0 && !key.includes('중시형'))
  .map(([key, val]) => ({ name: key, value: val }))
  .sort((a, b) => b.value - a.value); 

  const handleSurveySubmit = (keywords, esgPref, scores) => {
    const auto = mapFiltersByKeyword(keywords, esgPref);
    setPersonalityKeywords(keywords);
    setFilters((prev) => ({ ...prev, ...auto }));
    setScoreMap(scores);
    setShowChart(true);
  };

  const filterDisplayOrder = [
    'esg',        // ✅ ESG 통합 등급
    'envFocus',   // ✅ 환경
    'socFocus',   // ✅ 사회
    'govFocus',   // ✅ 지배구조
    'roeMin',
    'perMax',
    'pbrMax',
    'debtMax',
    'equityRatioMin',
    'dividendMin',
    'epsPositiveOnly',
    'allowNegativeEPS',
  ];

  const renderMatchedStats = (item) => {
    const parts = [];
  
    if (filters.roeMin)
      parts.push(`ROE: ${item['ROE(%)']?.toFixed(2) ?? '-'}%`);
  
    if (filters.debtMax)
      parts.push(`부채비율: ${item['부채비율']?.toFixed(2) ?? '-'}%`);
  
    if (filters.equityRatioMin)
      parts.push(`자기자본비율: ${item['자기자본비율']?.toFixed(2) ?? '-'}%`);
  
    if (filters.epsPositiveOnly)
      parts.push(
        `EPS: ${
          item['EPS(기본)'] > 0
            ? '양수'
            : item['EPS(기본)'] < 0
            ? '음수'
            : '-'
        }`
      );
  
    if (filters.perMax)
      parts.push(`PER: ${item['PER']?.toFixed(2) ?? '-'}`);
  
    if (filters.pbrMax)
      parts.push(`PBR: ${item['PBR']?.toFixed(2) ?? '-'}`);
  
    if (filters.dividendMin)
      parts.push(`배당: ${item['배당수익률(%)']?.toFixed(2) ?? '-'}%`);
  
    if (filters.esg)
      parts.push(`ESG: ${item['ESG등급'] ?? '-'}`);
  
    if (filters.envFocus)
      parts.push(`환경: ${item['ESG_환경'] ?? '-'}`);
  
    if (filters.socFocus)
      parts.push(`사회: ${item['ESG_사회'] ?? '-'}`);
  
    if (filters.govFocus)
      parts.push(`지배구조: ${item['ESG_지배구조'] ?? '-'}`);
  
    return parts.join(' / ');
  };

  const filtersToQuery = (filters) => {
    const params = new URLSearchParams();
    if (filters.roeMin) params.append('roe_min', filters.roeMin);
    if (filters.debtMax) params.append('debt_max', filters.debtMax);
    if (filters.equityRatioMin) params.append('equity_ratio_min', filters.equityRatioMin);
    if (filters.perMax) params.append('per_max', filters.perMax);
    if (filters.pbrMax) params.append('pbr_max', filters.pbrMax);
    if (filters.dividendMin) params.append('dividend_min', filters.dividendMin);
    if (filters.esg) params.append('esg', filters.esg);
    if (filters.epsPositiveOnly) params.append('eps_positive', 'true');
    if (filters.allowNegativeEPS) params.append('allow_negative_eps', 'true');
    return params.toString();
  };

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const query = filtersToQuery(filters);
      const res = await fetch(`http://localhost:8000/recommend?${query}`);
  
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
  
      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        console.error('❌ JSON 파싱 실패:', parseErr);
        setResults([]);
        return;
      }
  
      if (!Array.isArray(data)) {
        console.warn('❗ 예기치 않은 응답 형식:', data);
        setResults([]);
        return;
      }
  
      const sorted = data.sort((a, b) => {
        const debtA = a['부채비율'] ?? Infinity;
        const debtB = b['부채비율'] ?? Infinity;
        if (debtA !== debtB) return debtA - debtB;
        const roeA = a['ROE(%)'] ?? -Infinity;
        const roeB = b['ROE(%)'] ?? -Infinity;
        return roeB - roeA;
      });
  
      setResults(sorted); // ✅ 여기 꼭 필요합니다
    } catch (err) {
      console.error('❌ 추천 데이터 요청 실패:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFavorite = async (companyName) => {
    try {
      const res = await fetch(`http://localhost:8000/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ companyName: companyName }),
      });
      if (!res.ok) throw new Error('즐겨찾기 실패');
      alert(`${companyName} 즐겨찾기에 추가되었습니다.`);
      setFavorites((prev) => [...prev, companyName]);
    } catch (err) {
      alert('즐겨찾기 추가 실패');
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen px-6 py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">📈 종목 추천</h2>

      <button
        onClick={() => setShowSurvey(true)}
        className="bg-blue-500 hover:bg-blue-200 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm transition duration-200"
      >
        내 투자성향 알아보기
      </button> 
      <br></br>

      {personalityKeywords.length > 0 && (
        <div className="mt-4 flex gap-2 flex-wrap">
          {personalityKeywords.map((kw, idx) => (
          <span
            key={idx}
            className="px-5 py-2 bg-blue-100 text-blue-700 rounded-full text-base font-semibold shadow-sm"
          >
            #{kw}
          </span>
          ))}
        </div>
      )}
      <br></br>
      {showChart && chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <h4 className="text-lg font-bold mb-4 text-gray-800">나의 성향 분포</h4>
          <PieChart width={400} height={300}>
          <defs>
            <filter id="shadow" x="-20%" y="-20%" width="150%" height="150%">
              <feDropShadow dx="2" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.2" />
            </filter>
          </defs>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={100}
            paddingAngle={2}
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            dataKey="value"
          >
              {chartData.map((_, i) => (
                <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{
                marginTop: 60,
                fontSize: '10px',
                color: '#4b5563', // text-gray-600
              }}
              iconSize={12}
            />
          </PieChart>
        </motion.div>
      )}

    <br></br>
    <div className="mb-6 flex flex-wrap gap-2 text-sm text-blue-600 font-medium">
      {filterDisplayOrder.map((key) => {
        const value = filters[key];
        if (!value) return null;

        let label = '';
        switch (key) {
          case 'roeMin':
            label = `ROE ${value}% 이상`;
            break;
          case 'debtMax':
            label = `부채비율 ${value}% 이하`;
            break;
          case 'equityRatioMin':
            label = `자기자본비율 ${value}% 이상`;
            break;
          case 'epsPositiveOnly':
            if (value) label = 'EPS > 0';
            break;
          case 'allowNegativeEPS':
            if (value) label = 'EPS 적자 기업도 포함';
            break;
          case 'perMax':
            label = `PER ${value} 이하`;
            break;
          case 'pbrMax':
            label = `PBR ${value} 이하`;
            break;
          case 'dividendMin':
            label = `배당수익률 ${value}% 이상`;
            break;
          case 'esg':
            label = `ESG 등급 ${value} 이상`;
            break;
          case 'envFocus':
            if (value) label = '환경 등급 A 이상';
            break;
          case 'socFocus':
            if (value) label = '사회 등급 A 이상';
            break;
          case 'govFocus':
            if (value) label = '지배구조 등급 A 이상';
            break;
          default:
            label = `${key}: ${value}`;
        }

        return (
          <span
            key={key}
            className="bg-white px-3 py-1 rounded-xl border border-blue-200 text-blue-600 text-sm font-medium shadow-sm"
          >
            {label}
          </span>
        );
      })}
    </div>

      <button
        onClick={fetchRecommendations}
        className="bg-blue-500 hover:bg-blue-200 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm transition duration-200"
      >
      추천 종목 보기
      </button>

      <div className="mt-6">
        {loading ? (
          <p>로딩 중...</p>
        ) : results.length === 0 ? (
          <p className="text-gray-500">조건에 맞는 종목이 없습니다. 필터를 다시 조정해 보세요.</p>
        ) : (
          <ul className="space-y-2">
            {results.map((item, idx) => (
              <li
                key={idx}
                className="p-4 bg-gray-100 rounded shadow flex justify-between items-center cursor-pointer hover:bg-gray-200"
                onClick={() => navigate(`/company/${encodeURIComponent(item.회사명)}/financials`)}
              >
                <div>
                  <div className="font-semibold">{item.회사명}</div>
                  <div className="text-sm text-gray-600 leading-relaxed">
                    {renderMatchedStats(item)}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddFavorite(item.회사명);
                  }}
                  disabled={favorites.includes(item.회사명)}
                  className={`px-3 py-1 text-sm rounded shadow ${favorites.includes(item.회사명) ? 'bg-gray-400 cursor-not-allowed' : 'bg-yellow-400 hover:bg-yellow-500 text-white'}`}
                >
                  {favorites.includes(item.회사명) ? '⭐ 등록됨' : '⭐ 즐겨찾기'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showSurvey && (
        <SurveyModal
        onClose={() => setShowSurvey(false)}
        onSubmit={(keywords, esgPref, scores) => {
        handleSurveySubmit(keywords, esgPref, scores);
        setShowSurvey(false);
        }}
      />
      )}
    </div>
  );
}

export default RecommendationPage;

