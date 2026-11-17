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
  title: string; // H1 + card title
  dek: string; // card subtitle / teaser
  body: string; // main HTML (sections); short answer, FAQ, CTA and keep-reading are separate
  // SEO/GEO fields (optional). When present, the guide page uses them; the older
  // guides without them fall back to sensible defaults.
  titleTag?: string; // full <title>, e.g. "How Art Consignment Works … | Allegory Art Studio"
  metaDescription?: string; // meta + og description
  shortAnswer?: string; // 40–60 word answer shown right under the H1 (AI/Google quote this)
  faqs?: { q: string; a: string }[]; // renders the visible FAQ AND the FAQPage JSON-LD (one source)
  keepReading?: { title: string; href: string }[]; // explicit "Keep reading" links
  cta?: string; // closing CTA sentence (before the trial button)
  updated?: string; // "Last updated" date, ISO (YYYY-MM-DD)
  disclaimer?: string; // one-line note for tax/legal/money pages
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
{cat:"pricing", kind:"Guide", id:"how-to-price", title:"How to price your artwork",
dek:"A simple, repeatable formula, worked examples, and how to know when it's time to raise your prices.",
titleTag:"How to Price Your Artwork: A Simple Formula | Allegory Art Studio",
metaDescription:"A repeatable way to price your art by size, with worked examples, how to check it against costs and the market, and when to raise your prices.",
updated:"2026-11-17",
shortAnswer:"Most working artists price by size. Add the height and width in inches, multiply by a per-inch rate, then add the cost of materials and framing. Newer artists often start at $2 to $6 per inch. Check the result against your costs, your time and what similar artists charge, and use the same formula across your work.",
body:`<h2>The size-based pricing formula</h2>
<p>Pricing by feel leads to prices that don't match each other, and collectors notice. A formula gives every piece a price you can explain.</p>
<div class="keybox"><h4>Formula</h4><ul>
<li><strong>(height + width in inches) × your rate per inch + materials and framing</strong></li>
<li>Start between $2 and $6 per inch if you're early in your career, and raise the rate as your sales history grows.</li></ul></div>
<h3>Two worked examples</h3>
<p>Both use a rate of $4 per inch.</p>
<div class="g-table-wrap"><table class="g-table">
<thead><tr><th>Size</th><th>Height + width</th><th>× $4 per inch</th><th>Materials and framing</th><th>Price</th></tr></thead>
<tbody>
<tr><td>16 × 20 in</td><td>36 in</td><td>$144</td><td>$60</td><td>$204</td></tr>
<tr><td>30 × 40 in</td><td>70 in</td><td>$280</td><td>$120</td><td>$400</td></tr>
</tbody></table></div>
<p>Many artists round to a clean number, such as $200 and $400. The point is that a larger piece always costs more, by a predictable amount.</p>
<p>Want to skip the math? The free <a href="/pricing-calculator">art pricing calculator</a> runs it for you and shows what you keep after a gallery's commission.</p>
<h2>Check your price against three things</h2>
<h3>Your costs</h3>
<p>Materials, framing, shipping and a gallery's commission all have to fit inside the price. If a gallery takes 50%, a $400 price leaves you $200. See <a href="/resources/gallery-splits">understanding gallery splits</a>.</p>
<h3>Your time</h3>
<p>Compare the price to the hours the piece took. A 40-hour painting priced at $400 pays $10 an hour before costs.</p>
<h3>The market</h3>
<p>Look at what artists at a similar career stage, in your medium and region, sell for. You don't need to match them, but you should be able to explain a big gap.</p>
<h2>Keep prices the same everywhere</h2>
<p>A piece should cost the same in your studio, online and in a gallery. Selling for less on your own undercuts the gallery and teaches collectors to skip it.</p>
<h2>When and how to raise your prices</h2>
<p>Prices should go up over time, not down. Regular discounts teach collectors to wait for the next one. Signs it's time to raise them:</p>
<ul>
<li>Work sells steadily, or you have a waitlist</li>
<li>You've had a notable show, award or press</li>
<li>Your material costs have gone up</li>
</ul>
<p>Raise in measured steps, often 10 to 25% at a time. Apply the new per-inch rate to new work rather than repricing everything at once.</p>`,
faqs:[
{q:"How do I price my art as a beginner?",a:"Use a size-based formula: height plus width in inches, times $2 to $6 per inch, plus materials and framing. Check the result against your costs and similar artists, then keep it consistent."},
{q:"Should I price my art by the hour?",a:"Use hours as a check, not the formula. Pricing purely by time means a slow piece costs more than a quick one of the same size, which confuses collectors."},
{q:"How much should I charge for a painting?",a:"It depends on size, medium and your sales history. Run your sizes through the formula above, or use the free art pricing calculator."},
{q:"How often should artists raise their prices?",a:"When work sells steadily or demand grows, usually in steps of 10 to 25%. Many artists review prices once a year."},
{q:"Should my prices be different in a gallery and in my studio?",a:"No. Keep the same retail price everywhere so you don't undercut the gallery."},
],
keepReading:[
{title:"Art pricing calculator",href:"/pricing-calculator"},
{title:"Understanding gallery splits",href:"/resources/gallery-splits"},
{title:"Free art invoice template",href:"/resources/invoices-paid"},
],
cta:"Allegory Art Studio keeps your prices, sizes and sales history together, so every new piece is priced the same way.",
},

{cat:"pricing", kind:"Guide", id:"invoices-paid", title:"Invoices that actually get paid", dek:"Deposits, terms, and the follow-up that closes the gap between a sale and the deposit in your account.",
body:`<p>A sale isn't finished when someone says yes, it's finished when the money lands. A clear invoice and a calm follow-up routine are what get you there.</p>
<h2>What every invoice needs</h2>
<ul><li>Your name/business, the buyer's name, and the date.</li>
<li>The work: title, year, medium, dimensions, and the price.</li>
<li>Any tax, shipping, or framing as separate line items.</li>
<li><strong>Payment terms</strong> ("Due on receipt," or "Net 15") and <strong>how to pay</strong>.</li>
<li>An invoice number, so you can reference it later.</li></ul>
<h2>Take a deposit on commissions</h2>
<p>For commissioned or made-to-order work, ask for <strong>30–50% up front</strong> before you begin, with the balance due before delivery. A deposit confirms the client is serious and protects your time if plans change.</p>
<h2>Follow up without the awkwardness</h2>
<p>Late payment is usually forgetfulness, not refusal. A simple sequence keeps it professional:</p>
<ol><li><strong>Day the balance is due:</strong> a friendly "just a reminder, here's the invoice again."</li>
<li><strong>One week later:</strong> a short, warm nudge.</li>
<li><strong>Two weeks:</strong> a direct note with the due date and payment link, offering to help if there's an issue.</li></ol>
<div class="keybox"><h4>The quiet rule</h4><ul><li>Don't release or ship the work until payment (or the agreed deposit) has cleared.</li></ul></div>`},

{cat:"pricing", kind:"Guide", id:"gallery-splits", title:"Gallery commission: what the split covers and how to price for it",
dek:"What a 40–50% commission really covers, and how to price so a split still leaves you whole.",
titleTag:"Gallery Commission: What a 40–50% Split Covers | Allegory Art Studio",
metaDescription:"How much galleries take from art sales, what the commission pays for, and how to set prices so you still earn what you need from each piece.",
updated:"2026-11-17",
shortAnswer:"Most galleries take a 40 to 50% commission on each sale. That pays for their space, staff, marketing, openings and collector relationships. To make the split work, decide what you need to earn from a piece, then set the retail price so your share covers it. At 50%, that means doubling what you need.",
body:`<h2>How much do galleries take?</h2>
<p>The standard commission is 40 to 50% of the retail price. Some shops, cafes and co-op spaces take less. Whatever the rate, it should be in your <a href="/resources/consignment-agreement">consignment agreement</a>, along with whether framing and shipping come out before the split.</p>
<h2>What the commission pays for</h2>
<ul>
<li>The space, lighting and staff who show your work</li>
<li>Time spent with collectors, and the relationships the gallery already has</li>
<li>Marketing, openings and art fairs</li>
</ul>
<p>The commission pays for sales you couldn't make alone. It isn't money taken out of a sale you would have made anyway.</p>
<h2>How to price so the split still works</h2>
<h3>Work back from what you need to earn</h3>
<p>Decide the amount you need from a piece, then divide by your share.</p>
<div class="g-table-wrap"><table class="g-table">
<thead><tr><th>You need to earn</th><th>Gallery takes 40%</th><th>Gallery takes 50%</th></tr></thead>
<tbody>
<tr><td>$600</td><td>Retail price $1,000</td><td>Retail price $1,200</td></tr>
<tr><td>$1,000</td><td>Retail price about $1,667</td><td>Retail price $2,000</td></tr>
</tbody></table></div>
<p>The formula: retail price = what you need ÷ (1 − commission rate). The <a href="/pricing-calculator">art pricing calculator</a> shows this for any rate.</p>
<h3>Use the same price for direct sales</h3>
<p>A piece that's $2,000 in the gallery is $2,000 in your studio, not $1,000. You keep more when you sell directly, and the gallery isn't undercut.</p>
<h2>Questions to ask before you agree to a split</h2>
<ul>
<li>Is the commission on the retail price before or after framing and shipping?</li>
<li>Who covers a discount the gallery offers a buyer?</li>
<li>Does the gallery take a commission on sales you make yourself, such as studio visits from people who saw your work there?</li>
<li>How soon after a sale do you get paid?</li>
</ul>
<p>For the full list, see <a href="/resources/reading-consignment-agreement">reading a consignment agreement</a>.</p>`,
faqs:[
{q:"What percentage do art galleries take?",a:"Most take 40 to 50% of the retail price. Smaller shops, cafes and co-ops sometimes take less."},
{q:"Is a 50% gallery commission fair?",a:"It's standard for established galleries, because they cover space, staff, marketing and collector relationships. Make sure the agreement also covers insurance and payment timing."},
{q:"How do I price my art for a gallery?",a:"Decide what you need to earn, then divide by your share. At a 50% commission, the retail price is double what you need."},
{q:"Should my studio prices be lower than my gallery prices?",a:"No. Keep one retail price everywhere so you don't undercut the gallery or confuse collectors."},
],
keepReading:[
{title:"How to price your artwork",href:"/resources/how-to-price"},
{title:"Free art consignment agreement",href:"/resources/consignment-agreement"},
{title:"Reading a consignment agreement",href:"/resources/reading-consignment-agreement"},
],
cta:"Allegory Art Studio shows what you keep from each sale, so a gallery split never surprises you.",
},

{cat:"pricing", kind:"Guide", id:"sales-tax", title:"Sales tax for artists, plainly",
dek:"When you need to collect it, how to get a seller's permit, and how much to set aside.",
titleTag:"Sales Tax for Artists: When to Collect It | Allegory Art Studio",
metaDescription:"Do artists charge sales tax on art? When you need to collect it, how to get a seller's permit, and a simple way to track and set aside what you owe.",
updated:"2026-11-17",
shortAnswer:"In most US states, when you sell physical artwork directly to a buyer, you need to collect sales tax and pay it to the state. When a gallery sells your work, the gallery usually handles the tax. Register for a seller's permit, add tax on top of your price, and set it aside until you file.",
body:`<h2>Do artists have to charge sales tax?</h2>
<p>Usually yes, for physical work you sell directly: from your studio, at a fair or market, or through your own website. Rules, rates and exemptions vary by state, and sometimes by city or county.</p>
<p>When a gallery or shop sells your work, it usually collects and remits the tax. Confirm this in your <a href="/resources/consignment-agreement">consignment agreement</a>.</p>
<h2>Three steps to handle sales tax</h2>
<ol>
<li><strong>Register.</strong> Get a seller's permit from your state. It's often free and done online.</li>
<li><strong>Collect.</strong> Charge the correct rate on direct sales. Tax is added to your price, not taken out of it.</li>
<li><strong>Set aside and file.</strong> Pay the state on its schedule, which may be monthly, quarterly or yearly. The tax you collect was never your money.</li>
</ol>
<h2>Make it painless</h2>
<ul>
<li>Show tax as its own line on every invoice. The free <a href="/resources/invoices-paid">art invoice template</a> has a line for it.</li>
<li>Move collected tax into a separate savings account as soon as it comes in.</li>
<li>Keep a running log of tax collected and paid.</li>
</ul>`,
disclaimer:"This is general guidance, not tax advice. Rules differ by state and change over time. One conversation with an accountant can save a lot of worry.",
faqs:[
{q:"Do I charge sales tax when I sell my art?",a:"In most US states, yes, for physical work sold directly to the final buyer. Check your state's rules."},
{q:"Do I charge sales tax if a gallery sells my work?",a:"Usually not. The gallery collects and remits the tax on its sales. Confirm it in your agreement."},
{q:"Do I need a seller's permit to sell art?",a:"Most states require one before you collect sales tax. It's often free and available online."},
{q:"Is sales tax included in my art price?",a:"No. Add it on top of the price and show it as a separate line on the invoice."},
],
keepReading:[
{title:"Free art invoice template",href:"/resources/invoices-paid"},
{title:"Tax time for artists",href:"/resources/tax-time"},
{title:"Set up simple studio finances",href:"/resources/studio-finances"},
],
cta:"Allegory Art Studio logs each sale with its tax, so filing time is a total rather than a search.",
},

// ---------------- GALLERIES ----------------
{cat:"galleries", kind:"Guide", id:"how-consignment-works", title:"How art consignment works",
dek:"Who owns the piece, who insures it, when you get paid, and how consignment compares with selling outright.",
titleTag:"How Art Consignment Works: A Plain Guide for Artists | Allegory Art Studio",
metaDescription:"How consigning art to a gallery works: who owns the work, who insures it, when you get paid, and how consignment compares with selling outright.",
updated:"2026-11-17",
shortAnswer:"Art consignment means a gallery or shop displays and sells your work while you keep ownership. When a piece sells, the gallery keeps an agreed commission, usually 40 to 50% of the retail price, and pays you the rest. Unsold work comes back to you when the agreed term ends.",
body:`<h2>The essentials</h2>
<ul>
<li><strong>You keep ownership</strong> until a piece sells. The work is not the gallery's property.</li>
<li><strong>The gallery earns a commission</strong> only when a piece sells, typically 40 to 50% of the retail price. See <a href="/resources/gallery-splits">understanding gallery splits</a>.</li>
<li><strong>Unsold work comes back</strong> to you when the term ends.</li>
</ul>
<h2>Consignment vs. outright sale vs. commissioned work</h2>
<p>Three arrangements get confused because they share words. This table is the part AI tools and Google are most likely to quote.</p>
<div class="g-table-wrap"><table class="g-table">
<thead><tr><th></th><th>Consignment</th><th>Outright sale</th><th>Commissioned work</th></tr></thead>
<tbody>
<tr><td><strong>Who owns the work</strong></td><td>You, until it sells</td><td>The buyer or gallery, once paid</td><td>The client, once paid in full</td></tr>
<tr><td><strong>When you get paid</strong></td><td>After the piece sells, minus the commission</td><td>Up front, at the agreed price</td><td>A deposit up front, the balance on delivery</td></tr>
<tr><td><strong>Who carries the risk if it doesn't sell</strong></td><td>You</td><td>The buyer or gallery</td><td>No risk: the piece is made to order</td></tr>
<tr><td><strong>What "commission" means</strong></td><td>The gallery's cut, usually 40 to 50%</td><td>Not used</td><td>The job itself</td></tr>
<tr><td><strong>Paperwork</strong></td><td>Consignment agreement</td><td>Invoice or bill of sale</td><td>Commission contract</td></tr>
</tbody></table></div>
<p>Galleries usually buy outright only from established artists, often at a wholesale price around half of retail. Consignment is how most working artists place work. Start from the free <a href="/resources/consignment-agreement">consignment agreement</a> or the <a href="/resources/invoices-paid">art invoice template</a>.</p>
<h2>What to agree on before work leaves your studio</h2>
<ol>
<li><strong>Insurance:</strong> who covers the work while the gallery holds it.</li>
<li><strong>Term:</strong> how long the gallery keeps the work, and who pays return shipping.</li>
<li><strong>Payment:</strong> how many days after a sale you get paid. 30 is common.</li>
<li><strong>Pricing:</strong> whether the gallery can discount without your approval, and your minimum price.</li>
</ol>
<p>Put all four in writing. The free <a href="/resources/consignment-agreement">consignment agreement</a> covers each one, and <a href="/resources/reading-consignment-agreement">reading a consignment agreement</a> explains what to look for in a gallery's own contract.</p>
<h2>Keep your own record</h2>
<p>Photograph each piece before it leaves, get a signed receipt, and log where it is and when it is due back. <a href="/resources/tracking-work">Tracking work out in the world</a> has a simple system.</p>`,
faqs:[
{q:"How does consigning art to a gallery work?",a:"You deliver work to the gallery under a written agreement. The gallery shows and sells it, keeps an agreed commission from each sale, and pays you the rest. You keep ownership until a piece sells."},
{q:"Is consignment better than selling art outright?",a:"Selling outright gets you paid sooner and moves the risk to the buyer, but galleries usually buy outright only from established artists, at a lower price. Consignment earns more per sale and is how most working artists place work."},
{q:"What percentage does a gallery take on consigned art?",a:"Most galleries take 40 to 50% of the retail price. Shops, cafes and co-ops sometimes take less."},
{q:"What happens to consigned art that doesn't sell?",a:"It comes back to you at the end of the agreed term. The agreement should say how quickly and who pays to ship it."},
],
keepReading:[
{title:"Free art consignment agreement",href:"/resources/consignment-agreement"},
{title:"Reading a consignment agreement",href:"/resources/reading-consignment-agreement"},
{title:"Understanding gallery splits",href:"/resources/gallery-splits"},
],
cta:"Allegory Art Studio tracks every consigned piece: where it is, what it's priced at and when it's due back.",
},

{cat:"galleries", kind:"Checklist", id:"reading-consignment-agreement", title:"How to read a consignment agreement: a checklist for artists",
dek:"The clauses that matter, the red flags, and the questions to ask before you sign.",
titleTag:"Consignment Agreement Checklist for Artists | Allegory Art Studio",
metaDescription:"What to look for before you sign a gallery's consignment agreement: the clauses that matter, the red flags, and the questions to ask.",
updated:"2026-11-17",
shortAnswer:"Before you sign a gallery's consignment agreement, check six things: the commission rate, the term and return terms, insurance, how soon you get paid, whether the gallery can discount, and the agreed prices. Watch for missing insurance, vague return dates, exclusivity over all your work, and payment “when convenient.”",
body:`<h2>The six clauses to check</h2>
<div class="g-table-wrap"><table class="g-table">
<thead><tr><th>Clause</th><th>What to look for</th><th>Common terms</th></tr></thead>
<tbody>
<tr><td><strong>Commission</strong></td><td>The gallery's share, and whether framing and shipping come out first</td><td>40 to 50% of retail</td></tr>
<tr><td><strong>Term and return</strong></td><td>How long the gallery holds the work, and who pays return shipping</td><td>3 to 12 months</td></tr>
<tr><td><strong>Insurance</strong></td><td>The gallery insures work in its care against damage and theft</td><td>Covered at your share of retail</td></tr>
<tr><td><strong>Payment window</strong></td><td>How many days after a sale you get paid</td><td>30 days; challenge anything over 60</td></tr>
<tr><td><strong>Discount authority</strong></td><td>Whether the gallery can discount without asking you</td><td>Up to 10% without approval</td></tr>
<tr><td><strong>Price list</strong></td><td>Prices agreed in writing, piece by piece</td><td>Attached as a schedule</td></tr>
</tbody></table></div>
<h2>Red flags</h2>
<ul>
<li><strong>No insurance clause,</strong> or liability shifted to you.</li>
<li><strong>Vague return terms,</strong> such as “indefinitely.”</li>
<li><strong>Exclusive rights to all your work,</strong> not only the pieces consigned.</li>
<li><strong>Payment “when convenient”</strong> instead of a set number of days.</li>
</ul>
<h2>Questions to ask the gallery</h2>
<ul>
<li>Do you take a commission on sales I make myself, such as a collector who saw my work at the gallery?</li>
<li>Who pays for shipping and installation, in each direction?</li>
<li>Will I get the buyer's name and contact details?</li>
<li>Can we review the agreement after six months?</li>
</ul>
<p>Don't have a contract yet? Start from the free <a href="/resources/consignment-agreement">consignment agreement</a> and send it to the gallery.</p>`,
disclaimer:"This is a reading guide, not legal advice.",
faqs:[
{q:"What should a consignment agreement include?",a:"The works and their prices, ownership, the commission, the term and return terms, insurance, how soon you get paid, and signatures from both sides."},
{q:"What is a fair payment window for consigned art?",a:"30 days after the gallery receives payment is common. Push back on anything over 60 days."},
{q:"Should I sign an exclusive consignment agreement?",a:"Only if exclusivity is limited to the consigned pieces, a defined area and a set period. Avoid clauses that cover everything you make."},
{q:"Do I need a lawyer to review a consignment agreement?",a:"For most everyday consignments a careful read is enough. For high-value work or a long-term relationship, have an arts attorney review it once."},
],
keepReading:[
{title:"Free art consignment agreement",href:"/resources/consignment-agreement"},
{title:"How art consignment works",href:"/resources/how-consignment-works"},
{title:"Understanding gallery splits",href:"/resources/gallery-splits"},
],
cta:"Allegory Art Studio keeps each gallery's terms, commission and payment dates next to the work it holds.",
},

{cat:"galleries", kind:"Guide", id:"approaching-a-gallery", title:"How to approach an art gallery",
dek:"How to research the right fit and make an introduction that gets a reply, with a sample email.",
titleTag:"How to Approach an Art Gallery (With a Sample Email) | Allegory Art Studio",
metaDescription:"How to research the right galleries, what to send, and a sample introduction email that gets a reply. Plus a checklist before you hit send.",
updated:"2026-11-17",
shortAnswer:"Research galleries that already show work like yours, then contact them the way they ask, usually by email. Send a short note that says why this gallery, one paragraph about your work, and links to your portfolio and CV. Most rejections come down to fit and timing, not talent.",
body:`<h2>Research before you reach out</h2>
<ol>
<li>Does the gallery show work in your medium, scale and sensibility?</li>
<li>Who do they already represent, and is there room for you rather than someone similar?</li>
<li>How do they say they want to be contacted? Follow it exactly.</li>
</ol>
<h2>What to send</h2>
<ul>
<li>A specific opening that says why this gallery, such as a show you saw.</li>
<li>One short paragraph on who you are and what your work is about.</li>
<li>A link to a clean portfolio and your CV, not a pile of attachments.</li>
<li>A clear, low-pressure ask.</li>
</ul>
<h2>Sample introduction email</h2>
<div class="keybox"><h4>Copy and adapt</h4>
<p><strong>Subject:</strong> [Your name], [medium] work for [Gallery name]</p>
<p>Dear [Director's name],</p>
<p>I saw [show name] at [Gallery] last month, and [one specific detail you noticed]. My work explores [one sentence on subject and approach], and I think it would sit well alongside the artists you show.</p>
<p>I'm a [medium] artist based in [city]. Recent work includes [one or two shows, awards or residencies].</p>
<p>You can see recent work here: [portfolio link]. My CV is here: [CV link].</p>
<p>If it's a fit, I'd welcome the chance to send more images or arrange a studio visit. Thank you for your time.</p>
<p>[Name] · [website] · [Instagram]</p></div>
<h2>Before you hit send</h2>
<ul>
<li>Your website and images are current. See <a href="/resources/photographing-work">photographing your work</a>.</li>
<li>Your <a href="/resources/artist-statement">artist statement</a>, <a href="/resources/bio-cv">bio and CV</a> are ready to share.</li>
<li>You're contacting the gallery the way it asks.</li>
<li>You know your terms if they say yes. Read <a href="/resources/how-consignment-works">how art consignment works</a>.</li>
</ul>
<h2>Relationships open more doors than cold emails</h2>
<p>Go to openings, invite curators to studio visits, and ask artists the gallery already shows for an introduction. A warm introduction gets read; a cold email often doesn't.</p>`,
faqs:[
{q:"How do I get my art into a gallery?",a:"Find galleries that already show work like yours, build a relationship through openings and introductions, and send a short, specific email with a portfolio link when they accept submissions."},
{q:"Should I email or visit a gallery?",a:"Follow the gallery's instructions. Most prefer email. Don't walk in with work unannounced."},
{q:"How long should I wait before following up?",a:"Three to four weeks. Send one short follow-up, then move on if there's no reply."},
],
keepReading:[
{title:"How art consignment works",href:"/resources/how-consignment-works"},
{title:"Writing an artist statement",href:"/resources/artist-statement"},
{title:"Keep your bio & CV current",href:"/resources/bio-cv"},
],
cta:"Allegory Art Studio keeps your gallery contacts and follow-up dates in one place, so no introduction goes cold.",
},

{cat:"galleries", kind:"Guide", id:"tracking-work", title:"How to track consigned and loaned artwork",
dek:"A system for knowing where every piece is, who has it, and when it's due back.",
titleTag:"How to Track Consigned Artwork: A Simple System | Allegory Art Studio",
metaDescription:"Know where every piece is, who has it and when it's due back. What to record for consigned and loaned artwork, and habits that keep the record current.",
updated:"2026-11-17",
shortAnswer:"Keep one record for every piece with its details, its status (in studio, on consignment, on loan or sold), where it is, who has it, and when it's due back. Track status and location separately, update the record the day a piece moves, and set a reminder for every return date.",
body:`<h2>What to record for each piece</h2>
<div class="g-table-wrap"><table class="g-table">
<thead><tr><th>Field</th><th>Example</th></tr></thead>
<tbody>
<tr><td><strong>Title, year, medium, size</strong></td><td>Low Tide, 2026, oil on linen, 24 × 30 in</td></tr>
<tr><td><strong>Retail price</strong></td><td>$1,800</td></tr>
<tr><td><strong>Status</strong></td><td>On consignment</td></tr>
<tr><td><strong>Location and holder</strong></td><td>[Gallery name], [city]</td></tr>
<tr><td><strong>Date out and date due back</strong></td><td>March 3 to September 3</td></tr>
<tr><td><strong>Paperwork</strong></td><td>Signed agreement and delivery receipt, with photos</td></tr>
</tbody></table></div>
<h2>Track status and location separately</h2>
<p>Status is about the sale: available, sold or donated. Location is about the place. A piece can be available and on consignment at the same time, so one column can't hold both.</p>
<h2>Habits that keep the record accurate</h2>
<ul>
<li>Update the record the day a piece moves, not later.</li>
<li>Photograph work before it leaves, and keep the signed receipt.</li>
<li>Set a reminder for every return date, so nothing stays out past its term.</li>
<li>Check the record against each gallery's inventory a couple of times a year.</li>
</ul>
<p>Starting from scratch? The free <a href="/resources/inventory-starter">inventory starter</a> spreadsheet has these columns set up.</p>`,
faqs:[
{q:"How do artists keep track of consigned work?",a:"With one record per piece showing its status, location, holder and due-back date, updated whenever a piece moves. A spreadsheet works to start; studio software keeps it in one place as the inventory grows."},
{q:"What should an artwork inventory include?",a:"Title, year, medium, size, price, status, current location and holder, key dates, and photos and paperwork for each piece."},
{q:"How often should I check my consignment records?",a:"Update them every time a piece moves, and reconcile with each gallery a couple of times a year."},
],
keepReading:[
{title:"Inventory starter (free spreadsheet)",href:"/resources/inventory-starter"},
{title:"How art consignment works",href:"/resources/how-consignment-works"},
{title:"Free art consignment agreement",href:"/resources/consignment-agreement"},
],
cta:"Allegory Art Studio's inventory shows status, location and the exact gallery or collector in one view.",
},

// ---------------- OPPORTUNITIES ----------------
{cat:"opportunities", kind:"Guide", id:"finding-opps", title:"Finding open calls, grants & residencies", dek:"Where to look, how to vet them, and how to spot the ones worth your time.",
body:`<p>There's no shortage of opportunities, the skill is filtering the worthwhile ones from the time-wasters and the outright scams.</p>
<h2>Where to look</h2>
<ul><li>Dedicated listing sites and newsletters for open calls, grants, and residencies.</li>
<li>Your state or regional arts council and local arts organizations.</li>
<li>Museums, universities, and foundations in your discipline.</li>
<li>Other artists, word of mouth surfaces the good ones.</li></ul>
<h2>Vet before you apply</h2>
<div class="keybox"><h4>Green flags</h4><ul>
<li>A clear, reasonable (or no) application fee relative to what's offered.</li>
<li>A named jury or organization with a track record.</li>
<li>Transparent terms: what you get, what rights you keep, what's expected.</li></ul></div>
<p><strong>Be wary of</strong> high "entry fees" with vague prizes, anyone asking you to pay to be "exhibited" online, or contests that claim rights to your images. If the main product seems to be collecting fees, skip it.</p>
<h2>Choose where to spend your energy</h2>
<p>Weigh each opportunity by fit (is this for work like yours?), cost (fee + time), and payoff (money, exposure, connections). A handful of strong, well-targeted applications beats fifty scattershot ones.</p>
<p class="note">Allegory's Opportunity Finder helps surface calls that match your medium, region, and goals, a running shortlist instead of endless searching.</p>`},

{cat:"opportunities", kind:"Guide", id:"standout-application", title:"Writing an application that stands out", dek:"A structure for statements and project descriptions a reviewer will remember.",
body:`<p>Jurors read dozens, sometimes hundreds, of applications in one sitting. Yours wins by being <strong>clear, specific, and easy to follow</strong>, not by being clever.</p>
<h2>Answer the question they asked</h2>
<p>The most common reason strong artists get passed over: they submit a generic statement instead of responding to the specific prompt. Read the call twice. Mirror its language. Address exactly what it asks.</p>
<h2>A structure that works</h2>
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
<h2>Capture everything in one place</h2>
<p>For each opportunity, record the <strong>deadline</strong>, the <strong>link</strong>, the <strong>fee</strong>, and what it requires (statement, images, CV, references). Seeing them side by side makes it obvious where to spend your energy.</p>
<h2>Plan backward from the due date</h2>
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
<h2>Build your core kit once</h2>
<ul><li>A strong <strong>artist statement</strong> (long and short versions).</li>
<li>A current <strong>bio</strong> (50, 100, and 250-word versions).</li>
<li>An up-to-date <strong>CV/résumé</strong>.</li>
<li>A set of your <strong>best images</strong>, properly labeled and sized.</li></ul>
<h2>Tailor, don't rewrite</h2>
<p>For each application, start from your core version and make targeted edits: echo the call's language, foreground the most relevant project, and trim to their limits. Fifteen focused minutes beats two hours from a blank page.</p>
<div class="keybox"><h4>Keep versions, not chaos</h4><ul>
<li>Label each version clearly (statement, residency, statement, grant).</li>
<li>Note which version you sent where, so you can reuse and improve it.</li>
<li>Store everything in one place you can reach in seconds.</li></ul></div>
<p class="note">Allegory's Profile Vault keeps labeled, versioned statements, bios, and CVs, and can tailor them per opportunity, so your kit is always a click away.</p>`},

// ---------------- MATERIALS ----------------
{cat:"materials", kind:"Guide", id:"artist-statement", title:"Writing an artist statement you don't hate", dek:"A plain-language process for saying what your work is about, without the art-speak.",
body:`<p>A good artist statement sounds like <strong>you</strong>, explaining your work to an interested person, not like a press release written by committee. Here's how to get there.</p>
<h2>Answer three questions</h2>
<ol><li><strong>What do you make?</strong> Medium, subject, and approach, in plain terms.</li>
<li><strong>Why do you make it?</strong> The idea, question, or feeling behind the work.</li>
<li><strong>How do you make it?</strong> Process or materials, but only the parts that matter to the meaning.</li></ol>
<h2>Draft it like you'd say it</h2>
<p>Record yourself describing your work to a friend, then transcribe it. The spoken version is almost always clearer and warmer than what you'd force onto the page. Edit from there.</p>
<div class="keybox"><h4>Keep it honest</h4><ul>
<li>Use concrete words over abstract ones ("I paint the marshes near my home," not "I interrogate liminal spaces").</li>
<li>Cut any sentence you couldn't say out loud without wincing.</li>
<li>Write a long version (250–300 words) and a short one (2–3 sentences).</li></ul></div>
<p class="note">Your statement will evolve with your work, revisit it a couple of times a year, and keep the versions you like.</p>`},

{cat:"materials", kind:"Guide", id:"bio-cv", title:"Keep your bio & CV current", dek:"What belongs on each, how to format them, and a rhythm for keeping them up to date.",
body:`<p>Your bio and CV do different jobs. The bio introduces you warmly; the CV lists your record. Keeping both current means you're always ready when an opportunity appears.</p>
<h2>Your bio</h2>
<p>A short, third-person paragraph: who you are, what you make, where you're based, and a highlight or two (notable shows, education, awards). Keep a <strong>50-word</strong>, <strong>100-word</strong>, and <strong>250-word</strong> version on hand.</p>
<h2>Your CV (the artist's résumé)</h2>
<p>A dated, reverse-chronological record, usually including:</p>
<ul><li>Education</li><li>Solo exhibitions</li><li>Group exhibitions</li><li>Awards, grants & residencies</li><li>Press & publications</li><li>Collections (if applicable)</li></ul>
<div class="keybox"><h4>Formatting that reads cleanly</h4><ul>
<li>Be consistent: year, title, venue, city, same order every line.</li>
<li>List newest first within each section.</li>
<li>Only include sections you can fill; leave off the empty ones until you can.</li></ul></div>
<h2>Update it as you go</h2>
<p>Add each show, award, or mention <em>the week it happens</em>, while details are fresh. A CV updated continuously never needs a stressful rebuild before a deadline.</p>
<p class="note">Allegory's Profile Vault keeps versioned bios and CVs ready to export in the format each application wants.</p>`},

{cat:"materials", kind:"Guide", id:"tailoring-materials", title:"Tailoring materials per opportunity", dek:"Small, fast edits that make a general statement feel written for the specific call.",
body:`<p>A generic statement reads as generic, reviewers notice. The good news: a few targeted edits make your core materials feel custom without a full rewrite.</p>
<h2>Where small changes have big impact</h2>
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
<h2>The fundamentals</h2>
<ul><li><strong>Light it evenly.</strong> Soft, diffused daylight or two matched lights at 45°, no glare, no harsh shadows.</li>
<li><strong>Shoot straight on.</strong> Camera centered and level with the work to avoid distortion.</li>
<li><strong>Neutral background.</strong> A clean wall or seamless backdrop; let the work be the subject.</li>
<li><strong>Get it sharp.</strong> A tripod (or steady surface) beats a more expensive camera held by hand.</li></ul>
<h2>Prep the files</h2>
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
<h2>Separate studio money from personal money</h2>
<p>The single highest-leverage move: a <strong>dedicated bank account (and ideally a card)</strong> for the studio. Every sale goes in; every supply, fee, and expense goes out. Now your statement <em>is</em> most of your bookkeeping.</p>
<h2>Track four things</h2>
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
<h2>What counts as a studio expense</h2>
<ul><li>Materials and supplies</li><li>Framing, printing, and fabrication</li><li>Studio rent and utilities</li><li>Application and gallery fees</li><li>Shipping and crating</li><li>Marketing, website, and software</li><li>Professional photography</li></ul>
<p>If it's an ordinary, necessary cost of making or selling your work, it probably belongs here, and may be deductible.</p>
<h2>Log it in the moment</h2>
<p>The trick isn't a fancy system, it's capturing the expense when it happens. A photo of the receipt and a one-line note beats a shoebox you dread every spring.</p>
<div class="keybox"><h4>What your P&L tells you</h4><ul>
<li>Whether a body of work actually paid for itself.</li>
<li>Where your money really goes (often framing and fees surprise people).</li>
<li>What you'll owe at tax time, no guessing.</li></ul></div>
<p class="note">A live P&L also helps you price: if you can see your true costs per piece, you can set prices that respect them.</p>`},

{cat:"business", kind:"Guide", id:"tax-time", title:"Tax time for artists", dek:"Deductions you're probably missing and the records to keep year-round.",
body:`<p>Taxes are far less painful when the work is spread across the year instead of crammed into one dreadful week. Mostly, that means keeping records as you go.</p>
<h2>Deductions artists often miss</h2>
<ul><li>A portion of home/studio space used exclusively for work.</li>
<li>Materials, framing, and fabrication.</li>
<li>Application, entry, and gallery fees.</li>
<li>Shipping, travel to shows, and mileage.</li>
<li>Website, software, and professional photography.</li>
<li>Education, workshops, classes, relevant books.</li></ul>
<h2>Keep these all year</h2>
<div class="keybox"><h4>Your year-round record</h4><ul>
<li>Receipts for every expense (a photo is fine).</li>
<li>A log of income by source.</li>
<li>Sales tax collected and remitted.</li>
<li>Mileage and travel tied to the studio.</li></ul></div>
<h2>Set money aside</h2>
<p>If you're selling as a self-employed artist, no one is withholding taxes for you. A common habit is moving <strong>25–30% of net income</strong> into a separate account as it comes in, so the bill is already covered.</p>
<p class="note">This is general information, not tax advice. An accountant who knows creative businesses is one of the best investments an artist can make, usually once a year is plenty.</p>`},

{cat:"business", kind:"Guide", id:"need-studio-manager", title:"Do you need a studio manager?", dek:"The signs you've outgrown doing it all yourself, and the budget-friendly middle ground.",
body:`<p>Many artists hit a point where the admin, inventory, invoices, applications, follow-ups, starts eating the time they should spend making work. That's a good problem. The question is what to do about it.</p>
<h2>Signs you've outgrown DIY</h2>
<ul><li>You've missed deadlines or lost track of where work is.</li>
<li>Invoices go out late, or not at all.</li>
<li>You spend more evenings on spreadsheets than in the studio.</li>
<li>Opportunities slip by because prep feels overwhelming.</li></ul>
<h2>The options, honestly</h2>
<p>A part-time <strong>studio manager</strong> can cost anywhere from a few hundred to over a thousand dollars a month depending on hours, real money for most artists. Hiring one makes sense once the admin reliably exceeds what tools can handle and the work is worth that investment.</p>
<div class="keybox"><h4>The middle ground</h4><ul>
<li>Systematize first: one place for inventory, sales, deadlines, and contacts.</li>
<li>Automate the repetitive parts (reminders, invoice follow-ups, opportunity tracking).</li>
<li>Bring in help for the specific things software can't do, not everything.</li></ul></div>
<p class="note">This is exactly the gap Allegory was built to fill: the organization and reminders of a studio manager, at a fraction of the cost, until (and after) you're ready to hire.</p>`},

// ---------------- MARKETING ----------------
{cat:"marketing", kind:"Guide", id:"mailing-list", title:"Start (and keep) a mailing list", dek:"Why email beats the algorithm, and how to grow a list of people who actually buy.",
body:`<p>Social platforms rent you an audience and change the rules whenever they like. A mailing list is an audience you <strong>own</strong>, and it's where most art actually sells.</p>
<h2>Why email wins</h2>
<ul><li>It reaches everyone who signed up, not the fraction an algorithm chooses.</li>
<li>The people on it asked to hear from you, they're your warmest buyers.</li>
<li>It's yours forever, independent of any platform.</li></ul>
<h2>Grow it the honest way</h2>
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
<h2>Find a cadence you can keep</h2>
<p>Consistency beats frequency. <strong>Once a month</strong> you'll actually send is far better than a weekly plan you abandon. Pick a rhythm that fits your studio life.</p>
<h2>A simple structure</h2>
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
<h2>Pick one platform and do it well</h2>
<p>You don't need to be everywhere. Choose the one place your audience actually is, and where you enjoy showing up enough to be consistent. One platform done sustainably beats four done resentfully.</p>
<h2>Make it repeatable</h2>
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
<h2>The first sale is the beginning</h2>
<ul><li>Send a genuine thank-you and the care details for the piece.</li>
<li>A few weeks later, check that they're happy with it in place.</li>
<li>Keep a record of what they bought and what drew them to it.</li></ul>
<h2>Stay in touch without selling</h2>
<p>Give collectors a <strong>first look</strong> at new work before it goes public. Invite them to studio visits and openings. Remember the details, the series they loved, the room the piece hangs in. People collect from artists they feel connected to.</p>
<div class="keybox"><h4>A simple collector CRM</h4><ul>
<li>Record each collector, what they bought, and when.</li>
<li>Note preferences and any follow-up to make.</li>
<li>Reach out when you have something you know they'd love.</li></ul></div>
<p class="note">Allegory's contacts keep your collectors, their history, and your follow-ups in one place, so the right person hears about the right piece.</p>`},

// ---------------- TEMPLATES ----------------
{cat:"templates", kind:"Spreadsheet", id:"inventory-starter", title:"Inventory starter", dek:"Catalogue every piece, title, year, medium, size, price, and status, in one tidy sheet.",
body:`<p>Every organized studio starts with one reliable list of what exists. Copy this structure into a spreadsheet (or let Allegory keep it for you) and you'll always know what you have and where it is.</p>
<h2>The columns to include</h2>
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
<h2>Sections to include</h2>
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
<h2>Step 1, Your base formula</h2>
<div class="g-table-wrap"><table class="g-table">
<thead><tr><th>Input</th><th>Example</th></tr></thead>
<tbody>
<tr><td>Height + Width (inches)</td><td>24 + 30 = 54</td></tr>
<tr><td>× Your $-per-inch</td><td>× $18</td></tr>
<tr><td>= Size value</td><td>$972</td></tr>
<tr><td>+ Materials &amp; framing</td><td>+ $130</td></tr>
<tr><td>= Base price</td><td><strong>$1,102</strong></td></tr>
</tbody></table></div>
<h2>Step 2, Make the split work</h2>
<p>If you sell through a gallery at 50%, your retail price needs to be set so you still net what you need, and it must be <strong>the same price everywhere</strong>. Round to a clean number (here, $1,200).</p>
<h2>Step 3, Sanity-check</h2>
<div class="keybox"><h4>Before you lock it in</h4><ul>
<li>Does it line up with your other pieces by size?</li>
<li>Is it in range for artists at your stage, medium, and region?</li>
<li>Would the same price hold up in a gallery <em>and</em> direct from your studio?</li></ul></div>
<p class="note">Pick a $-per-inch and keep it steady across a body of work. Raise it deliberately as demand grows, Allegory's smart pricing tool helps you set and hold a consistent system.</p>`},

{cat:"templates", kind:"Worksheet", id:"statement-worksheet", title:"Artist statement worksheet", dek:"Prompts that turn scattered notes into a finished statement you're proud of.",
body:`<p>A blank page is the enemy of a good statement. Answer these prompts in plain, honest sentences, then stitch the best bits together and edit for flow.</p>
<h2>Answer these out loud, then write them down</h2>
<ul><li><strong>What do you make?</strong> If you had ten seconds to tell a stranger, what would you say?</li>
<li><strong>What is it about?</strong> The idea, question, place, or feeling underneath the work.</li>
<li><strong>Why this, why now?</strong> What pulls you to this subject at this point in your life?</li>
<li><strong>How do you make it?</strong> The process or materials, but only where they shape the meaning.</li>
<li><strong>What do you want a viewer to feel or notice?</strong></li></ul>
<h2>Assemble it</h2>
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

// Guides to surface at the end of a guide ("Keep reading"): same category first
// (most relevant), then fill from other categories. Internal links like these
// help both readers and crawlers move through the library.
export const relatedGuides = (g: ResGuide, n = 3): ResGuide[] => {
  const sameCat = GUIDES.filter((x) => x.id !== g.id && x.cat === g.cat);
  const otherCat = GUIDES.filter((x) => x.id !== g.id && x.cat !== g.cat);
  return [...sameCat, ...otherCat].slice(0, n);
};

// Byline author for every guide (links to the About page and Cara's LinkedIn).
export const RESOURCE_AUTHOR = {
  name: "Cara Alford",
  role: "arts administrator and founder of Allegory Art Studio",
  url: "/about",
  linkedin: "https://www.linkedin.com/in/cara-alford-34471217/",
};

const RES_SITE = "https://allegoryartstudio.com";

// Resolved SEO title/description for a guide (falls back for older guides).
export const guideTitleTag = (g: ResGuide): string =>
  g.titleTag || `${g.title} | Allegory Art Studio Resource Library`;
export const guideDescription = (g: ResGuide): string => g.metaDescription || g.dek;

// The "Keep reading" links for a guide: explicit when set, else related guides.
export const guideKeepReading = (g: ResGuide): { title: string; href: string }[] =>
  g.keepReading && g.keepReading.length
    ? g.keepReading
    : relatedGuides(g).map((r) => ({ title: r.title, href: `/resources/${r.id}` }));

// Structured data for a guide: Article + BreadcrumbList, plus FAQPage when the
// guide has an FAQ. Both the live page and the prerendered file emit this, so the
// visible FAQ and the FAQPage schema come from the one `faqs` source.
export function guideJsonLd(g: ResGuide): object[] {
  const url = `${RES_SITE}/resources/${g.id}`;
  const cat = catById(g.cat);
  const date = g.updated || "2026-11-17";
  const headline = guideTitleTag(g).split(" | ")[0];
  const blocks: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline,
      description: guideDescription(g),
      author: {
        "@type": "Person",
        name: RESOURCE_AUTHOR.name,
        jobTitle: "Arts administrator",
        url: `${RES_SITE}${RESOURCE_AUTHOR.url}`,
        sameAs: RESOURCE_AUTHOR.linkedin,
      },
      publisher: {
        "@type": "Organization",
        name: "Allegory Art Studio",
        logo: { "@type": "ImageObject", url: `${RES_SITE}/Allegory_Studio_Logo.png` },
      },
      datePublished: date,
      dateModified: date,
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      image: `${RES_SITE}/Allegory_Studio_Logo.png`,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${RES_SITE}/` },
        { "@type": "ListItem", position: 2, name: "Resources", item: `${RES_SITE}/resources` },
        { "@type": "ListItem", position: 3, name: cat ? cat.name : "Guides", item: `${RES_SITE}/resources#cat-${g.cat}` },
        { "@type": "ListItem", position: 4, name: g.title, item: url },
      ],
    },
  ];
  if (g.faqs && g.faqs.length) {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: g.faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }
  return blocks;
}
