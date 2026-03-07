import { useState } from "react";

const NAVY = "#0F1B2D";
const ACCENT = "#6C63FF";
const ACCENT2 = "#00D9A3";
const SURFACE = "#F7F8FA";
const BORDER = "#E5E7EB";
const INK = "#1A1D23";
const INK60 = "#6B7280";
const WARN = "#F59E0B";
const DANGER = "#EF4444";

const metrics = [
  { label: "Active Accounts", value: "2,847", delta: "+12.4%", up: true },
  { label: "Pipeline Value", value: "$14.2M", delta: "+8.1%", up: true },
  { label: "Churn Risk", value: "23", delta: "-3", up: false, warn: true },
  { label: "NPS Score", value: "72", delta: "+5pts", up: true },
];

const signals = [
  { id: 1, severity: "critical", account: "Meridian Corp", signal: "Champion departed — VP Product left 3 days ago", action: "Schedule exec alignment call", time: "2h ago", score: 94 },
  { id: 2, severity: "warning", account: "Helios Labs", signal: "Usage dropped 40% in last 14 days across all seats", action: "Trigger health check sequence", time: "5h ago", score: 78 },
  { id: 3, severity: "opportunity", account: "Atlas Dynamics", signal: "3 new departments activated — organic expansion detected", action: "Propose enterprise tier upgrade", time: "1d ago", score: 88 },
  { id: 4, severity: "warning", account: "Quantum Ridge", signal: "Support tickets 3x above baseline — integration pain", action: "Deploy technical success manager", time: "1d ago", score: 71 },
  { id: 5, severity: "opportunity", account: "Neon Health", signal: "CEO mentioned you in board deck — strong internal advocacy", action: "Send case study + ROI framework", time: "2d ago", score: 92 },
  { id: 6, severity: "critical", account: "Prism Analytics", signal: "Contract renewal in 18 days — no engagement from buyer", action: "Escalate to CRO for direct outreach", time: "3d ago", score: 96 },
  { id: 7, severity: "info", account: "Cobalt Systems", signal: "Completed onboarding milestone — 80% feature adoption", action: "Schedule value review", time: "3d ago", score: 65 },
];

const conversations = [
  { id: 1, account: "Meridian Corp", contact: "Sarah Chen", role: "VP Engineering", channel: "Zoom", sentiment: 0.3, duration: "32 min", topics: ["Integration Timeline", "API Limits", "Pricing"], date: "Today", snippet: "We need to see faster API response times before we can roll out to the rest of the org..." },
  { id: 2, account: "Atlas Dynamics", contact: "James Okafor", role: "Head of Data", channel: "Email", sentiment: 0.9, duration: "—", topics: ["Expansion", "New Use Case", "ROI"], date: "Today", snippet: "The marketing team just started using it independently — they're seeing 3x faster insights..." },
  { id: 3, account: "Neon Health", contact: "Dr. Lisa Park", role: "Chief Analytics Officer", channel: "Slack", sentiment: 0.8, duration: "—", topics: ["Board Prep", "Metrics", "Advocacy"], date: "Yesterday", snippet: "I included your platform in my board presentation. The before/after on our pipeline velocity was compelling..." },
  { id: 4, account: "Quantum Ridge", contact: "Mike Torres", role: "IT Director", channel: "Support", sentiment: 0.2, duration: "—", topics: ["SSO Issues", "Downtime", "Escalation"], date: "Yesterday", snippet: "We've had 3 SSO failures this week. My team is losing confidence in the platform..." },
];

const sevColors = { critical: "#EF4444", warning: "#F59E0B", opportunity: "#6C63FF", info: "#00D9A3" };
const sentimentColor = (s) => s > 0.6 ? "#00D9A3" : s > 0.3 ? "#F59E0B" : "#EF4444";
const sentimentLabel = (s) => s > 0.6 ? "Positive" : s > 0.3 ? "Neutral" : "Negative";

function MiniBar({ value, max = 100, color = ACCENT }) {
  return (
    <div style={{ width: 60, height: 6, background: "#E5E7EB", borderRadius: 3, overflow: "hidden" }}>
      <div style={{ width: `${(value / max) * 100}%`, height: "100%", background: color, borderRadius: 3 }} />
    </div>
  );
}

export default function AuraIntelligence() {
  const [tab, setTab] = useState("dashboard");
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [selectedConvo, setSelectedConvo] = useState(null);
  const [hoveredMetric, setHoveredMetric] = useState(null);

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: "#FAFBFC", minHeight: "100vh", color: INK }}>
      {/* Nav */}
      <div style={{ background: NAVY, padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
            </div>
            <span style={{ color: "#fff", fontSize: 17, fontWeight: 600, letterSpacing: "-0.02em" }}>Aura</span>
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 400, letterSpacing: "0.1em", textTransform: "uppercase" }}>Intelligence</span>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {[{id:"dashboard",label:"Dashboard"},{id:"signals",label:"Signals"},{id:"conversations",label:"Conversations"},{id:"roadmap",label:"Roadmap"}].map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setSelectedSignal(null); setSelectedConvo(null); }} style={{
                padding: "8px 16px", border: "none", borderRadius: 6,
                background: tab === t.id ? "rgba(255,255,255,0.1)" : "transparent",
                color: tab === t.id ? "#fff" : "rgba(255,255,255,0.5)",
                fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
              }}>{t.label}{t.id === "signals" && <span style={{ marginLeft: 6, padding: "1px 6px", borderRadius: 10, background: "#EF4444", color: "#fff", fontSize: 10 }}>3</span>}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{{COMPANY_NAME}}</div>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 600 }}>TS</div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 32px" }}>
        {/* ─── Dashboard ─── */}
        {tab === "dashboard" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4, letterSpacing: "-0.02em" }}>Good afternoon</h1>
                <p style={{ fontSize: 14, color: INK60 }}>Here's what Aura detected across your portfolio today.</p>
              </div>
              <div style={{ padding: "6px 14px", background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 12, color: INK60, display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: ACCENT2 }} />
                Live — Updated 2 min ago
              </div>
            </div>

            {/* Metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
              {metrics.map((m, i) => (
                <div key={i}
                  onMouseEnter={() => setHoveredMetric(i)} onMouseLeave={() => setHoveredMetric(null)}
                  style={{
                    padding: "20px 24px", background: "#fff", borderRadius: 12, border: `1px solid ${hoveredMetric === i ? ACCENT : BORDER}`,
                    transition: "all 0.2s", cursor: "pointer", boxShadow: hoveredMetric === i ? "0 4px 12px rgba(108,99,255,0.08)" : "none",
                  }}>
                  <div style={{ fontSize: 12, color: INK60, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>{m.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 4 }}>{m.value}</div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: m.warn ? WARN : m.up ? ACCENT2 : DANGER }}>{m.delta}</span>
                </div>
              ))}
            </div>

            {/* Recent signals preview */}
            <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
              <div style={{ padding: "16px 24px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>Priority Signals</span>
                <button onClick={() => setTab("signals")} style={{ fontSize: 12, color: ACCENT, background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>View all →</button>
              </div>
              {signals.slice(0, 4).map(s => (
                <div key={s.id} onClick={() => { setTab("signals"); setSelectedSignal(s.id); }} style={{ padding: "14px 24px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 14, cursor: "pointer", transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#FAFBFC"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: sevColors[s.severity], flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{s.account}</span>
                    <span style={{ fontSize: 13, color: INK60, marginLeft: 8 }}>{s.signal}</span>
                  </div>
                  <span style={{ fontSize: 11, color: INK60 }}>{s.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Signals ─── */}
        {tab === "signals" && (
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4, letterSpacing: "-0.02em" }}>AI Signals</h1>
            <p style={{ fontSize: 14, color: INK60, marginBottom: 24 }}>Aura continuously monitors your accounts for risks, opportunities, and anomalies.</p>

            <div style={{ display: "flex", gap: 20 }}>
              <div style={{ flex: 1 }}>
                {signals.map(s => (
                  <div key={s.id} onClick={() => setSelectedSignal(s.id === selectedSignal ? null : s.id)}
                    style={{
                      padding: "16px 20px", background: "#fff", borderRadius: 10,
                      border: `1px solid ${selectedSignal === s.id ? ACCENT : BORDER}`,
                      marginBottom: 8, cursor: "pointer", transition: "all 0.15s",
                      boxShadow: selectedSignal === s.id ? "0 2px 8px rgba(108,99,255,0.1)" : "none",
                    }}
                    onMouseEnter={e => { if (selectedSignal !== s.id) e.currentTarget.style.borderColor = "#D1D5DB"; }}
                    onMouseLeave={e => { if (selectedSignal !== s.id) e.currentTarget.style.borderColor = BORDER; }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: sevColors[s.severity] }} />
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{s.account}</span>
                      <span style={{ fontSize: 11, color: INK60, marginLeft: "auto" }}>{s.time}</span>
                    </div>
                    <p style={{ fontSize: 13, color: INK60, marginBottom: 8, lineHeight: 1.5 }}>{s.signal}</p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, color: ACCENT, fontWeight: 500 }}>→ {s.action}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11, color: INK60 }}>Score</span>
                        <MiniBar value={s.score} color={s.score > 85 ? DANGER : s.score > 70 ? WARN : ACCENT2} />
                        <span style={{ fontSize: 11, fontWeight: 600 }}>{s.score}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedSignal && (() => {
                const s = signals.find(x => x.id === selectedSignal);
                if (!s) return null;
                return (
                  <div style={{ width: 340, background: "#fff", borderRadius: 12, border: `1px solid ${BORDER}`, padding: "24px", position: "sticky", top: 20, alignSelf: "flex-start" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: sevColors[s.severity] }} />
                      <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: sevColors[s.severity], fontWeight: 600 }}>{s.severity}</span>
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{s.account}</h3>
                    <p style={{ fontSize: 14, color: INK60, lineHeight: 1.6, marginBottom: 16 }}>{s.signal}</p>
                    <div style={{ padding: "12px 16px", background: `${ACCENT}08`, border: `1px solid ${ACCENT}20`, borderRadius: 8, marginBottom: 16 }}>
                      <div style={{ fontSize: 11, color: ACCENT, fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Recommended Action</div>
                      <div style={{ fontSize: 13, color: INK }}>{s.action}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={{ flex: 1, padding: "10px 0", background: ACCENT, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Take Action</button>
                      <button style={{ padding: "10px 14px", background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 13, color: INK60, cursor: "pointer" }}>Dismiss</button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ─── Conversations ─── */}
        {tab === "conversations" && (
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4, letterSpacing: "-0.02em" }}>Conversations</h1>
            <p style={{ fontSize: 14, color: INK60, marginBottom: 24 }}>AI-analyzed interactions across all channels. Sentiment and topics extracted automatically.</p>

            {conversations.map(c => (
              <div key={c.id} onClick={() => setSelectedConvo(c.id === selectedConvo ? null : c.id)}
                style={{
                  padding: "20px 24px", background: "#fff", borderRadius: 12,
                  border: `1px solid ${selectedConvo === c.id ? ACCENT : BORDER}`,
                  marginBottom: 10, cursor: "pointer", transition: "all 0.15s",
                }}
                onMouseEnter={e => { if (selectedConvo !== c.id) e.currentTarget.style.borderColor = "#D1D5DB"; }}
                onMouseLeave={e => { if (selectedConvo !== c.id) e.currentTarget.style.borderColor = BORDER; }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${ACCENT}40, ${ACCENT2}40)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: ACCENT }}>
                      {c.contact.split(" ").map(w => w[0]).join("")}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{c.contact} <span style={{ fontSize: 12, fontWeight: 400, color: INK60 }}>· {c.role}</span></div>
                      <div style={{ fontSize: 12, color: INK60 }}>{c.account} · {c.channel} · {c.date}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: sentimentColor(c.sentiment) }} />
                    <span style={{ fontSize: 12, color: sentimentColor(c.sentiment), fontWeight: 500 }}>{sentimentLabel(c.sentiment)}</span>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: INK60, lineHeight: 1.5, margin: "8px 0 10px" }}>"{c.snippet}"</p>
                <div style={{ display: "flex", gap: 6 }}>
                  {c.topics.map(t => (
                    <span key={t} style={{ fontSize: 11, padding: "2px 8px", background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 4, color: INK60 }}>{t}</span>
                  ))}
                </div>

                {selectedConvo === c.id && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
                    <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                      <div style={{ flex: 1, padding: "12px 16px", background: SURFACE, borderRadius: 8 }}>
                        <div style={{ fontSize: 11, color: INK60, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Sentiment</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: "#E5E7EB", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ width: `${c.sentiment * 100}%`, height: "100%", background: sentimentColor(c.sentiment), borderRadius: 3, transition: "width 0.5s" }} />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{Math.round(c.sentiment * 100)}%</span>
                        </div>
                      </div>
                      {c.duration !== "—" && (
                        <div style={{ padding: "12px 16px", background: SURFACE, borderRadius: 8 }}>
                          <div style={{ fontSize: 11, color: INK60, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Duration</div>
                          <div style={{ fontSize: 15, fontWeight: 600 }}>{c.duration}</div>
                        </div>
                      )}
                    </div>
                    <button style={{ width: "100%", padding: "10px 0", background: ACCENT, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>View Full Transcript →</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ─── Roadmap ─── */}
        {tab === "roadmap" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4, letterSpacing: "-0.02em" }}>Product Roadmap</h1>
                <p style={{ fontSize: 14, color: INK60 }}>Upcoming capabilities powered by Aura's next-generation AI engine.</p>
              </div>
              <div style={{ padding: "6px 14px", background: `${ACCENT}10`, border: `1px solid ${ACCENT}30`, borderRadius: 8, fontSize: 12, color: ACCENT, fontWeight: 500 }}>Q3–Q4 2026</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
              {[
                { title: "Predictive Churn Engine", desc: "ML model trained on 500K+ accounts predicts churn 90 days before it happens. Auto-triggers intervention playbooks.", status: "In Development", quarter: "Q3", icon: "🔮", progress: 65 },
                { title: "Revenue Impact Scoring", desc: "Every signal gets a dollar-value impact estimate. Prioritize by ARR at risk, not just severity.", status: "In Development", quarter: "Q3", icon: "💰", progress: 40 },
                { title: "Multi-language Sentiment", desc: "Conversation analysis in 12 languages. Same accuracy as English across all supported markets.", status: "Design", quarter: "Q4", icon: "🌍", progress: 15 },
                { title: "Slack-native Workflows", desc: "Act on signals directly from Slack. One-click actions, threaded context, and team assignments without leaving chat.", status: "Design", quarter: "Q4", icon: "⚡", progress: 20 },
                { title: "Custom AI Models", desc: "Fine-tune Aura's models on your specific data. Industry-specific signal detection trained on your historical patterns.", status: "Research", quarter: "Q4", icon: "🧬", progress: 5 },
                { title: "Executive Dashboard", desc: "Board-ready views. Auto-generated quarterly narratives with trend analysis and peer benchmarks.", status: "Planned", quarter: "Q4", icon: "📊", progress: 0 },
              ].map((item, i) => (
                <div key={i} style={{ padding: "24px", background: "#fff", borderRadius: 12, border: `1px solid ${BORDER}`, transition: "all 0.2s", cursor: "pointer" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.boxShadow = "0 4px 12px rgba(108,99,255,0.08)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = "none"; }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ fontSize: 28 }}>{item.icon}</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: item.status === "In Development" ? `${ACCENT2}15` : item.status === "Design" ? `${ACCENT}10` : SURFACE, color: item.status === "In Development" ? ACCENT2 : item.status === "Design" ? ACCENT : INK60, fontWeight: 500 }}>{item.status}</span>
                      <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: SURFACE, color: INK60 }}>{item.quarter}</span>
                    </div>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, letterSpacing: "-0.01em" }}>{item.title}</h3>
                  <p style={{ fontSize: 13, color: INK60, lineHeight: 1.6, marginBottom: 12 }}>{item.desc}</p>
                  {item.progress > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 4, background: "#E5E7EB", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${item.progress}%`, height: "100%", background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT2})`, borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 11, color: INK60, fontWeight: 500 }}>{item.progress}%</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
