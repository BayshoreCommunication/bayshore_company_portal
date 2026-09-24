"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Check,
  Search,
  MapPin,
  MessageSquare,
  Shield,
  type LucideIcon,
} from "lucide-react";
import type { ServiceCategory } from "./data";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  seo: Search,
  gmb: MapPin,
  social: MessageSquare,
  web: Shield,
};

const ServiceCategoryCard = ({ category }: { category: ServiceCategory }) => {
  const [expanded, setExpanded] = useState(false);
  const Icon = CATEGORY_ICONS[category.key];

  return (
    <div className="rounded-[10px] border border-[#dbe3de] bg-white p-5">
      <div className="flex items-start justify-between gap-3.5">
        <div className="flex min-w-0 flex-1 cursor-pointer gap-3.5" onClick={() => setExpanded((v) => !v)}>
          <div
            className="flex h-10.5 w-10.5 shrink-0 items-center justify-center rounded-[10px] text-[17px] text-white"
            style={{ background: category.iconBg }}
          >
            <Icon size={16} strokeWidth={2} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[15px] font-bold text-[#0d1e2c]">{category.title}</span>
              <span className="rounded bg-[#f1f5f3] px-2.25 py-0.75 text-[10px] font-bold tracking-[0.4px] text-[#556977]">
                {category.plan}
              </span>
              <span className="ml-0.5 text-[10px] text-[#9aacb8]">
                {expanded ? (
                  <ChevronDown size={12} strokeWidth={2.5} />
                ) : (
                  <ChevronRight size={12} strokeWidth={2.5} />
                )}
              </span>
            </div>
            <div className="mt-1.5 text-[12.5px] leading-normal text-[#556977]">{category.desc}</div>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="shrink-0 whitespace-nowrap text-[19px] font-bold text-[#0d1e2c]">
            ${category.price}
            <span className="ml-0.5 text-[11px] font-semibold text-[#8496a3]">/mo</span>
          </div>
        </div>
      </div>

      {expanded ? (
        <div className="mt-1">
          <div className="mt-3.5 flex flex-col gap-2">
            {category.items.map((item) => (
              <div
                className="flex cursor-default items-center gap-2.5 border-b border-[#f4f7f5] px-1 py-2.5 text-[12.5px] last:border-b-0"
                key={item.text}
              >
                <span className="w-4 shrink-0 text-[13px] text-[#16a34a]">
                  <Check size={12} strokeWidth={2.5} />
                </span>
                <span className="flex-1 font-medium text-[#17242f]">{item.text}</span>
                <span className="whitespace-nowrap text-[11.5px] font-bold text-[#556977]">{item.price}</span>
              </div>
            ))}
          </div>

          <button
            className="mt-3.5 w-full cursor-pointer whitespace-nowrap rounded-md border border-dashed border-[#93c5fd] bg-white px-3 py-2.5 text-[11px] font-bold text-[#2563eb] hover:bg-[#eff6ff]"
            type="button"
          >
            + Add Service
          </button>

          <div className="mt-3.5 border-t border-[#eef3ef] pt-3 text-[11.5px] text-[#7a8e9b] [&_b]:text-[#17242f]">
            Your specialist: <b>{category.specialist}</b>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ServiceCategoryCard;
