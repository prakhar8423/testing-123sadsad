import {
  type Article,
  type CatalogItem,
  type Category,
  type Person,
  type Priority,
  type Status,
  type Ticket,
  type TimelineEvent,
  type TimelineKind,
  computeSlaDue,
  isOpenStatus,
} from '@/lib/itsm'

// Deterministic PRNG so seeds are stable across reloads (before persistence).
function mulberry32(seed: number) {
  let a = seed
  return function next() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rnd = mulberry32(20260722)
const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)]
const chance = (p: number) => rnd() < p

const DAY_MS = 24 * 60 * 60 * 1000
const now = Date.now()

const AGENT_NAMES = [
  'Maya Okafor',
  'Devin Patel',
  'Sofia Reyes',
  'Liam Novak',
  'Amara Cole',
  'Noah Fischer',
  'Priya Anand',
  'Owen Mbeki',
]

const REQUESTER_NAMES = [
  'Grace Lin',
  'Tomás Vega',
  'Hannah Weiss',
  'Isaac Boyd',
  'Nadia Farr',
  'Caleb Ross',
  'Yuki Tanaka',
  'Elena Petrov',
  'Marcus Hale',
  'Ruth Adeyemi',
  'Jonah Brandt',
  'Alina Sharp',
  'Felix Moreau',
  'Dana Kruse',
  'Omar Haddad',
  'Bea Sullivan',
  'Wren Castillo',
  'Theo Larsson',
  'Iris Nakamura',
  'Sam Delgado',
]

function emailFor(name: string): string {
  const [first, last] = name.toLowerCase().split(' ')
  return `${first}.${last}@northwind.example`
}

export function buildPeople(): Person[] {
  const agents: Person[] = AGENT_NAMES.map((name, i) => ({
    id: i === 0 ? 'agent-1' : `agent-${i + 1}`,
    name,
    email: emailFor(name),
    role: 'agent',
    team: pick(['Tier 1', 'Tier 2', 'Infrastructure', 'Endpoint']),
    avatarHue: Math.floor(rnd() * 360),
  }))
  const requesters: Person[] = REQUESTER_NAMES.map((name, i) => ({
    id: `req-${i + 1}`,
    name,
    email: emailFor(name),
    role: 'requester',
    team: pick(['Sales', 'Finance', 'Marketing', 'Engineering', 'People', 'Ops']),
    avatarHue: Math.floor(rnd() * 360),
  }))
  return [...agents, ...requesters]
}

const INCIDENT_SUBJECTS = [
  'Laptop won\u2019t boot after update',
  'Outlook not syncing on mobile',
  'VPN keeps disconnecting',
  'Cannot access shared drive',
  'Printer on 3rd floor offline',
  'Two-factor codes not arriving',
  'Excel crashes on large files',
  'Wi-Fi drops in the east wing',
  'Password reset link expired',
  'Zoom audio not working',
  'Monitor shows no signal',
  'Slow performance after patch',
  'Email flagged as spam internally',
  'Keyboard keys unresponsive',
  'License activation failing',
  'Browser blocks internal site',
  'Disk almost full warning',
  'Phone won\u2019t register on network',
  'Duplicate calendar invites',
  'Access denied to CRM',
]

const REQUEST_SUBJECTS = [
  'New laptop for new hire',
  'VPN access for contractor',
  'Additional monitor request',
  'Software license: Figma',
  'Shared mailbox creation',
  'Access to finance folder',
  'Docking station replacement',
  'New-hire onboarding kit',
]

const DESCRIPTIONS = [
  'The issue started this morning and is blocking my work. I\u2019ve tried restarting twice.',
  'Reproducible every time. Happy to share a screen recording if that helps.',
  'This has been intermittent all week but is getting worse today.',
  'Please advise on next steps \u2014 I have a deadline this afternoon.',
  'A colleague on my team is seeing the same thing.',
]

const CATEGORIES: Category[] = ['hardware', 'software', 'network', 'access', 'email', 'other']
const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent']

export function buildTickets(people: Person[]): {
  tickets: Ticket[]
  events: TimelineEvent[]
} {
  const agents = people.filter((p) => p.role === 'agent')
  const requesters = people.filter((p) => p.role === 'requester')
  const tickets: Ticket[] = []
  const events: TimelineEvent[] = []
  let eventSeq = 0

  const makeTicket = (index: number, type: 'incident' | 'request') => {
    const subject =
      type === 'incident' ? pick(INCIDENT_SUBJECTS) : `Request: ${pick(REQUEST_SUBJECTS)}`
    const category = type === 'request' ? pick(['hardware', 'software', 'access']) as Category : pick(CATEGORIES)
    const priority = pick(PRIORITIES)
    const ageDays = rnd() * 30
    const createdAt = new Date(now - ageDays * DAY_MS).toISOString()
    // status distribution: more open than closed
    const status: Status = pick([
      'new',
      'open',
      'open',
      'in_progress',
      'in_progress',
      'on_hold',
      'resolved',
      'resolved',
      'closed',
    ])
    const assigneeId = status === 'new' && chance(0.5) ? null : pick(agents).id
    const requesterId = pick(requesters).id
    const slaDueAt = computeSlaDue(priority, createdAt)
    const open = isOpenStatus(status)
    const slaBreached = open && new Date(slaDueAt).getTime() < now
    const firstResponseAt =
      status === 'new'
        ? null
        : new Date(new Date(createdAt).getTime() + rnd() * 6 * 60 * 60 * 1000).toISOString()
    const resolvedAt = !open
      ? new Date(new Date(createdAt).getTime() + (0.5 + rnd() * 4) * DAY_MS).toISOString()
      : null
    const updatedAt = resolvedAt ?? firstResponseAt ?? createdAt
    const id = `${type === 'incident' ? 'INC' : 'REQ'}-${String(1000 + index).slice(1)}`

    const ticket: Ticket = {
      id,
      type,
      subject,
      description: pick(DESCRIPTIONS),
      requesterId,
      assigneeId,
      category,
      priority,
      status,
      createdAt,
      updatedAt,
      slaDueAt,
      slaBreached,
      firstResponseAt,
      catalogItemId: null,
      attachedArticleIds: chance(0.25) ? [pick(ARTICLE_IDS)] : [],
    }
    tickets.push(ticket)

    // timeline
    const addEvent = (kind: TimelineKind, at: string, extra: Partial<TimelineEvent> = {}) => {
      events.push({
        id: `evt-${++eventSeq}`,
        ticketId: id,
        kind,
        actorId: assigneeId ?? requesterId,
        createdAt: at,
        ...extra,
      })
    }

    addEvent('created', createdAt, { actorId: requesterId })
    if (assigneeId) addEvent('assigned', createdAt, { meta: { to: assigneeId } })
    if (firstResponseAt)
      addEvent('comment', firstResponseAt, {
        actorId: assigneeId ?? requesterId,
        body: pick([
          'Thanks for the report \u2014 taking a look now.',
          'Can you confirm which build you\u2019re on?',
          'I\u2019ve escalated this to Tier 2 for a closer look.',
          'Reproduced on my end, working on a fix.',
        ]),
      })
    if (chance(0.5) && firstResponseAt)
      addEvent('internal_note', firstResponseAt, {
        actorId: assigneeId ?? requesterId,
        body: 'Similar to last week\u2019s patch regression \u2014 checking the rollback notes.',
      })
    if (slaBreached) addEvent('sla_breached', slaDueAt)
    if (resolvedAt) {
      addEvent('status_changed', resolvedAt, { meta: { to: status } })
      addEvent('resolved', resolvedAt, {
        body: pick([
          'Resolved by reinstalling the driver and rebooting.',
          'Access granted and confirmed working with the requester.',
          'Root cause was a stale cache; cleared and verified.',
        ]),
      })
    }
  }

  let idx = 1
  for (let i = 0; i < 38; i++) makeTicket(idx++, 'incident')
  for (let i = 0; i < 12; i++) makeTicket(idx++, 'request')

  tickets.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return { tickets, events }
}

const ARTICLE_IDS = ['kb-1', 'kb-2', 'kb-3', 'kb-4', 'kb-5', 'kb-6']

export const CATALOG_ITEMS: CatalogItem[] = [
  { id: 'cat-1', title: 'New laptop', description: 'Standard-issue laptop for a new or replacement device, imaged and enrolled.', category: 'hardware', icon: 'Laptop', fulfillmentDays: 3 },
  { id: 'cat-2', title: 'Additional monitor', description: 'Request a second or replacement display for your workstation.', category: 'hardware', icon: 'Monitor', fulfillmentDays: 2 },
  { id: 'cat-3', title: 'Software license', description: 'Request a license for approved software (design, dev, or productivity).', category: 'software', icon: 'Package', fulfillmentDays: 1 },
  { id: 'cat-4', title: 'VPN access', description: 'Remote-access VPN provisioning for staff and approved contractors.', category: 'network', icon: 'ShieldCheck', fulfillmentDays: 1 },
  { id: 'cat-5', title: 'Password reset', description: 'Reset your corporate account password with identity verification.', category: 'access', icon: 'KeyRound', fulfillmentDays: 1 },
  { id: 'cat-6', title: 'Shared mailbox', description: 'Create a shared mailbox or distribution list for a team.', category: 'email', icon: 'Mails', fulfillmentDays: 2 },
  { id: 'cat-7', title: 'Folder access', description: 'Request read or write access to a shared network folder.', category: 'access', icon: 'FolderKey', fulfillmentDays: 1 },
  { id: 'cat-8', title: 'New-hire onboarding', description: 'Full kit for a new joiner: device, accounts, access, and mailbox.', category: 'other', icon: 'UserPlus', fulfillmentDays: 5 },
  { id: 'cat-9', title: 'Docking station', description: 'Replacement or additional dock for hot-desking and offices.', category: 'hardware', icon: 'Usb', fulfillmentDays: 2 },
  { id: 'cat-10', title: 'Phone provisioning', description: 'Set up a corporate mobile line or handset for a team member.', category: 'network', icon: 'Smartphone', fulfillmentDays: 3 },
]

export const ARTICLES: Article[] = [
  { id: 'kb-1', title: 'Fix VPN disconnects on Wi-Fi', category: 'network', excerpt: 'Steps to stabilize the corporate VPN when it drops on wireless networks.', body: ['VPN drops are usually caused by aggressive Wi-Fi power management or a stale client cache.', 'First, disable power saving on the wireless adapter, then flush the VPN client cache and reconnect.', 'If the issue persists on a specific network, capture the connection log and attach it to a ticket.'], updatedAt: new Date(now - 3 * DAY_MS).toISOString(), views: 842, helpfulYes: 61, helpfulNo: 7 },
  { id: 'kb-2', title: 'Reset your account password', category: 'access', excerpt: 'How to reset your corporate password and recover locked accounts.', body: ['Use the self-service reset portal from a trusted device.', 'You will verify identity with your registered phone before setting a new password.', 'Passwords must be at least 14 characters and cannot reuse the last five.'], updatedAt: new Date(now - 8 * DAY_MS).toISOString(), views: 1503, helpfulYes: 120, helpfulNo: 9 },
  { id: 'kb-3', title: 'Outlook mobile sync issues', category: 'email', excerpt: 'Resolve calendar and mail sync problems on the Outlook mobile app.', body: ['Sync failures often follow a password change or a revoked app session.', 'Remove and re-add the account in the app, then allow a full initial sync on Wi-Fi.', 'For duplicate invites, clear the local calendar cache before re-syncing.'], updatedAt: new Date(now - 5 * DAY_MS).toISOString(), views: 610, helpfulYes: 44, helpfulNo: 12 },
  { id: 'kb-4', title: 'Laptop won\u2019t boot after update', category: 'hardware', excerpt: 'Recovery steps when a device fails to start following a system update.', body: ['Hold the power button for 10 seconds to force a full shutdown, then start again.', 'If it fails twice, the device enters recovery \u2014 choose \u201cRoll back the last update.\u201d', 'Persistent boot loops should be escalated to Endpoint with the asset tag.'], updatedAt: new Date(now - 1 * DAY_MS).toISOString(), views: 388, helpfulYes: 30, helpfulNo: 4 },
  { id: 'kb-5', title: 'Request software licenses', category: 'software', excerpt: 'The approval flow and typical timelines for licensed software.', body: ['Submit the request through the service catalog with a business justification.', 'Most licenses are approved within one business day; specialized tools may need manager sign-off.', 'License seats are reclaimed automatically after 45 days of inactivity.'], updatedAt: new Date(now - 12 * DAY_MS).toISOString(), views: 275, helpfulYes: 22, helpfulNo: 3 },
  { id: 'kb-6', title: 'Connect to shared drives', category: 'access', excerpt: 'Map network drives and troubleshoot access-denied errors.', body: ['Map the drive using the fully qualified server path provided by IT.', 'Access-denied usually means your group membership hasn\u2019t propagated yet \u2014 allow 15 minutes.', 'If access is still blocked, request the folder via the catalog.'], updatedAt: new Date(now - 6 * DAY_MS).toISOString(), views: 512, helpfulYes: 38, helpfulNo: 6 },
  { id: 'kb-7', title: 'Set up two-factor authentication', category: 'access', excerpt: 'Enroll a device for MFA and handle missing verification codes.', body: ['Enroll an authenticator app rather than SMS where possible for reliability.', 'If codes stop arriving, check the device clock is set to automatic.', 'Lost devices must be reported immediately so sessions can be revoked.'], updatedAt: new Date(now - 9 * DAY_MS).toISOString(), views: 934, helpfulYes: 80, helpfulNo: 5 },
  { id: 'kb-8', title: 'Printer offline troubleshooting', category: 'hardware', excerpt: 'Bring shared office printers back online quickly.', body: ['Confirm the printer has power and a network link light.', 'Remove and re-add the printer queue from the print portal.', 'For paper or toner faults, the panel error code tells Facilities what to bring.'], updatedAt: new Date(now - 14 * DAY_MS).toISOString(), views: 201, helpfulYes: 15, helpfulNo: 2 },
  { id: 'kb-9', title: 'Zoom audio not working', category: 'software', excerpt: 'Fix microphone and speaker problems in meetings.', body: ['Check the correct input and output devices are selected in Zoom settings.', 'Grant microphone permission to Zoom in the operating system privacy settings.', 'A quick test call from settings confirms both directions before your meeting.'], updatedAt: new Date(now - 4 * DAY_MS).toISOString(), views: 447, helpfulYes: 33, helpfulNo: 8 },
  { id: 'kb-10', title: 'Free up disk space', category: 'hardware', excerpt: 'Safely reclaim storage when you hit the low-disk warning.', body: ['Run the built-in storage cleanup to clear temp files and caches.', 'Move large media to the shared drive rather than keeping local copies.', 'Avoid deleting anything in system folders \u2014 raise a ticket if unsure.'], updatedAt: new Date(now - 7 * DAY_MS).toISOString(), views: 158, helpfulYes: 11, helpfulNo: 1 },
  { id: 'kb-11', title: 'Whitelist an internal site', category: 'network', excerpt: 'What to do when the browser blocks an internal application.', body: ['Internal tools sometimes trip the security proxy on first launch.', 'Send the exact URL and the block message to IT to be added to the allow-list.', 'Clear the browser cache after the allow-list update takes effect.'], updatedAt: new Date(now - 2 * DAY_MS).toISOString(), views: 96, helpfulYes: 7, helpfulNo: 0 },
  { id: 'kb-12', title: 'Onboard a new hire', category: 'other', excerpt: 'The IT checklist for a smooth first day.', body: ['Submit the onboarding request at least five business days before the start date.', 'The kit includes a device, accounts, group access, and a mailbox.', 'Day-one access issues are handled as high priority.'], updatedAt: new Date(now - 10 * DAY_MS).toISOString(), views: 322, helpfulYes: 26, helpfulNo: 2 },
  { id: 'kb-13', title: 'Docking station display fixes', category: 'hardware', excerpt: 'Get external monitors working through a docking station.', body: ['Reseat the dock cable at both ends \u2014 most no-signal cases are physical.', 'Update the dock firmware from the vendor utility if displays flicker.', 'One 4K display at 60Hz may need a specific port on the dock.'], updatedAt: new Date(now - 11 * DAY_MS).toISOString(), views: 143, helpfulYes: 10, helpfulNo: 3 },
  { id: 'kb-14', title: 'Report a phishing email', category: 'email', excerpt: 'How to safely report suspicious messages.', body: ['Do not click links or download attachments in a suspicious message.', 'Use the Report Phishing button in Outlook to send it to Security.', 'If you already clicked, change your password and raise an urgent ticket.'], updatedAt: new Date(now - 13 * DAY_MS).toISOString(), views: 588, helpfulYes: 51, helpfulNo: 4 },
]
