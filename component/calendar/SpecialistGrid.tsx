import { specialists } from "./data";

const SpecialistGrid = ({ onSelect }: { onSelect: (key: string) => void }) => {
  return (
    <div className="specialist-grid">
      {specialists.map((specialist) => (
        <div
          className="specialist-card"
          key={specialist.key}
          onClick={() => onSelect(specialist.key)}
        >
          <div className="specialist-avatar" style={{ background: specialist.color }}>
            {specialist.avatar}
          </div>
          <div className="specialist-name">{specialist.name}</div>
          <div className="specialist-role">{specialist.role}</div>
          <div className="specialist-category-tag">{specialist.category}</div>
          <div className="specialist-desc">{specialist.desc}</div>
        </div>
      ))}
    </div>
  );
};

export default SpecialistGrid;
