from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from bson.json_util import dumps
import json
import pandas as pd
import math 
from collections import defaultdict
import FinanceDataReader as fdr
from datetime import datetime, timedelta
from database import db
from routes import user, favorites
from fastapi.responses import JSONResponse
import yfinance as yf

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://192.168.0.156:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user.router)
app.include_router(favorites.router)

@app.get("/")
async def read_root():
    return {"message": "Stock Investment Helper API"}

@app.get("/company/{company_name}/financials")
async def get_company_financials(company_name: str):
    try:
        company_name_str = str(company_name)
        print(f"Searching for company: {company_name_str}")

        # ✅ 여러 연도 데이터 모두 가져오기
        cursor = db.finacial_statement.find({'회사명': company_name_str}, {'_id': 0})
        data = sorted(list(cursor), key=lambda x: x.get("연도", 0))

        if not data:
            all_companies = list(db.finacial_statement.distinct("회사명"))
            raise HTTPException(status_code=404, detail=f"Company not found. Available companies: {all_companies}")
        
        # ✅ NaN/Inf 정리
        cleaned_data = []
        for entry in data:
            cleaned = {
                k: (0 if isinstance(v, float) and (math.isnan(v) or math.isinf(v)) else v)
                for k, v in entry.items()
            }
            cleaned_data.append(cleaned)

        return cleaned_data

    except Exception as e:
        print(f"Error in get_company_financials: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/company/{company_name}/financials")
async def get_company_financials(company_name: str):
    try:
        company_name_str = str(company_name)
        print(f"Searching for company: {company_name_str}")

        financials = db.finacial_statement.find_one({'회사명': company_name_str}, {'_id': 0})
        print(f"Found financials: {financials}")

        if not financials:
            all_companies = list(db.finacial_statement.distinct("회사명"))
            print(f"Available companies: {all_companies}")
            raise HTTPException(status_code=404, detail=f"Company not found. Available companies: {all_companies}")

        clean = {
            k: (0 if isinstance(v, float) and (math.isnan(v) or math.isinf(v)) else v)
            for k, v in financials.items()
        }

        return clean
    except Exception as e:
        print(f"Error in get_company_financials: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/company/{company_name}/nonfinancials")
async def get_company_nonfinancials(company_name: str):
    try:
        years = [2021, 2022, 2023, 2024]
        basic_data = []

        # ✅ 업종 정보 확인
        cat_doc = db.category.find_one({"종목명": company_name})
        if not cat_doc or "GICS_4자리" not in cat_doc or "업종명" not in cat_doc:
            raise HTTPException(status_code=404, detail="GICS 정보 또는 업종명 없음")

        gics_code = cat_doc["GICS_4자리"]
        industry_name = cat_doc["업종명"]

        same_gics_docs = db.category.find({"GICS_4자리": gics_code}, {"종목명": 1})
        company_names = [doc["종목명"] for doc in same_gics_docs]

        # ✅ 연도별 데이터 저장용
        female_director_chart = defaultdict(list)
        director_ratio_chart = defaultdict(list)
        shareholder_ratio_chart = defaultdict(list)

        for year in years:
            # 현재 회사 데이터
            esg = db.ESG_rate.find_one({'회사명': company_name, '연도': year}, {'_id': 0})
            director = db.director_ratio.find_one({'회사명': company_name, '연도': year}, {'_id': 0})
            shareholder = db.share_holder_ratio.find_one({'회사명': company_name, '연도': year}, {'_id': 0})

            if not any([esg, director, shareholder]):
                continue

            year_data = {
                "연도": year,
                "ESG": esg.get("종합등급", "N/A") if esg else "N/A",
                "directorRatio": director.get("사외이사 비율(%)", "N/A") if director else "N/A",
                "femaleDirectorRatio": director.get("여성이사 비율", "N/A") if director else "N/A",
                "shareholderRatio": shareholder.get("최대주주지분율", "N/A") if shareholder else "N/A"
            }
            basic_data.append(year_data)

        # ✅ 업종평균 포함한 차트 데이터 계산 함수
        def compute_industry_avg(collection, field, alias):
            result = []
            for year in years:
                docs = collection.find({'회사명': {'$in': company_names}, '연도': year, field: {'$ne': None}}, {'회사명': 1, field: 1, '연도': 1})
                values = [doc[field] for doc in docs if isinstance(doc[field], (int, float))]
                industry_avg = round(sum(values) / len(values), 2) if values else None

                company_doc = collection.find_one({'회사명': company_name, '연도': year}, {field: 1})
                company_val = company_doc.get(field) if company_doc else None

                if company_val is not None or industry_avg is not None:
                    result.append({
                        "year": year,
                        alias: company_val,
                        "업종평균": industry_avg
                    })
            return result

        # ✅ 차트 데이터 생성
        female_director_chart = compute_industry_avg(db.director_ratio, "여성이사 비율", "여성이사 비율")
        director_ratio_chart = compute_industry_avg(db.director_ratio, "사외이사 비율(%)", "사외이사 비율(%)")
        shareholder_ratio_chart = compute_industry_avg(db.share_holder_ratio, "최대주주지분율", "최대주주지분율")

        # ✅ ESG 분석 데이터도 포함
        analysis_data = get_esg_trend(company_name)

        return JSONResponse(content={
            "basic": basic_data,
            "analysis": analysis_data,
            "female_director_chart": female_director_chart,
            "director_ratio_chart": director_ratio_chart,
            "shareholder_ratio_chart": shareholder_ratio_chart,
            "industry_name": industry_name
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/company/{company_name}/nonfinancials")
async def get_company_nonfinancials(company_name: str):
    try:
        years = [2021, 2022, 2023, 2024]
        basic_data = []

        # ✅ 업종 정보 확인
        cat_doc = db.category.find_one({"종목명": company_name})
        if not cat_doc or "GICS_4자리" not in cat_doc or "업종명" not in cat_doc:
            raise HTTPException(status_code=404, detail="GICS 정보 또는 업종명 없음")

        gics_code = cat_doc["GICS_4자리"]
        industry_name = cat_doc["업종명"]

        same_gics_docs = db.category.find({"GICS_4자리": gics_code}, {"종목명": 1})
        company_names = [doc["종목명"] for doc in same_gics_docs]

        # ✅ 연도별 데이터 저장용
        female_director_chart = defaultdict(list)
        director_ratio_chart = defaultdict(list)
        shareholder_ratio_chart = defaultdict(list)

        for year in years:
            # 현재 회사 데이터
            esg = db.ESG_rate.find_one({'회사명': company_name, '연도': year}, {'_id': 0})
            director = db.director_ratio.find_one({'회사명': company_name, '연도': year}, {'_id': 0})
            shareholder = db.share_holder_ratio.find_one({'회사명': company_name, '연도': year}, {'_id': 0})

            if not any([esg, director, shareholder]):
                continue

            year_data = {
                "연도": year,
                "ESG": esg.get("종합등급", "N/A") if esg else "N/A",
                "directorRatio": director.get("사외이사 비율(%)", "N/A") if director else "N/A",
                "femaleDirectorRatio": director.get("여성이사 비율", "N/A") if director else "N/A",
                "shareholderRatio": shareholder.get("최대주주지분율", "N/A") if shareholder else "N/A"
            }
            basic_data.append(year_data)

        # ✅ 업종평균 포함한 차트 데이터 계산 함수
        def compute_industry_avg(collection, field, alias):
            result = []
            for year in years:
                docs = collection.find({'회사명': {'$in': company_names}, '연도': year, field: {'$ne': None}}, {'회사명': 1, field: 1, '연도': 1})
                values = [doc[field] for doc in docs if isinstance(doc[field], (int, float))]
                industry_avg = round(sum(values) / len(values), 2) if values else None

                company_doc = collection.find_one({'회사명': company_name, '연도': year}, {field: 1})
                company_val = company_doc.get(field) if company_doc else None

                if company_val is not None or industry_avg is not None:
                    result.append({
                        "year": year,
                        alias: company_val,
                        "업종평균": industry_avg
                    })
            return result

        # ✅ 차트 데이터 생성
        female_director_chart = compute_industry_avg(db.director_ratio, "여성이사 비율", "여성이사 비율")
        director_ratio_chart = compute_industry_avg(db.director_ratio, "사외이사 비율(%)", "사외이사 비율(%)")
        shareholder_ratio_chart = compute_industry_avg(db.share_holder_ratio, "최대주주지분율", "최대주주지분율")

        # ✅ ESG 분석 데이터도 포함
        analysis_data = get_esg_trend(company_name)

        return JSONResponse(content={
            "basic": basic_data,
            "analysis": analysis_data,
            "female_director_chart": female_director_chart,
            "director_ratio_chart": director_ratio_chart,
            "shareholder_ratio_chart": shareholder_ratio_chart,
            "industry_name": industry_name
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/company/{company_name}/analysis")
def get_esg_trend(company_name: str):

    # ✅ 업종 코드 확인
    cat_doc = db.category.find_one({"종목명": company_name})
    if not cat_doc or "GICS_4자리" not in cat_doc or "업종명" not in cat_doc:
        raise HTTPException(status_code=404, detail="GICS 정보 또는 업종명 없음")

    gics_code = cat_doc["GICS_4자리"]
    industry_name = cat_doc["업종명"]

    # ✅ 동업종 기업명 확보
    same_gics_docs = db.category.find({"GICS_4자리": gics_code}, {"종목명": 1})
    company_names = [doc["종목명"] for doc in same_gics_docs]

    # ✅ ESG 점수 매핑
    grade_map = {"S": 7, "A+": 6, "A": 5, "B+": 4, "B": 3, "C": 2, "D": 1}
    fields = ["종합등급", "환경", "사회", "지배구조"]

    # ✅ 회사 ESG 데이터
    company_cursor = db.ESG_rate.find({"회사명": company_name})
    company_by_year = defaultdict(dict)
    for row in company_cursor:
        year = row.get("연도")
        for f in fields:
            score = grade_map.get(row.get(f))
            if score:
                company_by_year[year][f] = score

    # ✅ 업종 ESG 평균
    industry_cursor = db.ESG_rate.find({"회사명": {"$in": company_names}})
    industry_acc = defaultdict(lambda: defaultdict(list))
    for row in industry_cursor:
        year = row.get("연도")
        for f in fields:
            score = grade_map.get(row.get(f))
            if score:
                industry_acc[year][f].append(score)

    industry_avg_by_year = {
        year: {
            f: round(sum(v) / len(v), 2) if v else None
            for f, v in fields_dict.items()
        }
        for year, fields_dict in industry_acc.items()
    }

    # ✅ 환경투자비율 데이터 불러오기
    env_cursor = db.environment_ratio.find({"회사명": {"$in": [company_name] + company_names}})
    env_dict = defaultdict(list)
    for row in env_cursor:
        year = row["연도"]
        cname = row["회사명"]
        ratio = row["환경투자비율"]
        env_dict[year].append((cname, ratio))

    # ✅ 연도별 환경투자비율 및 평균 계산
    env_ratio_by_year = {}
    for year, values in env_dict.items():
        company_val = next((v for c, v in values if c == company_name), None)
        avg_val = round(sum(v for _, v in values if v is not None) / len(values), 4)
        env_ratio_by_year[year] = {
            "회사": company_val,
            "업종평균": avg_val
        }


        # ✅ 매출단위당 에너지/온실가스 자료 불러오기
    sales_cursor = db.environment_sales.find({"회사명": {"$in": [company_name] + company_names}})
    sales_dict = defaultdict(list)
    for row in sales_cursor:
        year = row.get("연도")
        cname = row.get("회사명")
        gas = row.get("매출단위당_온실가스배출량")
        energy = row.get("매출단위당_에너지사용량")
        if year and cname:
            sales_dict[year].append({
                "회사명": cname,
                "온실가스": gas,
                "에너지": energy
            })

    # ✅ 연도별 평균 계산 및 회사 데이터 분리
    sales_ratio_by_year = {}
    for year, values in sales_dict.items():
        company_gas = next((v["온실가스"] for v in values if v["회사명"] == company_name), None)
        company_energy = next((v["에너지"] for v in values if v["회사명"] == company_name), None)
        gas_list = [v["온실가스"] for v in values if v["온실가스"] is not None]
        energy_list = [v["에너지"] for v in values if v["에너지"] is not None]
        sales_ratio_by_year[year] = {
            "회사_온실가스": company_gas,
            "회사_에너지": company_energy,
            "업종평균_온실가스": round(sum(gas_list)/len(gas_list), 10) if gas_list else None,
            "업종평균_에너지": round(sum(energy_list)/len(energy_list), 10) if energy_list else None,
        }

    # ✅ 연도 기준 통합
    all_years = sorted(set(company_by_year.keys()) | set(industry_avg_by_year.keys()) |
                       set(env_ratio_by_year.keys()) | set(sales_ratio_by_year.keys()))
    
    result = []
    for year in all_years:
        result.append({
            "year": year,
            "company": company_by_year.get(year, {}),
            "industry_avg": industry_avg_by_year.get(year, {}),
            "env_ratio": env_ratio_by_year.get(year, {}),
            "sales_ratio": sales_ratio_by_year.get(year, {}),
            "industry_name": industry_name
        })

    return result

@app.get("/company/{company_name}/analysis")
def get_esg_trend(company_name: str):

    # ✅ 업종 코드 확인
    cat_doc = db.category.find_one({"종목명": company_name})
    if not cat_doc or "GICS_4자리" not in cat_doc or "업종명" not in cat_doc:
        raise HTTPException(status_code=404, detail="GICS 정보 또는 업종명 없음")

    gics_code = cat_doc["GICS_4자리"]
    industry_name = cat_doc["업종명"]

    # ✅ 동업종 기업명 확보
    same_gics_docs = db.category.find({"GICS_4자리": gics_code}, {"종목명": 1})
    company_names = [doc["종목명"] for doc in same_gics_docs]

    # ✅ ESG 점수 매핑
    grade_map = {"S": 7, "A+": 6, "A": 5, "B+": 4, "B": 3, "C": 2, "D": 1}
    fields = ["종합등급", "환경", "사회", "지배구조"]

    # ✅ 회사 ESG 데이터
    company_cursor = db.ESG_rate.find({"회사명": company_name})
    company_by_year = defaultdict(dict)
    for row in company_cursor:
        year = row.get("연도")
        for f in fields:
            score = grade_map.get(row.get(f))
            if score:
                company_by_year[year][f] = score

    # ✅ 업종 ESG 평균
    industry_cursor = db.ESG_rate.find({"회사명": {"$in": company_names}})
    industry_acc = defaultdict(lambda: defaultdict(list))
    for row in industry_cursor:
        year = row.get("연도")
        for f in fields:
            score = grade_map.get(row.get(f))
            if score:
                industry_acc[year][f].append(score)

    industry_avg_by_year = {
        year: {
            f: round(sum(v) / len(v), 2) if v else None
            for f, v in fields_dict.items()
        }
        for year, fields_dict in industry_acc.items()
    }

    # ✅ 환경투자비율 데이터 불러오기
    env_cursor = db.environment_ratio.find({"회사명": {"$in": [company_name] + company_names}})
    env_dict = defaultdict(list)
    for row in env_cursor:
        year = row["연도"]
        cname = row["회사명"]
        ratio = row["환경투자비율"]
        env_dict[year].append((cname, ratio))

    # ✅ 연도별 환경투자비율 및 평균 계산
    env_ratio_by_year = {}
    for year, values in env_dict.items():
        company_val = next((v for c, v in values if c == company_name), None)
        avg_val = round(sum(v for _, v in values if v is not None) / len(values), 4)
        env_ratio_by_year[year] = {
            "회사": company_val,
            "업종평균": avg_val
        }


        # ✅ 매출단위당 에너지/온실가스 자료 불러오기
    sales_cursor = db.environment_sales.find({"회사명": {"$in": [company_name] + company_names}})
    sales_dict = defaultdict(list)
    for row in sales_cursor:
        year = row.get("연도")
        cname = row.get("회사명")
        gas = row.get("매출단위당_온실가스배출량")
        energy = row.get("매출단위당_에너지사용량")
        if year and cname:
            sales_dict[year].append({
                "회사명": cname,
                "온실가스": gas,
                "에너지": energy
            })

    # ✅ 연도별 평균 계산 및 회사 데이터 분리
    sales_ratio_by_year = {}
    for year, values in sales_dict.items():
        company_gas = next((v["온실가스"] for v in values if v["회사명"] == company_name), None)
        company_energy = next((v["에너지"] for v in values if v["회사명"] == company_name), None)
        gas_list = [v["온실가스"] for v in values if v["온실가스"] is not None]
        energy_list = [v["에너지"] for v in values if v["에너지"] is not None]
        sales_ratio_by_year[year] = {
            "회사_온실가스": company_gas,
            "회사_에너지": company_energy,
            "업종평균_온실가스": round(sum(gas_list)/len(gas_list), 10) if gas_list else None,
            "업종평균_에너지": round(sum(energy_list)/len(energy_list), 10) if energy_list else None,
        }

    # ✅ 연도 기준 통합
    all_years = sorted(set(company_by_year.keys()) | set(industry_avg_by_year.keys()) |
                       set(env_ratio_by_year.keys()) | set(sales_ratio_by_year.keys()))
    
    result = []
    for year in all_years:
        result.append({
            "year": year,
            "company": company_by_year.get(year, {}),
            "industry_avg": industry_avg_by_year.get(year, {}),
            "env_ratio": env_ratio_by_year.get(year, {}),
            "sales_ratio": sales_ratio_by_year.get(year, {}),
            "industry_name": industry_name
        })

    return result


metric_map = {
    "부채비율": "부채비율",
    "ROE": "ROE(%)",
    "ROA": "ROA(%)",
    "자산총계": "자산총계",
    "영업이익": "영업이익",
    "영업이익률": "영업이익률",
    "순이익률": "순이익률",
    "자본유보율": "자본유보율",
    "자기자본비율": "자기자본비율",
    "매출액증가율": "매출액증가율",
    "이익증가율": "이익증가율",
    "자산증가율": "자산증가율",
    "FCF": "FCF",
    "EPS": "EPS(기본)"
}
@app.get("/average/{metric_name}")
def get_average_by_year(metric_name: str):
    field = metric_map.get(metric_name)
    if not field:
        raise HTTPException(status_code=400, detail="지원하지 않는 지표입니다.")

    cursor = db.finacial_statement.find({}, {"_id": 0, "연도": 1, field: 1})

    data_by_year = defaultdict(list)

    for doc in cursor:
        year = doc.get("연도")
        value = doc.get(field)
        if isinstance(value, (int, float)) and not math.isnan(value):
            data_by_year[year].append(value)

    result = []
    for year in sorted(data_by_year.keys()):
        values = data_by_year[year]
        avg = sum(values) / len(values) if values else 0
        result.append({
            "year": year,
            "average": round(avg, 2)
        })

    if not result:
        raise HTTPException(status_code=404, detail="해당 지표에 대한 데이터가 없습니다.")

    return result

@app.get("/company/{company_name}/analysis")
def get_esg_trend(company_name: str):

    # ✅ 업종 코드 확인
    cat_doc = db.category.find_one({"종목명": company_name})
    if not cat_doc or "GICS_4자리" not in cat_doc or "업종명" not in cat_doc:
        raise HTTPException(status_code=404, detail="GICS 정보 또는 업종명 없음")

    gics_code = cat_doc["GICS_4자리"]
    industry_name = cat_doc["업종명"]

    # ✅ 동업종 기업명 확보
    same_gics_docs = db.category.find({"GICS_4자리": gics_code}, {"종목명": 1})
    company_names = [doc["종목명"] for doc in same_gics_docs]

    # ✅ ESG 점수 매핑
    grade_map = {"S": 7, "A+": 6, "A": 5, "B+": 4, "B": 3, "C": 2, "D": 1}
    fields = ["종합등급", "환경", "사회", "지배구조"]

    # ✅ 회사 ESG 데이터
    company_cursor = db.ESG_rate.find({"회사명": company_name})
    company_by_year = defaultdict(dict)
    for row in company_cursor:
        year = row.get("연도")
        for f in fields:
            score = grade_map.get(row.get(f))
            if score:
                company_by_year[year][f] = score

    # ✅ 업종 ESG 평균
    industry_cursor = db.ESG_rate.find({"회사명": {"$in": company_names}})
    industry_acc = defaultdict(lambda: defaultdict(list))
    for row in industry_cursor:
        year = row.get("연도")
        for f in fields:
            score = grade_map.get(row.get(f))
            if score:
                industry_acc[year][f].append(score)

    industry_avg_by_year = {
        year: {
            f: round(sum(v) / len(v), 2) if v else None
            for f, v in fields_dict.items()
        }
        for year, fields_dict in industry_acc.items()
    }

    # ✅ 환경투자비율 데이터 불러오기
    env_cursor = db.environment_ratio.find({"회사명": {"$in": [company_name] + company_names}})
    env_dict = defaultdict(list)
    for row in env_cursor:
        year = row["연도"]
        cname = row["회사명"]
        ratio = row["환경투자비율"]
        env_dict[year].append((cname, ratio))

    # ✅ 연도별 환경투자비율 및 평균 계산
    env_ratio_by_year = {}
    for year, values in env_dict.items():
        company_val = next((v for c, v in values if c == company_name), None)
        avg_val = round(sum(v for _, v in values if v is not None) / len(values), 4)
        env_ratio_by_year[year] = {
            "회사": company_val,
            "업종평균": avg_val
        }


        # ✅ 매출단위당 에너지/온실가스 자료 불러오기
    sales_cursor = db.environment_sales.find({"회사명": {"$in": [company_name] + company_names}})
    sales_dict = defaultdict(list)
    for row in sales_cursor:
        year = row.get("연도")
        cname = row.get("회사명")
        gas = row.get("매출단위당_온실가스배출량")
        energy = row.get("매출단위당_에너지사용량")
        if year and cname:
            sales_dict[year].append({
                "회사명": cname,
                "온실가스": gas,
                "에너지": energy
            })

    # ✅ 연도별 평균 계산 및 회사 데이터 분리
    sales_ratio_by_year = {}
    for year, values in sales_dict.items():
        company_gas = next((v["온실가스"] for v in values if v["회사명"] == company_name), None)
        company_energy = next((v["에너지"] for v in values if v["회사명"] == company_name), None)
        gas_list = [v["온실가스"] for v in values if v["온실가스"] is not None]
        energy_list = [v["에너지"] for v in values if v["에너지"] is not None]
        sales_ratio_by_year[year] = {
            "회사_온실가스": company_gas,
            "회사_에너지": company_energy,
            "업종평균_온실가스": round(sum(gas_list)/len(gas_list), 10) if gas_list else None,
            "업종평균_에너지": round(sum(energy_list)/len(energy_list), 10) if energy_list else None,
        }

    # ✅ 연도 기준 통합
    all_years = sorted(set(company_by_year.keys()) | set(industry_avg_by_year.keys()) |
                       set(env_ratio_by_year.keys()) | set(sales_ratio_by_year.keys()))
    
    result = []
    for year in all_years:
        result.append({
            "year": year,
            "company": company_by_year.get(year, {}),
            "industry_avg": industry_avg_by_year.get(year, {}),
            "env_ratio": env_ratio_by_year.get(year, {}),
            "sales_ratio": sales_ratio_by_year.get(year, {}),
            "industry_name": industry_name
        })

    return result


metric_map = {
    "부채비율": "부채비율",
    "ROE": "ROE(%)",
    "ROA": "ROA(%)",
    "자산총계": "자산총계",
    "영업이익": "영업이익",
    "영업이익률": "영업이익률",
    "순이익률": "순이익률",
    "자본유보율": "자본유보율",
    "자기자본비율": "자기자본비율",
    "매출액증가율": "매출액증가율",
    "이익증가율": "이익증가율",
    "자산증가율": "자산증가율",
    "FCF": "FCF",
    "EPS": "EPS(기본)"
}
@app.get("/average/{metric_name}")
def get_average_by_year(metric_name: str):
    field = metric_map.get(metric_name)
    if not field:
        raise HTTPException(status_code=400, detail="지원하지 않는 지표입니다.")

    cursor = db.finacial_statement.find({}, {"_id": 0, "연도": 1, field: 1})

    data_by_year = defaultdict(list)

    for doc in cursor:
        year = doc.get("연도")
        value = doc.get(field)
        if isinstance(value, (int, float)) and not math.isnan(value):
            data_by_year[year].append(value)

    result = []
    for year in sorted(data_by_year.keys()):
        values = data_by_year[year]
        avg = sum(values) / len(values) if values else 0
        result.append({
            "year": year,
            "average": round(avg, 2)
        })

    if not result:
        raise HTTPException(status_code=404, detail="해당 지표에 대한 데이터가 없습니다.")

    return result


@app.get("/average/{metric}/by-gics")
def get_average_by_gics(metric: str, company_name: str):
    # 1. GICS 코드 찾기
    cat_doc = db.category.find_one({"종목명": company_name})
    if not cat_doc or "GICS_4자리" not in cat_doc:
        raise HTTPException(status_code=404, detail="GICS 정보 없음")

    gics_code = cat_doc["GICS_4자리"]
    industry_name = cat_doc.get("업종명", "알 수 없음")

    # 2. metric → 실제 필드명으로 매핑
    field = metric_map.get(metric)
    if not field:
        raise HTTPException(status_code=400, detail=f"지원하지 않는 지표: {metric}")

    # 3. 같은 GICS 기업 리스트 확보
    same_gics_docs = db.category.find({"GICS_4자리": gics_code}, {"종목명": 1})
    company_names = [doc["종목명"] for doc in same_gics_docs]
    print(f"✅ [GICS] {gics_code} 기업 수: {len(company_names)}")

    # 4. 해당 기업들의 재무 데이터 조회
    cursor = db.finacial_statement.find(
        {"회사명": {"$in": company_names}},
        {"_id": 0, "연도": 1, field: 1}
    )

    # 5. 연도별 평균 계산
    data_by_year = defaultdict(list)

    for doc in cursor:
        year = doc.get("연도")
        value = doc.get(field)

        print(f"🔍 기업: {doc.get('회사명', 'N/A')} | 연도: {year} | {field} = {value}")

        try:
            v = float(value)
            if not math.isnan(v):
                data_by_year[int(year)].append(v)
        except Exception as e:
            print(f"⚠️ 값 무시됨 - year: {year}, value: {value}, error: {e}")

    result = []
    for year in sorted(data_by_year):
        values = data_by_year[year]
        avg = sum(values) / len(values) if values else 0
        print(f"📊 {year} 평균 = {round(avg, 2)} from {len(values)}개 기업")
        result.append({"year": year, "average": round(avg, 2)})

    return {
        "industry_name": industry_name,
        "data": result
    }

df_codes = pd.read_excel("기업_리스트.xlsx")[['회사명', '종목코드']].dropna()
df_codes['종목코드'] = df_codes['종목코드'].astype(float).astype(int).astype(str).str.zfill(6)
df_codes['티커'] = df_codes['종목코드'] + ".KS"
ticker_map = dict(zip(df_codes['회사명'], df_codes['티커']))

def get_ticker_by_name(name: str) -> str | None:
    return ticker_map.get(name)

@app.get("/company/{company_name}/stock")
async def get_company_stock_price(company_name: str):
    ticker = get_ticker_by_name(company_name)
    if not ticker:
        raise HTTPException(status_code=404, detail="해당 회사명을 찾을 수 없습니다.")

    result = {}

    # ✅ 1일 데이터 (5분 단위, yfinance 사용)
    try:
        yf_ticker = yf.Ticker(ticker)
        df = yf_ticker.history(period="1d", interval="5m")
        df.index = df.index.tz_localize(None)

        result["1일"] = [
            {
                "date": dt.strftime('%Y-%m-%d %H:%M'),
                "price": float(row["Close"])
            }
            for dt, row in df.iterrows() if not pd.isna(row["Close"])
        ]
    except Exception as e:
        print(f"[1일 yfinance 처리 오류] {e}")

    # ✅ 기간별 시세 (1주~10년, FDR 사용)
    periods = {
        "1주": timedelta(weeks=1),
        "3달": timedelta(days=90),
        "1년": timedelta(days=365),
        "5년": timedelta(days=365*5),
        "10년": timedelta(days=365*10)
    }

    end = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

    for period_name, delta in periods.items():
        try:
            start = end - delta
            df = fdr.DataReader(ticker.replace(".KS", ""), start, end)
            df.index = pd.to_datetime(df.index)
            df = df.resample('1D').last().dropna().sort_index()

            result[period_name] = [
                {
                    "date": date.strftime('%Y-%m-%d'),
                    "price": float(row["Close"])
                }
                for date, row in df.iterrows()
            ]
        except Exception as e:
            print(f"[{period_name} 처리 오류] {e}")

        # ✅ 최신 시세 정보 추가 (yfinance)
    try:
        df_latest = yf.Ticker(ticker).history(period="2d", interval="1d")
        df_latest.index = pd.to_datetime(df_latest.index)
        df_latest = df_latest.sort_index()

        if len(df_latest) >= 2:
            current_price = float(df_latest["Close"].iloc[-1])
            prev_price = float(df_latest["Close"].iloc[-2])
            change = current_price - prev_price
            change_rate = (change / prev_price) * 100
            value_traded = current_price * float(df_latest["Volume"].iloc[-1])

            latest = df_latest.iloc[-1]
            result["latest"] = {
                "open": float(latest["Open"]),
                "high": float(latest["High"]),
                "low": float(latest["Low"]),
                "volume": int(latest["Volume"]),
                "current": current_price,
                "change": round(change, 2),
                "changeRate": round(change_rate, 2),
                "valueTraded": int(value_traded),
            }

            # ✅ MongoDB에서 추가 정보 병합
            stock_doc = db.stock_price.find_one({"회사명": company_name})
            if stock_doc:
                result["latest"]["EPS"] = stock_doc.get("EPS")
                result["latest"]["BPS"] = stock_doc.get("BPS")
                result["latest"]["PER"] = stock_doc.get("PER")
                result["latest"]["PBR"] = stock_doc.get("PBR")
                result["latest"]["배당수익률"] = stock_doc.get("배당수익률(%)")

    except Exception as e:
        print(f"[latest 시세 처리 오류] {e}")

    if not result:
        raise HTTPException(status_code=404, detail="주가 데이터를 찾을 수 없습니다.")

    return result

def clean_nan(obj):
    if isinstance(obj, dict):
        return {k: clean_nan(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_nan(i) for i in obj]
    elif isinstance(obj, float) and math.isnan(obj):
        return None
    else:
        return obj
    
@app.get("/recommend")
def recommend(
    roe_min: float = 0,
    esg: str = None,
    debt_max: float = None,
    equity_ratio_min: float = None,
    eps_positive: bool = False,
    allow_negative_eps: bool = False,
    per_max: float = None,
    pbr_max: float = None,
    dividend_min: float = None,
    env_focus: bool = False,
    soc_focus: bool = False,
    gov_focus: bool = False
):
    query = {}

    if roe_min:
        query["ROE(%)"] = {"$gte": roe_min}
    if debt_max:
        query["부채비율"] = {"$lte": debt_max}
    if equity_ratio_min:
        query["자기자본비율"] = {"$gte": equity_ratio_min}
    if eps_positive:
        query["EPS(기본)"] = {"$gt": 0}
    elif not allow_negative_eps:
        query["EPS(기본)"] = {"$ne": None}

    # 1️⃣ 재무 조건 기반 후보 기업 추출
    raw_candidates = list(db.finacial_statement.find(
        query,
        {
            "_id": 0,
            "회사명": 1,
            "ROE(%)": 1,
            "EPS(기본)": 1,
            "부채비율": 1,
            "자기자본비율": 1
        }
    ))

    # 2️⃣ stock_price 병합 + PER/PBR/배당 필터 적용
    candidates = []
    for corp in raw_candidates:
        stock_doc = db.stock_price.find_one({"회사명": corp["회사명"]})
        if stock_doc:
            per = stock_doc.get("PER")
            pbr = stock_doc.get("PBR")
            dividend = stock_doc.get("배당수익률(%)")

            if per_max is not None and (per is None or per > per_max):
                continue
            if pbr_max is not None and (pbr is None or pbr > pbr_max):
                continue
            if dividend_min is not None and (dividend is None or dividend < dividend_min):
                continue

            corp["PER"] = per
            corp["PBR"] = pbr
            corp["배당수익률(%)"] = dividend

        candidates.append(corp)

    # 3️⃣ ESG 등급 병합
    enriched = []
    for corp in candidates:
        esg_doc = db.ESG_rate.find_one({"회사명": corp["회사명"]}, {"_id": 0})
        if esg_doc:
            corp["ESG등급"] = esg_doc.get("종합등급", "N/A")
            corp["ESG_환경"] = esg_doc.get("환경", "-")
            corp["ESG_사회"] = esg_doc.get("사회", "-")
            corp["ESG_지배구조"] = esg_doc.get("지배구조", "-")
        else:
            corp["ESG등급"] = "N/A"
            corp["ESG_환경"] = "-"
            corp["ESG_사회"] = "-"
            corp["ESG_지배구조"] = "-"
        enriched.append(corp)

    # 4️⃣ ESG 필터 적용
    def grade_to_number(grade):
        map = {"S": 7, "A+": 6, "A": 5, "B+": 4, "B": 3, "C": 2, "D": 1}
        return map.get(str(grade).strip(), 0)

    if esg:
        esg_min_score = grade_to_number(esg)
        enriched = [c for c in enriched if grade_to_number(c["ESG등급"]) >= esg_min_score]

    # ✅ 4️⃣ ESG 세부 항목 필터 추가
    def get_esg_score(company_name, field):
        doc = db.ESG_rate.find_one({"회사명": company_name})
        if not doc: return 0
        score_map = {"S": 7, "A+": 6, "A": 5, "B+": 4, "B": 3, "C": 2, "D": 1}
        return score_map.get(doc.get(field, ""), 0)

    if env_focus:
        enriched = [c for c in enriched if get_esg_score(c["회사명"], "환경") >= 5]
    if soc_focus:
        enriched = [c for c in enriched if get_esg_score(c["회사명"], "사회") >= 5]
    if gov_focus:
        enriched = [c for c in enriched if get_esg_score(c["회사명"], "지배구조") >= 5]

    return JSONResponse(content=clean_nan(enriched))

@app.get("/percentile-summary/{category}/{company_name}")
def get_percentile_summary(category: str, company_name: str):
    category_map = {
        "안정성": ["부채비율", "자기자본비율", "자본유보율"],
        "수익성": ["영업이익률", "ROE(%)", "ROA(%)", "EPS(기본)", "FCF"],
        "성장성": ["매출액증가율", "이익증가율", "자산증가율"]
    }

    if category not in category_map:
        raise HTTPException(status_code=400, detail="잘못된 카테고리입니다")

    keys = category_map[category]

    # GICS 코드 가져오기
    cat_doc = db.category.find_one({"종목명": company_name})
    if not cat_doc or "GICS_4자리" not in cat_doc:
        raise HTTPException(status_code=404, detail="GICS 정보 없음")

    gics_code = cat_doc["GICS_4자리"]
    peers = db.category.find({"GICS_4자리": gics_code}, {"종목명": 1})
    peer_names = [p["종목명"] for p in peers]

    score_map = {"우수": 3, "양호": 2, "위험": 1}

    def rating_score(key, value):
        if key == "EPS(기본)" or key == "FCF":
            return 3 if value > 0 else 1
        if key == "부채비율":
            return 3 if value <= 100 else 2 if value <= 200 else 1
        if key == "자기자본비율":
            return 3 if value >= 50 else 2 if value >= 30 else 1
        if key == "자본유보율":
            return 3 if value >= 1000 else 2 if value >= 500 else 1
        if key == "영업이익률":
            return 3 if value >= 10 else 2 if value >= 5 else 1
        if key == "ROE(%)":
            return 3 if value >= 15 else 2 if value >= 7 else 1
        if key == "ROA(%)":
            return 3 if value >= 7 else 2 if value >= 3 else 1
        if key == "매출액증가율" or key == "이익증가율":
            return 3 if value >= 10 else 2 if value >= 3 else 1
        if key == "자산증가율":
            return 3 if value >= 10 else 2 if value >= 5 else 1
        return None

    def calc_score(doc):
        scores = []
        for key in keys:
            val = doc.get(key)
            if isinstance(val, (int, float)):
                score = rating_score(key, val)
                if score:
                    scores.append(score)
        if scores:
            return round(sum(scores) / len(scores), 4)
        return None

    peer_docs = list(db.finacial_statement.find({"회사명": {"$in": peer_names}}))
    scored_peers = [(doc["회사명"], calc_score(doc)) for doc in peer_docs if calc_score(doc) is not None]

    scored_peers = sorted(scored_peers, key=lambda x: x[1], reverse=True)
    total = len(scored_peers)

    target_score = calc_score(db.finacial_statement.find_one({"회사명": company_name}))
    if target_score is None:
        raise HTTPException(status_code=404, detail="해당 기업의 점수를 계산할 수 없음")

    rank = next((i for i, (name, score) in enumerate(scored_peers) if name == company_name), None)

    if rank is None:
        raise HTTPException(status_code=404, detail="해당 기업이 업종 내 순위에 없음")

    percentile = round((total - rank) / total * 100, 2)

    return {
        "company_name": company_name,
        "category": category,
        "score": target_score,
        "rank": rank + 1,
        "total": total,
        "avg_percentile": percentile
    }

@app.get("/company/{company_name}/sharp")
def get_sharp_timeseries(company_name: str):
    cursor = db.Sharp.find(
        {"회사명": company_name},
        {
            "_id": 0,
            "연도": 1,
            "Sharpe Ratio": 1,
            "MDD (%)": 1,
            "개별 종목 수익률(%) - 종합지수 수익률(%)": 1,
            "개별종목 수익률(%) - 업종 수익률(%)": 1
        }
    )
    data = sorted(cursor, key=lambda x: x.get("연도"))

    # ✅ 명시적으로 필드명 리맵
    result = []
    for doc in data:
        result.append({
            "연도": doc.get("연도"),
            "SharpRatio": doc.get("Sharpe Ratio"),
            "MDD": doc.get("MDD (%)"),
            "개별 종목 수익률 - 종합지수 수익률": doc.get("개별 종목 수익률(%) - 종합지수 수익률(%)"),
            "업종별 수익률 - 종합지수 수익률": doc.get("개별종목 수익률(%) - 업종 수익률(%)"),
        })

    if not result:
        raise HTTPException(status_code=404, detail="Sharp 시계열 데이터를 찾을 수 없습니다.")

    return result

@app.get("/percentile/{metric}/{company_name}")
def get_percentile(metric: str, company_name: str):
    metric_map = {
        "ROE": "ROE(%)",
        "ROA": "ROA(%)",
        "EPS": "EPS(기본)",
        "FCF": "FCF",
        "부채비율": "부채비율",
        "자기자본비율": "자기자본비율",
        "자본유보율": "자본유보율",
        "영업이익률": "영업이익률",
        "매출액증가율": "매출액증가율",
        "이익증가율": "이익증가율",
        "자산증가율": "자산증가율"
    }

    field = metric_map.get(metric, metric)

    cat_doc = db.category.find_one({"종목명": company_name})
    if not cat_doc or "GICS_4자리" not in cat_doc:
        raise HTTPException(status_code=404, detail="GICS 정보 없음")

    gics_code = cat_doc["GICS_4자리"]
    peers = db.category.find({"GICS_4자리": gics_code}, {"종목명": 1})
    peer_names = [p["종목명"] for p in peers]

    peer_docs = list(db.finacial_statement.find({"회사명": {"$in": peer_names}}))

    scored_peers = [
        (doc["회사명"], doc.get(field))
        for doc in peer_docs
        if isinstance(doc.get(field), (int, float))
    ]
    scored_peers.sort(key=lambda x: x[1], reverse=True)
    total = len(scored_peers)

    target_doc = db.finacial_statement.find_one({"회사명": company_name})
    target_value = target_doc.get(field) if target_doc else None

    if target_value is None or not isinstance(target_value, (int, float)):
        raise HTTPException(status_code=404, detail="해당 기업 값 없음")

    rank = next((i for i, (name, value) in enumerate(scored_peers) if name == company_name), None)

    if rank is None:
        raise HTTPException(status_code=404, detail="순위 계산 실패")

    percentile = round((total - rank) / total * 100, 2)

    return {
        "company_name": company_name,
        "metric": metric,
        "value": target_value,
        "rank": rank + 1,
        "total": total,
        "percentile": percentile
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)