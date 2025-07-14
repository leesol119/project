import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const gradeLabels = ['D', 'C', 'B', 'B+', 'A', 'A+', 'S'];

const fieldLabels = {
  '종합등급': '종합등급',
  '환경': '환경(E)',
  '사회': '사회(S)',
  '지배구조': '지배구조(G)'
};

function AnalysisPage() {
  const { companyName } = useParams();
  const [esgTrend, setEsgTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrend = async () => {
      try {
        const encoded = encodeURIComponent(companyName);
        const res = await axios.get(`http://localhost:8000/company/${encoded}/analysis`);
        setEsgTrend(res.data);
      } catch (err) {
        console.error("ESG 추이 로딩 실패:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrend();
  }, [companyName]);

  const industryName = esgTrend[0]?.industry_name || '업종 평균';

  if (loading) return <div className="p-4">로딩 중...</div>;
  if (!esgTrend || esgTrend.length === 0) return <div className="p-4 text-red-500">ESG 데이터 없음</div>;

  const customTooltip = (value, name) => {
    const label = name === '업종 평균' ? `${industryName} 평균` : name;
    return [value, label];
  };

  const percentTooltip = (value, name) => {
    const label = name === '업종 평균' ? `${industryName} 평균` : name;
    return [`${(value * 100).toFixed(2)}%`, label];
  };

  return (
    <div className="p-6">

      {/* ✅ ESG 등급 영역 */}
      <h3 className="text-xl font-bold mt-6 mb-4 border-b border-gray-300 pb-1">
        ESG 등급
      </h3>

      {/* 종합등급 */}
      <div className="mb-10 w-full flex justify-center">
        <div className="w-[80%]">
          <div className="flex justify-center items-baseline mb-2 gap-2">
            <h4 className="text-base font-bold text-center leading-tight">종합등급</h4>
            <span className="text-sm text-gray-500">(KCGS 기준)</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={esgTrend.filter(d => d.year >= 2020 && d.year <= 2023).map(d => ({
              year: d.year,
              기업: d.company?.['종합등급'],
              업종평균: d.industry_avg?.['종합등급']
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis domain={[1, 7]} ticks={[1, 2, 3, 4, 5, 6, 7]} tickFormatter={(v) => gradeLabels[v - 1]} />
              <Tooltip formatter={(v, n) => [gradeLabels[Math.round(v) - 1], n === '업종 평균' ? `${industryName} 평균` : n]} />
              <Legend />
              <Line type="linear" dataKey="기업" stroke="#8884d8" name={companyName} dot />
              <Line type="linear" dataKey="업종평균" stroke="#82ca9d" name="업종 평균" dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 환경/사회/지배구조 3개 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
        {['환경', '사회', '지배구조'].map((field) => (
          <div key={field}>
            <h4 className="text-base font-bold mb-2 text-center">{fieldLabels[field]}</h4>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={esgTrend.filter(d => d.year >= 2020 && d.year <= 2023).map(d => ({
                year: d.year,
                기업: d.company?.[field],
                업종평균: d.industry_avg?.[field]
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis domain={[1, 7]} ticks={[1, 2, 3, 4, 5, 6, 7]} tickFormatter={(v) => gradeLabels[v - 1]} />
                <Tooltip formatter={(v, n) => [gradeLabels[Math.round(v) - 1], n === '업종 평균' ? `${industryName} 평균` : n]} />
                <Legend />
                <Line type="linear" dataKey="기업" stroke="#8884d8" name={companyName} dot />
                <Line type="linear" dataKey="업종평균" stroke="#82ca9d" name="업종 평균" dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      {/* ✅ 환경성과 영역 */}
      <h3 className="text-xl font-bold mt-6 mb-4 border-b border-gray-300 pb-1">
        환경성과 지표
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* 환경투자비율 */}
        <div>
          <h4 className="text-base font-bold mb-2 text-center leading-tight">
            환경투자비율<br />
            <span className="text-sm font-normal text-gray-500">(환경투자금액 / 설비투자금액)</span>
          </h4>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={esgTrend.filter(d => d.year >= 2019 && d.year <= 2023).map(d => ({
              year: d.year,
              기업: d.env_ratio?.['회사'],
              업종평균: d.env_ratio?.['업종평균']
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={(v) => `${(v * 100).toFixed(1)}%`} />
              <Tooltip formatter={percentTooltip} />
              <Legend />
              <Line type="linear" dataKey="기업" stroke="#ff7f50" name={companyName} dot />
              <Line type="linear" dataKey="업종평균" stroke="#00b894" name="업종 평균" dot />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 온실가스 */}
        <div>
          <h4 className="text-base font-bold mb-2 text-center leading-tight">
            매출 10억 원당 온실가스 배출량<br />
            <span className="text-sm font-normal text-gray-500">(ton CO₂ / 10억 원)</span>
          </h4>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={esgTrend.filter(d => d.year >= 2019 && d.year <= 2023).map(d => ({
              year: d.year,
              기업: d.sales_ratio?.['회사_온실가스'] ? d.sales_ratio['회사_온실가스'] * 1e9 : null,
              업종평균: d.sales_ratio?.['업종평균_온실가스'] ? d.sales_ratio['업종평균_온실가스'] * 1e9 : null
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={(v) => v.toFixed(2)} />
              <Tooltip formatter={(v, n) => [`${v.toFixed(2)} ton CO₂`, n === '업종 평균' ? `${industryName} 평균` : n]} />
              <Legend />
              <Line type="linear" dataKey="기업" stroke="#8884d8" name={companyName} dot />
              <Line type="linear" dataKey="업종평균" stroke="#82ca9d" name="업종 평균" dot />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 에너지 */}
        <div>
          <h4 className="text-base font-bold mb-2 text-center leading-tight">
            매출 10억 원당 에너지 사용량<br />
            <span className="text-sm font-normal text-gray-500">(TJ / 10억 원)</span>
          </h4>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={esgTrend.filter(d => d.year >= 2019 && d.year <= 2023).map(d => ({
              year: d.year,
              기업: d.sales_ratio?.['회사_에너지'] ? d.sales_ratio['회사_에너지'] * 1e9 : null,
              업종평균: d.sales_ratio?.['업종평균_에너지'] ? d.sales_ratio['업종평균_에너지'] * 1e9 : null
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={(v) => v.toFixed(2)} />
              <Tooltip formatter={(v, n) => [`${v.toFixed(2)} TJ`, n === '업종 평균' ? `${industryName} 평균` : n]} />
              <Legend />
              <Line type="linear" dataKey="기업" stroke="#f39c12" name={companyName} dot />
              <Line type="linear" dataKey="업종평균" stroke="#2ecc71" name="업종 평균" dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default AnalysisPage;