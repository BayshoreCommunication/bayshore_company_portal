// Sample payments so the Payments page can be designed before it reads the real
// ones. Shaped like the backend's orders (models/serviceOrder.model.ts): what a
// client chose to add, what they paid for its first month, and how it went.

export type PaymentStatus = "pending" | "paid" | "expired" | "failed";

export type PaymentItem = {
  title: string;
  total: number;
  subServices: { name: string; price: number }[];
};

export type Payment = {
  _id: string;
  client: { _id: string; companyName: string };
  // The client-portal user who paid.
  paidBy: string;
  items: PaymentItem[];
  // Whole dollars.
  amount: number;
  status: PaymentStatus;
  createdAt: string;
  paidAt?: string;
  // Stripe's reference for the charge, once there is one.
  reference?: string;
};

export const samplePayments: Payment[] = [
  {
    _id: "pay_1",
    client: { _id: "c1", companyName: "Carter Injury Law" },
    paidBy: "Sarah Carter",
    items: [
      {
        title: "SEO & Website Optimization",
        total: 600,
        subServices: [
          { name: "On-page & technical SEO fixes", price: 300 },
          { name: "Backlink outreach (4–6 placements/mo)", price: 300 },
        ],
      },
    ],
    amount: 600,
    status: "paid",
    createdAt: "2026-10-03T14:20:00Z",
    paidAt: "2026-10-03T14:22:00Z",
    reference: "pi_3QxA1bK2mT9vL4",
  },
  {
    _id: "pay_2",
    client: { _id: "c2", companyName: "Harbor Family Law" },
    paidBy: "Daniel Okafor",
    items: [
      {
        title: "Social Media Management",
        total: 450,
        subServices: [
          { name: "12 posts/month across Facebook & Instagram", price: 300 },
          { name: "Comment & DM monitoring", price: 150 },
        ],
      },
      {
        title: "Google Business Profile Management",
        total: 150,
        subServices: [{ name: "Review monitoring & response", price: 150 }],
      },
    ],
    amount: 600,
    status: "paid",
    createdAt: "2026-10-02T09:05:00Z",
    paidAt: "2026-10-02T09:07:00Z",
    reference: "pi_3QwZ8dK2mT9vH1",
  },
  {
    _id: "pay_3",
    client: { _id: "c3", companyName: "Bayview Estate Planning" },
    paidBy: "Priya Nair",
    items: [
      {
        title: "Website Care & Hosting",
        total: 350,
        subServices: [
          { name: "Hosting, SSL & uptime monitoring", price: 200 },
          { name: "Monthly plugin & security updates", price: 150 },
        ],
      },
    ],
    amount: 350,
    status: "pending",
    createdAt: "2026-10-04T05:40:00Z",
  },
  {
    _id: "pay_4",
    client: { _id: "c1", companyName: "Carter Injury Law" },
    paidBy: "Sarah Carter",
    items: [
      {
        title: "Google Business Profile Management",
        total: 300,
        subServices: [
          { name: "Weekly posts & photo updates", price: 150 },
          { name: "Q&A section management", price: 150 },
        ],
      },
    ],
    amount: 300,
    status: "failed",
    createdAt: "2026-09-28T16:10:00Z",
  },
  {
    _id: "pay_5",
    client: { _id: "c4", companyName: "Lakeside Immigration Group" },
    paidBy: "Marco Alvarez",
    items: [
      {
        title: "SEO & Website Optimization",
        total: 250,
        subServices: [{ name: "Monthly keyword rank tracking & reporting", price: 250 }],
      },
    ],
    amount: 250,
    status: "expired",
    createdAt: "2026-09-25T11:30:00Z",
  },
  {
    _id: "pay_6",
    client: { _id: "c4", companyName: "Lakeside Immigration Group" },
    paidBy: "Marco Alvarez",
    items: [
      {
        title: "SEO & Website Optimization",
        total: 550,
        subServices: [
          { name: "Monthly keyword rank tracking & reporting", price: 250 },
          { name: "On-page & technical SEO fixes", price: 300 },
        ],
      },
    ],
    amount: 550,
    status: "paid",
    createdAt: "2026-09-26T08:15:00Z",
    paidAt: "2026-09-26T08:16:00Z",
    reference: "pi_3QtM4cK2mT9vB7",
  },
  {
    _id: "pay_7",
    client: { _id: "c2", companyName: "Harbor Family Law" },
    paidBy: "Daniel Okafor",
    items: [
      {
        title: "Website Care & Hosting",
        total: 100,
        subServices: [{ name: "Site speed checks", price: 100 }],
      },
    ],
    amount: 100,
    status: "paid",
    createdAt: "2026-09-18T13:45:00Z",
    paidAt: "2026-09-18T13:46:00Z",
    reference: "pi_3QqR7aK2mT9vN3",
  },
];
