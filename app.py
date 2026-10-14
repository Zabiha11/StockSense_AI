from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import math

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="StockSenseAI API",
    description="Inventory demand forecasting and stockout risk API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Development only; restrict before production
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = Path(__file__).parent / "notebooks" / "artifacts"

products = pd.read_csv(DATA_DIR / "product_features.csv")
forecasts = pd.read_csv(DATA_DIR / "future_forecasts.csv")
names = pd.read_csv(DATA_DIR / "product_names.csv")

products["StockCode"] = products["StockCode"].astype(str)
forecasts["StockCode"] = forecasts["StockCode"].astype(str)
names["StockCode"] = names["StockCode"].astype(str)

forecasts["Date"] = pd.to_datetime(forecasts["Date"])

names = names.drop_duplicates("StockCode").set_index("StockCode")

SERVICE_LEVEL_Z = {
    0.90: 1.282,
    0.95: 1.645,
    0.99: 2.326
}


BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR / "frontend"

app.mount(
    "/static",
    StaticFiles(directory=FRONTEND_DIR),
    name="static"
)

@app.get("/")
def home():
    return FileResponse(FRONTEND_DIR / "index.html")


@app.get("/products")
def get_products():
    result = products.merge(
        names[["Description"]],
        left_on="StockCode",
        right_index=True,
        how="left"
    )

    return result.fillna("").to_dict(orient="records")


@app.get("/products/{stock_code}")
def get_product(stock_code: str):
    result = products[
        products["StockCode"] == stock_code
    ]

    if result.empty:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    data = result.iloc[0].to_dict()
    data["Description"] = names["Description"].get(
        stock_code, "Unknown product"
    )

    return data


@app.get("/forecast/{stock_code}")
def get_forecast(stock_code: str):
    result = forecasts[
        forecasts["StockCode"] == stock_code
    ].sort_values("Date")

    if result.empty:
        raise HTTPException(
            status_code=404,
            detail="Forecast not found for this product"
        )

    result = result.copy()
    result["Date"] = result["Date"].dt.strftime("%Y-%m-%d")

    return result.to_dict(orient="records")


@app.get("/risk/{stock_code}")
def get_stockout_risk(
    stock_code: str,
    current_stock: int = Query(ge=0),
    lead_time_days: int = Query(default=7, ge=1, le=30),
    on_order: int = Query(default=0, ge=0),
    service_level: float = Query(default=0.95)
):
    if service_level not in SERVICE_LEVEL_Z:
        raise HTTPException(
            status_code=400,
            detail="service_level must be 0.90, 0.95, or 0.99"
        )

    product = products[
        products["StockCode"] == stock_code
    ]

    if product.empty:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    future = forecasts[
        forecasts["StockCode"] == stock_code
    ].sort_values("Date")

    if len(future) < lead_time_days:
        raise HTTPException(
            status_code=400,
            detail="Not enough forecast days available"
        )

    demand = float(
        future.head(lead_time_days)["PredictedUnits"].sum()
    )

    daily_std = float(product.iloc[0]["DemandStd"])
    if not np.isfinite(daily_std):
        daily_std = 0.0

    safety_stock = (
        SERVICE_LEVEL_Z[service_level]
        * daily_std
        * math.sqrt(lead_time_days)
    )

    reorder_point = math.ceil(demand + safety_stock)
    inventory_position = current_stock + on_order

    if inventory_position <= demand:
        risk = "HIGH"
    elif inventory_position <= reorder_point:
        risk = "MEDIUM"
    else:
        risk = "LOW"

    return {
        "StockCode": stock_code,
        "Product": names["Description"].get(
            stock_code, "Unknown product"
        ),
        "CurrentStock": current_stock,
        "OnOrder": on_order,
        "LeadTimeDays": lead_time_days,
        "ForecastLeadTimeDemand": round(demand, 2),
        "SafetyStock": round(safety_stock, 2),
        "ReorderPoint": reorder_point,
        "RiskLevel": risk,
        "RecommendedOrderQty": max(
            0, reorder_point - inventory_position
        ),
        "Note": "Demo estimate; stock values are user-supplied."
    }


