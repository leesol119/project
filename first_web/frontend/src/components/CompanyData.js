import React, { useState } from 'react';
import { getCompanyData } from '../services/getCompanyData';

const CompanyData = () => {
  const [companyName, setCompanyName] = useState('');
  const [companyData, setCompanyData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const data = await getCompanyData(companyName);
      setCompanyData(data);
    } catch (err) {
      setError(err.response?.data?.detail || '데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">회사 재무제표 조회</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="회사명을 입력하세요"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '로딩 중...' : '조회'}
          </button>
        </div>
      </form>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}
      
      {companyData && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">{companyName} 재무제표 데이터</h3>
          <div className="overflow-x-auto">
            <pre className="text-sm bg-gray-50 p-4 rounded-lg overflow-x-auto">
              {JSON.stringify(companyData, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyData; 