"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";

const seedIncome = [
  { id: "inc-1", date: "2026-02-15", source: "Consulting", amount: 3200, method: "Bank", status: "Received", note: "" },
  { id: "inc-2", date: "2026-02-13", source: "Sales (POS)", amount: 1180, method: "Cash", status: "Received", note: "" },
  { id: "inc-3", date: "2026-02-11", source: "Subscription", amount: 540, method: "Online", status: "Pending", note: "Stripe payout" },
  { id: "inc-4", date: "2026-02-10", source: "Services", amount: 4200, method: "Bank", status: "Received", note: "" },
  { id: "inc-5", date: "2026-02-08", source: "Affiliate", amount: 620, method: "Online", status: "Received", note: "" },
];

const seedExpense = [
  { id: "exp-1", date: "2026-02-14", category: "Software (SaaS)", amount: 240, method: "Card", status: "Paid", note: "" },
  { id: "exp-2", date: "2026-02-12", category: "Payroll", amount: 7500, method: "Bank", status: "Paid", note: "" },
  { id: "exp-3", date: "2026-02-10", category: "Marketing", amount: 940, method: "Card", status: "Pending", note: "" },
  { id: "exp-4", date: "2026-02-08", category: "Rent", amount: 4100, method: "Bank", status: "Paid", note: "" },
  { id: "exp-5", date: "2026-02-07", category: "Logistics", amount: 650, method: "Card", status: "Paid", note: "" },
];

const navItems = [
  { key: "dashboard", label: "Dashboard" },
  { key: "income", label: "Income" },
  { key: "expenses", label: "Expenses" },
  { key: "reports", label: "Reports" },
  { key: "business", label: "Businesses" },
  { key: "settings", label: "Settings" },
];

export default function Page() {
  const [incomes, setIncomes] = useLocalList("finex-incomes", seedIncome);
  const [expenses, setExpenses] = useLocalList("finex-expenses", seedExpense);
  const [drawer, setDrawer] = useState(null); // "income" | "expense" | null
  const [viewRange, setViewRange] = useState("week");
  const [activePage, setActivePage] = useState("dashboard");
  const barRef = useRef(null);
  const donutRef = useRef(null);
  const barChart = useRef(null);
  const donutChart = useRef(null);

  const totals = useMemo(() => {
    const incomeTotal = sumAmounts(incomes);
    const expenseTotal = sumAmounts(expenses);
    const pendingPayments = incomes.filter((i) => i.status === "Pending").reduce((s, i) => s + i.amount, 0);
    return { incomeTotal, expenseTotal, net: incomeTotal - expenseTotal, pending: pendingPayments };
  }, [incomes, expenses]);

  const recentTransactions = useMemo(() => {
    const incRows = incomes.map((i) => ({
      date: i.date,
      type: "Income",
      tone: "success",
      category: i.source,
      method: i.method,
      amount: i.amount,
    }));
    const expRows = expenses.map((e) => ({
      date: e.date,
      type: "Expense",
      tone: "danger",
      category: e.category,
      method: e.method,
      amount: -e.amount,
    }));
    return [...incRows, ...expRows].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
  }, [incomes, expenses]);

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
            plugins: {
              legend: { position: "bottom", labels: { usePointStyle: true } },
              tooltip: { mode: "index", intersect: false },
            },
            scales: {
              y: { ticks: { callback: (v) => `$${v / 1000}k` }, grid: { color: "rgba(15,23,42,0.08)" } },
              x: { grid: { display: false } },
            },
          },
        });
      }
      if (donutRef.current) {
        donutChart.current?.destroy();
        donutChart.current = new Chart(donutRef.current, {
          type: "doughnut",
          data: {
            labels: donutData.labels,
            datasets: [{ data: donutData.values, backgroundColor: donutColors, borderWidth: 0 }],
          },
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

  const handleExport = () => {
    downloadCSV("finex-export.csv", exportRows(incomes, expenses));
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="logo">Finex</div>
        <button className="sidebar__collapse" aria-label="Collapse sidebar">☰</button>
        <nav className="sidebar__nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={clsx("nav__item", activePage === item.key && "nav__item--active")}
              onClick={() => setActivePage(item.key)}
            >
              {item.label}
            </button>
          ))}
          <div className="nav__section">Admin</div>
          <button className="nav__item">Users & Roles</button>
          <button className="nav__item">Audit Logs</button>
        </nav>
        <div className="sidebar__cta">
          <button className="btn btn--ghost" onClick={() => setDrawer("income")}>+ New</button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar__left">
            <div className="business-pill">
              <span className="pill-dot"></span>
              Acme Studio
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5H7z"></path></svg>
            </div>
            <div className="breadcrumb">{labelFor(activePage)}</div>
          </div>
          <div className="topbar__right">
            <div className="search"><input type="search" placeholder="Qidiruv" /></div>
            <button className="icon-btn" aria-label="Language">UZ</button>
            <button className="icon-btn" aria-label="Notifications">🔔</button>
            <button className="icon-btn profile"><span className="avatar">A</span><span>Admin</span></button>
          </div>
        </header>

        <section className="actions actions--primary">
          <button className="btn btn--primary" onClick={() => setDrawer("income")}>+ Income</button>
          <button className="btn btn--danger" onClick={() => setDrawer("expense")}>+ Expense</button>
          <button className="btn btn--outline" onClick={handleExport}>Export</button>
          <button className="btn btn--ghost">Invite Accountant</button>
        </section>

        {activePage === "dashboard" && (
          <>
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
                      <button
                        key={v}
                        className={clsx("segmented__btn", viewRange === v && "segmented__btn--active")}
                        onClick={() => setViewRange(v)}
                      >
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
          </>
        )}

        {activePage === "income" && (
          <>
            <SectionHeader title="Income Management" subtitle="Yangi tushumlarni tez kiriting" />
            <FiltersBar chips={["All", "Pending", "Received"]} active="All" />
            <SummaryStrip totals={totals} />
            <IncomeTable rows={incomes} />
          </>
        )}

        {activePage === "expenses" && (
          <>
            <SectionHeader title="Expense Management" subtitle="Kategoriya bo‘yicha ko‘ring" />
            <FiltersBar chips={["All", "Paid", "Pending"]} active="All" />
            <CategoryIcons expenses={expenses} />
            <ExpenseTable rows={expenses} />
          </>
        )}

        {activePage === "reports" && (
          <>
            <SectionHeader title="Reports & Analytics" subtitle="P&L, soliqlar va eksport" />
            <ReportsBlock totals={totals} />
            <div className="card">
              <div className="card__header">
                <div>
                  <div className="card__title">Monthly Comparison</div>
                  <div className="card__subtitle">Demo ma’lumotlar</div>
                </div>
                <button className="btn btn--outline" onClick={() => downloadCSV("comparison.csv", exportRows(incomes, expenses))}>Export</button>
              </div>
              <canvas ref={barRef} height="180" />
            </div>
          </>
        )}

        {activePage === "business" && (
          <div className="card">
            <div className="card__header">
              <div>
                <div className="card__title">Businesses</div>
                <div className="card__subtitle">Multi-business demo</div>
              </div>
              <button className="btn btn--primary">+ Add business</button>
            </div>
            <div className="table">
              <div className="table__head"><span>Biznes</span><span>Rol</span><span>Status</span><span>Currency</span><span className="right">Balance</span></div>
              {["Acme Studio", "Green Farm", "Nova Retail"].map((b, i) => (
                <div className="table__row" key={b}>
                  <span>{b}</span>
                  <span>{i === 0 ? "Owner" : "Accountant"}</span>
                  <span><span className="pill pill--success">{i === 2 ? "Live" : "Active"}</span></span>
                  <span>{i === 1 ? "EUR" : "USD"}</span>
                  <span className="right">{fmt(42000 - i * 8000)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activePage === "settings" && (
          <div className="card">
            <div className="card__header">
              <div>
                <div className="card__title">Settings</div>
                <div className="card__subtitle">Ko‘rinish, valyuta, til</div>
              </div>
            </div>
            <div className="form" style={{ maxWidth: 480 }}>
              <label className="field">
                <span>Default currency</span>
                <select className="inputish">
                  <option>USD</option>
                  <option>EUR</option>
                  <option>UZS</option>
                </select>
              </label>
              <label className="field">
                <span>Language</span>
                <select className="inputish">
                  <option>Uzbek</option>
                  <option>English</option>
                  <option>Russian</option>
                </select>
              </label>
              <label className="field">
                <span>Theme</span>
                <select className="inputish">
                  <option>Light</option>
                  <option>Dark</option>
                  <option>System</option>
                </select>
              </label>
              <button className="btn btn--primary" style={{ justifySelf: "flex-start" }}>Save</button>
            </div>
          </div>
        )}
      </main>

      <nav className="mobile-tabbar">
        {["dashboard", "income", "expenses", "reports", "settings"].map((key) => (
          <button key={key} className={clsx("tab", activePage === key && "tab--active")} onClick={() => setActivePage(key)}>
            {labelFor(key)}
          </button>
        ))}
      </nav>

      <button className="floating-action" onClick={() => setDrawer("income")}>＋</button>

      <Drawer
        open={drawer}
        onClose={() => setDrawer(null)}
        onAddIncome={(payload) => {
          setIncomes((prev) => [{ id: crypto.randomUUID(), ...payload }, ...prev]);
          setDrawer(null);
        }}
        onAddExpense={(payload) => {
          setExpenses((prev) => [{ id: crypto.randomUUID(), ...payload }, ...prev]);
          setDrawer(null);
        }}
      />
    </div>
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
          <button className="btn btn--ghost">Add income</button>
          <button className="btn btn--ghost">Add expense</button>
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

function SummaryStrip({ totals }) {
  return (
    <div className="summary">
      <div className="summary__item">
        <div className="muted">This month income</div>
        <div className="summary__value">{fmt(totals.incomeTotal)}</div>
      </div>
      <div className="summary__item">
        <div className="muted">Expenses</div>
        <div className="summary__value">{fmt(totals.expenseTotal)}</div>
      </div>
      <div className="summary__item">
        <div className="muted">Net</div>
        <div className="summary__value">{fmt(totals.net)}</div>
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

function Drawer({ open, onClose, onAddIncome, onAddExpense }) {
  const isIncome = open === "income";
  const isExpense = open === "expense";
  const [form, setForm] = useState(defaultForm());

  useEffect(() => setForm(defaultForm()), [open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!open) return;
    if (!form.amount || form.amount <= 0 || !form.title) return;
    if (isIncome) {
      onAddIncome({ date: form.date, source: form.title, amount: Number(form.amount), method: form.method, status: form.status, note: form.note });
    } else if (isExpense) {
      onAddExpense({ date: form.date, category: form.title, amount: Number(form.amount), method: form.method, status: form.status, note: form.note });
    }
  };

  return (
    <div className={clsx("drawer", open && "drawer--open")}>
      <div className="drawer__overlay" onClick={onClose} />
      <div className="drawer__panel">
        <div className="drawer__header">
          <div>
            <div className="card__title">{isIncome ? "Yangi Income" : "Yangi Expense"}</div>
            <div className="card__subtitle">LocalStorage ga yoziladi</div>
          </div>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Nomi / Kategoriya</span>
            <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder={isIncome ? "Consulting" : "Marketing"} />
          </label>
          <label className="field">
            <span>Summa</span>
            <input required type="number" inputMode="decimal" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
          </label>
          <label className="field">
            <span>Sana</span>
            <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          </label>
          <label className="field">
            <span>To‘lov turi</span>
            <div className="chip-row">
              {["Bank", "Card", "Cash", "Online"].map((m) => (
                <button type="button" key={m} className={clsx("chip", form.method === m && "chip--active")} onClick={() => setForm((f) => ({ ...f, method: m }))}>{m}</button>
              ))}
            </div>
          </label>
          <label className="field">
            <span>Status</span>
            <div className="chip-row">
              {["Pending", "Received", "Paid"].map((m) => (
                <button type="button" key={m} className={clsx("chip", form.status === m && "chip--active")} onClick={() => setForm((f) => ({ ...f, status: m }))}>{m}</button>
              ))}
            </div>
          </label>
          <label className="field">
            <span>Izoh</span>
            <textarea rows={3} value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="Qo‘shimcha tafsilotlar" />
          </label>
          <div className="form__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>Bekor qilish</button>
            <button type="submit" className={clsx("btn", isIncome ? "btn--primary" : "btn--danger")}>Saqlash</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function useLocalList(key, seed) {
  const [data, setData] = useState(seed);
  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
    if (stored) {
      try { setData(JSON.parse(stored)); } catch { setData(seed); }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(data));
  }, [key, data]);
  return [data, setData];
}

function sumAmounts(list) {
  return list.reduce((s, i) => s + Number(i.amount || 0), 0);
}

function weekdayIndex(dateStr) {
  const d = new Date(dateStr);
  return (d.getDay() + 6) % 7; // monday first
}

function fmt(n) {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n || 0);
  return `${sign}$${abs.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function prettyDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function buildBarData(incomes, expenses, viewRange) {
  if (viewRange === "week") {
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const incomeSeries = Array(7).fill(0);
    const expenseSeries = Array(7).fill(0);
    incomes.forEach((i) => incomeSeries[weekdayIndex(i.date)] += i.amount);
    expenses.forEach((e) => expenseSeries[weekdayIndex(e.date)] += e.amount);
    return { labels, incomeSeries, expenseSeries };
  }
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const incomeSeries = Array(12).fill(0);
  const expenseSeries = Array(12).fill(0);
  incomes.forEach((i) => { incomeSeries[new Date(i.date).getMonth()] += i.amount; });
  expenses.forEach((e) => { expenseSeries[new Date(e.date).getMonth()] += e.amount; });
  return { labels: monthLabels, incomeSeries, expenseSeries };
}

function buildDonutData(expenses) {
  const buckets = {};
  expenses.forEach((e) => { buckets[e.category] = (buckets[e.category] || 0) + e.amount; });
  return { labels: Object.keys(buckets), values: Object.values(buckets) };
}

const donutColors = ["#2563eb", "#22c55e", "#f97316", "#ef4444", "#8b5cf6", "#0ea5e9", "#06b6d4"];

function defaultForm() {
  const today = new Date().toISOString().slice(0, 10);
  return { title: "", amount: "", date: today, method: "Bank", status: "Pending", note: "" };
}

function pillTone(tone) {
  return { success: "pill--success", danger: "pill--danger", warning: "pill--warning" }[tone] || "";
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

function exportRows(incomes, expenses) {
  return [
    ["Type", "Date", "Category/Source", "Method", "Status", "Amount"],
    ...incomes.map((i) => ["Income", i.date, i.source, i.method, i.status, i.amount]),
    ...expenses.map((e) => ["Expense", e.date, e.category, e.method, e.status, -e.amount]),
  ];
}

function transactionRows(rows) {
  return [
    ["Date", "Type", "Category/Source", "Method", "Amount"],
    ...rows.map((t) => [t.date, t.type, t.category, t.method, t.amount]),
  ];
}

function taxRows(totals) {
  return [
    ["Label", "Amount"],
    ["Deductible", totals.expenseTotal * 0.7],
    ["Non-deductible", totals.expenseTotal * 0.3],
    ["Estimated tax", Math.max(totals.net * 0.18, 0)],
  ];
}

function plRows(totals) {
  return [
    ["Line", "Amount"],
    ["Revenue", totals.incomeTotal],
    ["COGS", -totals.expenseTotal * 0.42],
    ["Gross Profit", totals.incomeTotal - totals.expenseTotal * 0.42],
    ["Operating Expenses", -totals.expenseTotal * 0.58],
    ["Net Profit", totals.net],
  ];
}

function labelFor(key) {
  return {
    dashboard: "Dashboard",
    income: "Income",
    expenses: "Expenses",
    reports: "Reports",
    business: "Businesses",
    settings: "Settings",
  }[key] || "Dashboard";
}
