import type { Area } from "@/data/types"

/**
 * The setup guide: the order a new company sets up its QMS in ThryveMS, from its own settings to corrective action.
 * The same order an auditor follows. Steps whose page a person's role can't open are left out for that person. Each step opens one page and shows a few tips on that page.
 *
 * A tip's `target` says which part of the page to highlight. Several targets can be given, separated by " || ";
 * the first one found is used. If none is found the tip shows in the middle of the screen without a highlight.
 *   "text:Invite people"   a button or link whose text is exactly this
 *   "card:Risk matrix"     the card whose title is exactly this
 *   "figures"              the row of figure cards at the top of a page
 *   anything else          a CSS selector
 */
export interface GuideTip {
  target: string
  title: string
  body: string
  /** the ISO 9001:2026 clauses this tip covers, shown under the tip */
  iso: string
}

export interface GuideStep {
  id: string
  title: string
  /** the area the step's page belongs to; people whose role can't open it don't see the step */
  area: Area
  /** one line shown in the setup guide list */
  summary: string
  clauses: string
  /** the page the step opens */
  path: string
  tips: GuideTip[]
}

export const GUIDE_STEPS: GuideStep[] = [
  {
    id: "company",
    area: "Settings",
    title: "Your company",
    summary: "Users, roles, numbering and review routes",
    clauses: "5.3, 7.5.2",
    path: "/settings/users",
    tips: [
      { target: "nav[aria-label='Settings sections']", title: "Your company's settings", body: "Start here: company profile, branding, document numbering, and who reviews and approves documents. Everything else uses these.", iso: "7.5.2: documents are identified and formatted consistently." },
      { target: "text:Invite people", title: "Invite your team", body: "Invite the people who will work in the QMS. Each one gets a role, and the role decides what they can see and do.", iso: "5.3: roles, responsibilities and authorities." },
      { target: "main table", title: "Give everyone a role and their processes", body: "Set each person's role and the processes they work in. Process owners see their own processes; top management sees everything.", iso: "5.3 and 7.2: assigned roles and competence." },
    ],
  },
  {
    id: "organization",
    area: "Organization & Scope",
    title: "Organization & Scope",
    summary: "Context, interested parties, scope, org chart",
    clauses: "4.1–4.3, 5.3",
    path: "/qms/organization",
    tips: [
      { target: "figures", title: "Where you stand", body: "These figures show your scope revision, the issues and interested parties you've listed, and how many people the QMS covers.", iso: "4.1 and 4.2: context and interested parties." },
      { target: "main [role=tablist]", title: "Everything about your company in one place", body: "Profile, sites, org chart, legal and permits, context, interested parties and terms. Work through the tabs from left to right.", iso: "4.1–4.3 and 5.3." },
      { target: "card:Scope of the QMS", title: "Write your QMS scope", body: "Say which products and services, sites and requirements the QMS covers, and anything that doesn't apply, with a reason.", iso: "4.3: scope of the quality management system." },
    ],
  },
  {
    id: "policies",
    area: "Policies",
    title: "Policies",
    summary: "Your quality policy",
    clauses: "5.2",
    path: "/qms/policies",
    tips: [
      { target: "text:Add policy", title: "Add your quality policy", body: "Write or upload your quality policy. It goes through review and approval like any document.", iso: "5.2.1: establishing the quality policy." },
      { target: "main table", title: "Make sure people have read it", body: "The Acknowledged column shows who has read and accepted each policy. Auditors often ask staff about it.", iso: "5.2.2: communicating the quality policy." },
    ],
  },
  {
    id: "processes",
    area: "Processes",
    title: "Processes",
    summary: "Map how your business works",
    clauses: "4.4",
    path: "/qms/processes",
    tips: [
      { target: "figures", title: "How your processes are doing", body: "These figures update as you set things up: processes without an owner or documents show under Need attention.", iso: "4.4: determine your processes and how they interact." },
      { target: "card:Leadership & planning || main [data-slot=card]", title: "Each card is one process", body: "Open a process to set its owner, inputs, activities and outputs, and to link its documents, risks and KPIs. Start with the ones without an owner.", iso: "4.4.1 a–h: inputs, outputs, sequence, owners, risks." },
      { target: "text:Edit process structure", title: "Add or reorganise processes", body: "Add a process or move one between Management, Core and Support. Not sure what your processes are? Start with how an order comes in and goes out.", iso: "4.4 and 5.3." },
    ],
  },
  {
    id: "documents",
    area: "Documents",
    title: "Procedures & documents",
    summary: "Import or write your controlled documents",
    clauses: "7.5",
    path: "/qms/procedures",
    tips: [
      { target: "text:Add document", title: "Add your documents", body: "Add procedures, work instructions and forms. Link to the file in SharePoint or OneDrive, or upload it if it's Public or Internal.", iso: "7.5.1: documented information the QMS needs." },
      { target: "main [role=tablist]", title: "Two ways to look", body: "Register lists every document. By ISO clause shows which clauses already have documents and which don't.", iso: "7.5.3: control of documented information." },
      { target: "main table", title: "Every document has a stage", body: "Draft, then review, approval and published. The stage track shows where each one is and who it's waiting on.", iso: "7.5.2: review and approval." },
    ],
  },
  {
    id: "objectives",
    area: "Objectives & KPIs",
    title: "Objectives & KPIs",
    summary: "What you aim for and how you measure it",
    clauses: "6.2, 9.1",
    path: "/qms/objectives",
    tips: [
      { target: "text:Add objective", title: "Set an objective", body: "Each objective has a target, an owner and a process. Keep it measurable: “95% on-time delivery”, not “better delivery”.", iso: "6.2: quality objectives and planning to achieve them." },
      { target: "main table", title: "Add results every period", body: "Add the latest figure each month or quarter. Results below target show in red and can start a corrective action.", iso: "9.1.1: monitoring and measurement." },
    ],
  },
  {
    id: "risks",
    area: "Risks & Opportunities",
    title: "Risks & Opportunities",
    summary: "What could go wrong, or go better",
    clauses: "6.1",
    path: "/risks",
    tips: [
      { target: "text:Add risk or opportunity", title: "Add a risk or opportunity", body: "Write what could go wrong, or go better, and which process it affects.", iso: "6.1.1: determining risks and opportunities." },
      { target: "card:Risk matrix", title: "Rate it on the matrix", body: "Rate how likely and how serious it is. The score decides what action is needed and how often it's reviewed.", iso: "6.1.2: actions to address risks." },
      { target: "card:Highest risks", title: "Deal with the highest first", body: "The highest-scoring risks show here, with their treatment and next review date.", iso: "6.1.2 and 6.1.3." },
    ],
  },
  {
    id: "evidence",
    area: "Evidence",
    title: "Evidence",
    summary: "Start keeping records of what you do",
    clauses: "7.5.3",
    path: "/evidence",
    tips: [
      { target: "figures", title: "How much proof you have", body: "These figures show how many ISO requirements have current evidence, and which evidence is getting old.", iso: "7.5.3: retained documented information." },
      { target: "text:Add evidence", title: "Add evidence", body: "Add a record that shows something was done: a signed form, a report, a photo. One item can support several clauses.", iso: "7.5.3.1: records are available and protected." },
      { target: "main [role=tablist]", title: "Find the gaps", body: "By ISO clause shows each requirement with its evidence. Red bars are where an auditor would find nothing.", iso: "9.2 and 9.3: evidence for audits and reviews." },
    ],
  },
  {
    id: "audits",
    area: "Audits",
    title: "Audits",
    summary: "Plan your first internal audit",
    clauses: "9.2",
    path: "/audits",
    tips: [
      { target: "card:2026 programme || main [data-slot=card]", title: "Your audit programme", body: "Each process gets audited during the year. The programme shows what's planned, done or late, month by month.", iso: "9.2.2 a: plan an audit programme." },
      { target: "text:Plan audit", title: "Plan your first internal audit", body: "Choose the process, the dates and an auditor who doesn't audit their own work. Then build the checklist.", iso: "9.2.2 b–c: criteria, scope and objective auditors." },
      { target: "main [role=tablist]", title: "Plans, audits, results and auditors", body: "Keep auditors and their exclusions here, then follow each audit from plan to report.", iso: "9.2.2 d–f: reporting and follow-up." },
    ],
  },
  {
    id: "review",
    area: "Management Review",
    title: "Management Review",
    summary: "Top management checks how the QMS is doing",
    clauses: "9.3",
    path: "/management-review",
    tips: [
      { target: "text:Start a review", title: "Start a review", body: "Top management can review the QMS at any time: a process, a document, evidence or a KPI.", iso: "9.3.1: top management reviews the QMS." },
      { target: "text:Use ISO 9001 template", title: "Or use the ISO 9001 template", body: "The template adds every input ISO asks for, so nothing is missed in your formal yearly review.", iso: "9.3.2: management review inputs." },
      { target: "main table", title: "Decisions become actions", body: "Each review records its decisions and actions, signed by top management, and keeps them as evidence.", iso: "9.3.3: management review outputs." },
    ],
  },
  {
    id: "corrective",
    area: "Corrective Action",
    title: "Corrective Action",
    summary: "Fix problems so they don't come back",
    clauses: "10.2",
    path: "/corrective-action",
    tips: [
      { target: "text:Add nonconformity", title: "Log a problem", body: "When something goes wrong (an audit finding, a complaint, a failed check), add a nonconformity.", iso: "10.2.1 a: react to the nonconformity." },
      { target: "main table", title: "Follow it to the end", body: "Contain it, find the root cause, act, then check the action worked. The track shows where each one is.", iso: "10.2.1 b–f: cause, action and effectiveness." },
      { target: "main [role=tablist]", title: "Improvements and complaints too", body: "Corrective actions, improvements and customer complaints all live here, so the whole picture is in one place.", iso: "10.1 and 9.1.2: improvement and customer satisfaction." },
    ],
  },
]
