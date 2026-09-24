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
import {
  breadcrumbLink,
  breadcrumbRow,
  breadcrumbs,
  btnDraft,
  btnSaveClient,
  clientStatIcon,
  dashLink,
  dashSideCol,
  fieldError,
  fieldHintPlain,
  fieldLabel,
  formErrorBanner,
  formGrid2,
  inputBase,
  inputText,
  pageDesc,
  pageTitle,
  requiredStar,
  sectionCard,
  sectionSub,
  sectionTitle,
  sideCard,
  sideCardBase,
  sideTitle,
  textareaBase,
} from "@/component/shared/ui";
import { CLIENT_STATUS_OPTIONS, NOTES_LIMIT, SERVICE_TYPES, todayInputValue } from "./clientUi";

const passwordInput = `${inputBase} pr-9.5 pl-3`;
const passwordToggle =
  "absolute top-1/2 right-2 inline-flex h-6.5 w-6.5 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-[#657787] hover:bg-[#eef3ef] hover:text-[#17242f] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#2563eb]";
const tipTitle = "text-[13px] font-bold text-[#0d1e2c]";
const tipText = "mt-1 text-[11px] text-[#7a8e9b]";

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
      <div className={breadcrumbRow}>
        <div className={breadcrumbs}>
          <Link href="/clients" className={breadcrumbLink}>
            Clients
          </Link>{" "}
          / {client ? (
            <>
              <Link href={`/clients/${client._id}`} className={breadcrumbLink}>
                {client.companyName}
              </Link>{" "}
              / <b>Edit</b>
            </>
          ) : (
            <b>Add Client</b>
          )}
        </div>
      </div>

      <div className="mb-5">
        <div className={pageTitle}>{isEdit ? "Edit Client" : "Add New Client"}</div>
        <div className={pageDesc}>
          {isEdit
            ? "Update the client's details. Their portal login is kept in sync."
            : "Add a new client to your account. A portal login is created for them automatically."}
        </div>
      </div>

      <div className="grid grid-cols-[2fr_1fr] items-start gap-5">
        <div className={sectionCard}>
            <form onSubmit={handleSubmit}>
              <div className="mb-2.5 flex items-center justify-between gap-2.5 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg bg-[#dbeafe] text-[15px] text-[#2563eb]">
                    <Users size={17} strokeWidth={2} />
                  </div>
                  <div>
                    <div className={sectionTitle}>Client Information</div>
                    <div className={`${sectionSub} font-medium`}>
                      Provide the basic information about your client.
                    </div>
                  </div>
                </div>
              </div>

              <div className={formGrid2}>
                <div>
                  <label className={fieldLabel} htmlFor="contactName">
                    Client Name <span className={requiredStar}>*</span>
                  </label>
                  <input id="contactName" type="text" className={inputText} placeholder="Enter client name" required value={contactName} onChange={(e) => setContactName(e.target.value)} />
                </div>
                <div>
                  <label className={fieldLabel} htmlFor="companyName">
                    Company Name <span className={requiredStar}>*</span>
                  </label>
                  <input id="companyName" type="text" className={inputText} placeholder="Enter company name" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </div>
              </div>

              <div className={`${formGrid2} mt-4`}>
                <div>
                  <label className={fieldLabel} htmlFor="email">
                    Email Address <span className={requiredStar}>*</span>
                  </label>
                  <input id="email" type="email" className={inputText} placeholder="client@company.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <label className={fieldLabel} htmlFor="phone">
                    Phone Number
                  </label>
                  <input id="phone" type="text" className={inputText} placeholder="+1 987 654 3210" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>

              <div className="mt-4">
                <label className={fieldLabel} htmlFor="address">
                  Address
                </label>
                <textarea id="address" className={`${textareaBase} h-16`} placeholder="Enter complete address" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>

              <div className="mt-4">
                <label className={fieldLabel}>
                  Service Types <span className={requiredStar}>*</span>
                </label>
                <MultiSelect
                  label="Service types"
                  options={serviceOptions}
                  value={serviceTypes}
                  onChange={setServiceTypes}
                  placeholder="Select service types"
                />
                <div className={fieldHintPlain}>
                  Select one or more services this client has signed up for.
                </div>
              </div>

              <div className={`${formGrid2} mt-4`}>
                <div>
                  <label className={fieldLabel} htmlFor="startDate">
                    Start Date <span className={requiredStar}>*</span>
                  </label>
                  <input id="startDate" type="date" className={inputText} required value={startDate} onChange={(e) => setPickedStartDate(e.target.value)} />
                </div>
                <div>
                  <label className={fieldLabel} htmlFor="status">
                    Status <span className={requiredStar}>*</span>
                  </label>
                  <select id="status" className={inputText} value={status} onChange={(e) => setStatus(e.target.value as ClientStatus)}>
                    {CLIENT_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className={fieldHintPlain}>
                    Only Active clients can sign in to the client portal.
                  </div>
                </div>
              </div>

              <div className={`${formGrid2} mt-4`}>
                {!isEdit ? (
                  <>
                  <div>
                    <label className={fieldLabel} htmlFor="password">
                      Portal Password <span className={requiredStar}>*</span>
                    </label>
                    <div className="relative">
                      <input id="password" type={showPassword ? "text" : "password"} className={passwordInput} placeholder="Enter a password" required minLength={8} maxLength={72} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                      <button
                        type="button"
                        className={passwordToggle}
                        onClick={() => setShowPassword((visible) => !visible)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        aria-pressed={showPassword}
                      >
                        {showPassword ? <EyeOff size={15} strokeWidth={2} /> : <Eye size={15} strokeWidth={2} />}
                      </button>
                    </div>
                    <div className={fieldHintPlain}>
                      At least 8 characters. Share it with the client so they can sign in.
                    </div>
                  </div>
                  <div>
                    <label className={fieldLabel} htmlFor="confirmPassword">
                      Confirm Password <span className={requiredStar}>*</span>
                    </label>
                    <div className="relative">
                      <input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} className={passwordInput} placeholder="Re-enter the password" required minLength={8} maxLength={72} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} aria-invalid={passwordsMismatch} />
                      <button
                        type="button"
                        className={passwordToggle}
                        onClick={() => setShowConfirmPassword((visible) => !visible)}
                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                        aria-pressed={showConfirmPassword}
                      >
                        {showConfirmPassword ? <EyeOff size={15} strokeWidth={2} /> : <Eye size={15} strokeWidth={2} />}
                      </button>
                    </div>
                    {passwordsMismatch ? (
                      <div className={fieldError} role="alert">
                        Passwords do not match.
                      </div>
                    ) : (
                      <div className={fieldHintPlain}>
                        Type the same password again.
                      </div>
                    )}
                  </div>
                  </>
                ) : null}
              </div>

              <div className="mt-4">
                <label className={fieldLabel} htmlFor="notes">
                  Notes
                </label>
                <textarea id="notes" className={`${textareaBase} h-18`} placeholder="Add any additional notes about this client..." maxLength={NOTES_LIMIT} value={notes} onChange={(e) => setNotes(e.target.value)} />
                <div className={`${fieldHintPlain} text-right`}>
                  {notes.length}/{NOTES_LIMIT}
                </div>
              </div>

              {error ? (
                <div className={formErrorBanner} role="alert">
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

              <div className="mt-5 flex justify-end gap-2.5 border-t border-[#eef3ef] pt-4">
                <Link href={backHref} className={btnDraft}>
                  Cancel
                </Link>
                <button type="submit" className={btnSaveClient} disabled={isPending}>
                  <Save size={13} strokeWidth={2} /> {isPending ? "Saving…" : isEdit ? "Save Changes" : "Save Client"}
                </button>
              </div>
            </form>
        </div>

        <div className={dashSideCol}>
          <div className={`${sideCardBase} border-[#bfdbfe] bg-[#eff6ff]`}>
            <div className={`${clientStatIcon} mb-3 bg-[#dbeafe] text-[#2563eb]`}>
              <Users size={17} strokeWidth={2} />
            </div>
            <div className={sideTitle}>Build Stronger Client Relationships</div>
            <ul className="mt-2.5 flex list-none flex-col gap-2.25 text-[12.5px] font-semibold text-[#17242f]">
              {BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-center gap-2">
                  <CheckCircle2 size={14} strokeWidth={2} color="#16a34a" /> {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div className={`${sideCardBase} border-[#bbf0cc] bg-[#f0fdf4]`}>
            <div className="flex items-start gap-2.5">
              <Lightbulb size={18} strokeWidth={2} color="#16a34a" />
              <div>
                <div className={tipTitle}>Pro Tip</div>
                <div className={tipText}>
                  Add detailed information to provide better service and improve collaboration with your client.
                </div>
              </div>
            </div>
          </div>

          <div className={sideCard}>
            <div className="flex items-start gap-2.5">
              <Headphones size={18} strokeWidth={2} color="#556977" />
              <div>
                <div className={tipTitle}>Need Help?</div>
                <div className={tipText}>
                  If you need assistance adding a client, check our help documentation or contact support.
                </div>
                <div className={`${dashLink} mt-2 inline-flex items-center gap-1`}>
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
