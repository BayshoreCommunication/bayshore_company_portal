import { LayoutDashboard, Users, FileText, Calendar } from "lucide-react";

const FEATURES = [
  { icon: LayoutDashboard, text: "One dashboard for every client account" },
  { icon: Users, text: "Track leads, services and onboarding" },
  { icon: FileText, text: "Generate and share monthly reports" },
  { icon: Calendar, text: "Coordinate meetings across your team" },
];

const AuthBrandPanel = () => {
  return (
    <div className="auth-brand-panel">
      <div style={{ fontFamily: "Georgia, serif", fontSize: 30, fontWeight: 700, color: "#fff" }}>
        BayShore
      </div>
      <div style={{ fontSize: 14, color: "#9cb0c3", marginTop: 10, maxWidth: 320, lineHeight: 1.6 }}>
        The internal workspace for managing every BayShore client relationship, from onboarding to
        renewal.
      </div>

      <div style={{ marginTop: 48, display: "flex", flexDirection: "column", gap: 20 }}>
        {FEATURES.map((feature) => (
          <div key={feature.text} style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#d99136",
                flexShrink: 0,
              }}
            >
              <feature.icon size={17} strokeWidth={2} />
            </div>
            <span style={{ fontSize: 13.5, color: "#c7d2da" }}>{feature.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AuthBrandPanel;
