import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "/src/assets/chatbot_image.png";

const menuItems = [
  {
    title: "보고서 작성",
    subItems: ["• 환경", "• 사회", "• 지배구조", "• 일반",  "• 부록","• 보고서 최종 생성"],
  },
  {
    title: "규정안 작성",
    subItems: ["• ESG 규정 목록", "• ESG 규정 작성"],
  },
];

export default function Header() {
  const [activeMenu, setActiveMenu] = useState(null);
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setIsLoggedIn(!!token); // 토큰이 있으면 true
  }, []);

  return (
    <header
      className="fixed top-0 left-0 w-full bg-white border-b shadow z-[100] transition-all duration-700 overflow-hidden"
      style={{ maxHeight: activeMenu ? "260px" : "64px" }}
      onMouseLeave={() => setActiveMenu(null)}
    >
      {/* 상단 바 */}
      <div className="max-w-screen-xl mx-auto px-6 py-3 flex justify-between items-center">
        <div
          className="flex items-center gap-2 font-bold text-xl text-green-800 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img src={logo} className="w-8 h-8 rounded-full" alt="logo" />
          ERI
        </div>
        <nav className="flex gap-8">
          {/* 기존 메뉴 출력 */}
          {menuItems.map((item) => (
            <button
              key={item.title}
              className="text-sm font-semibold text-gray-700 hover:text-green-600 transition"
              onMouseEnter={() => setActiveMenu(item)}
            >
              {item.title}
            </button>
          ))}

          {/* ✅ 로그인 여부에 따라 다른 버튼 표시 */}
          {isLoggedIn ? (
            <>
              <button
                className="text-sm font-semibold text-gray-700 hover:text-green-600 transition"
                onClick={() => navigate("/mypage")}
              >
                마이페이지
              </button>
              <button
                className="text-sm font-semibold text-red-500 hover:text-red-700 transition"
                onClick={() => {
                  localStorage.removeItem("access_token");  // 토큰 삭제
                  navigate("/login");                      // 로그인 페이지로 이동
                }}
              >
                로그아웃
              </button>
            </>
          ) : (
          <button
            className="text-sm font-semibold text-gray-700 hover:text-green-600 transition"
            onClick={() => navigate("/login")}
          >
            로그인
          </button>
        )}
        </nav>
      </div>

      {/* 드롭다운 메뉴 (header 안에 포함) */}
      {activeMenu && (
        <div className="w-full bg-white border-t">
        <div className="max-w-screen-xl mx-auto px-6 py-4 grid grid-cols-3 gap-y-3 gap-x-6">
          {activeMenu.subItems.map((sub, i) => (
            <div
              key={i}
              className="text-sm text-gray-700 hover:text-green-600 cursor-pointer"
              onClick={() => {
                if (sub.includes("환경")) {
                  navigate("/indicators/environment");
                } else if (sub.includes("ESG 규정 작성")) {
                  navigate("/templates");
                } else if (sub.includes("ESG 규정 목록")) {
                  navigate("/esg-drafts");
                } else if (sub.includes("사회")) {
                  navigate("/indicators/social"); // 추후 추가 예정
                } else if (sub.includes("지배구조")) {
                  navigate("/indicators/governance");
                } else if (sub.includes("일반")) {
                  navigate("/indicators/general");
                } else if (sub.includes("부록")) {
                  navigate("/indicators/appendix");
                } else if (sub.includes("보고서 최종 생성")) {
                  navigate("/indicators/final");
                }
              }}
            >
              {sub}
            </div>
          ))}
        </div>
        </div>
      )}
    </header>
  );
}
