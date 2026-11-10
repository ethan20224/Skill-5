# Copy and data

P6 (human, specific copy) is the cheapest pillar to score and the most often
missed. Content comes before layout (Step 6): write every word and number
first, then design around the real lengths.

---

## 1. The voice of a 9

| Level | Example |
|---|---|
| 4 | "Water your plant" · "Next watering: 3 days" |
| 6 | "Watering due Sat 11 · 650 ml" |
| 9 | "650 ml, slowly, until it runs from the drainage hole. Living room, east window." |

| Level | Example |
|---|---|
| 4 | "Your train departs soon" |
| 6 | "Platform 16 · departs 13:33" |
| 9 | "Six minutes on foot from Yaesu South gate. Doors open at 13:26." |

What the 9s do:
- **Place and sense:** where, how, what it feels like ("Warm shower, not hot";
  "Rain on a tin roof · fades out at 23:19").
- **The next action, not the status:** "Queue at floor marker 7" beats "Car 7".
- **A person's rhythm:** short sentences, fragments where natural, no jargon.
- **Small kindnesses:** "Skip tonight" as the secondary action; "Lights out, yours".
- **Specific nouns:** "Twenty pages, paper book", not "Reading".

## 2. Numbers and data

- **Uneven and believable:** `€137.60`, `€4,382.16`, `5:52 /km`, `1,850 lux`,
  `Journey 14 · 513 km this year`. Never `$1,000`, `100%`, `5 items`.
- **Realistic mid-use state:** some done, one overdue, one new; a streak at 23,
  not 100; a budget part-spent.
- **Format like a product:** `1.4M`, `38k`, `$4.99`, trim trailing zeros, local
  date formats ("Sat 3 Oct", "Sun 1 Nov").
- **Units small, values big** (anatomy.md §2).
- **Time-consistent:** the status-bar clock, the copy and the countdown agree.
  If the screen says "in 25 min" at 13:08, departure is 13:33.
- **Real-world facts must be true or omitted.** Mt Fuji really is visible on
  the right of a westbound Tokaido Shinkansen; Tō-ji pagoda really is visible
  arriving at Kyoto. "Gate 3 is quietest" was invented and had to be cut.
  When unsure, use a placeholder in brackets or leave it out.
- **Names:** specific and plausible for the setting (Ines Haraguchi, Marlow
  Grocers, Little Fern Coffee). Never John Doe, Jane Smith, Acme.
- **The worst case, beside the typical one.** A layout drawn around "Kyoto"
  breaks on "Shin-Yokohama". For every slot that holds data, know the
  longest real string and the largest real number, and mark the slot
  `data-stress="Shin-Yokohama"`: the audit's stress pass swaps it in (and
  grows every other string by 35%). Draw the empty, loading and error states
  of the core screen with real words too: "No trips yet. Your next ticket
  shows up here the moment you book."

## 3. Labels and actions

- **Verbs for this moment:** "Directions to platform", "Show ticket", "Hold to
  board", "Set arrival alert", "Watered", "Start". Not "Continue" everywhere.
- **One label per intent** across the app ("Get started" or "Start", never both).
- **Secondary as a text action:** "Skip tonight", "Share", "Seat map", "Mute".
- **Cap labels are nouns** ("Leaves in", "Next stop", "Car"), 1–2 words.
- **Errors say what happened and what to do**, inline, in the same voice.

## 4. Banned

Marketing and AI phrases: elevate, seamless, unlock, effortless, supercharge,
next-gen, revolutionary, transform your, journey (as a metaphor), "Welcome
back!", "Good morning, {name}" headers, "Oops!", exclamation marks in UI, emoji
in copy, lorem ipsum, "Coming soon" placeholders, em dashes as decoration.

## 5. Writing check

Read each screen aloud as if telling a friend what the app is saying. If any
line sounds like a dashboard or an ad, rewrite it. If you would not quote
at least one line, P6 is 0.5 at most.
