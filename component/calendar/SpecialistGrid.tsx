import { specialists } from "./data";

const SpecialistGrid = ({ onSelect }: { onSelect: (key: string) => void }) => {
  return (
    <div className="mx-auto mt-5 grid w-full max-w-260 grid-cols-3 gap-5 self-center">
      {specialists.map((specialist) => (
        <div
          className="cursor-pointer rounded-2xl border-[1.5px] border-[#dbe3de] bg-white p-7 hover:border-[#0b4d4a] hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)]"
          key={specialist.key}
          onClick={() => onSelect(specialist.key)}
        >
          <div
            className="mb-3.5 flex h-14 w-14 items-center justify-center rounded-full text-[19px] font-bold text-white"
            style={{ background: specialist.color }}
          >
            {specialist.avatar}
          </div>
          <div className="text-[18px] font-bold text-[#0d1e2c]">{specialist.name}</div>
          <div className="mt-0.5 text-[13.5px] text-[#7a8e9b]">{specialist.role}</div>
          <div className="mt-3 inline-block rounded-xl bg-[#eff6ff] px-3 py-1.25 text-[11.5px] font-bold text-[#2563eb]">
            {specialist.category}
          </div>
          <div className="mt-3.5 text-[13px] leading-[1.55] text-[#7a8e9b]">{specialist.desc}</div>
        </div>
      ))}
    </div>
  );
};

export default SpecialistGrid;
