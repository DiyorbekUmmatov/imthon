"use client";

import { useEffect, useMemo, useState } from "react";

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

export function useFinanceData() {
  const [incomes, setIncomes] = useLocalList("finex-incomes", seedIncome);
  const [expenses, setExpenses] = useLocalList("finex-expenses", seedExpense);

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

  return {
    incomes,
    expenses,
    totals,
    recentTransactions,
    setIncomes,
    setExpenses,
  };
}

function useLocalList(key, seed) {
  const [data, setData] = useState(seed);
  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
    if (stored) {
      try {
        setData(JSON.parse(stored));
      } catch {
        setData(seed);
      }
    }
  }, [key, seed]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(data));
  }, [key, data]);

  return [data, setData];
}

function sumAmounts(list) {
  return list.reduce((s, i) => s + Number(i.amount || 0), 0);
}

export function fmt(n) {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n || 0);
  return `${sign}$${abs.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function prettyDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function pillTone(tone) {
  return { success: "pill--success", danger: "pill--danger", warning: "pill--warning" }[tone] || "";
}

export function exportRows(incomes, expenses) {
  return [
    ["Type", "Date", "Category/Source", "Method", "Status", "Amount"],
    ...incomes.map((i) => ["Income", i.date, i.source, i.method, i.status, i.amount]),
    ...expenses.map((e) => ["Expense", e.date, e.category, e.method, e.status, -e.amount]),
  ];
}

export function transactionRows(rows) {
  return [
    ["Date", "Type", "Category/Source", "Method", "Amount"],
    ...rows.map((t) => [t.date, t.type, t.category, t.method, t.amount]),
  ];
}

export function taxRows(totals) {
  return [
    ["Label", "Amount"],
    ["Deductible", totals.expenseTotal * 0.7],
    ["Non-deductible", totals.expenseTotal * 0.3],
    ["Estimated tax", Math.max(totals.net * 0.18, 0)],
  ];
}

export function plRows(totals) {
  return [
    ["Line", "Amount"],
    ["Revenue", totals.incomeTotal],
    ["COGS", -totals.expenseTotal * 0.42],
    ["Gross Profit", totals.incomeTotal - totals.expenseTotal * 0.42],
    ["Operating Expenses", -totals.expenseTotal * 0.58],
    ["Net Profit", totals.net],
  ];
}

export const donutColors = ["#2563eb", "#22c55e", "#f97316", "#ef4444", "#8b5cf6", "#0ea5e9", "#06b6d4"];

export function buildBarData(incomes, expenses, viewRange) {
  if (viewRange === "week") {
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const incomeSeries = Array(7).fill(0);
    const expenseSeries = Array(7).fill(0);
    incomes.forEach((i) => (incomeSeries[weekdayIndex(i.date)] += i.amount));
    expenses.forEach((e) => (expenseSeries[weekdayIndex(e.date)] += e.amount));
    return { labels, incomeSeries, expenseSeries };
  }
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const incomeSeries = Array(12).fill(0);
  const expenseSeries = Array(12).fill(0);
  incomes.forEach((i) => {
    incomeSeries[new Date(i.date).getMonth()] += i.amount;
  });
  expenses.forEach((e) => {
    expenseSeries[new Date(e.date).getMonth()] += e.amount;
  });
  return { labels: monthLabels, incomeSeries, expenseSeries };
}

export function buildDonutData(expenses) {
  const buckets = {};
  expenses.forEach((e) => {
    buckets[e.category] = (buckets[e.category] || 0) + e.amount;
  });
  return { labels: Object.keys(buckets), values: Object.values(buckets) };
}

function weekdayIndex(dateStr) {
  const d = new Date(dateStr);
  return (d.getDay() + 6) % 7; // monday first
}
