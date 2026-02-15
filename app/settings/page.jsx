"use client";

import Shell from "../components/Shell";

export default function SettingsPage() {
  return (
    <Shell>
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
    </Shell>
  );
}
