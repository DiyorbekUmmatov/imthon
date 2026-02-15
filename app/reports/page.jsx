"use client";

import Shell from "../components/Shell";
import { exportRows, fmt, plRows, taxRows, useFinanceData } from "../hooks/useFinanceData";

export default function ReportsPage() {
  const { incomes, expenses, totals } = useFinanceData();

  return (
    <Shell>
      <SectionHeader title="Reports & Analytics" subtitle="P&L, soliqlar va eksport" />
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

      <div className="card">
        <div className="card__header">
          <div>
            <div className="card__title">Monthly comparison</div>
            <div className="card__subtitle">Demo ma’lumotlar</div>
          </div>
          <button className="btn btn--outline" onClick={() => exportCSV("comparison", exportRows(incomes, expenses))}>Export</button>
        </div>
        <div className="card__subtitle">Grafiklar dashboardda ko‘rinadi; bu yerda eksport tayyor.</div>
      </div>
    </Shell>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="card__header">
        <div>
          <div className="card__title">{title}</div>
          <div className="card__subtitle">{subtitle}</div>
        </div>
      </div>
    </div>
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
