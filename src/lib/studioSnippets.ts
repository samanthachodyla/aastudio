// Studio Snippets: a rotating daily tip shown on the dashboard. One snippet is
// chosen per calendar day (same for everyone, fresh each day) so an artist sees
// a new piece of practical advice every time they log in on a new day.
//
// Content is from Allegory Art Studio (Cara's studio tips). Spelling is cleaned
// and em-dashes removed to match the rest of the site; the voice is kept as-is.

export interface StudioSnippet {
  category: string;
  tip: string;
}

export const STUDIO_SNIPPETS: StudioSnippet[] = [
  { category: "Business", tip: "Regularly re-evaluate your relationships with your partners, framers, printers, shippers, photographers. The framer who was perfect three years ago might not match your current volume, quality bar, or budget. Loyalty is great, but check in: are they still delivering, still priced fairly, still handling your work with care? It's okay to trade up." },
  { category: "Admin", tip: "Artwork product images matter. Document your work with consistent lighting and clear photos, plus detail shots if you can. No need for a fancy camera, just give prospective buyers the chance to see the work clearly without having to reach out for more documentation." },
  { category: "Studio practice", tip: "Photograph every piece before it leaves your studio. No exceptions." },
  { category: "Admin", tip: "Follow up, follow up, follow up! I recently heard the advice to pretend you're someone else's assistant. Don't let a lead go dark just because you didn't follow up!" },
  { category: "Admin", tip: "On top of any state sales tax you owe, set aside 25-30% of every sale for taxes the moment it hits your account." },
  { category: "Studio practice", tip: "You know when you're stuck in the middle of the work? Step away if you need to, but always return. Chances are something will come from it!" },
  { category: "Studio practice", tip: "Photograph works in progress. Sometimes when you step away and look through a different lens (literally, in this case) you'll spot new details worth exploring, or erasing!" },
  { category: "Studio practice", tip: "Post the process, not just the final product. People buy the story of how it got made, and sometimes you can sell a piece before it's even finished." },
  { category: "Admin", tip: "Email lists are KING! If Instagram dies tomorrow, how are you reaching your followers? Build an email list now." },
  { category: "Admin", tip: "Don't overthink the newsletter, it doesn't have to be poetic prose. Send a playful hello, get into people's inboxes, share a little behind-the-scenes. It doesn't matter what it is, just be consistent so they remember you!" },
  { category: "Business", tip: "Apply to the thing you feel underqualified for. The application itself teaches you." },
  { category: "General", tip: "Exposure isn't a currency! Say no to the free “exposure” opportunity that costs you a week of studio time." },
  { category: "Admin", tip: "I like to recommend keeping three versions of your artist statement on hand, so you always have the right length ready for an application." },
  { category: "Business", tip: "A fun exercise I like to do with artists: write a mission and vision statement. It becomes a north star for your practice and helps guide your partnerships, the opportunities that cross your desk, and any collaborations. It gives you something to measure against, does this align with my brand? Because ultimately you are a brand!" },
  { category: "Business", tip: "New year, new goals! Set a bunch, some pie-in-the-sky dream partnerships and some more surface-level and attainable. Check in every quarter: did you hit them? What carries on? It's a great personal and strategic growth exercise." },
  { category: "Admin", tip: "If you take commissions, always have a clear process in place. Set your boundaries. Know in advance, and tell your client, how many revisions they'll get. Set expectations right off the bat!" },
  { category: "Admin", tip: "Add at least 10% to all commissions." },
  { category: "Admin", tip: "Always take a non-refundable deposit on commissions." },
  { category: "Studio practice", tip: "Title your work, basic titles are a cop-out. I've seen it firsthand: an artist titles a piece something specific and a collector resonates with it. You never know what will land, someone may buy a piece just because of the title!" },
  { category: "Admin", tip: "Look at how your studio time is spent, what's actually worth your time and what could be outsourced. Offload the admin so you can create: social media, bookkeeping, email, inventory tracking, lead follow-up, and so on." },
  { category: "Admin", tip: "Need to do admin work? Set the vibe and carve out the time: get comfy, put on some music or a podcast, make a snack and a nice drink, and give yourself a designated block to bang it out. (Allegory Art Studio helps cut that time down significantly!)" },
  { category: "Admin", tip: "Inbox zero, I dare you!" },
  { category: "Admin", tip: "Keep track of your work, where it lives and who collected it. Even if it's just a spreadsheet, this information is extremely valuable. (Allegory Art Studio has a great, affordable inventory tracker!)" },
  { category: "Business", tip: "Don't be afraid to ask for collaborations and partnerships, or to seek out opportunities. If you see other artists doing partnerships you envy, what's stopping you from making it happen for yourself? The worst someone can do is not reply, or say no. Shoot your shot, and know your worth." },
  { category: "Business", tip: "Before reaching out to galleries or art consultants, try getting to know them first. A coffee date, an info call, or a visit to the gallery with no goal of asking for something. Cold emails more often than not go unanswered, not because your work isn't strong, but because they're inundated. Follow them, sign up for their newsletter, attend events, be on their radar. Build the relationship first, then ask down the road." },
  { category: "Business", tip: "When sending your portfolio to galleries or art consultants, make it an easy-to-open, clean-to-read PDF or lookbook. No zip files." },
  { category: "Business", tip: "The most important question to ask yourself when seeking opportunities: do you want to work with this gallery, brand, or opportunity because you think they're cool, or because it genuinely aligns with your practice and your work? Alignment is crucial. They won't consider you if your work doesn't fit what they do." },
  { category: "Studio practice", tip: "Can you define your practice in one sentence? It's a great exercise, your elevator pitch. Who are you as an artist? What do you make? If you couldn't show your work, how would you describe it?" },
  { category: "Pricing & sales", tip: "Price consistently across venues. This matters to collectors and to your galleries and representation partners. Why would someone shop the more expensive option when they can find it cheaper elsewhere?" },
  { category: "Pricing & sales", tip: "Have a coherent pricing formula (size, medium, tier) so you're not pulling numbers out of the air for each piece. It doesn't have to be rigid (price per square inch, say) but a consistent approach to scale, medium, and value helps you in the end." },
  { category: "Pricing & sales", tip: "If it suits your practice, payment plans can be a nice option for entry-level collectors. Plenty of websites offer Klarna and similar apps, but you can also do it in-studio or over Instagram. Just put a clear system in place: a written contract, a payment structure, and a card on file." },
  { category: "Studio practice", tip: "Save your studio scraps and sketches, you never know when they'll find their way into your practice. I've had clients build entire bodies of work from remnants, they can become small-format pieces or help tell the story behind a bigger one." },
  { category: "Admin", tip: "Read all of your contracts thoroughly! It's important to understand who is responsible for what, a great use of an AI tool, or a reason to consult an arts administrator (using Allegory Art Studio!)." },
  { category: "Admin", tip: "Keep your press and CV updated as things happen. That way, when you need them for an opportunity, you're not scrambling!" },
  { category: "Admin", tip: "Nurture the collectors you already have. A repeat buyer is worth more than ten cold leads. Send a personal note or a studio update to past collectors, they want to feel like they got in early on you." },
  { category: "Pricing & sales", tip: "I don't love recommending sales. There's a time and a place (moving studios, clearing out work, open-ended print runs) but I encourage artists not to discount their work, people get used to the lower rate. Try offering free shipping instead!" },
  { category: "Admin", tip: "Include a note, if you can, with a sold work. It will resonate with the collector, I promise." },
  { category: "Mindset", tip: "Compare your work to your own from last year, not to someone else's highlight reel. You don't know what's happening in another artist's studio, especially one you don't know. Focus on your own work and your own growth!" },
  { category: "Mindset", tip: "Keep track of your rejections. It takes a lot of work to land that one big yes, and you will get there. Consistency over intensity." },
  { category: "Marketing", tip: "Pin your best three posts to the top of your profile. New visitors decide almost instantly whether to follow you, so keep it fresh up top: an intro, and two bodies of work you're loving right now." },
  { category: "Marketing", tip: "I hate to say it, but it's true, you have to feed the algorithm if you want to get out there. People follow people, then buy the art. Show your hands, your face, your studio. It gives people a personal connection to you and your work." },
  { category: "Marketing", tip: "Tag your framer, the gallery, the paint brand. If they reshare your post, it puts you in front of an aligned audience for free." },
  { category: "Marketing", tip: "Need newsletter ideas? Turn your best-performing posts and captions into newsletter content. No need to do twice the work." },
  { category: "Marketing", tip: "Always have a clear call to action in your caption. “Available now, DM to purchase” converts far better than a beautiful post with no ask." },
  { category: "Admin", tip: "Don't take Venmo! You might not like this, but your accountant will. :) It's a mess to categorize from a bookkeeping standpoint and can really trip you up come tax time." },
  { category: "Studio practice", tip: "If you can, work on more than one piece at a time. When one needs to dry or sit, you're not stalled, and you'll be surprised how the pieces inform and inspire one another." },
  { category: "Studio practice", tip: "Never underestimate the power of a studio clean-up, rehang, or reset. Sometimes a fresh space is all you need to feel energized to create!" },
];

// The snippet for a given day: a stable index derived from the date (UTC day
// count), so it's the same for everyone on a given day and advances each day.
export function snippetForToday(now: Date = new Date()): StudioSnippet {
  const dayIndex = Math.floor(now.getTime() / 86_400_000);
  return STUDIO_SNIPPETS[((dayIndex % STUDIO_SNIPPETS.length) + STUDIO_SNIPPETS.length) % STUDIO_SNIPPETS.length];
}
