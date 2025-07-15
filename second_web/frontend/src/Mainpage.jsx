import React from "react";
import Header from "./components/Header";

export default function MainPage() {
  return (
    <div className="relative h-screen w-full bg-cover bg-center" style={{ backgroundImage: "url('/main.jpg')" }}>
      
      {/* ✅ 반투명 오버레이 */}
      <div className="absolute inset-0 bg-black bg-opacity-20 z-0" />

      {/* 콘텐츠 (z-10으로 위에 배치) */}
      <Header />
      <div className="absolute top-1/2 left-1/4 transform -translate-y-1/2 text-white z-10">
        <h1 className="text-5xl font-bold leading-snug whitespace-pre-line">
          미래를 위한{"\n"}또 하나의 <span className="text-green-300">투자</span> ESG
        </h1>
      </div>
    </div>
  );
}