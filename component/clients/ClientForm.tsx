"use client";

import { useState, useSyncExternalStore, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Users, Save, CheckCircle2, Lightbulb, Headphones, ArrowRight, Eye, EyeOff } from "lucide-react";
import {
  createClientAction,
  updateClientAction,
  type Client,
  type ClientStatus,
} from "@/app/actions/clients";
import MultiSelect from "@/component/shared/MultiSelect";
import { CLIENT_STATUS_OPTIONS, NOTES_LIMIT, SERVICE_TYPES, todayInputValue } from "./clientUi";

const BENEFITS = [
  "Easy client management",
  "Track all communication",
  "Generate and share reports",
  "Schedule meetings",
  "Manage content and approvals",
];

const subscribeNever = () => () => {};

// Pass `client` to edit an existing one; leave it out to add a new one.
const ClientForm = ({ client }: { client?: Client }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(client);

  const [contactName, setContactName] = useState(client?.contactName ?? "");
  const [companyName, setCompanyName] = useState(client?.companyName ?? "");
  const [email, setEmail] = useState(client?.email ?? "");
  const [phone, setPhone] = useState(client?.phone ?? "");
  const [address, setAddress] = useState(client?.address ?? "");
  const [serviceTypes, setServiceTypes] = useState<string[]>(client?.serviceTypes ?? []);
  // A new client starts today unless the user picks another date. "Today" depends on
  // the visitor's timezone, which the server can't know, so it is read in the browser
  // only (the server render leaves the field empty and the browser fills it in).
  const today = useSyncExternalStore(subscribeNever, todayInputValue, () => "");
  const [pickedStartDate, setPickedStartDate] = useState<string | null>(client?.startDate?.slice(0, 10) ?? null);
  const startDate = pickedStartDate ?? today;
  const [status, setStatus] = useState<ClientStatus>(client?.status ?? "active");
  const [notes, setNotes] = useState(client?.notes ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  // Keep a saved custom service type selectable even if it isn't in the standard list.
  // Keep a saved custom service selectable even if it isn't in the standard list.
  const serviceOptions = [...SERVICE_TYPES, ...serviceTypes.filter((service) => !SERVICE_TYPES.includes(service))];
  const passwordsMismatch = confirmPassword !== "" && confirmPassword !== password;
  const backHref = client ? `/clients/${client._id}` : "/clients";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors([]);

    if (serviceTypes.length === 0) {
      const message = "Select at least one service type.";
      setError(message);
      toast.error(message);
      return;
    }

    if (!client && password !== confirmPassword) {
      const message = "Passwords do not match.";
      setError(message);
      toast.error(message);
      return;
    }

    const input = { contactName, companyName, email, phone, address, serviceTypes, startDate, status, notes };

    startTransition(async () => {
      const result = client
        ? await updateClientAction(client._id, input)
        : await createClientAction({ ...input, password });

      if (!result.ok) {
        setError(result.error ?? "Something went wrong.");
        setFieldErrors(result.fieldErrors ?? []);
        toast.error(result.error ?? "Something went wrong.");
        return;
      }

      if (client) {
        toast.success("Client updated successfully");
        router.push(`/clients/${client._id}`);
        return;
      }

      toast.success("Client created successfully");
      router.push("/clients");
    });
  };

  return (
    <>
      <div className="breadcrumb-row">
        <div className="breadcrumbs">
          <Link href="/clients" className="breadcrumb-link">
            Clients
          </Link>{" "}
          / {client ? (
            <>
              <Link href={`/clients/${client._id}`} className="breadcrumb-link">
                {client.companyName}
              </Link>{" "}
              / <b>Edit</b>
            </>
          ) : (
            <b>Add Client</b>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div className="page-title">{isEdit ? "Edit Client" : "Add New Client"}</div>
        <div className="page-desc">
          {isEdit
            ? "Update the client's details. Their portal login is kept in sync."
            : "Add a new client to your account. A portal login is created for them automatically."}
        </div>
      </div>

      <div className="add-client-grid">
        <div className="section-card">
            <form onSubmit={handleSubmit}>
              <div className="section-header" style={{ borderBottom: "none", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div className="client-stat-icon" style={{ background: "#dbeafe", color: "#2563eb", width: 34, height: 34, fontSize: 15 }}>
                    <Users size={17} strokeWidth={2} />
                  </div>
                  <div>
                    <div className="section-title">Client Information</div>
                    <div className="section-sub" style={{ fontWeight: 500 }}>
                      Provide the basic information about your client.
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-grid-2">
                <div>
                  <label className="field-label" htmlFor="contactName">
                    Client Name <span className="required-star">*</span>
                  </label>
                  <input id="contactName" type="text" className="input-text" placeholder="Enter client name" required value={contactName} onChange={(e) => setContactName(e.target.value)} />
                </div>
                <div>
                  <label className="field-label" htmlFor="companyName">
                    Company Name <span className="required-star">*</span>
                  </label>
                  <input id="companyName" type="text" className="input-text" placeholder="Enter company name" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </div>
              </div>

              <div className="form-grid-2" style={{ marginTop: 16 }}>
                <div>
                  <label className="field-label" htmlFor="email">
                    Email Address <span className="required-star">*</span>
                  </label>
                  <input id="email" type="email" className="input-text" placeholder="client@company.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <label className="field-label" htmlFor="phone">
                    Phone Number
                  </label>
                  <input id="phone" type="text" className="input-text" placeholder="+1 987 654 3210" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <label className="field-label" htmlFor="address">
                  Address
                </label>
                <textarea id="address" className="textarea-caption" style={{ height: 64 }} placeholder="Enter complete address" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>

              <div style={{ marginTop: 16 }}>
                <label className="field-label">
                  Service Types <span className="required-star">*</span>
                </label>
                <MultiSelect
                  label="Service types"
                  options={serviceOptions}
                  value={serviceTypes}
                  onChange={setServiceTypes}
                  placeholder="Select service types"
                />
                <div className="field-hint" style={{ fontStyle: "normal" }}>
                  Select one or more services this client has signed up for.
                </div>
              </div>

              <div className="form-grid-2" style={{ marginTop: 16 }}>
                <div>
                  <label className="field-label" htmlFor="startDate">
                    Start Date <span className="required-star">*</span>
                  </label>
                  <input id="startDate" type="date" className="input-text" required value={startDate} onChange={(e) => setPickedStartDate(e.target.value)} />
                </div>
                <div>
                  <label className="field-label" htmlFor="status">
                    Status <span className="required-star">*</span>
                  </label>
                  <select id="status" className="input-text" value={status} onChange={(e) => setStatus(e.target.value as ClientStatus)}>
                    {CLIENT_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="field-hint" style={{ fontStyle: "normal" }}>
                    Only Active clients can sign in to the client portal.
                  </div>
                </div>
              </div>

              <div className="form-grid-2" style={{ marginTop: 16 }}>
                {!isEdit ? (
                  <>
                  <div>
                    <label className="field-label" htmlFor="password">
                      Portal Password <span className="required-star">*</span>
                    </label>
                    <div className="password-field">
                      <input id="password" type={showPassword ? "text" : "password"} className="input-text" placeholder="Enter a password" required minLength={8} maxLength={72} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword((visible) => !visible)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        aria-pressed={showPassword}
                      >
                        {showPassword ? <EyeOff size={15} strokeWidth={2} /> : <Eye size={15} strokeWidth={2} />}
                      </button>
                    </div>
                    <div className="field-hint" style={{ fontStyle: "normal" }}>
                      At least 8 characters. Share it with the client so they can sign in.
                    </div>
                  </div>
                  <div>
                    <label className="field-label" htmlFor="confirmPassword">
                      Confirm Password <span className="required-star">*</span>
                    </label>
                    <div className="password-field">
                      <input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} className="input-text" placeholder="Re-enter the password" required minLength={8} maxLength={72} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} aria-invalid={passwordsMismatch} />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowConfirmPassword((visible) => !visible)}
                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                        aria-pressed={showConfirmPassword}
                      >
                        {showConfirmPassword ? <EyeOff size={15} strokeWidth={2} /> : <Eye size={15} strokeWidth={2} />}
                      </button>
                    </div>
                    {passwordsMismatch ? (
                      <div className="field-error" role="alert">
                        Passwords do not match.
                      </div>
                    ) : (
                      <div className="field-hint" style={{ fontStyle: "normal" }}>
                        Type the same password again.
                      </div>
                    )}
                  </div>
                  </>
                ) : null}
              </div>

              <div style={{ marginTop: 16 }}>
                <label className="field-label" htmlFor="notes">
                  Notes
                </label>
                <textarea id="notes" className="textarea-caption" style={{ height: 72 }} placeholder="Add any additional notes about this client..." maxLength={NOTES_LIMIT} value={notes} onChange={(e) => setNotes(e.target.value)} />
                <div className="field-hint" style={{ textAlign: "right", fontStyle: "normal" }}>
                  {notes.length}/{NOTES_LIMIT}
                </div>
              </div>

              {error ? (
                <div className="form-error-banner" role="alert">
                  {error}
                  {fieldErrors.length > 0 ? (
                    <ul>
                      {fieldErrors.map((message) => (
                        <li key={message}>{message}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}

              <div className="add-client-actions">
                <Link href={backHref} className="btn-draft">
                  Cancel
                </Link>
                <button type="submit" className="btn-save-client" disabled={isPending}>
                  <Save size={13} strokeWidth={2} /> {isPending ? "Saving…" : isEdit ? "Save Changes" : "Save Client"}
                </button>
              </div>
            </form>
        </div>

        <div className="dash-side-col">
          <div className="side-card add-client-tip-card">
            <div className="client-stat-icon" style={{ background: "#dbeafe", color: "#2563eb", marginBottom: 12 }}>
              <Users size={17} strokeWidth={2} />
            </div>
            <div className="side-title">Build Stronger Client Relationships</div>
            <ul className="benefits-list">
              {BENEFITS.map((benefit) => (
                <li key={benefit} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckCircle2 size={14} strokeWidth={2} color="#16a34a" /> {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div className="side-card" style={{ background: "#f0fdf4", borderColor: "#bbf0cc" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Lightbulb size={18} strokeWidth={2} color="#16a34a" />
              <div>
                <div className="side-title" style={{ fontSize: 13 }}>
                  Pro Tip
                </div>
                <div className="dash-pending-sub" style={{ marginTop: 4 }}>
                  Add detailed information to provide better service and improve collaboration with your client.
                </div>
              </div>
            </div>
          </div>

          <div className="side-card">
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Headphones size={18} strokeWidth={2} color="#556977" />
              <div>
                <div className="side-title" style={{ fontSize: 13 }}>
                  Need Help?
                </div>
                <div className="dash-pending-sub" style={{ marginTop: 4 }}>
                  If you need assistance adding a client, check our help documentation or contact support.
                </div>
                <div className="dash-link" style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  Contact Support <ArrowRight size={12} strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClientForm;
