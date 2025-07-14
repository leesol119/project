import React from 'react';
import { useLocation } from 'react-router-dom';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import FinancialsPage from './pages/FinancialsPage';
import NonFinancialsPage from './pages/NonFinancialsPage';
import AnalysisPage from './pages/AnalysisPage';
import StockPage from './pages/StockPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MyPage from './pages/MyPage';
import './index.css';
import SearchBar from './components/SearchBar';
import RecommendationPage from './pages/RecommendationPage';
import logo from './assets/logo.png';

function Navigation() {
  const location = useLocation(); // ✅ React Router의 훅으로 대체
  const { companyName } = useParams();
  const encodedCompanyName = encodeURIComponent(companyName);

  const tabs = [
    { label: '재무', to: `/company/${encodedCompanyName}/financials` },
    { label: '비재무', to: `/company/${encodedCompanyName}/nonfinancials` },
    { label: '주가', to: `/company/${encodedCompanyName}/stock` }
  ];

  return (
    <div className="w-full border-b border-blue-200 mb-8">
      <div className="flex space-x-4">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.to;
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`px-4 py-2 rounded-t-lg font-medium ${
                isActive
                  ? 'bg-gradient-to-r from-blue-400 to-blue-600 text-white shadow-md'
                  : 'text-blue-500 hover:text-blue-700 bg-gray-100'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="container mx-auto px-4 py-8">
      <header className="mb-8 flex justify-between items-center px-4 py-6 bg-gradient-to-b from-blue-100 via-white to-white shadow-sm rounded-b-xl">
        <Link to="/" className="flex items-center space-x-3 hover:text-blue-600">
          <img src={logo} alt="Finesg 로고" className="h-60 w-auto" />
        </Link>
        <div className="flex items-center gap-7">
        <SearchBar />
        <nav className="flex items-center gap-4 text text-blue-500">
          <Link to="/register" className="hover:text-blue-700">회원가입</Link>
          <Link to="/login" className="hover:text-blue-700">로그인</Link>
          <Link to="/mypage" className="hover:text-blue-700">마이페이지</Link>
        </nav>
      </div>
        </header>

        <main>
          {/* ✅ SearchBar는 Routes 바깥에서! */}
          
          <br></br>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/recommendation" element={<RecommendationPage />} />

            <Route
              path="/company/:companyName/financials"
              element={
                <>
                  <Navigation />
                  <FinancialsPage />
                </>
              }
            />
            <Route
              path="/company/:companyName/nonfinancials"
              element={
                <>
                  <Navigation />
                  <NonFinancialsPage />
                </>
              }
            />
            <Route
              path="/company/:companyName/analysis"
              element={
                <>
                  <Navigation />
                  <AnalysisPage />
                </>
              }
            />
            <Route
              path="/company/:companyName/stock"
              element={
                <>
                  <Navigation />
                  <StockPage />
                </>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
export default App;