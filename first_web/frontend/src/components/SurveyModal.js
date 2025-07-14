import React, { useState } from 'react';

const questions = [
  // 안정형
  { q: '시장 상황이 불안정할 때 취하는 행동은 무엇인가요?', options: ['현금을 보유한다', '저가 매수 기회로 본다'] },
  { q: '포트폴리오 구성에서 가장 중요한 기준은 무엇인가요?', options: ['리스크 관리', '수익률 극대화'] },
  { q: '손실이 10% 이상 나면 어떻게 하시나요?', options: ['일부라도 매도한다', '버티거나 추가 매수한다'] },
  // 수익형
  { q: '나의 연간 수익률 목표는 어느정도인가요?', options: ['적자만 아니면 된다', '연 10% 이상을 목표로 한다'] },
  { q: '고수익 고위험 종목 제안 시 무엇을 선택하실건가요?', options: ['리스크가 커서 회피한다', '도전해본다'] },
  { q: '장기 투자보다는 빠른 수익실현이 중요하다.', options: ['아니다', '그렇다'] },
  // 성장형
  { q: 'PER이 높아도 성장 가능성이 있다면 투자하시나요?', options: ['신중히 접근한다', '투자한다'] },
  { q: '기술주나 신산업에 관심이 많으신가요?', options: ['아니다', '그렇다'] },
  { q: '매출 성장률이 중요하다고 생각하시나요?', options: ['그렇지 않다', '그렇다'] },
  // 가치형
  { q: 'PER, PBR 등 재무지표를 참고하시나요?', options: ['그렇다', '아니다'] },
  { q: '기업 실적 발표를 유심히 보시나요?', options: ['보지 않는다', '자주 본다'] },
  { q: '단기 이슈보다 장기 실적을 보시나요?', options: ['단기 이슈 중시', '장기 실적 중시'] },
  // 고배당형
  { q: '배당이 없는 종목을 고려하시나요?', options: ['상관 없다', '고려하지 않는다'] },
  { q: '배당 성장률을 중요하게 보시나요?', options: ['중요하지 않다', '중요하다'] },
  { q: '꾸준한 배당을 선호하시나요?', options: ['아니다', '그렇다'] },
  // 단기형
  { q: '3개월 내 수익을 기대하시나요?', options: ['아니다', '그렇다'] },
  { q: '급등 테마주도 적극 활용하시나요?', options: ['아니다', '활용한다'] },
  { q: '단기 수익 기회를 위해 리스크를 감수할 수 있으신가요?', options: ['그렇지 않다', '감수할 수 있다'] },
  // ESG형
  { q: '투자 시 ESG 등급을 확인하시나요?', options: ['신경 쓰지 않는다', '반드시 확인한다'] },
  { q: 'ESG 등급이 높은 기업이 더 신뢰 가능하다고 보시나요?', options: ['그렇지 않다', '그렇다'] },
  // ESG 세부 선호 (보너스)
  { q: 'ESG 중 더 중요시하는 요소는 무엇인가요?', options: ['E(환경)', 'S(사회)', 'G(지배구조)'] },
];

const scoreMapping = {
  0: { 0: '안정형', 1: '수익형' },
  1: { 0: '안정형', 1: '수익형' },
  2: { 0: '안정형', 1: '가치형' },
  3: { 0: '가치형', 1: '수익형' },
  4: { 0: '안정형', 1: '수익형' },
  5: { 0: '가치형', 1: '단기형' },
  6: { 0: '가치형', 1: '성장형' },
  7: { 0: null, 1: '성장형' },
  8: { 0: null, 1: '성장형' },
  9: { 0: '가치형', 1: null },
  10: { 0: null, 1: '가치형' },
  11: { 0: null, 1: '가치형' },
  12: { 0: null, 1: '고배당형' },
  13: { 0: null, 1: '고배당형' },
  14: { 0: null, 1: '고배당형' },
  15: { 0: null, 1: '단기형' },
  16: { 0: null, 1: '단기형' },
  17: { 0: null, 1: '단기형' },
  18: { 0: null, 1: 'ESG형' },
  19: { 0: null, 1: 'ESG형' },
  20: { 0: 'E중시형', 1: 'S중시형', 2: 'G중시형' }, // ESG 세부
};

const SurveyModal = ({ onClose, onSubmit }) => {
  const [answers, setAnswers] = useState(Array(questions.length).fill(null));

  const [scoreMap, setScoreMap] = useState({
    안정형: 0,
    수익형: 0,
    성장형: 0,
    가치형: 0,
    고배당형: 0,
    단기형: 0,
    ESG형: 0,
    E중시형: 0,
    S중시형: 0,
    G중시형: 0,
  });
  const [showChart, setShowChart] = useState(false);

  const handleSelect = (qIdx, optIdx) => {
    const updated = [...answers];
    updated[qIdx] = optIdx;
    setAnswers(updated);
  };

  const handleSubmit = () => {
    const newScoreMap = {
      안정형: 0,
      수익형: 0,
      성장형: 0,
      가치형: 0,
      고배당형: 0,
      단기형: 0,
      ESG형: 0,
      E중시형: 0,
      S중시형: 0,
      G중시형: 0,
    };
  
    const typeQuestionCounts = {
      안정형: 3,
      수익형: 3,
      성장형: 3,
      가치형: 5,
      고배당형: 3,
      단기형: 4,
      ESG형: 2, // 보정 포함
      // ESG 세부(E/S/G)는 정규화 제외
    };
  
    // 점수 집계
    answers.forEach((ans, idx) => {
      if (ans === null || !scoreMapping[idx]) return;
      const keyword = scoreMapping[idx][ans];
  
      // ESG 세부 선호 문항 (마지막)은 필터용
      if (idx === 20 && keyword) {
        newScoreMap[keyword] += 1;
        return;
      }
  
      // 점수 누적
      if (keyword && newScoreMap[keyword] !== undefined) {
        if (keyword === 'ESG형') {
          newScoreMap[keyword] += 1.5;
        } else {
          newScoreMap[keyword] += 1;
        }
      }
    });
  
    // 정규화 처리
    Object.entries(typeQuestionCounts).forEach(([type, count]) => {
      if (count > 0 && newScoreMap[type] > 0) {
        newScoreMap[type] = newScoreMap[type] / count;
      }
    });
  
    // 상위 2개 키워드
    const topKeywords = Object.entries(newScoreMap)
      .filter(([k]) => !['E중시형', 'S중시형', 'G중시형'].includes(k))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([k]) => k);
  
    // ESG 선호 항목 추출
    let esgPref = null;
    if (newScoreMap['E중시형'] > 0) esgPref = 'E(환경)';
    else if (newScoreMap['S중시형'] > 0) esgPref = 'S(사회)';
    else if (newScoreMap['G중시형'] > 0) esgPref = 'G(지배구조)';
  
    setScoreMap(newScoreMap);
    setShowChart(true);
    onSubmit(topKeywords, esgPref, newScoreMap);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-xl w-full max-h-[80vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">🧠 투자 성향 설문</h3>
        {questions.map((q, idx) => (
          <div key={idx} className="mb-4">
            <p className="font-medium">{idx + 1}. {q.q}</p>
            <div className="mt-2 space-y-1">
              {q.options.map((opt, optIdx) => (
                <label key={optIdx} className="block">
                  <input
                    type="radio"
                    name={`q${idx}`}
                    checked={answers[idx] === optIdx}
                    onChange={() => handleSelect(idx, optIdx)}
                    className="mr-2"
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        ))}
        <div className="flex justify-end gap-2 mt-6">
          <button className="text-gray-500" onClick={onClose}>닫기</button>
          <button
            onClick={handleSubmit}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            성향 분석하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default SurveyModal;
