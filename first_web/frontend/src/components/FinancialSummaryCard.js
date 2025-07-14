import React from 'react';

const levelColors = {
  우수: 'text-green-600',
  양호: 'text-yellow-500',
  위험: 'text-red-500',
};

const FinancialSummaryCard = ({
  type,
  percentile,
  scoreDetails = []
}) => {
  const percentileText = percentile !== undefined ? (
  <p className="text-base text-gray-700 mb-1">
    동종업계 상위{" "}
    <span className="text-blue-700 font-bold text-xl">
      {percentile.toFixed(1)}%
    </span>
    입니다
  </p>
) : (
  <p className="text-sm text-gray-400 mb-1">퍼센타일 정보 없음</p>
)
    
    
  // ✅ 점수 계산 함수
  const scoreToValue = (label, level) => {
    if (["FCF", "EPS(기본)"].includes(label)) {
      return level === "우수" ? 3 : level === "위험" ? 1 : null;
    }
    if (level === "우수") return 3;
    if (level === "양호") return 2;
    if (level === "위험") return 1;
    return null;
  };

  let totalScore = 0;
  let validCount = 0;
  const scoreCount = { 우수: 0, 양호: 0, 위험: 0 };

  scoreDetails.forEach(({ label, level }) => {
    const value = scoreToValue(label, level);
    if (value !== null) {
      totalScore += value;
      validCount++;
    }

    if (["FCF", "EPS(기본)"].includes(label)) {
      if (level === "우수") scoreCount["우수"]++;
      else if (level === "위험") scoreCount["위험"]++;
    } else {
      if (["우수", "양호", "위험"].includes(level)) {
        scoreCount[level]++;
      }
    }
  });

  // ✅ 평균 점수로 등급 판정
  let rating = "-";
  if (validCount > 0) {
    const avgScore = totalScore / validCount;
    if (avgScore >= 2.5) rating = "우수";
    else if (avgScore >= 1.5) rating = "양호";
    else rating = "위험";
  }

  const color = levelColors[rating] || "text-gray-400";

  return (
    <div className="w-52 h-auto flex flex-col items-center text-center">
      <div className="w-44 h-44 rounded-full flex flex-col justify-center items-center shadow-lg border border-gray-300 bg-white mb-4">
        <div className="text-lg text-gray-600">{type}</div>
        <div className={`text-2xl font-bold ${color}`}>
          {rating}
        </div>
      </div>

   

    {percentile !== undefined ? (
        <p className="text-base text-gray-700 mb-1">
            동종업계 상위{" "}
            <span className="text-blue-700 font-bold text-xl">
            {(100 - percentile).toFixed(1)}%
            </span>
            입니다
        </p>
        ) : (
        <p className="text-sm text-gray-400 mb-1">퍼센타일 정보 없음</p>
    )}
        
    
            <br/>
        <hr className="border-t border-gray-300 w-full my-3" />
            <br/>

      {/* ✅ 등급별 항목 리스트 출력 */}
      {scoreDetails.length > 0 && (
        <div className="mt-2 space-y-2 text-sm w-full">
          {["우수", "양호", "위험"].map((lvl) => {
            const items = scoreDetails
              .filter(({ label, level }) => {
                if (["FCF", "EPS(기본)"].includes(label)) {
                  return level === lvl && (lvl === "우수" || lvl === "위험");
                }
                return level === lvl;
              })
              .map(({ label }) => label);

            if (items.length === 0) return null;

            return (
              <div key={lvl} className="flex items-start text-sm">
                <p className={`w-20 font-semibold ${levelColors[lvl]}`}>
                  {lvl} : {items.length}개
                </p>
                <p className="text-gray-800 text-xs flex-1 break-words">
                  {items.map((label, i) => (
                    <span key={label}>
                      {i > 0 && ' · '} {label}
                    </span>
                  ))}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FinancialSummaryCard;
