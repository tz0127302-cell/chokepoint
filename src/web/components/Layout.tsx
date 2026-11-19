import { useState } from "react";
import { NavLink } from "react-router-dom";
import { DISCLAIMER, DISCLAIMER_ZH } from "../../lib/disclaimer.js";
import { VERSION } from "../../lib/version.js";

function currentTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function useTheme(): { theme: "light" | "dark"; toggle: () => void } {
  const [theme, setTheme] = useState<"light" | "dark">(currentTheme);

  function toggle(): void {
    const next = theme === "dark" ? "light" : "dark";
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = next;
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", next === "dark" ? "#121614" : "#f3efe4");
    }
    try {
      localStorage.setItem("chokepoint-theme", next);
    } catch {
      /* ignore private-mode storage failures */
    }
    setTheme(next);
  }

  return { theme, toggle };
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { theme, toggle } = useTheme();
  return (
    <div className="page">
      <a className="skip" href="#content">
        Skip to content
      </a>
      <header className="mast">
        <div className="mast-title">
          <p className="kicker">Public maritime status</p>
          <NavLink to="/" end className="wordmark">
            chokepoint
          </NavLink>
        </div>
        <nav className="nav" aria-label="Sections">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "nav-link is-active" : "nav-link")}>
            Status
          </NavLink>
          <NavLink
            to="/methodology"
            className={({ isActive }) => (isActive ? "nav-link is-active" : "nav-link")}
          >
            Methodology
          </NavLink>
        </nav>
        <div className="mast-actions">
          <button type="button" className="text-button" onClick={toggle} aria-pressed={theme === "dark"}>
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </div>
      </header>
      <p className="disclaimer" role="note">
        {DISCLAIMER}
      </p>
      <main id="content">{children}</main>
      <footer className="colophon">
        <p>{DISCLAIMER_ZH}</p>
        <p>
          chokepoint {VERSION}. No account, no analytics. Theme stays in this browser.
        </p>
      </footer>
    </div>
  );
}
