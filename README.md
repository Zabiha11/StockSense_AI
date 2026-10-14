# StockSense AI — Intelligent Demand Forecasting & Inventory Optimization

**An end-to-end machine learning application for product demand forecasting, inventory risk analysis, anomaly detection, and data-driven reorder recommendations.**

<p align="center">
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python"/>
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/Machine%20Learning-8A2BE2?style=for-the-badge" alt="Machine Learning"/>
  <img src="https://img.shields.io/badge/Time%20Series-Forecasting-orange?style=for-the-badge" alt="Time Series Forecasting"/>
  <img src="https://img.shields.io/badge/Deployment-Render-46E3B7?style=for-the-badge&logo=render&logoColor=black" alt="Render"/>
</p>

## 🌐 Live Demo

- **Live Application:** https://stocksense-ai-majq.onrender.com
- **GitHub Repository:** https://github.com/Zabiha11/StockSense_AI

## 📌 Project Overview

StockSense AI is an intelligent inventory analytics and demand forecasting system designed to help businesses make better stocking decisions using historical sales data.

Traditional inventory management often relies on fixed reorder quantities, manual calculations, or simple historical averages. These approaches may fail to account for changing demand patterns, intermittent sales, seasonal trends, and unexpected sales spikes.

StockSense AI addresses these challenges by transforming transaction-level retail data into daily product-demand time series, evaluating forecasting techniques, identifying unusual demand patterns, grouping products according to their demand characteristics, and generating inventory replenishment recommendations.

The application combines a machine learning and analytics pipeline with a FastAPI backend and an interactive web frontend, making the resulting insights accessible through a user-friendly dashboard.

## 🎯 Project Objectives

- Forecast future product demand using historical sales patterns.
- Compare forecasting models and select the most suitable model for individual products.
- Identify unusual sales spikes and potentially anomalous product-demand observations.
- Group products according to their demand behavior using unsupervised learning.
- Estimate inventory risk using available stock, supplier lead time, forecast demand, and safety-stock requirements.
- Recommend replenishment quantities to help reduce potential stockouts and excess inventory.
- Deploy the analytics system as a web application accessible through a browser.

## ✨ Key Features

### 1. Time-Series Demand Forecasting

StockSense AI analyzes daily product sales and generates future demand estimates.

The forecasting pipeline evaluates approaches such as:

- **Holt-Winters Exponential Smoothing:** Models demand levels, trends, and seasonality where supported by the data.
- **Seasonal Naive Forecasting:** Uses demand from a corresponding previous seasonal period as a baseline.
- **Previous 7-Day Mean:** Uses recent demand history to estimate upcoming demand.

Models are evaluated using a chronological train-test split to preserve the time order of observations.

Forecasting performance is assessed using:

- Mean Absolute Error (MAE)
- Root Mean Squared Error (RMSE)
- Weighted Absolute Percentage Error (WAPE)

The best-performing candidate is selected for each product based on the implemented evaluation criterion.

### 2. Unsupervised Demand Clustering

Products can exhibit very different demand patterns. A frequently purchased product behaves differently from one that sells occasionally in large batches.

StockSense AI uses demand-related features to group products with similar characteristics.

Example features include:

- Average daily demand
- Median daily demand
- Demand standard deviation
- Maximum daily demand
- 95th-percentile demand
- Zero-sales days
- Active-sales days
- Demand coefficient of variation

The clustering output helps distinguish products with relatively stable demand from products with intermittent or highly variable demand.

This is an **unsupervised learning task** because the algorithm groups products according to their characteristics rather than learning from predefined demand-category labels.

### 3. Demand Anomaly Detection

The anomaly detection component identifies product-days whose demand differs significantly from expected behavior.

Potential anomalies include:

- Unusually large sales quantities
- Sudden demand spikes
- Rare, high-volume transactions
- Products with highly irregular sales behavior

An anomaly is not automatically an error or fraud. It may represent a genuine bulk order, a seasonal event, or an unusual but valid business transaction.

The detected observations can be investigated before making inventory decisions.

### 4. Inventory Risk Analysis

StockSense AI evaluates inventory risk using available stock information and estimated future demand.

The analysis considers inputs such as:

- Current stock
- Outstanding orders, where available
- Supplier lead time
- Forecast demand during the lead-time period
- Safety stock
- Reorder point

A typical reorder-point calculation is:

`Reorder Point = Lead-Time Demand + Safety Stock`

The system compares available inventory against the calculated threshold to estimate the possibility of a stock shortage.

Risk categories such as LOW, MEDIUM, and HIGH depend on the application's implemented thresholds.

### 5. Recommended Order Quantity

The application estimates how much inventory may need to be replenished.

A simplified replenishment calculation is:

`Recommended Order Quantity = max(0, Target Stock − Inventory Position)`

Where:

`Inventory Position = Current Stock + On-Order Stock − Backorders`

The exact formula depends on the inventory policy implemented in the application. If backorders and outstanding purchase orders are unavailable, the calculation should use only the supported inputs.

These quantities are decision-support estimates and should be reviewed alongside supplier constraints, minimum order quantities, and actual business requirements.

### 6. Interactive Web Dashboard

The web application provides an accessible interface for exploring inventory insights.

Depending on the implemented frontend, users can interact with product information, demand forecasts, anomalies, demand clusters, and inventory recommendations without running the analysis notebooks manually.

### 7. REST API

The FastAPI backend exposes analytics through HTTP endpoints, allowing the frontend or other applications to request product and forecasting information.

The API separates the data-processing and analytics logic from the presentation layer.

## 🏗️ System Architecture

```text
                 Historical Retail Dataset
                           |
                           v
                Data Cleaning & Validation
                           |
                           v
                 Daily Demand Aggregation
                           |
              +------------+------------+
              |            |            |
              v            v            v
         Forecasting    Clustering   Anomaly Detection
              |            |            |
              +------------+------------+
                           |
                           v
                 Inventory Risk Analysis
                           |
                           v
                Reorder Recommendations
                           |
                           v
                    FastAPI Backend
                           |
                       REST API
                           |
                           v
                  HTML / CSS / JavaScript
                           |
                           v
                  Interactive Dashboard
```

## 🛠️ Technology Stack

| Component | Technology | Purpose |
|---|---|---|
| Programming language | Python | Data processing and analytics |
| Data manipulation | Pandas, NumPy | Cleaning, aggregation, and feature engineering |
| Forecasting | Statsmodels / implemented forecasting libraries | Time-series demand prediction |
| Machine learning | Scikit-learn | Clustering, preprocessing, and model evaluation |
| Backend | FastAPI | REST API development |
| API server | Uvicorn | Running the backend application |
| Frontend | HTML, CSS, JavaScript | User interface and API integration |
| Visualization | Implemented charting library | Forecast and inventory visualizations |
| Version control | Git and GitHub | Source-code management |
| Deployment | Render | Hosting the deployed application and/or API |

*The listed libraries should match the dependencies actually used by the final repository.*

## 📊 Dataset

The project uses the Online Retail transactional dataset, stored locally as `Online Retail.xlsx`.

The original dataset contains **541,909 transaction records** spanning December 2010 to December 2011.

Important columns include:

| Column | Description |
|---|---|
| InvoiceNo | Transaction identifier |
| StockCode | Product identifier |
| Description | Product description |
| Quantity | Quantity recorded for the transaction |
| InvoiceDate | Transaction timestamp |
| UnitPrice | Unit price |
| CustomerID | Customer identifier |
| Country | Customer's country |

### Data preparation

The data-processing workflow includes:

1. Loading the original retail dataset.
2. Removing exact duplicate records.
3. Inspecting cancellations, negative quantities, unusual stock codes, and non-merchandise transactions.
4. Filtering records according to the project's merchandise and sales rules.
5. Aggregating transaction records into daily product-demand observations.
6. Creating a complete daily calendar for selected products and assigning zero sales to days without recorded sales.
7. Generating time-series features such as lagged demand, rolling averages, and calendar variables.
8. Preparing chronological training and evaluation periods.

The project produced a calendar-complete dataset of **17,903 product-day observations** for the selected 50 products used in the reported modeling experiments.

The final modeling dataset contained **17,203 rows and 11 columns** after time-series feature preparation.

These counts refer to the specific preprocessing and modeling stages, not the entire original retail dataset.

## 🔬 Methodology

### Step 1: Exploratory Data Analysis

The analysis investigates sales distributions, product activity, zero-sales frequency, unusually large quantities, and potential data-quality issues.

### Step 2: Time-Series Construction

Transaction quantities are aggregated by date and product. Missing product-days are represented as zero demand for the selected calendar-complete series.

### Step 3: Feature Engineering

The forecasting pipeline creates temporal and historical features, including:

- Day of week
- Month and day of month
- Previous-day demand (`Lag_1`)
- Previous-week demand (`Lag_7`)
- Previous-two-week demand (`Lag_14`)
- Seven-day rolling demand mean
- Fourteen-day rolling demand mean

Rolling and lagged features must be calculated without using future observations.

### Step 4: Forecast Model Evaluation

The historical series is split chronologically into training and testing periods. Candidate models are evaluated against the held-out period and compared with simple baseline forecasts.

In the reported experiment, Holt-Winters achieved the following aggregate results across 50 products:

| Model | MAE | RMSE | WAPE |
|---|---:|---:|---:|
| Holt-Winters | 66.432 | 169.901 | 82.593% |
| Previous 7-Day Mean | 82.611 | 166.460 | 102.708% |
| Seasonal Naive | 96.579 | 255.879 | 120.074% |

Holt-Winters achieved the lowest MAE and WAPE among these candidates, while the previous 7-day mean achieved a slightly lower RMSE.

These results illustrate why model evaluation should consider multiple metrics rather than selecting a model using only one score.

The best model was subsequently selected per product. In the reported experiment, Holt-Winters was selected for 30 products, Seasonal Naive for 14, and Previous 7-Day Mean for 6.

**Important:** These metrics describe the reported historical test period. They are not a guarantee of future forecasting accuracy.

### Step 5: Demand Clustering

Products are represented using statistical summaries of their demand patterns and grouped using an unsupervised clustering method.

The resulting clusters can help identify differences in demand frequency, volume, and variability.

### Step 6: Anomaly Detection

Anomaly detection is applied to product-day demand observations to identify unusually large or otherwise atypical values.

The flagged observations are candidates for investigation rather than confirmed data errors.

### Step 7: Inventory Optimization

The forecasting and demand-analysis outputs are combined with stock and lead-time inputs to estimate reorder points, inventory risk, and suggested replenishment quantities.

### Step 8: Deployment

The analytics functionality is exposed through a FastAPI backend and connected to the frontend. The deployed application provides a browser-based interface for accessing the available features.

## 💡 Example Use Case

Consider a retailer selling a product called *WHITE HANGING HEART T-LIGHT HOLDER*, identified by stock code `85123A`.

Suppose the retailer has the following inventory information:

- Current stock: 500 units
- Outstanding orders: 100 units
- Supplier lead time: 7 days
- Forecast lead-time demand: 600 units
- Safety stock: 150 units

The reorder point would be:

`Reorder Point = 600 + 150 = 750 units`

Inventory position would be:

`Inventory Position = 500 + 100 = 600 units`

If the target stock level is 750 units, a simplified replenishment calculation gives:

`Recommended Order Quantity = max(0, 750 − 600) = 150 units`

The retailer would receive a recommendation to consider ordering 150 units.

This is an illustrative example, not a recorded output from the live application. Actual recommendations depend on the data and inventory rules configured in StockSense AI.

## 🚀 Getting Started

### Prerequisites

Install the following before running the project locally:

- Python 3.10 or another Python version supported by the repository's dependencies
- Git
- A web browser
- A code editor such as Visual Studio Code

### 1. Clone the repository

Replace the placeholder with your actual GitHub repository URL.

```bash
git clone https://github.com/Zabiha11/StockSense_AI.git
cd StockSense_AI
```

### 2. Create a virtual environment

**Windows — PowerShell**

```powershell
python -m venv my_env
.\my_env\Scripts\Activate.ps1
```

If PowerShell blocks activation, use Command Prompt instead:

```cmd
my_env\Scripts\activate.bat
```

**macOS / Linux**

```bash
python3 -m venv my_env
source my_env/bin/activate
```

### 3. Install dependencies

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Verify the required files

Check that the project contains the backend code, dependency file, and required model artifacts or CSV files.

For example:

```text
StockSense_AI/
├── app.py
├── requirements.txt
├── notebooks/
│   └── artifacts/
│       ├── product_features.csv
│       ├── future_forecasts.csv
│       └── product_names.csv
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
└── README.md
```

This is an illustrative structure. Use the actual paths in your repository, especially where `app.py` loads the artifacts.

**Dataset and artifact requirements:** If the repository does not include the original dataset or generated artifact files, the local setup will require those files separately or a documented preprocessing step to generate them. Do not assume that cloning the source code alone provides every required data file.

### 5. Configure the frontend API URL

Open the frontend JavaScript file and locate the backend API base URL.

For local development, configure it to use:

```javascript
const API_BASE_URL = "http://127.0.0.1:8000";
```

For the deployed application, use your actual Render backend URL instead.

Avoid committing secrets, private credentials, or environment-specific configuration containing sensitive information.

### 6. Start the backend

From the project root, with the virtual environment activated, run:

```bash
uvicorn app:app --reload
```

The API should be available at:

`http://127.0.0.1:8000`

Interactive API documentation:

`http://127.0.0.1:8000/docs`

If the application expects generated artifacts in `notebooks/artifacts/`, preserve that directory structure or update the configured paths before starting the backend.

### 7. Start the frontend

Open the frontend using the development server configured for your project.

If the frontend consists of static HTML, CSS, and JavaScript files, a simple option is to use the Live Server extension in Visual Studio Code and open `index.html`.

Confirm that the JavaScript API URL points to the local backend.

### 8. Use the deployed application

Alternatively, visit the live frontend URL in your browser. The deployed backend must be running and accessible for API-powered features to work.

## 🔗 API Usage

The following endpoints are examples based on the development workflow. Verify their exact paths and parameters in your implementation and at `/docs`.

| Endpoint | Purpose |
|---|---|
| `GET /` | API welcome or health information |
| `GET /docs` | Interactive API documentation |
| `GET /products` | Retrieve product information |
| `GET /forecast/23166` | Request a forecast for product `23166` |
| `GET /risk/23166?current_stock=500&lead_time_days=7` | Request an inventory-risk estimate |

### Example request

```bash
curl "http://127.0.0.1:8000/forecast/23166"
```

Example inventory-risk request:

```bash
curl "http://127.0.0.1:8000/risk/23166?current_stock=500&lead_time_days=7"
```

The response format and supported query parameters depend on the implemented API. Use the interactive documentation to inspect request schemas and responses.

## 📈 Evaluation Metrics

| Metric | What it tells us |
|---|---|
| MAE | Average absolute difference between actual and predicted demand |
| RMSE | Penalizes large forecasting errors more heavily |
| WAPE | Measures aggregate absolute error relative to actual demand |
| Demand CV | Measures demand variability relative to its mean |
| Anomaly score | Indicates how unusual an observation appears under the chosen detection method |

Lower MAE and RMSE generally indicate more accurate forecasts on the same evaluation set. Lower WAPE generally indicates less aggregate forecast error, although it requires careful interpretation when actual demand totals are very small.

## ⚠️ Limitations

- The dataset covers a historical period from 2010 to 2011 and may not represent modern retail conditions.
- Only a selected subset of products was used in the reported forecasting and clustering experiments.
- Large sales quantities can heavily influence forecast errors and inventory estimates.
- Historical demand alone does not capture every promotion, holiday, supplier disruption, or external market change.
- Anomaly detection identifies unusual observations, not necessarily fraudulent or incorrect transactions.
- Inventory recommendations depend on the quality of stock, outstanding-order, and supplier lead-time inputs.
- Forecasts and replenishment quantities should support, rather than replace, business judgment.

## 🔮 Future Enhancements

Potential improvements include:

- Integrating live inventory and point-of-sale data.
- Expanding forecasting to more products and longer historical periods.
- Incorporating holidays, promotions, prices, and external demand drivers.
- Adding automated model retraining and monitoring.
- Introducing confidence intervals and probabilistic forecasts.
- Supporting configurable service levels and safety-stock policies.
- Adding downloadable reports and inventory alerts.
- Tracking forecast accuracy over time to identify model drift.
- Adding authentication, rate limiting, and stricter production CORS policies.

## 🎓 Learning Outcomes

Developing StockSense AI provides practical experience in:

- Exploratory data analysis and data cleaning.
- Time-series preprocessing and feature engineering.
- Forecasting model selection and chronological evaluation.
- Unsupervised learning and demand segmentation.
- Anomaly detection and statistical analysis.
- Inventory management calculations and decision-support logic.
- Building REST APIs using FastAPI.
- Integrating a web frontend with a Python backend.
- Version control, project organization, and cloud deployment.

## 👩‍💻 Author

**Zabiha Muskan K**

Final-Year Computer Science and Engineering Student | AI/ML & Software Development

- GitHub: https://github.com/Zabiha11
- Project: https://github.com/Zabiha11/StockSense_AI
- Live Demo: https://stocksense-ai-majq.onrender.com
## 📄 License

Choose an appropriate open-source license before distributing the project. If you intend to make the repository publicly reusable, consider the MIT License and include a corresponding `LICENSE` file.

---

**StockSense AI — Turning historical sales data into actionable inventory insights.**
