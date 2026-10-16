// Content for the public Resource Library (/resources). Each guide renders at
// its own URL (/resources/<id>) so every topic is separately indexable , the
// core of the SEO/AEO plan. Bodies are trusted, hand-authored HTML strings.
export interface ResCat {
  id: string;
  name: string;
  blurb: string;
  color: string; // category hue (brand palette)
  ink: string; // readable text color on that hue
}
export interface ResGuide {
  cat: string;
  kind: string;
  id: string; // URL slug
  title: string;
  dek: string;
  body: string;
}

export const CATS: ResCat[] = [
  { id: "pricing", name: "Pricing & selling", blurb: "Set prices you can defend and turn a yes into money in the bank.", color: "#e2ad44", ink: "#032419" },
  { id: "galleries", name: "Galleries & consignment", blurb: "Place your work with confidence and always know where it is.", color: "#7a98d3", ink: "#032419" },
  { id: "opportunities", name: "Opportunities & applications", blurb: "Find the calls worth your time and apply like a pro.", color: "#e27a55", ink: "#2a0f04" },
  { id: "materials", name: "Your artist materials", blurb: "Statements, bios, CVs, and images that are always ready to send.", color: "#cfc581", ink: "#032419" },
  { id: "business", name: "The business side", blurb: "The few numbers and habits that keep your practice running.", color: "#032419", ink: "#fff5ff" },
  { id: "marketing", name: "Marketing & your audience", blurb: "Build real relationships with the people who collect your work.", color: "#522513", ink: "#f4e3d6" },
  { id: "templates", name: "Free templates & worksheets", blurb: "Starting points you can copy and make your own.", color: "#efd2c4", ink: "#532a12" },
];

export const GUIDES: ResGuide[] = [
// ---------------- PRICING ----------------
{cat:"pricing", kind:"Guide", id:"how-to-price", title:"How to price your work", dek:"A simple, repeatable formula, and how to know when it's time to raise your prices.",
body:`<p>Pricing is the question that stops more artists in their tracks than any other. The goal isn't a perfect number, it's a <strong>consistent, defensible</strong> one you can repeat without second-guessing every time someone asks.</p>
<h3>Start with a formula, not a feeling</h3>
<p>Most working artists price with some version of a size-based formula, then sanity-check it against the market. A common starting point:</p>
<div class="keybox"><h4>A starting formula</h4><ul>
<li><strong>(Height + Width in inches) × your $-per-inch</strong>, plus the cost of materials and framing.</li>
<li>Set your $-per-inch low when you're starting out (say $2–$6) and raise it as your sales history and demand grow.</li>
<li>Keep the same formula across a body of work so a 16×20 and a 30×40 relate to each other sensibly.</li></ul></div>
<h3>Check it against three things</h3>
<ul><li><strong>Your market:</strong> what do artists at a similar career stage, medium, and region actually sell for?</li>
<li><strong>Your costs:</strong> materials, framing, and the gallery's cut all have to fit inside the price.</li>
<li><strong>Your time:</strong> if a piece took 40 hours, does the price respect that at all?</li></ul>
<h3>Raise prices deliberately</h3>
<p>Prices go up, not down, dropping a price trains collectors to wait for discounts. Raise when you have steady sell-through, a waitlist, a notable show or award, or genuinely rising costs. Move in measured steps (often 10–25%), and apply the new $-per-inch to new work rather than re-pricing everything overnight.</p>
<p class="note">Consistency matters more than any single number. A collector who sees your prices scale logically with size trusts the whole system.</p>`},

{cat:"pricing", kind:"Guide", id:"invoices-paid", title:"Invoices that actually get paid", dek:"Deposits, terms, and the follow-up that closes the gap between a sale and the deposit in your account.",
body:`<p>A sale isn't finished when someone says yes, it's finished when the money lands. A clear invoice and a calm follow-up routine are what get you there.</p>
<h3>What every invoice needs</h3>
<ul><li>Your name/business, the buyer's name, and the date.</li>
<li>The work: title, year, medium, dimensions, and the price.</li>
<li>Any tax, shipping, or framing as separate line items.</li>
<li><strong>Payment terms</strong> ("Due on receipt," or "Net 15") and <strong>how to pay</strong>.</li>
<li>An invoice number, so you can reference it later.</li></ul>
<h3>Take a deposit on commissions</h3>
<p>For commissioned or made-to-order work, ask for <strong>30–50% up front</strong> before you begin, with the balance due before delivery. A deposit confirms the client is serious and protects your time if plans change.</p>
<h3>Follow up without the awkwardness</h3>
<p>Late payment is usually forgetfulness, not refusal. A simple sequence keeps it professional:</p>
<ol><li><strong>Day the balance is due:</strong> a friendly "just a reminder, here's the invoice again."</li>
<li><strong>One week later:</strong> a short, warm nudge.</li>
<li><strong>Two weeks:</strong> a direct note with the due date and payment link, offering to help if there's an issue.</li></ol>
<div class="keybox"><h4>The quiet rule</h4><ul><li>Don't release or ship the work until payment (or the agreed deposit) has cleared.</li></ul></div>`},

{cat:"pricing", kind:"Guide", id:"gallery-splits", title:"Understanding gallery splits", dek:"What a 40–50% commission really covers, and how to price so a split still leaves you whole.",
body:`<p>The first time you see half your sale price go to a gallery, it can sting. Understanding what that commission buys, and pricing for it from the start, turns it from a loss into a partnership.</p>
<h3>What the gallery's cut pays for</h3>
<ul><li>Physical space, staff, lighting, and hours spent with collectors.</li>
<li>Marketing, openings, art fairs, and their existing relationships.</li>
<li>Sales they make that you never could have on your own.</li></ul>
<p>A standard commission is <strong>40–50%</strong>. It's not a fee taken from "your" money, it's the cost of reaching buyers you otherwise wouldn't.</p>
<h3>Price so the split works</h3>
<p>The number one rule: <strong>your prices must be the same everywhere.</strong> If a gallery sells a piece for $2,000, your studio price for the same piece is also $2,000, not $1,000. Otherwise you undercut your gallery and erode collector trust.</p>
<div class="keybox"><h4>Build the split into your formula</h4><ul>
<li>Decide what you need to net on a piece.</li>
<li>If the gallery takes 50%, your retail price is <strong>double</strong> that net.</li>
<li>Use that same retail price for direct sales too, you simply keep more on those.</li></ul></div>
<p class="note">Consistent pricing across every channel is what makes galleries want to keep working with you.</p>`},

{cat:"pricing", kind:"Guide", id:"sales-tax", title:"Sales tax, plainly", dek:"When you need to collect it, how to keep track, and how much to set aside.",
body:`<p>Sales tax feels intimidating because the rules vary by place, but the habits that keep you out of trouble are simple and the same everywhere.</p>
<h3>The basic idea</h3>
<p>In most U.S. states, selling a physical artwork directly to a buyer means you're expected to <strong>collect sales tax</strong> and pass it to the state. Galleries that sell on your behalf usually handle tax on those sales, one more thing their commission covers.</p>
<h3>Three steps to stay clean</h3>
<ol><li><strong>Register</strong> for a seller's permit in your state (often free, done online).</li>
<li><strong>Collect</strong> the right rate on direct sales, it's an add-on to your price, not a cut of it.</li>
<li><strong>Set it aside and file</strong> on your state's schedule. The tax you collect was never your money.</li></ol>
<div class="keybox"><h4>Make it painless</h4><ul>
<li>Show tax as its own line on every invoice.</li>
<li>Move collected tax to a separate savings "bucket" the day it comes in.</li>
<li>Keep a running log of what you collected and remitted.</li></ul></div>
<p class="note">This is general guidance, not tax advice, rules differ by state and change over time. A quick conversation with an accountant once, up front, saves a lot of worry later.</p>`},

// ---------------- GALLERIES ----------------
{cat:"galleries", kind:"Guide", id:"how-consignment-works", title:"How consignment works", dek:"Who owns the piece, who insures it, and exactly what happens when it sells.",
body:`<p>Consignment is the most common way artists place work with galleries and shops. You keep ownership; they display and sell on your behalf for a commission. Knowing how it works makes every agreement easier to read.</p>
<h3>The essentials</h3>
<ul><li><strong>You still own the work</strong> while it's on consignment, it hasn't been bought, just placed.</li>
<li>The gallery takes a <strong>commission</strong> (usually 40–50%) only when it sells.</li>
<li>Unsold work comes back to you at the end of the agreed term.</li></ul>
<h3>What to pin down before it leaves your studio</h3>
<ul><li><strong>Insurance:</strong> who covers the piece while it's in their care? (It should be them.)</li>
<li><strong>Duration:</strong> how long will they hold it before returning it?</li>
<li><strong>Payment timing:</strong> how soon after a sale do you get paid, 30 days? 60?</li>
<li><strong>Price integrity:</strong> can they discount without your okay? (Set a floor.)</li></ul>
<div class="keybox"><h4>Keep your own record</h4><ul>
<li>Note every piece you've placed, where it is, and when it's due back.</li>
<li>Photograph work before it goes, and get a signed receipt or agreement.</li></ul></div>
<p>A good consignment relationship runs on clarity. When both sides know the terms, you can focus on the part that matters: your work finding collectors.</p>`},

{cat:"galleries", kind:"Checklist", id:"reading-consignment-agreement", title:"Reading a consignment agreement", dek:"The clauses that matter most, in plain language.",
body:`<p>A consignment agreement doesn't need to be long to be good, it needs to be <strong>clear</strong>. Here's what to look for, and what each clause is really protecting.</p>
<div class="keybox"><h4>The clauses that matter</h4><ul>
<li><strong>Commission %</strong>, the gallery's share of each sale. 40–50% is standard.</li>
<li><strong>Term & return</strong>, how long they hold the work, and who pays to ship it back.</li>
<li><strong>Insurance</strong>, the gallery should insure work in its care against damage and theft.</li>
<li><strong>Payment window</strong>, how many days after a sale you're paid (30 is common; push back on anything over 60).</li>
<li><strong>Discount authority</strong>, whether they can discount, and by how much, without asking you.</li>
<li><strong>Price list</strong>, your prices, agreed in writing, so there's no drift.</li></ul></div>
<h3>Quiet red flags</h3>
<ul><li>No mention of insurance, or liability pushed onto you.</li>
<li>Vague or missing return terms ("indefinitely").</li>
<li>Exclusive rights to <em>all</em> your work, not just the consigned pieces.</li>
<li>Payment "when convenient" instead of a defined window.</li></ul>
<p class="note">This is a guide to reading an agreement, not legal advice. For a long-term or high-value relationship, it's worth having an arts lawyer glance at the contract once.</p>`},

{cat:"galleries", kind:"Guide", id:"approaching-a-gallery", title:"Approaching a gallery", dek:"How to research the right fit and make an introduction that gets a reply.",
body:`<p>Most gallery rejections aren't about talent, they're about fit and timing. A little research and a respectful approach put you miles ahead of the mass emails galleries ignore.</p>
<h3>Research before you reach out</h3>
<ul><li>Does the gallery show work in your medium, scale, and sensibility?</li>
<li>Who do they already represent, and is there room for you, not a duplicate?</li>
<li>How do <em>they</em> say they want to be contacted? Follow it exactly.</li></ul>
<h3>Make it easy to say yes</h3>
<p>Galleries are busy. A strong first contact is short and complete:</p>
<ul><li>A warm, specific opening, why <em>this</em> gallery, referencing a show you saw.</li>
<li>One tight paragraph on who you are and what your work is about.</li>
<li>A link to a clean portfolio and your CV, not fifteen attachments.</li>
<li>A clear, low-pressure ask.</li></ul>
<div class="keybox"><h4>Before you hit send</h4><ul>
<li>Your website and images are current and professional.</li>
<li>Your statement, bio, and CV are ready to share.</li>
<li>You're contacting them the way they asked to be contacted.</li></ul></div>
<p class="note">Relationships beat cold emails. Openings, studio visits, and introductions from other artists open more doors than any single email ever will.</p>`},

{cat:"galleries", kind:"Guide", id:"tracking-work", title:"Tracking work out in the world", dek:"A system for knowing where every piece is, who has it, and when it's due back.",
body:`<p>The more your work travels, galleries, shows, consignments, loans, the easier it is to lose track. A simple system means you always know where every piece is without digging through emails.</p>
<h3>What to record for each piece</h3>
<ul><li>Title, year, medium, size, and price.</li>
<li>Its current <strong>status</strong> (in studio, on consignment, on loan, sold).</li>
<li>Its current <strong>location</strong>, and the specific gallery or collector when it's out.</li>
<li>Key dates: when it went out, and when it's due back.</li></ul>
<h3>Two axes, not one</h3>
<p>It helps to track <strong>status</strong> (is it available, sold, donated?) separately from <strong>location</strong> (where is it physically?). A piece can be <em>available</em> and <em>on consignment at a gallery</em> at the same time, one fact is about the sale, the other about the place.</p>
<div class="keybox"><h4>A few habits that prevent headaches</h4><ul>
<li>Update a piece's status the day it moves, not "later."</li>
<li>Photograph work before it leaves, and keep the receipt.</li>
<li>Set a reminder for return dates so nothing lingers past its term.</li></ul></div>
<p class="note">This is exactly what Allegory's inventory is built for, status, location, and the specific place, all in one view.</p>`},

// ---------------- OPPORTUNITIES ----------------
{cat:"opportunities", kind:"Guide", id:"finding-opps", title:"Finding open calls, grants & residencies", dek:"Where to look, how to vet them, and how to spot the ones worth your time.",
body:`<p>There's no shortage of opportunities, the skill is filtering the worthwhile ones from the time-wasters and the outright scams.</p>
<h3>Where to look</h3>
<ul><li>Dedicated listing sites and newsletters for open calls, grants, and residencies.</li>
<li>Your state or regional arts council and local arts organizations.</li>
<li>Museums, universities, and foundations in your discipline.</li>
<li>Other artists, word of mouth surfaces the good ones.</li></ul>
<h3>Vet before you apply</h3>
<div class="keybox"><h4>Green flags</h4><ul>
<li>A clear, reasonable (or no) application fee relative to what's offered.</li>
<li>A named jury or organization with a track record.</li>
<li>Transparent terms: what you get, what rights you keep, what's expected.</li></ul></div>
<p><strong>Be wary of</strong> high "entry fees" with vague prizes, anyone asking you to pay to be "exhibited" online, or contests that claim rights to your images. If the main product seems to be collecting fees, skip it.</p>
<h3>Choose where to spend your energy</h3>
<p>Weigh each opportunity by fit (is this for work like yours?), cost (fee + time), and payoff (money, exposure, connections). A handful of strong, well-targeted applications beats fifty scattershot ones.</p>
<p class="note">Allegory's Opportunity Finder helps surface calls that match your medium, region, and goals, a running shortlist instead of endless searching.</p>`},

{cat:"opportunities", kind:"Guide", id:"standout-application", title:"Writing an application that stands out", dek:"A structure for statements and project descriptions a reviewer will remember.",
body:`<p>Jurors read dozens, sometimes hundreds, of applications in one sitting. Yours wins by being <strong>clear, specific, and easy to follow</strong>, not by being clever.</p>
<h3>Answer the question they asked</h3>
<p>The most common reason strong artists get passed over: they submit a generic statement instead of responding to the specific prompt. Read the call twice. Mirror its language. Address exactly what it asks.</p>
<h3>A structure that works</h3>
<ol><li><strong>Open with the work</strong>, what it is and what it's about, in plain words.</li>
<li><strong>Connect to this opportunity</strong>, why you and this call fit.</li>
<li><strong>Be concrete</strong>, a specific project, timeline, or body of work, not vague ambition.</li>
<li><strong>Close with what you'll do with it</strong>, the impact of the grant, residency, or show.</li></ol>
<div class="keybox"><h4>Before you submit</h4><ul>
<li>Images are high-quality, correctly labeled, and in the requested format.</li>
<li>You've answered every part of the prompt, no more, no less.</li>
<li>Someone else has read it for clarity and typos.</li>
<li>You're comfortably inside the word and file limits.</li></ul></div>
<p class="note">Keep your strongest version of each answer on hand, most prompts are variations on the same few questions.</p>`},

{cat:"opportunities", kind:"Template", id:"application-calendar", title:"Build an application calendar", dek:"Plan backward from each deadline so a great opportunity never slips by.",
body:`<p>The best opportunities have the earliest deadlines. A simple calendar turns a stressful scramble into a steady rhythm you can actually keep.</p>
<h3>Capture everything in one place</h3>
<p>For each opportunity, record the <strong>deadline</strong>, the <strong>link</strong>, the <strong>fee</strong>, and what it requires (statement, images, CV, references). Seeing them side by side makes it obvious where to spend your energy.</p>
<h3>Plan backward from the due date</h3>
<p>Most missed deadlines are really missed <em>preparation</em>. Work backward:</p>
<div class="g-table-wrap"><table class="g-table">
<thead><tr><th>When</th><th>What</th></tr></thead>
<tbody>
<tr><td>Deadline</td><td>Submit, with a day to spare</td></tr>
<tr><td>3 days before</td><td>Final proofread; confirm formats &amp; limits</td></tr>
<tr><td>1 week before</td><td>Tailor your statement to this specific call</td></tr>
<tr><td>2 weeks before</td><td>Select &amp; prepare images; update CV</td></tr>
<tr><td>Add to calendar</td><td>The moment you decide to apply</td></tr>
</tbody></table></div>
<div class="keybox"><h4>Make it a habit</h4><ul>
<li>Add the deadline the day you find the opportunity, future-you forgets.</li>
<li>Set a reminder at the "1 week before" mark, not the deadline itself.</li>
<li>Review your upcoming deadlines once a week.</li></ul></div>
<p class="note">In Allegory, every opportunity carries its deadline, link, fee, and requirements, and surfaces on your dashboard as it approaches, the calendar builds itself.</p>`},

{cat:"opportunities", kind:"Guide", id:"reuse-materials", title:"Reuse your materials, the smart way", dek:"Keep one strong set of statements, images, and CVs, and tailor it fast to each call.",
body:`<p>Writing every application from scratch is the fastest way to burn out and miss deadlines. The pros keep a well-organized kit and adapt it, quickly, each time.</p>
<h3>Build your core kit once</h3>
<ul><li>A strong <strong>artist statement</strong> (long and short versions).</li>
<li>A current <strong>bio</strong> (50, 100, and 250-word versions).</li>
<li>An up-to-date <strong>CV/résumé</strong>.</li>
<li>A set of your <strong>best images</strong>, properly labeled and sized.</li></ul>
<h3>Tailor, don't rewrite</h3>
<p>For each application, start from your core version and make targeted edits: echo the call's language, foreground the most relevant project, and trim to their limits. Fifteen focused minutes beats two hours from a blank page.</p>
<div class="keybox"><h4>Keep versions, not chaos</h4><ul>
<li>Label each version clearly (statement, residency, statement, grant).</li>
<li>Note which version you sent where, so you can reuse and improve it.</li>
<li>Store everything in one place you can reach in seconds.</li></ul></div>
<p class="note">Allegory's Profile Vault keeps labeled, versioned statements, bios, and CVs, and can tailor them per opportunity, so your kit is always a click away.</p>`},

// ---------------- MATERIALS ----------------
{cat:"materials", kind:"Guide", id:"artist-statement", title:"Writing an artist statement you don't hate", dek:"A plain-language process for saying what your work is about, without the art-speak.",
body:`<p>A good artist statement sounds like <strong>you</strong>, explaining your work to an interested person, not like a press release written by committee. Here's how to get there.</p>
<h3>Answer three questions</h3>
<ol><li><strong>What do you make?</strong> Medium, subject, and approach, in plain terms.</li>
<li><strong>Why do you make it?</strong> The idea, question, or feeling behind the work.</li>
<li><strong>How do you make it?</strong> Process or materials, but only the parts that matter to the meaning.</li></ol>
<h3>Draft it like you'd say it</h3>
<p>Record yourself describing your work to a friend, then transcribe it. The spoken version is almost always clearer and warmer than what you'd force onto the page. Edit from there.</p>
<div class="keybox"><h4>Keep it honest</h4><ul>
<li>Use concrete words over abstract ones ("I paint the marshes near my home," not "I interrogate liminal spaces").</li>
<li>Cut any sentence you couldn't say out loud without wincing.</li>
<li>Write a long version (250–300 words) and a short one (2–3 sentences).</li></ul></div>
<p class="note">Your statement will evolve with your work, revisit it a couple of times a year, and keep the versions you like.</p>`},

{cat:"materials", kind:"Guide", id:"bio-cv", title:"Keep your bio & CV current", dek:"What belongs on each, how to format them, and a rhythm for keeping them up to date.",
body:`<p>Your bio and CV do different jobs. The bio introduces you warmly; the CV lists your record. Keeping both current means you're always ready when an opportunity appears.</p>
<h3>Your bio</h3>
<p>A short, third-person paragraph: who you are, what you make, where you're based, and a highlight or two (notable shows, education, awards). Keep a <strong>50-word</strong>, <strong>100-word</strong>, and <strong>250-word</strong> version on hand.</p>
<h3>Your CV (the artist's résumé)</h3>
<p>A dated, reverse-chronological record, usually including:</p>
<ul><li>Education</li><li>Solo exhibitions</li><li>Group exhibitions</li><li>Awards, grants & residencies</li><li>Press & publications</li><li>Collections (if applicable)</li></ul>
<div class="keybox"><h4>Formatting that reads cleanly</h4><ul>
<li>Be consistent: year, title, venue, city, same order every line.</li>
<li>List newest first within each section.</li>
<li>Only include sections you can fill; leave off the empty ones until you can.</li></ul></div>
<h3>Update it as you go</h3>
<p>Add each show, award, or mention <em>the week it happens</em>, while details are fresh. A CV updated continuously never needs a stressful rebuild before a deadline.</p>
<p class="note">Allegory's Profile Vault keeps versioned bios and CVs ready to export in the format each application wants.</p>`},

{cat:"materials", kind:"Guide", id:"tailoring-materials", title:"Tailoring materials per opportunity", dek:"Small, fast edits that make a general statement feel written for the specific call.",
body:`<p>A generic statement reads as generic, reviewers notice. The good news: a few targeted edits make your core materials feel custom without a full rewrite.</p>
<h3>Where small changes have big impact</h3>
<ul><li><strong>The opening line.</strong> Connect directly to this opportunity's theme or mission.</li>
<li><strong>The example you lead with.</strong> Foreground the project most relevant to <em>this</em> call.</li>
<li><strong>The vocabulary.</strong> Echo a few of the call's own words so it reads as a response, not a form letter.</li>
<li><strong>The length.</strong> Trim precisely to their limit, respecting it signals you read the brief.</li></ul>
<div class="keybox"><h4>A 15-minute tailoring pass</h4><ul>
<li>Re-read the prompt and underline its key words.</li>
<li>Swap your opening to reference this opportunity.</li>
<li>Reorder so the most relevant work comes first.</li>
<li>Cut to the word limit; proofread once.</li></ul></div>
<p class="note">Keep each tailored version, next time a similar call comes around, you're starting from something strong, not blank.</p>`},

{cat:"materials", kind:"Guide", id:"photographing-work", title:"Photographing your work", dek:"Clean, consistent, submission-ready images, even without a studio setup.",
body:`<p>For most opportunities, jurors judge your <em>images</em> before they ever see the real thing. Good documentation is one of the highest-return skills an artist can build.</p>
<h3>The fundamentals</h3>
<ul><li><strong>Light it evenly.</strong> Soft, diffused daylight or two matched lights at 45°, no glare, no harsh shadows.</li>
<li><strong>Shoot straight on.</strong> Camera centered and level with the work to avoid distortion.</li>
<li><strong>Neutral background.</strong> A clean wall or seamless backdrop; let the work be the subject.</li>
<li><strong>Get it sharp.</strong> A tripod (or steady surface) beats a more expensive camera held by hand.</li></ul>
<h3>Prep the files</h3>
<ul><li>Color-correct so the image matches the real piece, especially whites and skin tones.</li>
<li>Crop cleanly to the edges of the work (unless a detail shot is intended).</li>
<li>Export at the size and format each application asks for, and keep a high-res master.</li></ul>
<div class="keybox"><h4>Label like a pro</h4><ul>
<li>Name files consistently: <em>Lastname_Title_Year_Medium_Size.jpg</em>.</li>
<li>Keep both a web-size and a print-size version of every piece.</li></ul></div>
<p class="note">Phone cameras are more than good enough now, it's the light, the angle, and the care that make an image look professional.</p>`},

// ---------------- BUSINESS ----------------
{cat:"business", kind:"Guide", id:"studio-finances", title:"Set up simple studio finances", dek:"The handful of numbers worth tracking so tax season is a review, not a scramble.",
body:`<p>You don't need accounting software built for corporations. You need a few simple habits that keep your studio's money legible all year.</p>
<h3>Separate studio money from personal money</h3>
<p>The single highest-leverage move: a <strong>dedicated bank account (and ideally a card)</strong> for the studio. Every sale goes in; every supply, fee, and expense goes out. Now your statement <em>is</em> most of your bookkeeping.</p>
<h3>Track four things</h3>
<ul><li><strong>Income</strong>, sales, commissions, grants, teaching.</li>
<li><strong>Expenses</strong>, materials, framing, fees, shipping, studio rent.</li>
<li><strong>What you've set aside</strong>, for taxes and sales tax.</li>
<li><strong>What you're owed</strong>, unpaid invoices.</li></ul>
<div class="keybox"><h4>A 20-minute weekly habit</h4><ul>
<li>Log the week's sales and expenses while you remember them.</li>
<li>Move tax money to its separate bucket.</li>
<li>Glance at any unpaid invoices and nudge if needed.</li></ul></div>
<p class="note">Allegory turns this into a live profit-and-loss view, so you can see your month at a glance instead of rebuilding it in April.</p>`},

{cat:"business", kind:"Guide", id:"expenses-pl", title:"Expenses & your P&L, demystified", dek:"What counts, how to log it in a minute, and reading your month at a glance.",
body:`<p>"Profit and loss" sounds corporate, but it's just a plain answer to two questions: what came in, and what went out. For an artist, that picture is genuinely useful.</p>
<h3>What counts as a studio expense</h3>
<ul><li>Materials and supplies</li><li>Framing, printing, and fabrication</li><li>Studio rent and utilities</li><li>Application and gallery fees</li><li>Shipping and crating</li><li>Marketing, website, and software</li><li>Professional photography</li></ul>
<p>If it's an ordinary, necessary cost of making or selling your work, it probably belongs here, and may be deductible.</p>
<h3>Log it in the moment</h3>
<p>The trick isn't a fancy system, it's capturing the expense when it happens. A photo of the receipt and a one-line note beats a shoebox you dread every spring.</p>
<div class="keybox"><h4>What your P&L tells you</h4><ul>
<li>Whether a body of work actually paid for itself.</li>
<li>Where your money really goes (often framing and fees surprise people).</li>
<li>What you'll owe at tax time, no guessing.</li></ul></div>
<p class="note">A live P&L also helps you price: if you can see your true costs per piece, you can set prices that respect them.</p>`},

{cat:"business", kind:"Guide", id:"tax-time", title:"Tax time for artists", dek:"Deductions you're probably missing and the records to keep year-round.",
body:`<p>Taxes are far less painful when the work is spread across the year instead of crammed into one dreadful week. Mostly, that means keeping records as you go.</p>
<h3>Deductions artists often miss</h3>
<ul><li>A portion of home/studio space used exclusively for work.</li>
<li>Materials, framing, and fabrication.</li>
<li>Application, entry, and gallery fees.</li>
<li>Shipping, travel to shows, and mileage.</li>
<li>Website, software, and professional photography.</li>
<li>Education, workshops, classes, relevant books.</li></ul>
<h3>Keep these all year</h3>
<div class="keybox"><h4>Your year-round record</h4><ul>
<li>Receipts for every expense (a photo is fine).</li>
<li>A log of income by source.</li>
<li>Sales tax collected and remitted.</li>
<li>Mileage and travel tied to the studio.</li></ul></div>
<h3>Set money aside</h3>
<p>If you're selling as a self-employed artist, no one is withholding taxes for you. A common habit is moving <strong>25–30% of net income</strong> into a separate account as it comes in, so the bill is already covered.</p>
<p class="note">This is general information, not tax advice. An accountant who knows creative businesses is one of the best investments an artist can make, usually once a year is plenty.</p>`},

{cat:"business", kind:"Guide", id:"need-studio-manager", title:"Do you need a studio manager?", dek:"The signs you've outgrown doing it all yourself, and the budget-friendly middle ground.",
body:`<p>Many artists hit a point where the admin, inventory, invoices, applications, follow-ups, starts eating the time they should spend making work. That's a good problem. The question is what to do about it.</p>
<h3>Signs you've outgrown DIY</h3>
<ul><li>You've missed deadlines or lost track of where work is.</li>
<li>Invoices go out late, or not at all.</li>
<li>You spend more evenings on spreadsheets than in the studio.</li>
<li>Opportunities slip by because prep feels overwhelming.</li></ul>
<h3>The options, honestly</h3>
<p>A part-time <strong>studio manager</strong> can cost anywhere from a few hundred to over a thousand dollars a month depending on hours, real money for most artists. Hiring one makes sense once the admin reliably exceeds what tools can handle and the work is worth that investment.</p>
<div class="keybox"><h4>The middle ground</h4><ul>
<li>Systematize first: one place for inventory, sales, deadlines, and contacts.</li>
<li>Automate the repetitive parts (reminders, invoice follow-ups, opportunity tracking).</li>
<li>Bring in help for the specific things software can't do, not everything.</li></ul></div>
<p class="note">This is exactly the gap Allegory was built to fill: the organization and reminders of a studio manager, at a fraction of the cost, until (and after) you're ready to hire.</p>`},

// ---------------- MARKETING ----------------
{cat:"marketing", kind:"Guide", id:"mailing-list", title:"Start (and keep) a mailing list", dek:"Why email beats the algorithm, and how to grow a list of people who actually buy.",
body:`<p>Social platforms rent you an audience and change the rules whenever they like. A mailing list is an audience you <strong>own</strong>, and it's where most art actually sells.</p>
<h3>Why email wins</h3>
<ul><li>It reaches everyone who signed up, not the fraction an algorithm chooses.</li>
<li>The people on it asked to hear from you, they're your warmest buyers.</li>
<li>It's yours forever, independent of any platform.</li></ul>
<h3>Grow it the honest way</h3>
<ul><li>Put a simple sign-up on your website and link it everywhere.</li>
<li>Collect emails at shows, openings, and studio visits.</li>
<li>Offer a real reason to join, first look at new work, early access, studio notes.</li></ul>
<div class="keybox"><h4>Collector-list hygiene</h4><ul>
<li>Tag past buyers, they're your most valuable segment.</li>
<li>Note what each collector has bought or admired.</li>
<li>Never buy a list; permission is the whole point.</li></ul></div>
<p class="note">A list of 200 engaged collectors is worth more than 20,000 anonymous followers.</p>`},

{cat:"marketing", kind:"Guide", id:"newsletter", title:"Write a newsletter people read", dek:"A simple cadence and structure that keeps collectors opening, and clicking.",
body:`<p>The best artist newsletters feel like a note from a friend who happens to make beautiful things, not a sales blast. That's what keeps people opening them.</p>
<h3>Find a cadence you can keep</h3>
<p>Consistency beats frequency. <strong>Once a month</strong> you'll actually send is far better than a weekly plan you abandon. Pick a rhythm that fits your studio life.</p>
<h3>A simple structure</h3>
<ol><li><strong>A short, personal opening</strong>, what's happening in the studio.</li>
<li><strong>One piece of new work</strong>, an image and a sentence or two about it.</li>
<li><strong>Something human</strong>, a process photo, a show you saw, what you're reading.</li>
<li><strong>One clear next step</strong>, "see it here," "reply to visit the studio," "available now."</li></ol>
<div class="keybox"><h4>What keeps people subscribed</h4><ul>
<li>Lead with the work and the story, not the ask.</li>
<li>Let your real voice come through, personality is the point.</li>
<li>One strong image beats five small ones.</li>
<li>Make it easy to reply; conversations become sales.</li></ul></div>
<p class="note">Sell in maybe one of every three sends. The rest build the relationship that makes the selling work.</p>`},

{cat:"marketing", kind:"Guide", id:"social-media", title:"Social media without the burnout", dek:"A sustainable rhythm that fits around studio time instead of eating it.",
body:`<p>Social media can genuinely help your practice, or quietly consume it. The difference is treating it as one tool on your terms, not an obligation that runs your week.</p>
<h3>Pick one platform and do it well</h3>
<p>You don't need to be everywhere. Choose the one place your audience actually is, and where you enjoy showing up enough to be consistent. One platform done sustainably beats four done resentfully.</p>
<h3>Make it repeatable</h3>
<ul><li><strong>Batch it.</strong> Photograph and draft several posts in one studio session.</li>
<li><strong>Keep a short list of post types</strong> you can rotate: new work, process, a detail, behind-the-scenes, a shipped sale.</li>
<li><strong>Schedule</strong> so posting doesn't interrupt studio flow.</li></ul>
<div class="keybox"><h4>Protect your energy</h4><ul>
<li>Set a time box, post and engage, then close the app.</li>
<li>Measure what matters (sales, inquiries, list sign-ups), not just likes.</li>
<li>Move your best followers to your mailing list, which you own.</li></ul></div>
<p class="note">Social media is a front door, not the house. Use it to invite people somewhere you control, your list, your site, your studio.</p>`},

{cat:"marketing", kind:"Guide", id:"repeat-collector", title:"Turn a buyer into a repeat collector", dek:"The small follow-up habits that build the relationships behind a sustainable practice.",
body:`<p>Your next sale is far more likely to come from someone who's already bought than from a stranger. Repeat collectors are the quiet engine of a lasting practice, and they're built through attention, not luck.</p>
<h3>The first sale is the beginning</h3>
<ul><li>Send a genuine thank-you and the care details for the piece.</li>
<li>A few weeks later, check that they're happy with it in place.</li>
<li>Keep a record of what they bought and what drew them to it.</li></ul>
<h3>Stay in touch without selling</h3>
<p>Give collectors a <strong>first look</strong> at new work before it goes public. Invite them to studio visits and openings. Remember the details, the series they loved, the room the piece hangs in. People collect from artists they feel connected to.</p>
<div class="keybox"><h4>A simple collector CRM</h4><ul>
<li>Record each collector, what they bought, and when.</li>
<li>Note preferences and any follow-up to make.</li>
<li>Reach out when you have something you know they'd love.</li></ul></div>
<p class="note">Allegory's contacts keep your collectors, their history, and your follow-ups in one place, so the right person hears about the right piece.</p>`},

// ---------------- TEMPLATES ----------------
{cat:"templates", kind:"Spreadsheet", id:"inventory-starter", title:"Inventory starter", dek:"Catalogue every piece, title, year, medium, size, price, and status, in one tidy sheet.",
body:`<p>Every organized studio starts with one reliable list of what exists. Copy this structure into a spreadsheet (or let Allegory keep it for you) and you'll always know what you have and where it is.</p>
<h3>The columns to include</h3>
<div class="g-table-wrap"><table class="g-table">
<thead><tr><th>Title</th><th>Year</th><th>Medium</th><th>Size</th><th>Price</th><th>Status</th><th>Location</th></tr></thead>
<tbody>
<tr><td>Marsh, Morning</td><td>2026</td><td>Oil on linen</td><td>24 × 30 in</td><td>$2,400</td><td>Available</td><td>In studio</td></tr>
<tr><td>Low Tide II</td><td>2025</td><td>Oil on panel</td><td>16 × 20 in</td><td>$1,100</td><td>Available</td><td>On consignment, Blue Door Gallery</td></tr>
<tr><td>Study, Reeds</td><td>2025</td><td>Watercolor</td><td>9 × 12 in</td><td>$450</td><td>Sold</td><td>Private collection</td></tr>
</tbody></table></div>
<div class="keybox"><h4>Two tips that make it last</h4><ul>
<li>Track <strong>status</strong> (available / sold / donated / NFS) separately from <strong>location</strong> (in studio / on consignment / on loan / in gallery). A piece can be available <em>and</em> at a gallery.</li>
<li>Add a piece the moment it's finished, and update it the moment it moves.</li></ul></div>
<p class="note">This is the backbone of Allegory's Inventory Manager, including an image for each piece, and one-click portfolio and label exports.</p>`},

{cat:"templates", kind:"Document", id:"consignment-agreement", title:"Consignment agreement", dek:"A clear, artist-friendly agreement you can adapt for each gallery or shop.",
body:`<p>A short written agreement protects both you and the gallery. Here's a plain-language skeleton to adapt, covering the points that prevent nearly every consignment dispute.</p>
<h3>Sections to include</h3>
<ul><li><strong>The parties & date</strong>, artist, gallery, and when the agreement starts.</li>
<li><strong>The works</strong>, a list: title, year, medium, size, and retail price of each piece.</li>
<li><strong>Ownership</strong>, the artist retains ownership until a piece sells.</li>
<li><strong>Commission</strong>, the gallery's percentage of each sale (e.g., 50%).</li>
<li><strong>Term</strong>, how long the gallery holds the work, and who pays return shipping.</li>
<li><strong>Insurance</strong>, the gallery insures the work against loss or damage in its care.</li>
<li><strong>Pricing & discounts</strong>, prices are set in writing; discounts beyond X% need the artist's approval.</li>
<li><strong>Payment</strong>, the artist is paid within [30] days of a sale.</li>
<li><strong>Signatures</strong>, both parties sign and keep a copy.</li></ul>
<div class="keybox"><h4>Sample clause, payment</h4><ul>
<li><em>"The Gallery shall remit the Artist's share (50% of the retail price) within thirty (30) days of receiving payment for any sold Work, along with the name of the purchaser."</em></li></ul></div>
<p class="note"><strong>Important:</strong> this is a sample starting point, not legal advice. For high-value or long-term relationships, have an arts attorney review your agreement. Allegory can generate consignment agreements and statements from your inventory.</p>`},

{cat:"templates", kind:"Worksheet", id:"pricing-worksheet", title:"Pricing worksheet", dek:"Plug in your numbers and get to a consistent, defensible price every time.",
body:`<p>Use this worksheet to turn a vague "what should this cost?" into a number you can repeat across every piece and every sales channel.</p>
<h3>Step 1, Your base formula</h3>
<div class="g-table-wrap"><table class="g-table">
<thead><tr><th>Input</th><th>Example</th></tr></thead>
<tbody>
<tr><td>Height + Width (inches)</td><td>24 + 30 = 54</td></tr>
<tr><td>× Your $-per-inch</td><td>× $18</td></tr>
<tr><td>= Size value</td><td>$972</td></tr>
<tr><td>+ Materials &amp; framing</td><td>+ $130</td></tr>
<tr><td>= Base price</td><td><strong>$1,102</strong></td></tr>
</tbody></table></div>
<h3>Step 2, Make the split work</h3>
<p>If you sell through a gallery at 50%, your retail price needs to be set so you still net what you need, and it must be <strong>the same price everywhere</strong>. Round to a clean number (here, $1,200).</p>
<h3>Step 3, Sanity-check</h3>
<div class="keybox"><h4>Before you lock it in</h4><ul>
<li>Does it line up with your other pieces by size?</li>
<li>Is it in range for artists at your stage, medium, and region?</li>
<li>Would the same price hold up in a gallery <em>and</em> direct from your studio?</li></ul></div>
<p class="note">Pick a $-per-inch and keep it steady across a body of work. Raise it deliberately as demand grows, Allegory's smart pricing tool helps you set and hold a consistent system.</p>`},

{cat:"templates", kind:"Worksheet", id:"statement-worksheet", title:"Artist statement worksheet", dek:"Prompts that turn scattered notes into a finished statement you're proud of.",
body:`<p>A blank page is the enemy of a good statement. Answer these prompts in plain, honest sentences, then stitch the best bits together and edit for flow.</p>
<h3>Answer these out loud, then write them down</h3>
<ul><li><strong>What do you make?</strong> If you had ten seconds to tell a stranger, what would you say?</li>
<li><strong>What is it about?</strong> The idea, question, place, or feeling underneath the work.</li>
<li><strong>Why this, why now?</strong> What pulls you to this subject at this point in your life?</li>
<li><strong>How do you make it?</strong> The process or materials, but only where they shape the meaning.</li>
<li><strong>What do you want a viewer to feel or notice?</strong></li></ul>
<h3>Assemble it</h3>
<ol><li>Open with your clearest answer to "what do you make?"</li>
<li>Follow with the "what is it about", the heart of the statement.</li>
<li>Add just enough process to ground it.</li>
<li>Close with what you hope it offers a viewer.</li></ol>
<div class="keybox"><h4>Then edit</h4><ul>
<li>Cut art-speak and anything you couldn't say aloud.</li>
<li>Make a long version (250–300 words) and a short one (2–3 sentences).</li>
<li>Read it to someone who doesn't know your work, does it land?</li></ul></div>
<p class="note">Keep your statement versions labeled and current in Allegory's Profile Vault, ready to tailor for each opportunity.</p>`},
];

export const catById = (id: string): ResCat | undefined => CATS.find((c) => c.id === id);
export const guideBySlug = (slug: string): ResGuide | undefined => GUIDES.find((g) => g.id === slug);
export const readMinutes = (html: string): number =>
  Math.max(2, Math.round(html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length / 200));
