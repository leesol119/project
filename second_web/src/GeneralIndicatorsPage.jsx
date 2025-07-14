import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "./components/Header";

const generalIndicators = [
  { code: "KBZ-SR10", name: "이 보고서에 대하여" },
  { code: "KBZ-SR21", name: "CEO 메시지" },
  { code: "KBZ-SR22", name: "회사 개요" },
  { code: "KBZ-SR23", name: "경제적 가치 창출 및 분배" },
  { code: "KBZ-SR24", name: "ESG 경영 비전 및 성과" },
  { code: "KBZ-SR30", name: "이해관계자 소통 및 중요성 평가" },
];

function GeneralIndicatorsPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <Header />
      <br></br>
      <br></br>
      <h1 className="text-2xl font-bold mb-6">지속가능성 보고 일반</h1>
      <div className="grid grid-cols-2 gap-4">
        {generalIndicators.map((indicator) => (
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

export default GeneralIndicatorsPage;
