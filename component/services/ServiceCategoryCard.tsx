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
    <div className="service-cat-card">
      <div className="sc-header">
        <div className="sc-header-left" style={{ cursor: "pointer" }} onClick={() => setExpanded((v) => !v)}>
          <div className="sd-icon" style={{ background: category.iconBg }}>
            <Icon size={16} strokeWidth={2} />
          </div>
          <div>
            <div className="sd-title-row">
              <span className="sd-title">{category.title}</span>
              <span className="plan-pill">{category.plan}</span>
              <span className="expand-arrow">
                {expanded ? (
                  <ChevronDown size={12} strokeWidth={2.5} />
                ) : (
                  <ChevronRight size={12} strokeWidth={2.5} />
                )}
              </span>
            </div>
            <div className="sd-desc">{category.desc}</div>
          </div>
        </div>
        <div className="sc-header-right">
          <div className="sc-price">
            ${category.price}
            <span className="sc-price-mo">/mo</span>
          </div>
        </div>
      </div>

      {expanded ? (
        <div className="sc-body">
          <div className="sc-service-list">
            {category.items.map((item) => (
              <div className="sc-check-item static-check" key={item.text}>
                <span className="chk">
                  <Check size={12} strokeWidth={2.5} />
                </span>
                <span className="chk-text">{item.text}</span>
                <span className="item-price">{item.price}</span>
              </div>
            ))}
          </div>

          <button className="btn-request-service btn-request-service-below" type="button">
            + Add Service
          </button>

          <div className="sd-footer">
            Your specialist: <b>{category.specialist}</b>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ServiceCategoryCard;
