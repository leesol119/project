import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { LineChart, AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function StockPage() {
  const { companyName } = useParams();
  const [stockData, setStockData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('1일');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sharpTrend, setSharpTrend] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const encodedCompanyName = encodeURIComponent(companyName);
      const response = await axios.get(`http://localhost:8000/company/${encodedCompanyName}/stock`);
      if (!response.data || Object.keys(response.data).length === 0) {
        throw new Error('데이터가 없습니다.');
      }
      setStockData(response.data);
    } catch (error) {
      console.error('데이터 로딩 오류:', error);
      setError(error.response?.data?.detail || '데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSharpData = async () => {
    try {
      const encodedName = encodeURIComponent(companyName);
      const res = await axios.get(`http://localhost:8000/company/${encodedName}/sharp`);
      
      // 🔍 필드명 매핑 + null 처리 + 숫자형 변환
      const cleaned = res.data.map((d) => ({
        연도: d.연도,
        SharpRatio: parseFloat(d.SharpRatio ?? 0),
        MDD: parseFloat(d.MDD ?? 0),
        "개별 종목 수익률 - 종합지수 수익률": parseFloat(d["개별 종목 수익률 - 종합지수 수익률"] ?? 0),
        "업종별 수익률 - 종합지수 수익률": parseFloat(d["업종별 수익률 - 종합지수 수익률"] ?? 0),
      }));
  
      console.log("📊 sharpTrend 확인:", cleaned);
      setSharpTrend(cleaned);
  
    } catch (err) {
      console.error("Sharp 데이터 로딩 오류:", err);
      setSharpTrend([]);
    }
  };
  

  useEffect(() => {
    if (!companyName || companyName === 'undefined' || companyName.trim() === '') {
      setError('회사명이 올바르지 않습니다. 검색창에서 회사명을 입력해주세요.');
      setLoading(false);
      return;
    }

    fetchData(); // 최초 1회 실행
    fetchSharpData();

    let intervalId;
    if (selectedPeriod === '1일') {
      intervalId = setInterval(() => {
        fetchData();
        fetchSharpData();
      }, 100000); // 10초 간격 갱신
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [companyName, selectedPeriod]);

  if (loading) return <div className="p-4">로딩 중...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!stockData) return <div className="p-4 text-gray-500">데이터가 없습니다.</div>;

  const periods = ['1일', '1주', '3달', '1년', '5년', '10년'];
  const currentData = stockData[selectedPeriod];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">주가 정보</h2>
      
      {/* 기간 선택 버튼 */}
      <div className="mb-4 flex gap-2">
        {periods.map((period) => (
          <button
            key={period}
            onClick={() => {
              console.log('기간 변경:', period);
              setSelectedPeriod(period);
            }}
            className={`px-4 py-2 rounded ${
              selectedPeriod === period
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {period}
          </button>
        ))}
      </div>

      {/* 주가 차트 */}
      <div style={{ height: '400px' }}>
        {currentData && currentData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={currentData}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={false} />
            <XAxis
              dataKey="date"
              tick={false}
            />
              <YAxis 
                domain={['auto', 'auto']}
                interval="preserveStartEnd"
                tickFormatter={(value) => value.toLocaleString()}  // 쉼표(,) 포함한 숫자
              />
              <Tooltip 
                formatter={(value) => [
                  value !== undefined && value !== null && !isNaN(value) ? value.toLocaleString() + '원' : '-',
                  '종가',
                ]}
                labelFormatter={(date) => date}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#8884d8"
                strokeWidth={3}
                name="종가"
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            해당 기간의 데이터가 없습니다.
          </div>
        )}
      </div>

      {stockData.latest && (
      <div className="bg-white rounded-lg shadow px-6 py-4 mb-6">
        <h3 className="text-lg font-semibold mb-3 border-b pb-2">주요 정보</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-sm text-gray-700">
          <div className="flex flex-col items-center">
            <div className="text-gray-500">EPS</div>
            <div className="font-semibold text-black">{stockData.latest.EPS?.toLocaleString() ?? '-'}</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-gray-500">BPS</div>
            <div className="font-semibold text-black">{stockData.latest.BPS?.toLocaleString() ?? '-'}</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-gray-500">PER</div>
            <div className="font-semibold text-black">
              {stockData.latest.PER !== undefined ? stockData.latest.PER.toFixed(2) : '-'}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-gray-500">PBR</div>
            <div className="font-semibold text-black">
              {stockData.latest.PBR !== undefined ? stockData.latest.PBR.toFixed(2) : '-'}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-gray-500">배당수익률</div>
            <div className="font-semibold text-black">
              {stockData.latest["배당수익률"] !== undefined ? `${stockData.latest["배당수익률"]}%` : '-'}
            </div>
          </div>
        </div>
      </div>
    )}



      {/* 주가 정보 섹션 */}
      {stockData.latest && (
        <div className="grid grid-cols-2 gap-6 mt-6">
          {/* 가격 정보 */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-2 border-b pb-1">가격 정보</h3>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <div className="text-gray-500">시가</div>
              <div>{
                stockData.latest.open !== undefined && stockData.latest.open !== null && !isNaN(stockData.latest.open)
                  ? stockData.latest.open.toLocaleString()
                  : '-'
              }</div>

              <div className="text-gray-500">고가</div>
              <div>{
                stockData.latest.high !== undefined && stockData.latest.high !== null && !isNaN(stockData.latest.high)
                  ? stockData.latest.high.toLocaleString()
                  : '-'
              }</div>

              <div className="text-gray-500">저가</div>
              <div>{
                stockData.latest.low !== undefined && stockData.latest.low !== null && !isNaN(stockData.latest.low)
                  ? stockData.latest.low.toLocaleString()
                  : '-'
              }</div>

              <div className="text-gray-500">거래량</div>
              <div>{
                stockData.latest.volume !== undefined && stockData.latest.volume !== null && !isNaN(stockData.latest.volume)
                  ? stockData.latest.volume.toLocaleString() + '주'
                  : '-'
              }</div>

              <div className="text-gray-500">거래대금</div>
              <div>{
                stockData.latest.valueTraded !== undefined && stockData.latest.valueTraded !== null && !isNaN(stockData.latest.valueTraded)
                  ? stockData.latest.valueTraded.toLocaleString() + '원'
                  : '-'
              }</div>
            </div>
          </div>

          {/* 등락 정보 */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-2 border-b pb-1">등락 정보</h3>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <div className="text-gray-500">현재가</div>
              <div>{
                stockData.latest.current !== undefined && stockData.latest.current !== null && !isNaN(stockData.latest.current)
                  ? stockData.latest.current.toLocaleString()
                  : '-'
              }</div>

              <div className="text-gray-500">전일 대비</div>
              <div className={
                stockData.latest.change > 0 ? "text-red-600" :
                stockData.latest.change < 0 ? "text-blue-600" : "text-gray-600"
              }>
                {stockData.latest.change > 0 ? '+' : ''}
                {
                  stockData.latest.change !== undefined && stockData.latest.change !== null && !isNaN(stockData.latest.change)
                    ? stockData.latest.change.toLocaleString()
                    : '-'
                }원
              </div>

              <div className="text-gray-500">등락률</div>
              <div className={
                stockData.latest.changeRate > 0 ? "text-red-600" :
                stockData.latest.changeRate < 0 ? "text-blue-600" : "text-gray-600"
              }>
                {stockData.latest.changeRate > 0 ? '+' : ''}
                {
                  stockData.latest.changeRate !== undefined && stockData.latest.changeRate !== null && !isNaN(stockData.latest.changeRate)
                    ? stockData.latest.changeRate.toFixed(2)
                    : '-'
                }%
              </div>
            </div>
          </div>
        </div>
      )}
      {sharpTrend.length > 0 && (
        <div className="space-y-10 mt-10">

          {/* 📈 표1: 수익률 품질 관련 지표 */}
          <div className="bg-white rounded-lg shadow px-6 py-6 w-full">
            <h3 className="text-lg font-bold mb-4 text-gray-800">변동성 지표</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed text-sm text-center border border-gray-300">
                <thead className="bg-gray-100 text-gray-700 font-semibold">
                  <tr>
                    <th className="w-1/3 border px-4 py-2">연도</th>
                    <th className="w-1/3 border px-4 py-2">Sharp Ratio(%)</th>
                    <th className="w-1/3 border px-4 py-2">MDD(%)</th>
                  </tr>
                </thead>
                <tbody>
                  {[...sharpTrend].reverse().map((item) => (
                    <tr key={`sharp-${item.연도}`}>
                      <td className="border px-4 py-2 font-bold">{item.연도}</td>
                      <td className="border px-4 py-2">{item.SharpRatio?.toFixed(3)}</td>
                      <td className="border px-4 py-2">{item.MDD?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 📊 표2: 초과 수익률 */}
          <div className="bg-white rounded-lg shadow px-6 py-6 w-full">
            <h3 className="text-lg font-bold mb-4 text-gray-800">시장/업종 반영 주가수익률</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed text-sm text-center border border-gray-300">
                <thead className="bg-gray-100 text-gray-700 font-semibold">
                  <tr>
                    <th className="w-1/3 border px-4 py-2">연도</th>
                    <th className="w-1/3 border px-4 py-2">개별 - 종합지수(%)</th>
                    <th className="w-1/3 border px-4 py-2">개별 - 업종(%)</th>
                  </tr>
                </thead>
                <tbody>
                  {[...sharpTrend].reverse().map((item) => (
                    <tr key={`excess-${item.연도}`}>
                      <td className="border px-4 py-2 font-bold">{item.연도}</td>
                      <td className="border px-4 py-2">{item["개별 종목 수익률 - 종합지수 수익률"]?.toFixed(2)}</td>
                      <td className="border px-4 py-2">{item["업종별 수익률 - 종합지수 수익률"]?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
    
  );
}

export default StockPage; 