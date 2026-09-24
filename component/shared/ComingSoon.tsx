import { Construction } from "lucide-react";

const ComingSoon = ({ title }: { title: string }) => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2.5 p-15">
      <Construction size={38} strokeWidth={1.5} color="#657787" />
      <div className="font-[Georgia,serif] text-[22px] font-bold text-[#0b1a26]">{title}</div>
      <div className="max-w-90 text-center text-[13px] text-[#657787]">
        This section isn&apos;t part of this prototype yet — it&apos;s just a placeholder so the
        navigation stays clickable.
      </div>
    </div>
  );
};

export default ComingSoon;
