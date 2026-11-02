import type { Area } from "@/data/types"

/**
 * The setup guide: the order a new company sets up its QMS in ThryveMS, from its own settings to corrective action.
 * The same order an auditor follows. Steps whose page a person's role can't open are left out for that person.
 *
 * Each step is a full tour of its area: the list page, then the pages and stages inside it, one tip at a time.
 * A tip can open another page (`path`) and a tab on it (`open`). Tips marked `practice` show a sample record so a
 * new company can see every stage before it has records of its own. They are labelled as practice, the page can't
 * be changed while the tip is open, and a tip whose record doesn't exist or can't be opened is skipped.
 *
 * A tip's `target` (and `open`) says which part of the page to use. Several targets can be given, separated by " || ";
 * the first one found is used. If none is found the tip shows in the middle of the screen without a highlight.
 *   "text:Invite people"   a button or link whose text is exactly this
 *   "card:Risk matrix"     the card whose title is exactly this
 *   "tab:Context"          the tab whose label starts with this
 *   "track"                the progress track at the top of a record
 *   "figures"              the row of figure cards at the top of a page
 *   anything else          a CSS selector
 */
export interface GuideTip {
  target: string
  title: string
  body: string
  /** the ISO 9001:2026 clauses this tip covers, shown under the tip */
  iso: string
  /** the page this tip is on; the step's page if not given */
  path?: string
  /** something to open first on that page, such as a tab */
  open?: string
  /** a sample record shown to practise on; nothing can be changed */
  practice?: boolean
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
    title: "Your company",
    area: "Settings",
    summary: "Profile, people, roles, numbering and review routes",
    clauses: "5.3, 7.5.2",
    path: "/settings/organization",
    tips: [
      {
        target: "card:Company",
        title: "Your company profile",
        body: "Your company's name, address and industry. They print on documents, reports and the review pack.",
        iso: "4.1: understanding the organization."
      },
      {
        target: "card:ISO 9001 certification",
        title: "Your certification",
        body: "Record your certification body and dates, or that you're working towards certification. The Overview counts down to your audits from here.",
        iso: "9.2 and 9.3: audit and review planning."
      },
      {
        target: "text:Invite people",
        title: "Invite your team",
        body: "Invite the people who will work in the QMS. Each one gets a role, and the role decides what they can see and do.",
        iso: "5.3: roles, responsibilities and authorities.",
        path: "/settings/users"
      },
      {
        target: "main table",
        title: "Give everyone a role and their processes",
        body: "Set each person's role and the processes they work in. Process owners see their own processes; top management sees everything.",
        iso: "5.3 and 7.2: assigned roles and competence.",
        path: "/settings/users"
      },
      {
        target: "card:All roles at a glance",
        title: "What each role can do",
        body: "Each role has a level for every part of ThryveMS: none, view, add and edit, approve or manage. Change a role here and everyone with it changes too.",
        iso: "5.3: authorities are assigned and communicated.",
        path: "/settings/roles"
      },
      {
        target: "main table || main",
        title: "Your process structure",
        body: "List your processes and sort them into Management, Core and Support. You'll fill in each one later in Processes.",
        iso: "4.4: the processes the QMS needs.",
        path: "/settings/process-structure"
      },
      {
        target: "card:Pattern",
        title: "How documents are numbered",
        body: "Choose the pattern, such as OPS-PRO-001, and the codes for each document type. New documents get their number automatically.",
        iso: "7.5.2: identification and description.",
        path: "/settings/numbering"
      },
      {
        target: "card:Revision workflow",
        title: "Who reviews and approves documents",
        body: "Set the default route a document follows, from draft to published, and who approves each type.",
        iso: "7.5.2 c: review and approval for suitability.",
        path: "/settings/review"
      },
      {
        target: "card:Approver by document type",
        title: "Approvers by document type",
        body: "Policies and manuals usually need top management; work instructions can be approved by the process owner.",
        iso: "5.1.1 and 7.5.2.",
        path: "/settings/review"
      }
    ]
  },
  {
    id: "organization",
    title: "Organization & Scope",
    area: "Organization & Scope",
    summary: "Context, interested parties, scope, org chart",
    clauses: "4.1–4.3, 5.3",
    path: "/qms/organization",
    tips: [
      {
        target: "figures",
        title: "Where you stand",
        body: "These figures show your scope revision, the issues and interested parties you've listed, and how many people the QMS covers.",
        iso: "4.1 and 4.2: context and interested parties."
      },
      {
        target: "card:Scope of the QMS",
        title: "Write your QMS scope",
        body: "Say which products and services, sites and requirements the QMS covers, and anything that doesn't apply, with a reason.",
        iso: "4.3: scope of the quality management system.",
        open: "tab:Scope"
      },
      {
        target: "text:Revise scope",
        title: "Change the scope as a revision",
        body: "The scope is a controlled document. Revise it when you add a site or a product, and the change goes through approval.",
        iso: "4.3 and 7.5.2.",
        open: "tab:Scope"
      },
      {
        target: "main [role=tabpanel][data-state=active]",
        title: "Your company profile",
        body: "What you do, who your customers are and how big you are. Auditors read this first.",
        iso: "4.1: understanding the organization.",
        open: "tab:Profile"
      },
      {
        target: "main [role=tabpanel][data-state=active]",
        title: "Sites",
        body: "Every place the QMS covers: offices, plants, warehouses. Each one can have its own scope notes.",
        iso: "4.3: physical boundaries of the QMS.",
        open: "tab:Sites"
      },
      {
        target: "main [role=tabpanel][data-state=active]",
        title: "Org chart",
        body: "Who reports to whom, by team. Build it here instead of keeping a separate drawing up to date.",
        iso: "5.3: roles, responsibilities and authorities.",
        open: "tab:Org chart"
      },
      {
        target: "main [role=tabpanel][data-state=active]",
        title: "Legal and permits",
        body: "Laws, permits and licences that apply to you, with renewal dates so none lapse.",
        iso: "4.2 and 8.2.2: statutory and regulatory requirements.",
        open: "tab:Legal"
      },
      {
        target: "main [role=tabpanel][data-state=active]",
        title: "Context: internal and external issues",
        body: "Things inside and outside the company that affect your results, like a key customer, staff turnover or new rules. Review them at least once a year.",
        iso: "4.1: issues relevant to your purpose.",
        open: "tab:Context"
      },
      {
        target: "main [role=tabpanel][data-state=active]",
        title: "Interested parties",
        body: "Customers, suppliers, regulators, staff: what each one needs from you and how you check you're meeting it.",
        iso: "4.2: needs and expectations of interested parties.",
        open: "tab:Interested parties"
      },
      {
        target: "main [role=tabpanel][data-state=active]",
        title: "Terms",
        body: "Words your company uses in its own way, so everyone reads documents the same way.",
        iso: "7.5: documented information is clear.",
        open: "tab:Terms"
      }
    ]
  },
  {
    id: "policies",
    title: "Policies",
    area: "Policies",
    summary: "Your quality policy and how people acknowledge it",
    clauses: "5.2",
    path: "/qms/policies",
    tips: [
      {
        target: "figures",
        title: "Your policies at a glance",
        body: "How many policies are published, how many people have acknowledged them, and when top management last reviewed them.",
        iso: "5.2: quality policy."
      },
      {
        target: "text:Add policy",
        title: "Add your quality policy",
        body: "Write or upload your quality policy. It goes through review and approval like any document.",
        iso: "5.2.1: establishing the quality policy."
      },
      {
        target: "main table",
        title: "Make sure people have read it",
        body: "The Acknowledged column shows who has read and accepted each policy. Auditors often ask staff about it.",
        iso: "5.2.2: communicating the quality policy."
      },
      {
        target: "main table",
        title: "Keep it current",
        body: "Each policy has a review date. Top management reviews it at least once a year, usually in the management review.",
        iso: "5.2.1 and 9.3.2."
      }
    ]
  },
  {
    id: "processes",
    title: "Processes",
    area: "Processes",
    summary: "Map how your business works, process by process",
    clauses: "4.4",
    path: "/qms/processes",
    tips: [
      {
        target: "figures",
        title: "How your processes are doing",
        body: "These figures update as you set things up: processes without an owner or documents show under Need attention.",
        iso: "4.4: determine your processes and how they interact."
      },
      {
        target: "card:Leadership & planning || main [data-slot=card]",
        title: "Each card is one process",
        body: "Each card shows the owner, its ISO clauses, documents, open nonconformities and next audit. Start with the ones without an owner.",
        iso: "4.4.1 e: responsibilities and authorities."
      },
      {
        target: "text:Edit process structure",
        title: "Add or reorganise processes",
        body: "Add a process or move one between Management, Core and Support. Not sure what your processes are? Start with how an order comes in and goes out.",
        iso: "4.4 and 5.3."
      },
      {
        target: "card:How the process works",
        title: "Inside a process: inputs, activities, outputs",
        body: "List what comes in, what people do and what goes out. Link each input to the process it comes from, so the processes join up.",
        iso: "4.4.1 a–b: inputs, outputs, sequence and interaction.",
        path: "/qms/processes/purchasing",
        practice: true
      },
      {
        target: "card:People",
        title: "Who works in it",
        body: "The owner and the people who work in this process. They see its records; people outside it don't, unless they're given access.",
        iso: "4.4.1 e and 5.3.",
        path: "/qms/processes/purchasing",
        practice: true
      },
      {
        target: "card:Objectives",
        title: "Its objectives",
        body: "The KPIs that measure this process. Results below target show here and on the Overview.",
        iso: "4.4.1 c and 6.2.",
        path: "/qms/processes/purchasing",
        practice: true
      },
      {
        target: "main [role=tablist]",
        title: "Its documents, risks, nonconformities and audits",
        body: "Everything about the process in one place. Use these tabs to check nothing is missing before an audit.",
        iso: "4.4.1 c–h.",
        path: "/qms/processes/purchasing",
        practice: true
      },
      {
        target: "card:Review route",
        title: "Its own review route",
        body: "A process can have its own reviewers and approvers for documents. Leave it empty to use the company default.",
        iso: "7.5.2 c.",
        path: "/qms/processes/purchasing",
        practice: true
      }
    ]
  },
  {
    id: "documents",
    title: "Procedures & documents",
    area: "Documents",
    summary: "Add your documents and take one from draft to published",
    clauses: "7.5",
    path: "/qms/procedures",
    tips: [
      {
        target: "text:Add document",
        title: "Add your documents",
        body: "Add procedures, work instructions and forms. Link to the file in SharePoint or OneDrive, or upload it if it's Public or Internal.",
        iso: "7.5.1: documented information the QMS needs."
      },
      {
        target: "main [aria-label=Views] || main [role=tablist]",
        title: "Filter by stage",
        body: "Published, in review, review overdue and drafts. Review overdue means the periodic review date has passed.",
        iso: "7.5.3.2: review and update."
      },
      {
        target: "main [role=tablist]",
        title: "Two ways to look",
        body: "Register lists every document. By ISO clause shows which clauses already have documents and which don't.",
        iso: "7.5.3: control of documented information."
      },
      {
        target: "track",
        title: "A document's stages",
        body: "Draft, technical review, approval, ready to publish and published. The track shows where it is now and who it's waiting on.",
        iso: "7.5.2 c: review and approval.",
        path: "/documents/PUR-PRO-002",
        practice: true
      },
      {
        target: "card:About this document",
        title: "What it is and what it covers",
        body: "The purpose, process, type, ISO clauses and classification. Classification decides who can see it and whether the file can be uploaded.",
        iso: "7.5.2 a and 7.5.3.1.",
        path: "/documents/PUR-PRO-002",
        practice: true
      },
      {
        target: "card:Comments",
        title: "Reviewers comment here",
        body: "Reviewers and approvers leave comments on the revision. The author answers or changes the document before it moves on.",
        iso: "7.5.2 c.",
        path: "/documents/PUR-PRO-002",
        practice: true
      },
      {
        target: "card:Evidence",
        title: "Records that show it's followed",
        body: "Link the records that prove the procedure is used, such as filled-in forms. They're kept with the document for audits.",
        iso: "7.5.3 and 9.2.",
        path: "/documents/PUR-PRO-002",
        practice: true
      },
      {
        target: "card:Revisions",
        title: "Every revision is kept",
        body: "Earlier revisions stay as they were, with who approved them and why they changed. Only the published one is in use.",
        iso: "7.5.3.2 c–d: changes and retention.",
        path: "/documents/PUR-PRO-002",
        practice: true
      }
    ]
  },
  {
    id: "objectives",
    title: "Objectives & KPIs",
    area: "Objectives & KPIs",
    summary: "Set measurable objectives and add results each period",
    clauses: "6.2, 9.1",
    path: "/qms/objectives",
    tips: [
      {
        target: "figures",
        title: "How your objectives are doing",
        body: "How many are on target, below target, and when results are next due.",
        iso: "9.1.1: monitoring and measurement."
      },
      {
        target: "text:Add objective",
        title: "Set an objective",
        body: "Each objective has a target, an owner and a process. Keep it measurable: “95% on-time delivery”, not “better delivery”.",
        iso: "6.2.1: quality objectives."
      },
      {
        target: "main table",
        title: "Results at a glance",
        body: "The last six results for every objective, with the trend. Below-target results show in red.",
        iso: "9.1.3: analysis and evaluation."
      },
      {
        target: "card:Latest results",
        title: "Inside an objective: its results",
        body: "Each period's figure against the target. Click a bar to see the result and its evidence.",
        iso: "9.1.1 and 9.1.3.",
        path: "/qms/objectives/OBJ-2026-01",
        practice: true
      },
      {
        target: "text:Add result",
        title: "Add a result every period",
        body: "Add the month's or quarter's figure, and attach the report it came from.",
        iso: "9.1.1: when and how results are evaluated.",
        path: "/qms/objectives/OBJ-2026-01",
        practice: true
      },
      {
        target: "card:Details",
        title: "The plan to reach it",
        body: "What will be done, the resources, who is responsible, the deadline and how results are evaluated.",
        iso: "6.2.2 a–e: planning to achieve objectives.",
        path: "/qms/objectives/OBJ-2026-01",
        practice: true
      },
      {
        target: "card:Supporting evidence",
        title: "Evidence behind the figures",
        body: "The records the figures come from. Management review uses them, so keep them linked.",
        iso: "9.1 and 9.3.2 c.",
        path: "/qms/objectives/OBJ-2026-01",
        practice: true
      }
    ]
  },
  {
    id: "risks",
    title: "Risks & Opportunities",
    area: "Risks & Opportunities",
    summary: "Find, rate and treat risks and opportunities",
    clauses: "6.1",
    path: "/risks",
    tips: [
      {
        target: "text:Add risk or opportunity",
        title: "Add a risk or opportunity",
        body: "Write what could go wrong, or go better, and which process it affects.",
        iso: "6.1.1: determining risks and opportunities."
      },
      {
        target: "card:Risk matrix",
        title: "Rate it on the matrix",
        body: "Rate how likely and how serious it is. The score decides what action is needed and how often it's reviewed.",
        iso: "6.1.2: actions to address risks."
      },
      {
        target: "card:Highest risks",
        title: "Deal with the highest first",
        body: "The highest-scoring risks show here, with their treatment and next review date.",
        iso: "6.1.2 and 6.1.3."
      },
      {
        target: "card:Rating and reviews",
        title: "Inside a risk: its rating over time",
        body: "Each review records the rating again, so you can see whether the treatment is working.",
        iso: "6.1.2 b: evaluate the effectiveness of actions.",
        path: "/risks/R-031",
        practice: true
      },
      {
        target: "card:Treatment",
        title: "How you'll treat it",
        body: "Avoid it, reduce it, share it or accept it, with an owner and a due date.",
        iso: "6.1.2 a: plan actions.",
        path: "/risks/R-031",
        practice: true
      },
      {
        target: "card:Nonconformities linked to it",
        title: "Linked to problems that happened",
        body: "When a risk turns into a real problem, the nonconformity links here. ISO asks you to update risks after a nonconformity.",
        iso: "10.2.1 e: update risks and opportunities.",
        path: "/risks/R-031",
        practice: true
      },
      {
        target: "card:Management review actions",
        title: "And to management decisions",
        body: "Actions top management decided on for this risk show here.",
        iso: "9.3.2 e and 9.3.3.",
        path: "/risks/R-031",
        practice: true
      },
      {
        target: "text:Mark reviewed today",
        title: "Review it on time",
        body: "Mark it reviewed when you've checked it. Overdue reviews show on the list and the Overview.",
        iso: "6.1 and 9.1.3 e.",
        path: "/risks/R-031",
        practice: true
      }
    ]
  },
  {
    id: "evidence",
    title: "Evidence",
    area: "Evidence",
    summary: "Keep records that show what you do, and find the gaps",
    clauses: "7.5.3",
    path: "/evidence",
    tips: [
      {
        target: "figures",
        title: "How much proof you have",
        body: "These figures show how many ISO requirements have current evidence, and which evidence is getting old.",
        iso: "7.5.3: retained documented information."
      },
      {
        target: "text:Add evidence",
        title: "Add evidence",
        body: "Add a record that shows something was done: a signed form, a report, a photo. One item can support several clauses.",
        iso: "7.5.3.1: records are available and protected."
      },
      {
        target: "main [role=tablist]",
        title: "Find the gaps by clause",
        body: "By ISO clause shows each requirement with its evidence. Red bars are where an auditor would find nothing.",
        iso: "9.2: evidence for audits.",
        open: "tab:By ISO clause"
      },
      {
        target: "main [role=tabpanel][data-state=active]",
        title: "Evidence that's getting old",
        body: "Records older than your refresh period. Replace them with current ones before the audit.",
        iso: "7.5.3.2: retention and currency.",
        open: "tab:Getting old"
      },
      {
        target: "card:Files and links",
        title: "Inside an evidence item: its files",
        body: "One item can hold several files and links in folders, like a pack. Confidential ones stay as links to SharePoint.",
        iso: "7.5.3.1 and 7.5.3.2.",
        path: "/evidence/EV-0200",
        practice: true
      },
      {
        target: "card:Used on",
        title: "Where it's used",
        body: "The documents, nonconformities and reviews this evidence supports. Use it once, link it anywhere.",
        iso: "7.5.3.",
        path: "/evidence/EV-0200",
        practice: true
      }
    ]
  },
  {
    id: "audits",
    title: "Audits",
    area: "Audits",
    summary: "Plan the programme, run an audit, issue the report",
    clauses: "9.2",
    path: "/audits",
    tips: [
      {
        target: "card:2026 programme || main [data-slot=card]",
        title: "Your audit programme",
        body: "Each process gets audited during the year. The programme shows what's planned, done or late, month by month.",
        iso: "9.2.2 a: plan an audit programme.",
        open: "tab:Programme"
      },
      {
        target: "text:Plan audit",
        title: "Plan an audit",
        body: "Choose the process, the dates and an auditor who doesn't audit their own work.",
        iso: "9.2.2 b–c: criteria, scope and objective auditors."
      },
      {
        target: "main [role=tabpanel][data-state=active]",
        title: "Auditors and their exclusions",
        body: "Your internal auditors, their level, and the processes each one can't audit.",
        iso: "9.2.2 c and 7.2: competent, impartial auditors.",
        open: "tab:Auditors"
      },
      {
        target: "card:Timetable",
        title: "The audit plan and timetable",
        body: "Opening meeting, interviews, breaks and closing meeting. Print it or email it to everyone taking part.",
        iso: "9.2.2 b.",
        path: "/audits/plans/AP-2026-01",
        practice: true
      },
      {
        target: "main [role=tablist]",
        title: "Checklist, evidence pack, findings and report",
        body: "Everything for this audit day, from the questions to ask to the findings and the report.",
        iso: "9.2.2 b–e.",
        path: "/audits/plans/AP-2026-01",
        practice: true
      },
      {
        target: "track",
        title: "An audit's stages",
        body: "Planned, checklist ready, held, findings agreed, report issued and follow-up. The track shows where this audit is.",
        iso: "9.2.2: conduct and report.",
        path: "/audits/IA-2026-10",
        practice: true
      },
      {
        target: "card:Checklists and questionnaires",
        title: "Checklists and questionnaires",
        body: "Build the checklist the auditor follows and the questionnaires people answer before the audit.",
        iso: "9.2.2 b: audit criteria.",
        path: "/audits/IA-2026-10",
        practice: true
      },
      {
        target: "card:Observations and nonconformities",
        title: "Findings",
        body: "Each observation or nonconformity found. A nonconformity becomes a corrective action with one click.",
        iso: "9.2.2 d and 10.2.",
        path: "/audits/IA-2026-10",
        practice: true
      },
      {
        target: "card:Report readiness",
        title: "Ready to report?",
        body: "What's still missing before the lead auditor can issue the report.",
        iso: "9.2.2 d: results reported to management.",
        path: "/audits/IA-2026-10",
        practice: true
      },
      {
        target: "card:Final report || main",
        title: "The audit report",
        body: "The lead auditor issues the report. Once issued it can't be changed, only amended with a reason.",
        iso: "9.2.2 d–f and 7.5.3.",
        path: "/audits/IA-2026-10/report",
        practice: true
      }
    ]
  },
  {
    id: "review",
    title: "Management Review",
    area: "Management Review",
    summary: "Run a review from the first input to signed decisions",
    clauses: "9.3",
    path: "/management-review",
    tips: [
      {
        target: "figures",
        title: "Your reviews at a glance",
        body: "When the next ISO 9001 review is, how many reviews are open, and how many actions from earlier reviews are still to do.",
        iso: "9.3.1: reviews at planned intervals."
      },
      {
        target: "text:Start a review",
        title: "Start a review",
        body: "Top management can review the QMS at any time: a process, a document, evidence, a KPI or a question of their own.",
        iso: "9.3.1: top management reviews the QMS."
      },
      {
        target: "text:Use ISO 9001 template",
        title: "Or use the ISO 9001 template",
        body: "The template adds all 11 inputs ISO asks for, with figures for the reporting period, so nothing is missed in your formal review.",
        iso: "9.3.2: management review inputs."
      },
      {
        target: "main table",
        title: "Every review in one list",
        body: "Each review's type, date, stage and open actions. Open one to work on it.",
        iso: "9.3: management review."
      },
      {
        target: "track",
        title: "Stage 1 · Plan the review",
        body: "A review moves through seven stages: plan, prepare inputs, send the pack, evaluate, record decisions, sign off and monitor actions. This one was planned because top management asked a question.",
        iso: "9.3.1: planned review.",
        path: "/management-review/MR-2026-03",
        practice: true
      },
      {
        target: "main [role=tabpanel][data-state=active]",
        title: "Stage 2 · Prepare the inputs",
        body: "Each topic is prepared by someone: figures, analysis and the records behind them. A topic shows Prepared, With someone, or Needs analysis.",
        iso: "9.3.2: inputs are prepared.",
        path: "/management-review/MR-2026-03",
        open: "tab:Topics",
        practice: true
      },
      {
        target: "text:Add to review",
        title: "Add more to review",
        body: "Add a process, document, evidence, risk, audit or a topic of your own at any time before the review is held.",
        iso: "9.3.2.",
        path: "/management-review/MR-2026-03",
        practice: true
      },
      {
        target: "text:Send review pack",
        title: "Stage 3 · Send the review pack",
        body: "When every input is ready, send the pack to top management. They read it before the review.",
        iso: "9.3.2: information for top management.",
        path: "/management-review/MR-2026-03",
        practice: true
      },
      {
        target: "track",
        title: "Stage 4 · Top management evaluates",
        body: "This ISO 9001 review has its pack sent. Top management now evaluates each input: is it suitable, adequate and effective?",
        iso: "9.3.1 and 9.3.2.",
        path: "/management-review/MR-2026-02",
        practice: true
      },
      {
        target: "main [role=tabpanel][data-state=active]",
        title: "Figures for the reporting period",
        body: "Each ISO input has its figure, target and trend for the period, worked out from your records. Evaluated topics are marked.",
        iso: "9.3.2 a–e.",
        path: "/management-review/MR-2026-02",
        open: "tab:Topics",
        practice: true
      },
      {
        target: "text:Open review pack",
        title: "The review pack",
        body: "The pack puts every input on paper, for top management to read or print.",
        iso: "9.3.2 and 7.5.3.",
        path: "/management-review/MR-2026-02",
        practice: true
      },
      {
        target: "text:Record the review",
        title: "Stage 5 · Record the review",
        body: "After the review, record who took part, the conclusion and each decision.",
        iso: "9.3.3: outputs of the review.",
        path: "/management-review/MR-2026-02",
        practice: true
      },
      {
        target: "card:Conclusion of top management",
        title: "Stage 6 · The conclusion, signed off",
        body: "Top management concludes whether the QMS is suitable, adequate, effective and in line with the company's direction, then signs and locks the record.",
        iso: "9.3.1 and 9.3.3.",
        path: "/management-review/MR-2026-01",
        practice: true
      },
      {
        target: "main [role=tabpanel][data-state=active]",
        title: "Decisions become actions",
        body: "Each decision is an action with an owner, a due date and the input it came from: improvements, changes to the QMS and resources needed.",
        iso: "9.3.3 a–c.",
        path: "/management-review/MR-2026-01",
        open: "tab:Decisions and actions",
        practice: true
      },
      {
        target: "main [role=tabpanel][data-state=active]",
        title: "Who reviewed it, and the record",
        body: "Who took part and the signed, locked record. It's kept as evidence for the audit.",
        iso: "9.3.3 and 7.5.3.",
        path: "/management-review/MR-2026-01",
        open: "tab:People and record",
        practice: true
      },
      {
        target: "card:Evidence it was done",
        title: "Stage 7 · Monitor each action",
        body: "Each action has its own page. The owner links evidence when it's done, and open actions carry into the next review's first input.",
        iso: "9.3.2 a and 10.3.",
        path: "/management-review/actions/RA-01",
        practice: true
      },
      {
        target: "text:Amend record",
        title: "Change a signed record only by amendment",
        body: "A locked record isn't edited. An amendment adds the change, the reason and who made it.",
        iso: "7.5.3.2 c: control of changes.",
        path: "/management-review/MR-2026-01",
        practice: true
      }
    ]
  },
  {
    id: "corrective",
    title: "Corrective Action",
    area: "Corrective Action",
    summary: "Log a problem and follow it to an effective fix",
    clauses: "10.2",
    path: "/corrective-action",
    tips: [
      {
        target: "figures",
        title: "Open problems at a glance",
        body: "Open nonconformities, corrective actions in progress, what's waiting for verification, and customer complaints.",
        iso: "10.2: nonconformity and corrective action."
      },
      {
        target: "text:Add nonconformity",
        title: "Log a problem",
        body: "When something goes wrong (an audit finding, a complaint, a failed check), add a nonconformity.",
        iso: "10.2.1 a: react to the nonconformity."
      },
      {
        target: "main [role=tablist]",
        title: "Nonconformities, actions, improvements and complaints",
        body: "All four live here, so the whole picture is in one place.",
        iso: "10.1, 10.2 and 9.1.2."
      },
      {
        target: "track",
        title: "A nonconformity's stages",
        body: "Raised, contained, root cause and action, action done, verification, effectiveness and closed.",
        iso: "10.2.1 a–f.",
        path: "/corrective-action/NC-2026-007",
        practice: true
      },
      {
        target: "card:Containment",
        title: "First, contain it",
        body: "What was done straight away to stop the problem spreading and deal with its effects.",
        iso: "10.2.1 a 1–2.",
        path: "/corrective-action/NC-2026-007",
        practice: true
      },
      {
        target: "card:Root cause",
        title: "Find the root cause",
        body: "Ask why until you reach the real cause, and check whether it could happen elsewhere.",
        iso: "10.2.1 b.",
        path: "/corrective-action/NC-2026-007",
        practice: true
      },
      {
        target: "card:Corrective action",
        title: "Act on the cause",
        body: "Tasks with owners and dates. When they're done, someone else verifies the action worked.",
        iso: "10.2.1 c–d.",
        path: "/corrective-action/NC-2026-007",
        practice: true
      },
      {
        target: "card:Risks and opportunities",
        title: "Update your risks",
        body: "Link the risk this problem relates to, or add a new one. Note when no change was needed.",
        iso: "10.2.1 e.",
        path: "/corrective-action/NC-2026-007",
        practice: true
      },
      {
        target: "card:Evidence",
        title: "Keep the evidence",
        body: "Records of what was found, what was done and that it worked.",
        iso: "10.2.2: retained documented information.",
        path: "/corrective-action/NC-2026-007",
        practice: true
      },
      {
        target: "card:The improvement || main",
        title: "Improvements",
        body: "Ideas to do better, not only fixes. Track them from proposed to done.",
        iso: "10.1 and 10.3.",
        path: "/corrective-action/improvements/IMP-2026-01",
        practice: true
      },
      {
        target: "card:The complaint || main",
        title: "Customer complaints",
        body: "Log each complaint, investigate, respond and close it. Complaints feed customer satisfaction in management review.",
        iso: "9.1.2 and 8.2.1.",
        path: "/corrective-action/complaints/CC-2026-03",
        practice: true
      }
    ]
  }
]
