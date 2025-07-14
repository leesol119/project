import React from 'react';

const ESGSummaryCard = ({
  grades,
  industryGrades,
  envIndicators,
  socialIndicators
}) => {
  const gradeToScore = (grade) => {
    const map = { S: 7, "A+": 6, A: 5, "B+": 4, B: 3, C: 2, D: 1, "N/A": 0, "-": 0 };
    return map[String(grade).trim()] ?? 0;
  };

  const calculateESGGradeScore = (grade) => {
    if (typeof grade === 'number') {
      // 업종 평균 등급 (예: 3.57)
      return Math.round((grade / 7) * 100);
    }
    const score = gradeToScore(grade); // 문자열 등급
    return Math.round((score / 7) * 100);
  };

  const calculateRelativeScore = (companyVal, industryAvg, direction = 'high') => {
    if (companyVal == null || industryAvg == null || industryAvg === 0) return 0;
    const ratio = companyVal / industryAvg;

    if (direction === 'low') {
      if (ratio <= 0.8) return 100;
      if (ratio <= 1.2) return 70;
      return 40;
    }
    if (direction === 'high') {
      if (ratio >= 1.2) return 100;
      if (ratio >= 0.8) return 70;
      return 40;
    }
    if (direction === 'neutral') {
      const diff = Math.abs(ratio - 1);
      if (diff <= 0.2) return 100;
      if (diff <= 0.4) return 70;
      return 40;
    }

    return 0;
  };

  const scoreToLabelWithColor = (score) => {
    if (score === 100) return { label: '상위 20% 이내', color: 'text-green-600' };
    if (score === 70) return { label: '업종 평균 수준', color: 'text-yellow-600' };
    if (score === 40) return { label: '하위 20% 이상', color: 'text-red-600' };
    return { label: '정보 없음', color: 'text-gray-400' };
  };

  const esgScore = calculateESGGradeScore(grades['종합등급']);
  const industryESGScore = calculateESGGradeScore(industryGrades['종합등급']);

  const gasScore = calculateRelativeScore(envIndicators['온실가스'], envIndicators['온실가스_업종평균'], 'low');
  const energyScore = calculateRelativeScore(envIndicators['에너지'], envIndicators['에너지_업종평균'], 'low');
  const envInvScore = calculateRelativeScore(envIndicators['환경투자'], envIndicators['환경투자_업종평균'], 'high');
  const femaleScore = calculateRelativeScore(socialIndicators['여성이사'], socialIndicators['여성이사_업종평균'], 'high');
  const directorScore = calculateRelativeScore(socialIndicators['사외이사'], socialIndicators['사외이사_업종평균'], 'high');
  const shareholderScore = calculateRelativeScore(socialIndicators['최대주주'], socialIndicators['최대주주_업종평균'], 'neutral');

  let weightedSum = 0;
  let weightTotal = 0;
  
  const pushScore = (score, weight) => {
    if (score !== null && score !== undefined && score !== 0 && !Number.isNaN(score)) {
      weightedSum += score * weight;
      weightTotal += weight;
    }
  };
  
  // 점수와 가중치 반영
  pushScore(esgScore, 0.4);
  pushScore(gasScore, 0.1);
  pushScore(energyScore, 0.1);
  pushScore(envInvScore, 0.1);
  pushScore(femaleScore, 0.1);
  pushScore(directorScore, 0.1);
  pushScore(shareholderScore, 0.1);
  
  // 총점 재계산
  const totalScore = weightTotal > 0 ? Math.round(weightedSum / weightTotal) : 0;

  const scoreData = [
    { label: '온실가스 배출량', score: gasScore },
    { label: '여성이사 비율', score: femaleScore },
    { label: '에너지 사용량', score: energyScore },
    { label: '사외이사 비율', score: directorScore },
    { label: '환경투자비율', score: envInvScore },
    { label: '최대주주 지분율', score: shareholderScore },
  ];

  return (
    <div className="relative group w-full flex justify-center">
      <div className="bg-white border shadow-md rounded-xl p-6 w-full md:w-[1000px] flex flex-col items-center text-center">
        <h3 className="text-lg font-semibold mb-2">ESG 종합 평가 점수</h3>
        <div className="text-4xl font-extrabold text-blue-700">{totalScore}점</div>
        <div className="text-sm text-gray-500 mb-3">
        <br></br>
          ESG 등급 점수: {esgScore}점 / 업종 평균: {industryESGScore}점
          
        </div>
        
        <hr className="my-3" />
        <div className="grid grid-cols-2 gap-y-1 gap-x-8 text-sm">
          {scoreData.map(({ label, score }) => {
            const { label: text, color } = scoreToLabelWithColor(score);
            return (
              <div key={label}>
                {label}: <span className={`font-semibold ${color}`}>{text}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 툴팁 박스 */}
      <div className="absolute right-[-100px] top-2 z-10 hidden group-hover:block bg-white text-gray-800 text-sm max-w-[520px] rounded shadow-lg p-4 leading-relaxed border border-gray-300 min-w-[400px] ">

        <div className="font-semibold text-base mb-2">📘 ESG 종합 점수 평가 기준</div>
        
        <div className="mb-2">
            <span className="font-semibold">총점 100점</span> = ESG 등급 40% + 환경 30% + 사회/지배구조 30%
        </div>

        <div className="mb-2">
            ESG 등급은 <b>절대평가</b>, 나머지는 <b>상대평가</b>
        </div>

        <div className="mb-1 font-semibold">상대평가 기준 (업종 평균 대비 비율):</div>
        <div className="ml-3 mb-1 text-green-700">• 0.8 이하 (20% 이상 낮음) → 100점</div>
        <div className="ml-3 mb-1 text-yellow-600">• 0.8 ~ 1.2 (±20% 이내) → 70점</div>
        <div className="ml-3 mb-3 text-red-600">• 1.2 초과 (20% 이상 높음) → 40점</div>

        <div className="mb-1"><b>온실가스/에너지 사용량</b>은 낮을수록 우수</div>
        <div className="mb-1"><b>여성이사/사외이사/환경투자</b>는 높을수록 우수</div>
        <div className="mb-1"><b>최대주주 지분율</b>은 업종 평균 ±20% 이내면 우수</div>

        <div className="text-gray-500 text-xs mt-2">※ 관련 데이터가 없는 경우 해당 지표는 계산에서 제외됨</div>
        </div>
    </div>
  );
};

export default ESGSummaryCard;