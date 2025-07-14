import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "./components/Header";

const environmentIndicators = [
  { code: "KBZ-EN00", name: "환경경영 전략" },
  { code: "KBZ-EN11", name: "환경경영 체계" },
  { code: "KBZ-EN12", name: "환경 투자" },
  { code: "KBZ-EN13", name: "환경 컴플라이언스" },
  { code: "KBZ-EN21", name: "원부자재" },
  { code: "KBZ-EN22", name: "온실가스 및 에너지" },
  { code: "KBZ-EN23", name: "폐기물 및 재활용" },
  { code: "KBZ-EN24", name: "수자원" },
  { code: "KBZ-EN25", name: "대기오염물질" },
  { code: "KBZ-EN26", name: "생물다양성" }
];

function EnvironmentIndicatorsPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <Header />
      <br></br>
      <br></br>
      <h1 className="text-2xl font-bold mb-6">환경</h1>
      <hr></hr>
      <br></br>
      <div className="grid grid-cols-2 gap-4">
        {environmentIndicators.map((indicator) => (
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

export default EnvironmentIndicatorsPage;
