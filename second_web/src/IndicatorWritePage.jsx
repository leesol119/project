import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import RequiredDataInput from "./components/RequiredDataInput";

// ✅ 표 입력 컴포넌트
const PageTablesRenderer = ({ page, tableInputs, setTableInputs }) => {
  const [tableHTMLs, setTableHTMLs] = useState([]);

  useEffect(() => {
    const loadTables = async () => {
      try {
        const indexRes = await fetch("/tables_gpt/index.json");
        const indexData = await indexRes.json();
        const files = indexData?.[String(page)] || [];

        const loaded = await Promise.all(
          files.map(async (filename) => {
            const res = await fetch(`/tables_gpt/${filename}`);
            if (!res.ok) return null;
            const html = await res.text();
            return html;
          })
        );

        setTableHTMLs(loaded.filter(Boolean));
      } catch (err) {
        console.error(`❌ page${page} 테이블 로딩 실패:`, err);
      }
    };

    loadTables();
  }, [page]);

  const parseTableToJSX = (html, tableIndex) => {
    const el = document.createElement("div");
    el.innerHTML = html;
    const table = el.querySelector("table");
    const rows = Array.from(table?.querySelectorAll("tr") || []);

    return (
      <table className="table-auto border w-full mb-4 text-sm">
        <tbody>
          {rows.map((tr, rowIdx) => {
            const cells = Array.from(tr.querySelectorAll("th, td"));
            return (
              <tr key={rowIdx}>
                {cells.map((cell, colIdx) => {
                  const isTH = cell.tagName === "TH";
                  const key = `page${page}_table${tableIndex}_r${rowIdx}_c${colIdx}`;
                  return isTH ? (
                    <th key={colIdx} className="border px-2 py-1 bg-gray-100 font-semibold">
                      {cell.textContent}
                    </th>
                  ) : (
                    <td key={colIdx} className="border p-1">
                      <input
                        type="text"
                        className="w-full px-1 py-0.5 text-sm border rounded"
                        value={
                          tableInputs?.[key] !== undefined
                            ? tableInputs[key]
                            : cell.textContent.trim() // HTML 셀 원래 텍스트를 기본값으로 사용
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          setTableInputs((prev) => ({
                            ...prev,
                            [key]: val,
                          }));
                        }}
                      />
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  return (
    <>
      {tableHTMLs.map((html, idx) => (
        <div key={idx} className="mb-6 border rounded p-3 bg-white shadow">
          {parseTableToJSX(html, idx)}
        </div>
      ))}
    </>
  );
};


const extractFilledTableHTML = () => {
  const tables = document.querySelectorAll("table");
  return Array.from(tables).map((table) => table.outerHTML).join("\n");
};

// ✅ 메인 페이지
const IndicatorWritePage = () => {
  const { indicator_id: indicatorId } = useParams();
  const [parsedFields, setParsedFields] = useState([]);
  const [chunks, setChunks] = useState([]);
  const [tableTexts, setTableTexts] = useState([]);
  const [summary, setSummary] = useState("");
  const [indicatorMeta, setIndicatorMeta] = useState({ GRI: "", SASB: "", KESG: "" });
  const [loadingFields, setLoadingFields] = useState(false);
  const [tablePages, setTablePages] = useState([]);

  // ✅ 표 입력값 상태 추가
  const [tableInputs, setTableInputs] = useState({});


  useEffect(() => {
  const extractIndicatorMeta = (chunks) => {
    const fullText = chunks.join("\n");
    let GRI = "", SASB = "", KESG = "";

    const lines = fullText.split("\n");

    // ✅ GRI 추출
    const griRaw = fullText.match(/GRI[:\s\-]*([\s\S]*?)SASB/i);
    if (griRaw) {
      GRI = griRaw[1].trim().replace(/[\n\r]/g, " ");
    }

    // ✅ K-ESG 추출
    const kesgMatch = fullText.match(/K-ESG[:\s\-]*([^\n▶]*)/i);
    if (kesgMatch) {
      KESG = kesgMatch[1].trim();
    }

    // ✅ SASB 추출 (기존 방식)
    const sasbParts = [];
    const griIndex = lines.findIndex(line => /GRI/i.test(line));
    for (let i = 0; i < griIndex; i++) {
      const line = lines[i].trim();
      if (line.length > 3 && !/^KBZ-[A-Z]{2}\d{2}/.test(line) && /[A-Za-z]/.test(line)) {
        sasbParts.push(line);
      }
    }

    const sasbIndex = lines.findIndex(line => /SASB/i.test(line));
    const kesgIndex = lines.findIndex(line => /K-ESG/i.test(line));
    if (sasbIndex >= 0 && kesgIndex > sasbIndex) {
      for (let i = sasbIndex + 1; i < kesgIndex; i++) {
        const line = lines[i].trim();
        if (line.length > 3) sasbParts.push(line);
      }
    }

    const arrowIndex = lines.findIndex(line => /▶/.test(line));
    if (kesgIndex >= 0) {
      const endIndex = arrowIndex > kesgIndex ? arrowIndex : lines.length;
      for (let i = kesgIndex + 1; i < endIndex; i++) {
        const line = lines[i].trim();
        if (line.length > 3) sasbParts.push(line);
      }
    }

    SASB = sasbParts.join(" ").replace(/\s+/g, " ").trim();

    // ✅ 수동 매핑: KBZ 코드가 있을 경우 SASB 덮어쓰기
    const manualSasbMap = {
      "KBZ-EN21": "Materials Sourcing & Efficiency",
      "KBZ-EN22": "GHG Emissions, Energy Management",
      "KBZ-EN23": "Waste & Hazardous Materials Management",
      "KBZ-EN24": "Water & Wastewater Management",
      "KBZ-EN25": "Air Quality",
      "KBZ-EN26": "Ecological Impacts",
      "KBZ-SC11": "Employee Health and Safety",
      "KBZ-SC12": "Employee Health and Safety",
      "KBZ-SC13": "Employee Health and Safety",
      "KBZ-SC14": "Waste & Hazardous Materials Management",
      "KBZ-SC15": "Employee Health and Safety",
      "KBZ-SC21": "Labor Practices",
      "KBZ-SC22": "Human Rights & Community Relation",
      "KBZ-SC23": "Human Rights & Community Relation",
      "KBZ-SC24": "Human Rights & Community Relation",
      "KBZ-SC31": "Employee Engagement, Diversity & Inclusion",
      "KBZ-SC32": "Employee Engagement, Diversity & Inclusion",
      "KBZ-SC33": "Employee Engagement, Diversity & Inclusion",
      "KBZ-SC41": "Supply Chain Management",
      "KBZ-SC42": "Supply Chain Management",
      "KBZ-SC51": "Data Security, Customer Privacy",
      "KBZ-SC52": "Data Security, Customer Privacy",
      "KBZ-SC53": "Product Quality & Safety, Customer Welfare",
      "KBZ-SC54": "Product Quality & Safety, Customer Welfare",
      "KBZ-SC61": "Access & Affordability",
      "KBZ-GV21": "Business Ethics",
      "KBZ-GV23": "Competitive Behaviour, Management of the Legal & Regulatory Environment",
    };
      return { GRI, SASB, KESG };
    };


    const fetchAndInfer = async () => {
      try {
        setLoadingFields(true);

        const fetchRes = await axios.post("http://localhost:8000/environment/fetch-data", {
          topic: indicatorId,
          company: "테스트회사",
          department: "",
          history: [],
        });

        setChunks(fetchRes.data.chunks || []);
        setTableTexts(fetchRes.data.table_texts || []);
        setTablePages(fetchRes.data.pages || []);

        const meta = extractIndicatorMeta(fetchRes.data.chunks || []);
        setIndicatorMeta(meta);

        const inferRes = await axios.post("http://localhost:8000/environment/infer-required-data", {
          topic: indicatorId,
          chunks: fetchRes.data.chunks || [],
          table_texts: fetchRes.data.table_texts?.map((html) => {
            const el = document.createElement("div");
            el.innerHTML = html;
            return el.innerText;
          }) || [],
        });

        if (Array.isArray(inferRes.data.required_fields)) {
          setParsedFields(inferRes.data.required_fields);
        }

        const summaryRes = await axios.post("http://localhost:8000/environment/summarize-indicator", {
          topic: indicatorId,
          chunks: fetchRes.data.chunks || [],
          table_texts: fetchRes.data.table_texts || [],
        });

        setSummary(summaryRes.data.summary);
      } catch (err) {
        console.error("❌ 데이터 로딩 실패:", err);
      } finally {
        setLoadingFields(false);
      }
    };

    fetchAndInfer();
  }, [indicatorId]);

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-4">지표 입력 페이지</h1>
      <p className="text-sm text-gray-700 mb-6">
        지표 ID: <strong>{indicatorId}</strong>
      </p>

      {indicatorMeta && !indicatorId.startsWith("KBZ-AP") && (
        <div className="mb-6 text-sm bg-blue-50 border border-blue-200 rounded p-4">
          <p><strong>GRI:</strong> {indicatorMeta.GRI || "-"}</p>
          <p><strong>SASB:</strong> {indicatorMeta.SASB || "-"}</p>
          <p><strong>K-ESG:</strong> {indicatorMeta.KESG || "-"}</p>
        </div>
      )}

      {loadingFields && (
        <div className="text-sm text-gray-500 italic mb-6">
          ⏳ 입력 항목 로딩 중...
        </div>
      )}

      {parsedFields.length > 0 && (
        <>
          {summary && (
            <div className="text-sm bg-gray-50 p-4 rounded border mb-6">
              <h4 className="font-semibold mb-2">🧾 지표 요약 설명</h4>
              <p>{summary}</p>
            </div>
          )}

          {tablePages.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-2">📊 표 작성</h2>
              {tablePages.map((page) => (
                <PageTablesRenderer
                  key={page}
                  page={page}
                  tableInputs={tableInputs}
                  setTableInputs={setTableInputs}
                />
              ))}
            </div>
          )}

          <RequiredDataInput
            fields={parsedFields}
            chunks={chunks}
            tableTexts={tableTexts}
            tableInputs={tableInputs} // ✅ 추가
          />
        </>
      )}
    </div>
  );
};

export default IndicatorWritePage;
