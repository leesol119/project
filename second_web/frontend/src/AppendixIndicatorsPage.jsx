import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "./components/Header";

const appendixIndicators = [
  { code: "KBZ-AP11", name: "GRI Content Index" },
  { code: "KBZ-AP12", name: "SASB Table" },
  { code: "KBZ-AP20", name: "지속가능경영 이니셔티브" },
  { code: "KBZ-AP30", name: "제3자 검증 성명서" }
];


function AppendixIndicatorsPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <Header />
      <h1 className="text-2xl font-bold mb-6">부록</h1>
      <div className="grid grid-cols-2 gap-4">
        {appendixIndicators.map((indicator) => (
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

export default AppendixIndicatorsPage;
