"use client";

import Shell from "../components/Shell";
import { exportRows, fmt, pillTone, prettyDate, transactionRows, useFinanceData } from "../hooks/useFinanceData";
import clsx from "clsx";

export default function IncomePage() {
  const { incomes } = useFinanceData();
  return (
    <Shell>
      <SectionHeader title="Income Management" subtitle="Yangi tushumlarni tez kiriting" />
      <FiltersBar chips={["All", "Pending", "Received"]} active="All" />
      <IncomeTable rows={incomes} />
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

function IncomeTable({ rows }) {
  return (
    <section className="card">
      <div className="card__header">
        <div>
          <div className="card__title">Income history</div>
          <div className="card__subtitle">Tartib, filtrlash va eksport</div>
        </div>
        <div className="table-actions">
          <button className="btn btn--outline" onClick={() => exportCSV("income", exportRows(rows, []))}>Export</button>
        </div>
      </div>
      <div className="table">
        <div className="table__head"><span>Sana</span><span>Manba</span><span>To‘lov turi</span><span>Status</span><span className="right">Summa</span></div>
        {rows.map((r) => (
          <div className="table__row" key={r.id}>
            <span>{prettyDate(r.date)}</span>
            <span>{r.source}</span>
            <span>{r.method}</span>
            <span><span className={clsx("pill", pillTone(r.status === "Pending" ? "warning" : "success"))}>{r.status}</span></span>
            <span className="right">{fmt(r.amount)}</span>
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
