import { Construction } from "lucide-react";

const ComingSoon = ({ title }: { title: string }) => {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 10,
        padding: 60,
      }}
    >
      <Construction size={38} strokeWidth={1.5} color="#657787" />
      <div style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#0b1a26" }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: "#657787", maxWidth: 360, textAlign: "center" }}>
        This section isn&apos;t part of this prototype yet — it&apos;s just a placeholder so the
        navigation stays clickable.
      </div>
    </div>
  );
};

export default ComingSoon;
