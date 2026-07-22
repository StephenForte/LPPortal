"use client";

import { useState } from "react";

type FundKey = "all" | "northstar" | "opportunity";
type View = "dashboard" | "updates" | "admin";

const funds = {
  northstar: { name: "Northstar Fund I", short: "Fund I", committed: 500000, called: 375000, distributed: 42000, ownership: 0.0325 },
  opportunity: { name: "Northstar Opportunity I", short: "Opportunity I", committed: 250000, called: 225000, distributed: 18000, ownership: 0.018 },
};

const positions = [
  { company: "Aperture", initials: "AP", sector: "Developer tools", instrument: "SAFE", fund: "northstar" as const, mark: 5800000, date: "Jun 30, 2026", shares: null },
  { company: "Canopy", initials: "CA", sector: "Climate software", instrument: "Equity", fund: "northstar" as const, mark: 4200000, date: "Jun 30, 2026", shares: "28,450" },
  { company: "Canopy", initials: "CA", sector: "Climate software", instrument: "SAFE", fund: "opportunity" as const, mark: 2100000, date: "Jun 30, 2026", shares: null },
  { company: "Kite Health", initials: "KH", sector: "Healthcare", instrument: "Note", fund: "opportunity" as const, mark: 3600000, date: "May 15, 2026", shares: null },
  { company: "Relay", initials: "RE", sector: "Fintech infrastructure", instrument: "Equity", fund: "northstar" as const, mark: 1900000, date: "Jun 30, 2026", shares: "16,200" },
];

const updates = [
  { quarter: "Q2 2026", title: "Building with discipline", fund: "Northstar Fund I", date: "July 12, 2026", intro: "The second quarter rewarded focus. Our founders continued to build efficiently, with several meaningful product and commercial milestones across the portfolio." },
  { quarter: "Q1 2026", title: "A strong start to the year", fund: "Northstar Opportunity I", date: "April 9, 2026", intro: "We began the year with encouraging momentum across the opportunity portfolio and remain focused on thoughtful follow-on support." },
  { quarter: "Q4 2025", title: "Year-end letter", fund: "Northstar Fund I", date: "January 16, 2026", intro: "A look back at a year of patient company-building and the priorities we are carrying into 2026." },
];

const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

function Mark({ children }: { children: React.ReactNode }) {
  return <span className="mark">{children}</span>;
}

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(true);
  const [role, setRole] = useState<"lp" | "gp">("lp");
  const [view, setView] = useState<View>("dashboard");
  const [fund, setFund] = useState<FundKey>("all");
  const [expanded, setExpanded] = useState<string | null>("Canopy");

  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} />;

  const navigate = (next: View) => { setView(next); if (next === "admin") setRole("gp"); };

  return (
    <div className="shell">
      <header className="topbar">
        <button className="brand" onClick={() => navigate("dashboard")}><Mark>N</Mark><span>Northstar</span></button>
        <nav aria-label="Primary navigation">
          {role === "lp" ? <>
            <button className={view === "dashboard" ? "active" : ""} onClick={() => navigate("dashboard")}>Overview</button>
            <button className={view === "updates" ? "active" : ""} onClick={() => navigate("updates")}>Updates</button>
          </> : <button className={view === "admin" ? "active" : ""} onClick={() => navigate("admin")}>Fund administration</button>}
        </nav>
        <div className="account">
          <button className="role-switch" onClick={() => { const next = role === "lp" ? "gp" : "lp"; setRole(next); setView(next === "gp" ? "admin" : "dashboard"); }}>{role === "lp" ? "LP view" : "GP view"}</button>
          <span className="avatar">SF</span><button className="signout" onClick={() => setLoggedIn(false)}>Sign out</button>
        </div>
      </header>
      {view === "dashboard" && <Dashboard fund={fund} setFund={setFund} expanded={expanded} setExpanded={setExpanded} />}
      {view === "updates" && <Updates />}
      {view === "admin" && <Admin />}
      <footer><span>Northstar Ventures</span><span>Private & confidential · Last updated July 18, 2026</span></footer>
    </div>
  );
}

function Login({ onLogin }: { onLogin: () => void }) {
  const [sent, setSent] = useState(false);
  return <main className="login-page">
    <section className="login-copy"><Mark>N</Mark><p className="eyebrow">Northstar Ventures</p><h1>A clear view of what we’re building together.</h1><p>Capital accounts, portfolio positions, and investor updates—all in one quiet place.</p></section>
    <section className="login-card">{sent ? <><div className="success">✓</div><h2>Check your inbox</h2><p>We sent a secure sign-in link. It expires in 15 minutes.</p><button className="primary" onClick={onLogin}>Open demo link</button><button className="text-button" onClick={() => setSent(false)}>Use another email</button></> : <><p className="eyebrow">Investor portal</p><h2>Welcome back</h2><p>Enter the email associated with your Northstar account.</p><label>Email address<input type="email" defaultValue="steve@forte.vc" /></label><button className="primary" onClick={() => setSent(true)}>Email me a secure link <span>→</span></button><small>No password needed. For your security, links can only be used once.</small></>}</section>
  </main>;
}

function Dashboard({ fund, setFund, expanded, setExpanded }: { fund: FundKey; setFund: (v: FundKey) => void; expanded: string | null; setExpanded: (v: string | null) => void }) {
  const includedFunds = fund === "all" ? Object.entries(funds) : [[fund, funds[fund]]];
  const metrics = includedFunds.reduce((a, [, f]) => ({ committed: a.committed + f.committed, called: a.called + f.called, distributed: a.distributed + f.distributed }), { committed: 0, called: 0, distributed: 0 });
  const visible = positions.filter(p => fund === "all" || p.fund === fund);
  const rows = (() => {
    const grouped = new Map<string, typeof visible>();
    visible.forEach(p => grouped.set(p.company, [...(grouped.get(p.company) || []), p]));
    return [...grouped.entries()].map(([company, items]) => ({ company, items, lookThrough: items.reduce((sum, p) => sum + p.mark * funds[p.fund].ownership, 0) })).sort((a, b) => b.lookThrough - a.lookThrough);
  })();
  const value = rows.reduce((sum, row) => sum + row.lookThrough, 0);

  return <main className="content">
    <div className="welcome"><div><p className="eyebrow">Investor overview</p><h1>Good morning, Steve.</h1><p>Your consolidated partnership snapshot as of June 30, 2026.</p></div><label className="fund-select">View<select value={fund} onChange={e => { const v = e.target.value as FundKey; setFund(v); history.replaceState(null, "", `?fund=${v}`); }}><option value="all">All funds</option><option value="northstar">Northstar Fund I</option><option value="opportunity">Northstar Opportunity I</option></select></label></div>
    <section className="hero-metric"><div><p className="eyebrow">Estimated current value</p><strong>{money(value)}</strong><span className="multiple">{(value / metrics.called).toFixed(2)}x multiple on called capital</span></div><div className="hero-note"><span className="dot" /> Based on the latest GP marks</div></section>
    <section className="metric-grid">
      {[ ["Committed", metrics.committed], ["Called", metrics.called], ["Outstanding", metrics.committed - metrics.called], ["Distributed", metrics.distributed] ].map(([label, n]) => <article key={label as string}><p>{label}</p><strong>{money(n as number)}</strong>{label === "Called" && <span>{Math.round((metrics.called / metrics.committed) * 100)}% of commitment</span>}</article>)}
    </section>
    <div className="section-heading"><div><p className="eyebrow">Look-through portfolio</p><h2>Your positions</h2></div><p>{rows.length} companies · Sorted by current value</p></div>
    <section className="positions">
      <div className="table-head"><span>Company</span><span>Instrument</span><span>Fund mark</span><span>Your value</span><span>Mark date</span><span /></div>
      {rows.map(row => <div className="position-wrap" key={row.company}>
        <button className="position-row" onClick={() => setExpanded(expanded === row.company ? null : row.company)}>
          <span className="company"><i>{row.items[0].initials}</i><span><b>{row.company}</b><small>{row.items[0].sector}</small></span></span>
          <span><em>{row.items.length > 1 ? `${row.items.length} positions` : row.items[0].instrument}</em></span>
          <span>{row.items.length > 1 ? "—" : money(row.items[0].mark)}</span><strong>{money(row.lookThrough)}</strong><span>{row.items.length > 1 ? "Various" : row.items[0].date}</span><span className="chevron">{expanded === row.company ? "⌃" : "⌄"}</span>
        </button>
        {expanded === row.company && <div className="breakdown"><p>Position breakdown</p>{row.items.map(item => <div key={item.fund}><span>{funds[item.fund].name}</span><span>Fund mark <b>{money(item.mark)}</b></span><span>Ownership <b>{(funds[item.fund].ownership * 100).toFixed(2)}%</b></span><span>Look-through <b>{money(item.mark * funds[item.fund].ownership)}</b></span>{item.shares && <span>Shares <b>{item.shares}</b></span>}</div>)}</div>}
      </div>)}
    </section>
    <p className="disclaimer">Values shown are estimates based on the fund’s latest internal marks and are not guarantees of future results.</p>
  </main>;
}

function Updates() {
  const [selected, setSelected] = useState(0);
  const update = updates[selected];
  return <main className="content updates-layout"><aside><p className="eyebrow">Investor letters</p><h1>Updates</h1><p>Quarterly notes from the Northstar team.</p><div className="update-list">{updates.map((u, i) => <button className={selected === i ? "selected" : ""} key={u.title} onClick={() => setSelected(i)}><span>{u.quarter}</span><b>{u.title}</b><small>{u.fund}</small></button>)}</div></aside><article className="letter"><div className="letter-meta"><span>{update.quarter}</span><span>{update.fund}</span><span>{update.date}</span></div><h2>{update.title}</h2><p className="lead">{update.intro}</p><hr/><p className="eyebrow">Portfolio highlights</p><h3>Aperture</h3><p>Aperture shipped its enterprise workflow suite and expanded several design partnerships into annual contracts. The team remains measured on hiring while demand continues to build.</p><h3>Canopy</h3><p>Canopy crossed an important product milestone this quarter, giving operators a unified view of energy usage across distributed sites. Early expansion signals remain encouraging.</p><h3>Relay</h3><p>Relay deepened its payments infrastructure and welcomed two new financial institution partners. The company remains focused on reliability and a narrow customer profile.</p><p className="signature">With appreciation,<br/><b>The Northstar team</b></p></article></main>;
}

function Admin() {
  const [section, setSection] = useState("Overview");
  const [draft, setDraft] = useState("Canopy reached a meaningful product milestone this quarter, giving operators a unified view of energy usage across distributed sites.");
  const menu = ["Overview", "Funds", "Companies", "Limited partners", "Updates", "Team", "Settings", "System"];
  return <main className="admin-shell"><aside className="admin-nav"><p className="eyebrow">General partner</p>{menu.map(item => <button className={section === item ? "selected" : ""} onClick={() => setSection(item)} key={item}>{item}<span>›</span></button>)}</aside><section className="admin-content">
    {section === "Updates" ? <Composer draft={draft} setDraft={setDraft} /> : section === "Companies" ? <Companies /> : section === "Settings" ? <Settings /> : section === "System" ? <System /> : <><div className="admin-title"><div><p className="eyebrow">Fund administration</p><h1>{section}</h1><p>Manage the records that power every investor view.</p></div><button className="primary small">+ Add {section === "Overview" ? "record" : section.toLowerCase().replace(/s$/, "")}</button></div><div className="admin-stats"><article><span>Active funds</span><b>2</b><small>$28.5m total commitments</small></article><article><span>Limited partners</span><b>24</b><small>23 active · 1 inactive</small></article><article><span>Portfolio companies</span><b>11</b><small>8 linked to Pipedrive</small></article></div><section className="admin-table"><div className="table-toolbar"><h2>{section === "Overview" ? "Recent portfolio marks" : section}</h2><input placeholder="Search records…" /></div>{[ ["Aperture", "Northstar Fund I", "$5,800,000", "Jun 30, 2026"], ["Canopy", "2 fund positions", "$6,300,000", "Jun 30, 2026"], ["Kite Health", "Opportunity I", "$3,600,000", "May 15, 2026"], ["Relay", "Northstar Fund I", "$1,900,000", "Jun 30, 2026"] ].map(r => <button className="admin-row" key={r[0]}><span className="company"><i>{r[0].split(" ").map(x => x[0]).join("")}</i><b>{r[0]}</b></span><span>{r[1]}</span><strong>{r[2]}</strong><span>{r[3]}</span><span>•••</span></button>)}</section></>}
  </section></main>;
}

type CompanyRecord = { orgId: string; dealId: string; linked: boolean; activities: number; notes: number; deals: number; lastSynced: string };

const companyRecords: Record<string, CompanyRecord> = {
  Aperture: { orgId: "10239481", dealId: "7734", linked: true, activities: 12, notes: 4, deals: 1, lastSynced: "July 14 at 6:02 AM" },
  Canopy: { orgId: "12483917", dealId: "8421", linked: true, activities: 18, notes: 6, deals: 1, lastSynced: "July 14 at 6:02 AM" },
  "Kite Health": { orgId: "11029273", dealId: "5310", linked: true, activities: 9, notes: 3, deals: 1, lastSynced: "May 15 at 9:40 AM" },
  Relay: { orgId: "", dealId: "", linked: false, activities: 0, notes: 0, deals: 0, lastSynced: "" },
};

function Companies() {
  const [selected, setSelected] = useState("Canopy");
  const [orgId, setOrgId] = useState(companyRecords.Canopy.orgId);
  const [dealId, setDealId] = useState(companyRecords.Canopy.dealId);
  const [status, setStatus] = useState<"idle" | "testing" | "connected" | "syncing" | "synced">(companyRecords.Canopy.linked ? "connected" : "idle");
  const record = companyRecords[selected];
  const select = (name: string) => { setSelected(name); const next = companyRecords[name]; setOrgId(next.orgId); setDealId(next.dealId); setStatus(next.linked ? "connected" : "idle"); };
  const test = () => { setStatus("testing"); setTimeout(() => setStatus("connected"), 750); };
  const sync = () => { setStatus("syncing"); setTimeout(() => setStatus("synced"), 950); };
  const connected = status === "connected" || status === "syncing" || status === "synced" || status === "testing";
  return <><div className="admin-title"><div><p className="eyebrow">Portfolio data</p><h1>Companies</h1><p>Link portfolio companies to their CRM records.</p></div><button className="primary small">+ Add company</button></div><div className="company-workspace"><section className="company-list"><div className="table-toolbar"><h2>11 companies</h2></div>{Object.keys(companyRecords).map(name => <button className={selected === name ? "selected" : ""} onClick={() => select(name)} key={name}><span className="company"><i>{name.split(" ").map(x => x[0]).join("")}</i><span><b>{name}</b><small>{companyRecords[name].linked ? "Pipedrive connected" : "Not linked"}</small></span></span><span>›</span></button>)}</section><section className="company-detail"><div className="detail-heading"><div><p className="eyebrow">Company record</p><h2>{selected}</h2></div><span className={connected ? "connection-badge" : "connection-badge muted"}><i /> {connected ? "Connected" : "Not linked"}</span></div><div className="form-grid"><label>Pipedrive organization ID<input value={orgId} onChange={e => setOrgId(e.target.value)} /></label><label>Pipedrive deal ID<input value={dealId} onChange={e => setDealId(e.target.value)} /></label></div><div className="integration-actions"><button onClick={test}>{status === "testing" ? "Checking…" : "Test connection"}</button><button className="primary small" onClick={sync}>{status === "syncing" ? "Syncing…" : status === "synced" ? "Synced ✓" : "Sync now"}</button></div><div className="last-sync"><span className="sync-icon">↻</span><div><b>{status === "synced" ? "Synced just now" : record.linked ? `Last synced ${record.lastSynced}` : "Not yet synced"}</b><p>{status === "synced" || record.linked ? `${record.activities} activities · ${record.notes} notes · ${record.deals} active deal${record.deals === 1 ? "" : "s"}` : "Link a Pipedrive organization or deal to sync data"}</p></div></div><p className="secret-note">The Pipedrive API token is managed securely in the deployment environment and is never shown here.</p></section></div></>;
}

function Settings() {
  const [saved, setSaved] = useState(false);
  return <><div className="admin-title"><div><p className="eyebrow">AI drafting</p><h1>Writing style</h1><p>These rules guide every AI-generated portfolio blurb.</p></div><button className="primary small" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 1800); }}>{saved ? "Saved ✓" : "Save changes"}</button></div><section className="settings-card"><label>Tone<textarea rows={3} defaultValue="Calm, direct, and candid. Write like an experienced investor speaking to trusted partners." /></label><label>Length and structure<textarea rows={4} defaultValue="70–100 words. Lead with the most important operating milestone, follow with evidence, then close with the next focus. Use one paragraph." /></label><label>Banned phrases<textarea rows={3} defaultValue="game-changing, crushing it, hockey-stick, thrilled to announce, unprecedented, best-in-class" /></label><div className="setting-row"><label>Daily drafting limit<input type="number" defaultValue="40" /></label><label>Maximum output tokens<input type="number" defaultValue="500" /></label></div><p className="secret-note">AI credentials are managed securely in the deployment environment. Generated text is always returned to the composer as an editable draft.</p></section></>;
}

function System() {
  const [running, setRunning] = useState(false);
  return <><div className="admin-title"><div><p className="eyebrow">Integrations</p><h1>System</h1><p>Monitor automated data pulls and integration health.</p></div><button className="primary small" onClick={() => { setRunning(true); setTimeout(() => setRunning(false), 1100); }}>{running ? "Syncing 8 companies…" : "Run Pipedrive sync"}</button></div><div className="health-grid"><article><span>Pipedrive</span><b><i className="health-dot" /> Operational</b><small>8 of 11 companies linked</small></article><article><span>AI drafting</span><b><i className="health-dot" /> Operational</b><small>12 of 40 calls used today</small></article><article><span>Next automatic sync</span><b>Mon, 6:00 AM</b><small>Weekly · America/Los_Angeles</small></article></div><section className="runs"><div className="table-toolbar"><h2>Recent runs</h2><span>Last 30 days</span></div><div className="run-head"><span>Started</span><span>Trigger</span><span>Result</span><span>Records</span><span>Duration</span></div>{[["Jul 14, 6:00 AM","Scheduled","Success","8 companies","18s"],["Jul 10, 2:42 PM","Manual · Sarah","Success","Canopy","2s"],["Jul 7, 6:00 AM","Scheduled","1 skipped","7 companies","16s"],["Jun 30, 6:00 AM","Scheduled","Success","8 companies","19s"]].map(row => <div className="run-row" key={row[0]}>{row.map((cell, i) => <span className={i === 2 ? (cell === "Success" ? "run-ok" : "run-warn") : ""} key={cell}>{cell}</span>)}</div>)}</section><div className="system-note"><b>About skipped companies</b><p>Companies without a linked Pipedrive organization or deal ID are skipped safely and included in the run summary.</p></div></>;
}

function Composer({ draft, setDraft }: { draft: string; setDraft: (v: string) => void }) {
  const [published, setPublished] = useState(false);
  const [contextOpen, setContextOpen] = useState(true);
  const [generating, setGenerating] = useState(false);
  const generate = () => { setGenerating(true); setTimeout(() => { setDraft("Canopy crossed a meaningful product milestone this quarter, launching its multi-site energy dashboard to all design partners. Three customers expanded into paid annual contracts, bringing ARR to $2.4 million, up 38% quarter over quarter. The team remains disciplined on hiring and is focused next on shortening enterprise onboarding while converting the remaining pilots."); setGenerating(false); }, 1050); };
  return <><div className="admin-title"><div><p className="eyebrow">Q2 2026 · Northstar Fund I</p><h1>Building with discipline</h1><p><span className="saved">● All changes saved</span></p></div><div className="composer-actions"><button>Preview</button><button className="primary small" onClick={() => setPublished(true)}>{published ? "Published ✓" : "Review & publish"}</button></div></div><div className="composer"><section><label>Introduction<textarea rows={5} defaultValue="The second quarter rewarded focus. Our founders continued to build efficiently, with several meaningful product and commercial milestones across the portfolio." /></label><div className="section-card"><div><span className="drag">⠿</span><span className="company"><i>CA</i><b>Canopy</b></span><button>Remove</button></div><button className="context-toggle" onClick={() => setContextOpen(!contextOpen)}><span><b>Context from Pipedrive</b><small>Updated July 14</small></span><span>{contextOpen ? "⌃" : "⌄"}</span></button>{contextOpen && <div className="context-panel"><ul><li><b>Revenue:</b> ARR reached $2.4m, up 38% quarter over quarter.</li><li><b>Customers:</b> Three design partners converted to annual contracts.</li><li><b>Product:</b> Multi-site energy dashboard launched June 18.</li><li><b>Team:</b> Headcount held at 19; VP Sales search remains open.</li></ul><div className="context-meta"><span>6 notes</span><span>18 activities</span><span>1 active deal</span></div></div>}<div className="ai-bar"><div><span className="spark">✦</span><span><b>Drafting assistant</b><small>Uses CRM context + your writing style</small></span></div><button onClick={generate} disabled={generating}>{generating ? "Drafting…" : draft.length > 170 ? "Regenerate" : "Draft with AI"}</button></div><div className="formatbar"><button><b>B</b></button><button><i>I</i></button><button>↗ Link</button><button>• List</button></div><textarea rows={8} value={draft} onChange={e => setDraft(e.target.value)} /><div className="draft-foot"><span>{draft.split(/\s+/).filter(Boolean).length} words</span><span>Editable draft · Never published automatically</span></div></div><button className="add-section">+ Add portfolio company</button></section><aside className="preview"><p className="eyebrow">Live preview</p><div className="paper"><small>Q2 2026 · Northstar Fund I</small><h2>Building with discipline</h2><p>The second quarter rewarded focus. Our founders continued to build efficiently, with several meaningful product and commercial milestones across the portfolio.</p><hr/><h3>Canopy</h3><p>{draft}</p></div></aside></div></>;
}
