import React from "react";
import Header from "./components/Header"
export default function MainPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 고정 헤더 */}
      <Header />

      {/* 본문 영역 */}
      <main className="pt-[100px] text-center text-gray-700">
        <h2 className="text-xl font-semibold">확장 예정</h2>
      </main>
    </div>
  );
}
