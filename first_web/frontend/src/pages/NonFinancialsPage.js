import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import ESGSummaryCard from '../components/EsgsummaryCard';


const gradeLabels = ['D', 'C', 'B', 'B+', 'A', 'A+', 'S'];
// 등급 → 점수로 변환
const convertEsgToScore = (grade) => {
  const map = { S: 7, "A+": 6, A: 5, "B+": 4, B: 3, C: 2, D: 1, "N/A": 0, "-": 0 };
  return map[String(grade).trim()] ?? 0;
};

// 필드 라벨 정의
const fieldLabels = {
  환경: '환경 등급',
  사회: '사회 등급',
  지배구조: '지배구조 등급'
};

// 퍼센트용 툴팁 포맷터
const percentTooltip = (value, name) => [`${(value * 100).toFixed(2)}%`, name];


function NonFinancialsPage() {
  
  const { companyName } = useParams();
  const [nonFinancials, setNonFinancials] = useState([]);
  const [esgTrend, setEsgTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [femaleDirectorChartData, setFemaleDirectorChartData] = useState([]);
  const [industryName, setIndustryName] = useState('');
  const [directorChartData, setDirectorChartData] = useState([]);
 const [shareholderChartData, setShareholderChartData] = useState([]);
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        const encoded = encodeURIComponent(companyName);
        const response = await axios.get(`http://localhost:8000/company/${encoded}/nonfinancials`);
        const raw = response.data;
        setNonFinancials(raw.basic || []);
        setEsgTrend(raw.analysis || []);
        setIndustryName(raw.industry_name || '');
        setFemaleDirectorChartData(raw.female_director_chart || []);
        setDirectorChartData(raw.director_ratio_chart || []);
        setShareholderChartData(raw.shareholder_ratio_chart || []);
      } catch (error) {
        setError("비재무 데이터를 불러올 수 없습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [companyName]);

  if (loading) return <div className="p-4">로딩 중...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!nonFinancials.length) return <div className="p-4">비재무 데이터가 없습니다.</div>;

  const processedData = nonFinancials.map(item => ({
    ...item,
    ESG: convertEsgToScore(item.ESG),
    originalESG: item.ESG,
    directorRatio: parseFloat(item.directorRatio) || 0,
    shareholderRatio: parseFloat(item.shareholderRatio) || 0,
    year: item.연도
  }));

  const latest = processedData[processedData.length - 1];
  const grades = {
    '종합등급': latest?.originalESG,
    '환경': esgTrend.at(-1)?.company?.['환경'],
    '사회': esgTrend.at(-1)?.company?.['사회'],
    '지배구조': esgTrend.at(-1)?.company?.['지배구조'],
  };
  const industryGrades = {
    '종합등급': esgTrend.at(-1)?.industry_avg?.['종합등급'],
    '환경': esgTrend.at(-1)?.industry_avg?.['환경'],
    '사회': esgTrend.at(-1)?.industry_avg?.['사회'],
    '지배구조': esgTrend.at(-1)?.industry_avg?.['지배구조'],
  };
  const lastValid = [...esgTrend].reverse().find(item =>
    item.sales_ratio?.['회사_온실가스'] != null &&
    item.sales_ratio?.['회사_에너지'] != null &&
    item.env_ratio?.['회사'] != null
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-14">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{companyName}의 비재무 정보</h2>

      {esgTrend.length > 0 && (
        <div>
  <ESGSummaryCard
  grades={grades}
  industryGrades={industryGrades}
  envIndicators={{
    '온실가스': lastValid?.sales_ratio?.['회사_온실가스'],
    '온실가스_업종평균': lastValid?.sales_ratio?.['업종평균_온실가스'],
    '에너지': lastValid?.sales_ratio?.['회사_에너지'],
    '에너지_업종평균': lastValid?.sales_ratio?.['업종평균_에너지'],
    '환경투자': lastValid?.env_ratio?.['회사'],
    '환경투자_업종평균': lastValid?.env_ratio?.['업종평균'],
  }}
  socialIndicators={{
    '여성이사': latest?.femaleDirectorRatio,
    '여성이사_업종평균': femaleDirectorChartData.at(-1)?.['업종평균'],
    '사외이사': latest?.directorRatio,
    '사외이사_업종평균': directorChartData.at(-1)?.['업종평균'],
    '최대주주': latest?.shareholderRatio,
    '최대주주_업종평균': shareholderChartData.at(-1)?.['업종평균'],
  }}
/>
<br></br>


          <div className="max-w-6xl mx-auto px-4 py-8 space-y-4">
          <div className="flex items-baseline gap-2">
            <h3 className="text-xl font-bold text-gray-900">ESG 등급</h3>
            <span className="text-sm text-gray-500">(KCGS 기준)</span>
          </div>
          </div>
          <hr className="border-t border-gray-300 my-2" />
          

          {/* ESG 등급 카드 + 종합등급 그래프 한 줄 배치 */}
          <div className="items-center flex flex-col md:flex-row w-full gap-x-20 mb-10">
            {/* ESG 카드 - 원형 스타일 */}
            <div className="bg-white rounded-full shadow-md border border-gray-200 w-48 h-48 flex flex-col items-center justify-center text-center">
              <h3 className="text-sm font-medium text-gray-700 mb-1">ESG 등급</h3>
              <div className="text-4xl font-bold text-blue-600">{latest?.originalESG ?? '-'}</div>
              <div className="text-xs text-gray-400 mt-1">{latest?.year}년</div>
            </div>
            

            {/* 종합등급 그래프 */}
            <div className="w-full md:w-2/3 p-5 rounded-2xl border border-blue-100 bg-blue-50 shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)]">
              <div className="flex items-baseline gap-2 mb-2">
                <h4 className="text-base font-bold leading-tight ">종합등급</h4>

              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={esgTrend.filter(d => d.year >= 2020 && d.year <= 2023).map(d => ({
                  year: d.year,
                  기업: d.company?.['종합등급'],
                  업종평균: d.industry_avg?.['종합등급']
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="year" tick={{ fill: "#6b7280", fontSize: 12 }} />
                  <YAxis domain={[1, 7]} ticks={[1, 2, 3, 4, 5, 6, 7]} tickFormatter={(v) => gradeLabels[v - 1]} tick={{ fill: "#6b7280", fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #ccc' }} labelStyle={{ fontSize: 13 }} formatter={(v, n) => [gradeLabels[Math.round(v) - 1], n === '업종 평균' ? `${industryName} 평균` : n]} />
                  <Legend verticalAlign="top" height={36} />
                  <Line type="monotone" dataKey="기업" stroke="#2563eb" strokeWidth={3} name={companyName} dot />
                  <Line type="monotone" dataKey="업종평균" stroke="	#64748b" strokeWidth={3} strokeDasharray="4 4" name="업종 평균" dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <br></br>


          {/* 환경/사회/지배구조 */}
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
                    <Line type="monotone" dataKey="기업" stroke="#8884d8" name={companyName} dot />
                    <Line type="monotone" dataKey="업종평균" stroke="#0284c7" strokeDasharray="4 4" name="업종 평균" dot />

                  </LineChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
          <br></br>
          <br></br>

          {/* 환경성과 */}
          <h3 className="text-xl font-bold mt-6 mb-4 border-b border-gray-300 pb-1">환경 지표 (E)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            

            {/* 온실가스 */}
            <div>
            <br></br>
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
                  <Line type="monotone" dataKey="기업" stroke="rgba(76, 126, 233, 0.92)" strokeWidth={3} name={companyName} dot />
                  <Line type="monotone" dataKey="업종평균" stroke="rgba(152, 211, 134, 0.92)" strokeWidth={2} strokeDasharray="4 4" name="업종 평균" dot />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 에너지 */}
            <div>
            <br></br>
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
                  <Line type="monotone" dataKey="기업" stroke="rgba(76, 126, 233, 0.92)" strokeWidth={3} name={companyName} dot />
                  <Line type="monotone" dataKey="업종평균" stroke="rgba(152, 211, 134, 0.92)" strokeWidth={2} strokeDasharray="4 4" name="업종 평균" dot />
                </LineChart>
              </ResponsiveContainer>

            </div>
            <div>
            <br></br>
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
                  <Line type="monotone" dataKey="기업" strokeWidth={3} stroke="rgba(28, 148, 68, 0.92)" name={companyName} dot />
                  <Line type="monotone" dataKey="업종평균" stroke="rgba(152, 211, 134, 0.92)" strokeWidth={2} strokeDasharray="4 4" name="업종 평균" dot />

                </LineChart>
              </ResponsiveContainer>
            </div>
            
          </div>
          <br></br>

        </div>


      )}

      <h3 className="text-xl font-bold mt-6 mb-4 border-b border-gray-300 pb-1">사회, 지배구조 지표 (S, G)</h3>

      {/* 여성이사 비율 카드 + 그래프 한 줄 배치 */}
      <div className="flex flex-col md:flex-row items-center w-full gap-6 mb-10">
        {/* 카드 */}
        <div className="bg-white h-48 rounded-lg shadow-md flex flex-col items-center justify-center w-full md:w-1/3">
            <h3 className="text-lg font-semibold mb-2">여성이사 비율</h3>
            <div className="text-3xl font-bold text-pink-600">{latest?.femaleDirectorRatio ?? '-'}%</div>
            <div className="text-xs text-gray-500 mt-1">{latest?.year}년</div>
          </div>


        {/* 그래프 */}
        <div className="w-full md:w-2/3">
          <h3 className="text-xl font-semibold mb-4">여성이사 비율</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={femaleDirectorChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(v, n) => [`${v}%`, n === '업종평균' ? `${industryName} 평균` : n]} />
              <Legend />
              <Line type="monotone" dataKey="여성이사 비율" name={companyName} strokeWidth={3} stroke="#e91e63" />
              <Line type="monotone" dataKey="업종평균" stroke="rgba(64, 66, 63, 0.92)" strokeWidth={3} strokeDasharray="4 4" name="업종 평균" dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>


        {/* 사외이사 비율 카드 + 그래프 한 줄 배치 */}
        <div className="items-center flex flex-col md:flex-row w-full gap-6 mb-10">

          {/* 카드 */}
          <div className="bg-white h-48 rounded-lg shadow-md flex flex-col items-center justify-center w-full md:w-1/3">
            <h3 className="text-lg font-semibold mb-2">사외이사 비율</h3>
            <div className="text-3xl font-bold text-green-600">{latest?.directorRatio ?? '-'}%</div>
            <div className="text-xs text-gray-500 mt-1">{latest?.year}년</div>
          </div>

          <div className="w-full md:w-2/3">
          <h3 className="text-xl font-semibold mb-4">사외이사 비율</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={directorChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(v, n) => [`${v}%`, n === '업종평균' ? `${industryName} 평균` : n]} />
              <Legend />
              <Line type="monotone" dataKey="사외이사 비율(%)" name={companyName} strokeWidth={3} stroke="#2ecc71" />
              <Line type="monotone" dataKey="업종평균" stroke="rgba(64, 66, 63, 0.92)" strokeWidth={3} strokeDasharray="4 4" name="업종 평균" dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

        
        {/* 최대주주 지분율 카드 + 그래프 한 줄 배치 */}
        <div className="items-center flex flex-col md:flex-row w-full gap-6 mb-10">
          {/* 카드 */}
          <div className="bg-white h-48 rounded-lg shadow-md flex flex-col items-center justify-center w-full md:w-1/3">
            <h3 className="text-lg font-semibold mb-2">최대주주 지분율</h3>
            <div className="text-3xl font-bold text-yellow-600">{latest?.shareholderRatio ?? '-'}%</div>
            <div className="text-xs text-gray-500 mt-1">{latest?.year}년</div>
          </div>

          {/* 그래프 */}
          <div className="w-full md:w-2/3">
          <h3 className="text-xl font-semibold mb-4">최대주주 지분율</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={shareholderChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(v, n) => [`${v}%`, n === '업종평균' ? `${industryName} 평균` : n]} />
              <Legend />
              <Line type="monotone" dataKey="최대주주지분율" name={companyName} strokeWidth={3} stroke="#f1c40f" />
              <Line type="monotone" dataKey="업종평균" stroke="rgba(64, 66, 63, 0.92)" strokeWidth={2} strokeDasharray="4 4" name="업종 평균" dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
        




    </div>
  );
}

export default NonFinancialsPage;