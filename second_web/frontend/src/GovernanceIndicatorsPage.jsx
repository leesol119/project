import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "./components/Header";

const governanceIndicators = [
  { code: "KBZ-GV00", name: "지배구조 경영전략" },
  { code: "KBZ-GV11", name: "이사회 구조" },
  { code: "KBZ-GV12", name: "이사회 활동 성과" },
  { code: "KBZ-GV13", name: "이사회 성과 평가 및 보상" },
  { code: "KBZ-GV14", name: "지배구조 컴플라이언스" },
  { code: "KBZ-GV21", name: "윤리규정 및 지침" },
  { code: "KBZ-GV22", name: "윤리 모니터링" },
  { code: "KBZ-GV23", name: "윤리 컴플라이언스" },
];


function GovernanceIndicatorsPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <Header />
      <br></br>
      <br></br>
      <h1 className="text-2xl font-bold mb-6">지배구조</h1>
      <hr></hr>
      <br></br>
      <div className="grid grid-cols-2 gap-4">
        {governanceIndicators.map((indicator) => (
          <button
            key={indicator.code}
            onClick={() => navigate(`/write/indicator/${indicator.code}`)}
            className="border rounded-xl p-4 hover:bg-green-100 text-left"
          >
            <strong>{indicator.code}</strong> <br />
            {indicator.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default GovernanceIndicatorsPage;
