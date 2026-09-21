import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";
import type { Client } from "@/app/actions/clients";
import { avatarColorFor, formatDate, initialsOf, statusClassName, statusLabel, statusStyle } from "./clientUi";

const ClientCard = ({ client }: { client: Client }) => {
  return (
    <div className="client-card">
      <div className="client-card-top">
        <div className="client-avatar" style={{ background: avatarColorFor(client._id) }}>
          {initialsOf(client.companyName)}
        </div>
        <span className={statusClassName(client.status)} style={statusStyle(client.status)}>
          {statusLabel(client.status)}
        </span>
      </div>
      <div className="client-name">{client.companyName}</div>
      <div className="client-contact">
        {client.contactName}
        <br />
        {client.email}
      </div>
      <div className="tag-row">
        {client.serviceTypes.map((service) => (
          <span className="tag-chip" key={service}>
            {service}
          </span>
        ))}
      </div>
      <div className="client-card-footer">
        <span className="client-since" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <Calendar size={12} strokeWidth={2} /> Client since {formatDate(client.startDate)}
        </span>
        <Link
          href={`/clients/${client._id}`}
          className="btn-select-client"
          style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
        >
          Select Client <ArrowRight size={13} strokeWidth={2.5} />
        </Link>
      </div>
    </div>
  );
};

export default ClientCard;
