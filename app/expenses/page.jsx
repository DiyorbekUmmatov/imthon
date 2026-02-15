"use client";

import Shell from "../components/Shell";
import { exportRows, fmt, pillTone, prettyDate, useFinanceData } from "../hooks/useFinanceData";
import clsx from "clsx";

export default function ExpensesPage() {
  const { expenses } = useFinanceData();
  return (
    <Shell>
      <SectionHeader title="Expense Management" subtitle="Kategoriya bo‘yicha ko‘ring" />
      <FiltersBar chips={["All", "Paid", "Pending"]} active="All" />
      <CategoryIcons expenses={expenses} />
      <ExpenseTable rows={expenses} />
    </Shell>
  );
}

function FiltersBar({ chips, active }) {
  return (
    <div className="filters">
      {chips.map((c) => (
        <button key={c} className={clsx("chip", c === active && "chip--active")}>{c}</button>
      ))}
      <div className="filters__right">
        <input className="filters__search" placeholder="Qidiruv / filter" />
        <button className="btn btn--ghost">Date range</button>
      </div>
    </div>
  );
}

function CategoryIcons({ expenses }) {
  const grouped = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});
  const entries = Object.entries(grouped);
  return (
    <div className="category-icons">
      {entries.map(([cat, amt]) => (
        <div className="category-card" key={cat}>
          <div className="category-icon">{cat[0]}</div>
          <div className="category-name">{cat}</div>
          <div className="category-amount">-{fmt(amt)}</div>
        </div>
      ))}
    </div>
  );
}

function ExpenseTable({ rows }) {
  return (
    <section className="card">
      <div className="card__header">
        <div>
          <div className="card__title">Expenses</div>
          <div className="card__subtitle">Status, supplier, summa</div>
        </div>
        <div className="table-actions">
          <button className="btn btn--outline" onClick={() => exportCSV("expenses", exportRows([], rows))}>Export</button>
        </div>
      </div>
      <div className="table">
        <div className="table__head"><span>Sana</span><span>Kategoriya</span><span>To‘lov</span><span>Status</span><span className="right">Summa</span></div>
        {rows.map((r) => (
          <div className="table__row" key={r.id}>
            <span>{prettyDate(r.date)}</span>
            <span>{r.category}</span>
            <span>{r.method}</span>
            <span><span className={clsx("pill", pillTone(r.status === "Pending" ? "warning" : "success"))}>{r.status}</span></span>
            <span className="right">-{fmt(r.amount)}</span>
          </div>
        ))}
      </div>
    </section>
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
