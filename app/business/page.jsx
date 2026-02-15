"use client";

import Shell from "../components/Shell";
import { fmt } from "../hooks/useFinanceData";

export default function BusinessPage() {
  const businesses = [
    { name: "Acme Studio", role: "Owner", status: "Active", currency: "USD", balance: 42000 },
    { name: "Green Farm", role: "Accountant", status: "Live", currency: "EUR", balance: 34000 },
    { name: "Nova Retail", role: "Viewer", status: "Live", currency: "USD", balance: 28000 },
  ];

  return (
    <Shell>
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
          {businesses.map((b) => (
            <div className="table__row" key={b.name}>
              <span>{b.name}</span>
              <span>{b.role}</span>
              <span><span className="pill pill--success">{b.status}</span></span>
              <span>{b.currency}</span>
              <span className="right">{fmt(b.balance)}</span>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}
