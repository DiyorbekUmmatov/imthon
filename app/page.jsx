"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import Shell from "./components/Shell";
import {
  buildBarData,
  buildDonutData,
  donutColors,
  exportRows,
  fmt,
  pillTone,
  plRows,
  prettyDate,
  taxRows,
  transactionRows,
  useFinanceData,
} from "./hooks/useFinanceData";

export default function DashboardPage() {
  const { incomes, expenses, totals, recentTransactions, setIncomes, setExpenses } = useFinanceData();
  const [viewRange, setViewRange] = useState("week");
  const barRef = useRef(null);
  const donutRef = useRef(null);
  const barChart = useRef(null);
  const donutChart = useRef(null);

  const barData = useMemo(() => buildBarData(incomes, expenses, viewRange), [incomes, expenses, viewRange]);
  const donutData = useMemo(() => buildDonutData(expenses), [expenses]);

  useEffect(() => {
    let isMounted = true;
    import("chart.js/auto").then(({ default: Chart }) => {
      if (!isMounted) return;
      if (barRef.current) {
        barChart.current?.destroy();
        barChart.current = new Chart(barRef.current, {
          type: "bar",
          data: {
            labels: barData.labels,
            datasets: [
              { label: "Income", data: barData.incomeSeries, backgroundColor: "rgba(37, 99, 235, 0.85)", borderRadius: 8, maxBarThickness: 44 },
              { label: "Expenses", data: barData.expenseSeries, backgroundColor: "rgba(239, 68, 68, 0.82)", borderRadius: 8, maxBarThickness: 44 },
            ],
          },
          options: {
            responsive: true,
            plugins: { legend: { position: "bottom", labels: { usePointStyle: true } }, tooltip: { mode: "index", intersect: false } },
            scales: { y: { ticks: { callback: (v) => `$${v / 1000}k` }, grid: { color: "rgba(15,23,42,0.08)" } }, x: { grid: { display: false } } },
          },
        });
      }
      if (donutRef.current) {
        donutChart.current?.destroy();
        donutChart.current = new Chart(donutRef.current, {
          type: "doughnut",
          data: { labels: donutData.labels, datasets: [{ data: donutData.values, backgroundColor: donutColors, borderWidth: 0 }] },
          options: { cutout: "64%", plugins: { legend: { display: false } } },
        });
      }
    });
    return () => {
      isMounted = false;
      barChart.current?.destroy();
      donutChart.current?.destroy();
    };
  }, [barData, donutData]);

  const kpis = [
    { label: "Total Income", value: fmt(totals.incomeTotal), delta: "+12% vs last mo", tone: "success", meta: "Avg / day " + fmt(totals.incomeTotal / 30) },
    { label: "Total Expenses", value: fmt(totals.expenseTotal), delta: "+6% vs last mo", tone: "danger", meta: "Top category check" },
    { label: "Net Profit", value: fmt(totals.net), delta: "+9% vs last mo", tone: "success", meta: "Margin " + Math.round((totals.net / Math.max(totals.incomeTotal, 1)) * 100) + "%" },
    { label: "Pending Payments", value: fmt(totals.pending), delta: "Invoices due", tone: "warning", meta: "Next 7 days" },
  ];

  return (
    <Shell>
      <section className="actions actions--primary">
        <a className="btn btn--primary" href="/income">+ Income</a>
        <a className="btn btn--danger" href="/expenses">+ Expense</a>
        <button className="btn btn--outline" onClick={() => downloadCSV("finex-export.csv", exportRows(incomes, expenses))}>Export</button>
        <button className="btn btn--ghost">Invite Accountant</button>
      </section>

      <section className="kpi-grid">
        {kpis.map((kpi) => (
          <div className="card kpi" key={kpi.label}>
            <div className="card__header">
              <span>{kpi.label}</span>
              <span className={clsx("pill", pillTone(kpi.tone))}>{kpi.delta}</span>
            </div>
            <div className="kpi__value">{kpi.value}</div>
            <div className="kpi__meta">{kpi.meta}</div>
          </div>
        ))}
      </section>

      <section className="grid">
        <div className="card">
          <div className="card__header">
            <div>
              <div className="card__title">Income vs Expenses</div>
              <div className="card__subtitle">Haftalik / oylik taqqoslash</div>
            </div>
            <div className="segmented">
              {["week", "month"].map((v) => (
                <button key={v} className={clsx("segmented__btn", viewRange === v && "segmented__btn--active")} onClick={() => setViewRange(v)}>
                  {v === "week" ? "Week" : "Month"}
                </button>
              ))}
            </div>
          </div>
          <canvas ref={barRef} height="140" />
        </div>

        <div className="card">
          <div className="card__header">
            <div>
              <div className="card__title">Category Split</div>
              <div className="card__subtitle">Donut chart</div>
            </div>
            <button className="btn btn--ghost">Filter</button>
          </div>
          <canvas ref={donutRef} height="180" />
          <div className="legend">
            {donutData.labels.map((label, i) => (
              <span key={label}><span className="dot" style={{ background: donutColors[i % donutColors.length] }}></span>{label}</span>
            ))}
          </div>
        </div>
      </section>

      <RecentTable rows={recentTransactions} />
      <ReportsBlock totals={totals} />
    </Shell>
  );
}

function RecentTable({ rows }) {
  return (
    <section className="card">
      <div className="card__header">
        <div>
          <div className="card__title">Recent Transactions</div>
          <div className="card__subtitle">LocalStorage ma’lumotlari</div>
        </div>
        <div className="table-actions">
          <a className="btn btn--ghost" href="/income">Add income</a>
          <a className="btn btn--ghost" href="/expenses">Add expense</a>
          <button className="btn btn--outline" onClick={() => exportCSV("transactions", transactionRows(rows))}>CSV</button>
        </div>
      </div>
      <div className="table">
        <div className="table__head"><span>Sana</span><span>Tip</span><span>Kategoriya/Manba</span><span>To‘lov</span><span className="right">Summa</span></div>
        {rows.map((tx, idx) => (
          <div className="table__row" key={idx}>
            <span>{prettyDate(tx.date)}</span>
            <span><span className={clsx("pill", pillTone(tx.tone))}>{tx.type}</span></span>
            <span>{tx.category}</span>
            <span>{tx.method}</span>
            <span className="right">{fmt(tx.amount)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ReportsBlock({ totals }) {
  return (
    <section className="grid reports">
      <div className="card">
        <div className="card__header">
          <div>
            <div className="card__title">Profit & Loss</div>
            <div className="card__subtitle">Dinamik hisob-kitob</div>
          </div>
          <button className="btn btn--outline" onClick={() => exportCSV("pnl", plRows(totals))}>Download P&L</button>
        </div>
        <ul className="pl">
          <li><span>Revenue</span><span>{fmt(totals.incomeTotal)}</span></li>
          <li><span>COGS</span><span>{fmt(-totals.expenseTotal * 0.42)}</span></li>
          <li><span>Gross Profit</span><span>{fmt(totals.incomeTotal - totals.expenseTotal * 0.42)}</span></li>
          <li><span>Operating Expenses</span><span>{fmt(-totals.expenseTotal * 0.58)}</span></li>
          <li className="pl__net"><span>Net Profit</span><span>{fmt(totals.net)}</span></li>
        </ul>
      </div>

      <div className="card">
        <div className="card__header">
          <div>
            <div className="card__title">Tax Summary</div>
            <div className="card__subtitle">Chegiriladigan vs. yo‘q</div>
          </div>
        <button className="btn btn--ghost" onClick={() => exportCSV("tax-summary", taxRows(totals))}>Export tax</button>
        </div>
        <div className="tax">
          <div className="tax__item">
            <div>Deductible</div>
            <div className="tax__value">{fmt(totals.expenseTotal * 0.7)}</div>
            <div className="tax__hint">~70% xarajatlar</div>
          </div>
          <div className="tax__item">
            <div>Non-deductible</div>
            <div className="tax__value">{fmt(totals.expenseTotal * 0.3)}</div>
            <div className="tax__hint">Marketing, Entertainment</div>
          </div>
          <div className="tax__item tax__item--due">
            <div>Estimated Tax Due</div>
            <div className="tax__value">{fmt(Math.max(totals.net * 0.18, 0))}</div>
            <div className="tax__hint">15 Mar 2026 gacha</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function downloadCSV(filename, rows) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportCSV(filename, rows) {
  downloadCSV(`${filename}.csv`, rows);
}
