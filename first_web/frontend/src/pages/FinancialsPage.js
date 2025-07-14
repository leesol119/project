import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import FavoriteButton from '../components/FavoriteButton';
import FinancialChartWithRating from '../components/FinancialChartWithRating';
import FinancialSummaryCard from '../components/FinancialSummaryCard';

function FinancialsPage() {
  const { companyName } = useParams();
  const [financials, setFinancials] = useState(null);
  const [averages, setAverages] = useState({});
  const [industryName, setIndustryName] = useState("");
  const [percentiles, setPercentiles] = useState({});
  const [summaryRatings, setSummaryRatings] = useState({
    안정성: null,
    수익성: null,
    성장성: null,
  });
  const [error, setError] = useState(null);
  const [summaryPercentiles, setSummaryPercentiles] = useState({});


  const charts = [
    { key: "영업이익률", apiKey: "영업이익률", title: "영업이익률(6개년)" },
    { key: "매출액증가율", apiKey: "매출액증가율", title: "매출액증가율(5개년)" },
    { key: "이익증가율", apiKey: "이익증가율", title: "이익증가율(5개년)" },
    { key: "자산증가율", apiKey: "자산증가율", title: "자산증가율(5개년)" },
    { key: "자본유보율", apiKey: "자본유보율", title: "자본유보율(6개년)" },
    { key: "자기자본비율", apiKey: "자기자본비율", title: "자기자본비율(6개년)" },
    { key: "부채비율", apiKey: "부채비율", title: "부채비율(6개년)" },
    { key: "ROE(%)", apiKey: "ROE", title: "ROE(6개년)" },
    { key: "ROA(%)", apiKey: "ROA", title: "ROA(6개년)" },
    { key: "EPS(기본)", apiKey: "EPS", title: "EPS(6개년)" },
    { key: "FCF", apiKey: "FCF", title: "FCF(6개년)" },
  ];

  const categories = {
    안정성: ["부채비율", "자기자본비율", "자본유보율"],
    수익성: ["영업이익률", "ROE(%)", "ROA(%)", "EPS(기본)", "FCF"],
    성장성: ["매출액증가율", "이익증가율", "자산증가율"],
  };

  const ratingCriteria = {
    "영업이익률": (v) => v >= 10 ? "우수" : v >= 5 ? "양호" : "위험",
    "ROE(%)": (v) => v >= 15 ? "우수" : v >= 7 ? "양호" : "위험",
    "ROA(%)": (v) => v >= 7 ? "우수" : v >= 3 ? "양호" : "위험",
    "EPS(기본)": (v) => v > 0 ? "우수" : "위험",
    "FCF": (v) => v > 0 ? "우수" : "위험",
    "매출액증가율": (v) => v >= 10 ? "우수" : v >= 3 ? "양호" : "위험",
    "이익증가율": (v) => v >= 10 ? "우수" : v >= 3 ? "양호" : "위험",
    "자산증가율": (v) => v >= 10 ? "우수" : v >= 5 ? "양호" : "위험",
    "부채비율": (v) => v <= 100 ? "우수" : v <= 200 ? "양호" : "위험",
    "자기자본비율": (v) => v >= 50 ? "우수" : v >= 30 ? "양호" : "위험",
    "자본유보율": (v) => v >= 1000 ? "우수" : v >= 500 ? "양호" : "위험",
  };

  const tooltipMap = {
    "영업이익률": "우수: 10% 이상 / 양호: 5~10% / 위험: 5% 미만",
    "ROE(%)": "우수: 15% 이상 / 양호: 7~15% / 위험: 7% 미만",
    "ROA(%)": "우수: 7% 이상 / 양호: 3~7% / 위험: 3% 미만",
    "EPS(기본)": "우수: 0 이상 / 위험: 0 이하",
    "FCF": "우수: 0 이상 / 위험: 0 이하",
    "매출액증가율": "우수: 10% 이상 / 양호: 3~10% / 위험: 3% 미만",
    "이익증가율": "우수: 10% 이상 / 양호: 3~10% / 위험: 3% 미만",
    "자산증가율": "우수: 10% 이상 / 양호: 5~10% / 위험: 5% 미만",
    "부채비율": "우수: 100% 이하 / 양호: 100~200% / 위험: 200% 초과",
    "자기자본비율": "우수: 50% 이상 / 양호: 30~50% / 위험: 30% 미만",
    "자본유보율": "우수: 1000% 이상 / 양호: 500~1000% / 위험: 500% 미만",
  };

  const sourceFields = {
    "부채비율": ["부채총계", "자본총계"],
    "자기자본비율": ["자본총계", "자산총계"],
    "자본유보율": ["이익잉여금", "자본금"],
    "영업이익률": ["영업이익", "매출액"],
    "ROE(%)": ["당기순이익", "자본총계"],
    "ROA(%)": ["당기순이익", "자산총계"],
    "EPS(기본)": ["EPS(기본)"],
    "FCF": ["영업활동현금흐름", "CAPEX"],
    "매출액증가율": ["매출액"],
    "이익증가율": ["영업이익"],
    "자산증가율": ["자산총계"],
  };

  const formatLargeNumber = (num) => {
    if (num >= 1e12) return (num / 1e12).toFixed(1) + "조";
    if (num >= 1e8) return (num / 1e8).toFixed(1) + "억";
    if (num >= 1e4) return (num / 1e4).toFixed(1) + "만";
    return num.toLocaleString();
  };

  const transformData = (key, apiKey = key) => {
    return financials.map((entry) => {
      const avgEntry = averages[apiKey]?.find(a => a.year === entry["연도"]);
      const value = entry[key] ?? 0;
      return {
        year: entry["연도"],
        value,
        average: avgEntry?.average ?? null,
      };
    });
  };

  const getSummaryRating = (keys) => {
    const grades = keys.map((key) => {
      const transformed = transformData(key);
      const latest = transformed.at(-1)?.value;
      return ratingCriteria[key]?.(latest);
    }).filter(Boolean);

    const count = { 우수: 0, 양호: 0, 위험: 0 };
    grades.forEach((g) => count[g]++);

    if (count["위험"] >= 2) return "위험";
    if (count["우수"] >= 2) return "우수";
    return "양호";
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const encoded = encodeURIComponent(companyName);

        const [companyRes, ...avgResList] = await Promise.all([
          axios.get(`http://localhost:8000/company/${encoded}/financials`),
          ...charts.map(({ apiKey }) =>
            axios
              .get(`http://localhost:8000/average/${encodeURIComponent(apiKey)}/by-gics?company_name=${encoded}`)
              .catch(() => null)
          )
        ]);

        const companyData = companyRes.data;
        const avgMap = {};

        charts.forEach(({ key, apiKey }, idx) => {
          const res = avgResList[idx];
          if (res && res.data) {
            avgMap[apiKey] = res.data.data;
        
            // industryName 설정
            if (!industryName && res.data.industry_name) {
              setIndustryName(res.data.industry_name);
            }
          }
        });

        setFinancials(companyData);
        setAverages(avgMap);
      } catch (err) {
        console.error('데이터 로딩 오류:', err);
        setError('데이터를 불러오는 데 실패했습니다.');
      }
    };

    fetchData();
  }, [companyName]);

  useEffect(() => {
    if (!financials) return;
    setSummaryRatings({
      안정성: getSummaryRating(categories.안정성),
      수익성: getSummaryRating(categories.수익성),
      성장성: getSummaryRating(categories.성장성),
    });
  }, [financials]);


  useEffect(() => {
  const fetchMetricPercentiles = async () => {
    const encoded = encodeURIComponent(companyName);
    const keys = charts.map((c) => c.apiKey);
    const result = {};

    await Promise.all(
      keys.map((key) =>
        axios
          .get(`http://localhost:8000/percentile/${encodeURIComponent(key)}/${encoded}`)
          .then((res) => {
            result[key] = res.data;
          })
          .catch(() => {})
      )
    );

    setPercentiles(result);
  };

  fetchMetricPercentiles();
}, [companyName]);

  useEffect(() => {
  const fetchSummaryPercentiles = async () => {
    const encoded = encodeURIComponent(companyName);
    const categoriesToFetch = ["안정성", "수익성", "성장성"];

    const results = await Promise.all(
      categoriesToFetch.map((cat) =>
        axios
          .get(`http://localhost:8000/percentile-summary/${encodeURIComponent(cat)}/${encoded}`)
          .then(res => {
            console.log(`✅ ${cat} 응답:`, res.data); // 👈 확인 포인트
            return { key: cat, data: res.data };
          })
          .catch((e) => {
            console.warn(`❌ ${cat} 요약 퍼센타일 에러`, e);
            return null;
          })
      )
    );

    const map = {};
    results.forEach(r => {
      if (r) map[r.key] = r.data;
    });

    console.log("📊 요약 퍼센타일 map:", map); // 👈 확인 포인트
    setSummaryPercentiles(map);
  };

  fetchSummaryPercentiles();
}, [companyName]);

  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!financials) return <div className="p-4">로딩 중...</div>;

 return (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
      {companyName} 재무정보
      <FavoriteButton companyName={companyName} />
    </h2>
    

    {/* ✅ 여기에 붙이세요 */}
    <div className="bg-gray-50 p-8 rounded-xl shadow-md mb-10">
      <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">재무 종합 평가</h3>

      <div className="flex flex-wrap justify-center gap-40">
        {["안정성", "수익성", "성장성"].map((type) => {

          const rawData = summaryPercentiles[type];
          const percentile = rawData?.rank && rawData?.total
            ? (1 - rawData.rank / rawData.total) * 100
            : undefined;

          
          
          // ✅ scoreDetails 계산
          const scoreDetails = categories[type].map((key) => {
            const transformed = transformData(key);
            const latest = transformed.at(-1)?.value;
            const level = ratingCriteria[key]?.(latest) ?? "정보 없음";
            return { label: key, level };
          });

          return (
            <FinancialSummaryCard
              key={type}
              type={type}
              percentile={percentile}
              scoreDetails={scoreDetails}
            />
          );
        })}
      </div>
  </div>      
    <p className="text-sm text-gray-500 text-center mt-[-12px]">
      2024년 데이터를 기반으로 안정성·수익성·성장성을 평가한 결과입니다.
    </p>
    <br />

    {/* ✅ 구분선 + 여백 추가 */}
    <hr className="border-t border-gray-300 my-8" />

    <h3 className="text-2xl font-bold mb-6 text-gray-800">세부 항목별 평가</h3>


    {/* 카테고리별 차트 그룹 */}
    {Object.entries(categories).map(([category, keys], index) => {
      const chartItems = charts.filter(({ key }) => keys.includes(key));

      return (
        <div key={category} className="mb-12">
          {index > 0 && <hr className="border-t border-gray-300 my-8" />}

          <h3 className="text-xl font-bold mb-4 text-gray-800">{category}</h3>

          <table className="w-full text-base text-gray-800 border-collapse leading-relaxed">
            <thead>
              <tr className="bg-gray-100 text-gray-700 border-b">
                <th className="text-left px-4 py-2 font-semibold">항목</th>
                {financials.slice(-3).map((f) => (
                  <th key={f["연도"]} className="text-right px-4 py-2 font-semibold">
                    {f["연도"]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {keys.flatMap((key) =>
                (sourceFields[key] || []).map((field, i) => (
                  <tr key={key + field} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2 font-medium">{field}</td>
                    {financials.slice(-3).map((f, idx) => (
                      <td key={idx} className="text-right px-4 py-2 whitespace-nowrap">
                        {f[field] !== undefined && f[field] !== null
                          ? formatLargeNumber(f[field])
                          : "-"}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>

            <br/> <br/> 


          <div className="col-span-2 grid grid-cols-2 gap-6">
          {chartItems.map(({ key, apiKey, title }) => {
              const transformed = transformData(key, apiKey);
              const latest = transformed.at(-1);
              const value = latest?.value ?? 0;
              const grade = ratingCriteria[key]?.(value) ?? "정보 없음";
              const label = title.replace(/\(.*?\)/, '');

              return (
                <div key={key} className="flex justify-between items-center gap-4 p-2">
                  <FinancialChartWithRating
                    data={transformed}
                    title={title}
                    industryName={industryName}
                  />
                  <div className="w-28 h-24 flex flex-col justify-center items-center rounded-xl border shadow text-center">
                    <div className="text-sm font-medium text-gray-700">{label}</div>
                    <div
                      className={`text-xl font-bold ${
                        grade === "우수" ? "text-green-700" :
                        grade === "양호" ? "text-yellow-500" :
                        "text-red-600"
                      }`}
                      title={tooltipMap[label]}
                    >
                      {grade}
                    </div>
                    <div className="text-xs text-gray-500 mt-1"
                      title={
                        typeof percentiles[apiKey]?.percentile === "number"
                          ? `동종업계 ${percentiles[apiKey].total}개 기업 중 ${percentiles[apiKey].rank}위입니다`
                          : ""
                      }
                    >
                      {typeof percentiles[apiKey]?.percentile === "number"
                        ? `상위 ${(100 - percentiles[apiKey].percentile).toFixed(1)}%`
                        : "2024년 기준"}
                    </div>
                        



                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    })}
  </div>
);
}

export default FinancialsPage;