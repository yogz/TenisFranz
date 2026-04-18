// ── Image paths ──
const imgs = [
  '/wbear/1673975391_9-xphoto-name-p-jack-radcliffe-porn-10.jpg',
  '/wbear/1673975407_5-xphoto-name-p-jack-radcliffe-porn-6.jpg',
  '/wbear/1673975429_1-xphoto-name-p-jack-radcliffe-porn-1.jpg',
  '/wbear/1673975436_3-xphoto-name-p-jack-radcliffe-porn-3.jpg',
  '/wbear/1673975457_7-xphoto-name-p-jack-radcliffe-porn-8.jpg',
  '/wbear/1673975460_12-xphoto-name-p-jack-radcliffe-porn-13.jpg',
  '/wbear/1673975464_11-xphoto-name-p-jack-radcliffe-porn-12.jpg',
  '/wbear/1673975476_16-xphoto-name-p-jack-radcliffe-porn-17.jpg',
  '/wbear/GJrMJRSXwAAR_7C.jpeg',
  '/wbear/Jack-Radcliffe-After-Bellini-1-2002-by-Chris-Komater.jpg',
  '/wbear/Untitled-design-2025-09-04T125911.867.png',
  '/wbear/tumblr_lx8hlaVV9J1r9xpsho1_640.jpg',
];

// Demo-only: varied-aspect SVG placeholders to make the masonry mode
// visibly different from the uniform mode (natural photo pool above is
// all ~4:5 portrait, so variance is subtle without these).
(() => {
  const makeFake = (w, h, hue, label) => {
    const svg =
      `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>` +
      `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
      `<stop offset='0' stop-color='hsl(${hue}, 38%, 34%)'/>` +
      `<stop offset='1' stop-color='hsl(${hue + 25}, 45%, 20%)'/>` +
      `</linearGradient></defs>` +
      `<rect width='${w}' height='${h}' fill='url(#g)'/>` +
      `<text x='50%' y='50%' text-anchor='middle' dominant-baseline='central' ` +
      `fill='rgba(255,255,255,0.55)' font-family='-apple-system,sans-serif' ` +
      `font-size='${Math.min(w, h) / 6}' font-weight='300' letter-spacing='-0.02em'>${label}</text>` +
      `</svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  };
  const fakes = [
    makeFake(400, 600, 18,  '2:3 tall'),     // tall portrait
    makeFake(400, 400, 200, '1:1 square'),   // square
    makeFake(600, 400, 50,  '3:2 wide'),     // landscape
    makeFake(400, 300, 280, '4:3 wide'),     // wider landscape
    makeFake(300, 500, 340, '3:5 very tall'),// very tall
  ];
  imgs.push(...fakes);
})();

// ── Populate Activity screen (behind the bell) ──
(() => {
  const HEART_FILL = '<svg viewBox="0 0 24 24" fill="#fff"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
  const EYE_ICON   = '<svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
  const CHAT_ICON2 = '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  const FOLLOW_ICO = '<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>';
  const STAR_ICON  = '<svg viewBox="0 0 24 24" fill="#fff"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
  const TAG_ICON   = '<svg viewBox="0 0 24 24" fill="#fff" stroke="none"><path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/></svg>';

  const today = [
    { kind: 'match',   name: 'Daniel', img: imgs[3],                  unread: true,  time: 'just now', text: "<strong>Daniel</strong> and you are a new match" },
    { kind: 'like',    name: 'Marcus', img: imgs[0],  thumb: imgs[4],  unread: true,  time: '4m',       text: "<strong>Marcus</strong> liked your lake pic" },
    { kind: 'view',    name: 'Jake',   img: imgs[1],                  unread: true,  time: '12m',      text: "<strong>Jake</strong> viewed your profile" },
    { kind: 'comment', name: 'Chris',  img: imgs[9],  thumb: imgs[6],  unread: true,  time: '18m',      text: "<strong>Chris</strong> commented: \"cabin goals 🔥\"" },
    { kind: 'tag',     name: 'Sam',    img: imgs[4],  thumb: imgs[2],  unread: false, time: '1h',       text: "<strong>Sam</strong> tagged you in a photo" },
    { kind: 'like',    name: 'Sam + 4 others', img: imgs[4], thumb: imgs[2], unread: false, time: '42m', text: "<strong>Sam</strong> and 4 others liked your brunch pic" },
    { kind: 'follow',  name: 'Alex',   img: imgs[5],                  unread: false, time: '1h',       text: "<strong>Alex</strong> started following you" },
  ];

  const thisWeek = [
    { kind: 'view',    name: 'Ben',    img: imgs[6],                  unread: false, time: 'Yesterday', text: "<strong>Ben</strong> viewed your profile" },
    { kind: 'tag',     name: 'Alex',   img: imgs[5],  thumb: imgs[6],  unread: false, time: 'Yesterday', text: "<strong>Alex</strong> tagged you in a photo" },
    { kind: 'comment', name: 'Ryan',   img: imgs[7],  thumb: imgs[11], unread: false, time: 'Yesterday', text: "<strong>Ryan</strong> replied to your comment on Jake's post" },
    { kind: 'follow',  name: 'Leo',    img: imgs[11],                 unread: false, time: '2d',        text: "<strong>Leo</strong> started following you" },
    { kind: 'like',    name: 'Tom',    img: imgs[8],  thumb: imgs[0],  unread: false, time: '3d',        text: "<strong>Tom</strong> liked your bike pic" },
    { kind: 'view',    name: 'Kai + 8 others', img: imgs[1],           unread: false, time: '4d',        text: "<strong>Kai</strong> and 8 others viewed your profile" },
    { kind: 'comment', name: 'Nate',   img: imgs[5],  thumb: imgs[9],  unread: false, time: '5d',        text: "<strong>Nate</strong> mentioned you in a comment" },
  ];

  function renderList(containerId, events) {
    const list = document.getElementById(containerId);
    events.forEach(e => {
      const icon = e.kind === 'like'    ? HEART_FILL
                 : e.kind === 'view'    ? EYE_ICON
                 : e.kind === 'comment' ? CHAT_ICON2
                 : e.kind === 'follow'  ? FOLLOW_ICO
                 : e.kind === 'tag'     ? TAG_ICON
                 : STAR_ICON;
      const row = document.createElement('div');
      row.className = 'activity-row' + (e.unread ? ' unread' : '');
      row.dataset.kind = e.kind;

      let trailing = '';
      if (e.thumb) {
        trailing = `<div class="activity-row-thumb" style="background-image:url('${e.thumb}');"></div>`;
      } else if (e.kind === 'follow') {
        trailing = `<button class="activity-row-cta">Follow back</button>`;
      } else if (e.kind === 'match') {
        trailing = `<button class="activity-row-cta">Say hi</button>`;
      } else if (e.kind === 'view') {
        trailing = `<button class="activity-row-cta secondary">View</button>`;
      }

      row.innerHTML = `
        <div class="activity-row-avatar" style="background-image:url('${e.img}');">
          <div class="activity-row-badge ${e.kind}">${icon}</div>
        </div>
        <div class="activity-row-body">
          <span class="activity-row-text">${e.text}</span>
          <span class="activity-row-time">${e.time}</span>
        </div>
        ${trailing}`;
      list.appendChild(row);
    });
  }

  renderList('activityListToday', today);
  renderList('activityListWeek',  thisWeek);

  // Filter chips
  document.querySelectorAll('#screenInbox .activity-filter').forEach(f => {
    f.addEventListener('click', () => {
      document.querySelectorAll('#screenInbox .activity-filter').forEach(x => x.classList.remove('active'));
      f.classList.add('active');
      const kind = f.dataset.kind;
      document.querySelectorAll('#screenInbox .activity-row').forEach(row => {
        row.style.display = (kind === 'all' || row.dataset.kind === kind) ? '' : 'none';
      });
    });
  });
})();

// ── Generate activity rail (stories) ──
(() => {
  const rail = document.getElementById('activityRail');
  // "Add your story" entry first
  const addItem = document.createElement('div');
  addItem.className = 'activity-item';
  addItem.innerHTML = `
    <div class="activity-avatar">
      <div class="activity-ring seen">
        <div class="activity-img activity-add"></div>
      </div>
      <div class="activity-add-avatar" style="background-image:url('${imgs[2]}');"></div>
    </div>
    <span class="activity-name">Your story</span>`;
  rail.appendChild(addItem);

  const people = [
    { name: 'Marcus', img: imgs[0], unread: true, live: true },
    { name: 'Jake', img: imgs[1], unread: true },
    { name: 'Daniel', img: imgs[3], unread: true },
    { name: 'Chris', img: imgs[9], unread: false },
    { name: 'Sam', img: imgs[4], unread: false },
    { name: 'Alex', img: imgs[5], unread: false },
    { name: 'Ben', img: imgs[6], unread: false },
    { name: 'Ryan', img: imgs[7], unread: false },
    { name: 'Leo', img: imgs[11], unread: false },
    { name: 'Tom', img: imgs[8], unread: false },
  ];
  people.forEach(p => {
    const item = document.createElement('div');
    item.className = 'activity-item';
    item.innerHTML = `
      <div class="activity-avatar">
        <div class="activity-ring${p.unread ? '' : ' seen'}">
          <div class="activity-img" style="background:url('${p.img}') center/cover;"></div>
        </div>
        ${p.live ? '<div class="activity-live">LIVE</div>' : (p.unread ? '<div class="activity-dot"></div>' : '')}
      </div>
      <span class="activity-name">${p.name}</span>`;
    rail.appendChild(item);
  });
})();

// ── Generate events rail ──
(() => {
  const rail = document.getElementById('eventsRail');
  const events = [
    {
      id: 'tgi-happy-hour',
      name: 'TGI Bears Happy Hour',
      meta: 'Tonight · Touché, Rogers Park',
      day: '17', mo: 'Apr', img: imgs[5],
      when: 'Fri Apr 17 · 6:00 – 9:00 PM',
      badge: 'Tonight',
      liveNow: true,
      hereNow: [0, 3, 5, 7, 1, 9, 11],
      hereCount: 14,
      venueName: 'Touché',
      venueAddr: '6412 N Clark St · Rogers Park',
      going: 38, interested: 72, friends: 6,
      attendees: [0, 3, 5, 7, 1, 9, 11, 4],
      friendsLine: "<strong>Jake</strong>, <strong>Marcus</strong> and 4 more of your bears are going",
      about: "Kick off the weekend with $5 drafts, $7 whiskey sours and the best jukebox on the north side. No cover, no guestlist — just bears, beards and the city's softest lighting. Bring a friend.",
      hostName: 'Touché Chicago',
      hostImg: imgs[5],
    },
    {
      id: 'white-lotus',
      name: 'White Lotus finale viewing party',
      meta: 'Sat · Progress Bar, Boystown',
      day: '18', mo: 'Apr', img: imgs[1],
      when: 'Sat Apr 18 · 8:00 – 11:30 PM',
      badge: 'Free entry',
      venueName: 'Progress Bar',
      venueAddr: '3359 N Halsted St · Boystown',
      going: 124, interested: 210, friends: 11,
      attendees: [1, 3, 0, 9, 7, 5, 11, 4, 6, 8],
      friendsLine: "<strong>Daniel</strong>, <strong>Chris</strong> and 9 more of your bears are going",
      about: "Season 4 finale on the big screen with surround sound, themed drink specials (Belinda's Last Stand, $10), drag-hosted trivia at the commercial break, and a best-dressed contest — winner takes home a $100 bar tab. Doors at 8, episode rolls at 9 sharp.",
      hostName: 'Progress Bar',
      hostImg: imgs[1],
    },
    {
      kind: 'promo',
      id: 'promo-touche-happy-hour',
      promoAccent: 'gold',
      promoBadge: 'Sponsored',
      promoTitle: "Touché · $5 drafts all week",
      promoSubtitle: "Show your W|Bear profile, skip the cover",
      promoCta: 'See the deal',
    },
    {
      id: 'leather-sunday',
      name: 'Leather Sunday',
      meta: 'Sun · Touché',
      day: '19', mo: 'Apr', img: imgs[3],
      when: 'Sun Apr 19 · 9:00 PM – 2:00 AM',
      badge: 'Dress code',
      venueName: 'Touché',
      venueAddr: '6412 N Clark St · Rogers Park',
      going: 56, interested: 94, friends: 4,
      attendees: [3, 5, 0, 11, 7, 1, 9],
      friendsLine: "<strong>Marcus</strong> and 3 more of your bears are going",
      about: "Weekly leather night at Chicago's longest-running leather bar. Full gear encouraged — harness, boots, or uniform gets you $2 off every drink. DJ Ox spinning 10pm–close.",
      hostName: 'Touché Chicago',
      hostImg: imgs[3],
    },
    {
      id: 'trivia',
      name: 'Beer & Bears Trivia',
      meta: "Tue · Marty's, Andersonville",
      day: '21', mo: 'Apr', img: imgs[7],
      when: 'Tue Apr 21 · 7:30 – 10:00 PM',
      badge: 'Weekly',
      venueName: "Marty's Martini Bar",
      venueAddr: '1511 W Balmoral Ave · Andersonville',
      going: 24, interested: 41, friends: 3,
      attendees: [7, 0, 3, 5, 9],
      friendsLine: "<strong>Alex</strong> and 2 of your bears are going",
      about: "Six rounds, five categories, one winning team takes home the bar tab. Teams up to 6. Host: Miss Toto. Early bird: buy any cocktail before 8pm, get your second at half price.",
      hostName: "Marty's Martini Bar",
      hostImg: imgs[7],
    },
    {
      id: 'bear-bowl',
      name: 'Bear Bowl Night',
      meta: 'Fri · Timber Lanes, North Center',
      day: '24', mo: 'Apr', img: imgs[9],
      when: 'Fri Apr 24 · 8:00 – 11:00 PM',
      badge: 'Tickets · $15',
      venueName: 'Timber Lanes',
      venueAddr: '1851 W Irving Park Rd · North Center',
      going: 72, interested: 115, friends: 8,
      attendees: [9, 0, 3, 11, 5, 7, 1, 4, 8],
      friendsLine: "<strong>Leo</strong>, <strong>Tom</strong> and 6 more of your bears are going",
      about: "$15 gets you 2 hours of lane rental, shoes, and a pitcher. Sign up solo and we'll team you up. Prizes for high score, low score and best bowling shirt. Lanes fill up fast — grab a spot before Thursday.",
      hostName: 'Chicago Bear Social',
      hostImg: imgs[9],
    },
    {
      id: 'drag-race',
      name: 'Drag Race watch party',
      meta: 'Sun · @mosphere, Andersonville',
      day: '26', mo: 'Apr', img: imgs[4],
      when: 'Sun Apr 26 · 7:00 – 10:00 PM',
      badge: 'Free · 21+',
      venueName: '@mosphere',
      venueAddr: '5355 N Clark St · Andersonville',
      going: 87, interested: 142, friends: 5,
      attendees: [4, 1, 3, 0, 7, 9, 11],
      friendsLine: "<strong>Jake</strong> and 4 of your bears are going",
      about: "New episode on the big screen, lip-sync mini-competition at every commercial break, winner gets a $50 bar tab. Hosted by the one and only Miss Foozie. Doors at 7, episode at 8.",
      hostName: '@mosphere Chicago',
      hostImg: imgs[4],
    },
    {
      kind: 'promo',
      id: 'promo-chicago-safe-spaces',
      promoAccent: 'pride',
      promoBadge: 'Community',
      promoTitle: 'Chicago safe-space map',
      promoSubtitle: '42 bear-friendly venues · vetted by locals',
      promoCta: 'Open the map',
    },
    {
      id: 'bear-pride',
      name: 'Bear Pride Chicago',
      meta: 'May 15–17 · Boystown',
      day: '15', mo: 'May', img: imgs[10],
      when: 'May 15–17 · 3 days, 14 events',
      badge: 'Flagship · Tickets',
      venueName: 'Boystown (multi-venue)',
      venueAddr: 'N Halsted St corridor · Lakeview',
      going: 1242, interested: 3104, friends: 18,
      attendees: [0, 1, 3, 4, 5, 7, 9, 10, 11, 6, 8],
      friendsLine: "<strong>Marcus</strong>, <strong>Jake</strong>, <strong>Daniel</strong> and 15 more of your bears are going",
      about: "Chicago's biggest weekend for the bear community. Three days of parties, pool socials, dance nights and the iconic Sunday beer bust. Full weekend pass $75 early bird, $95 door. Individual events from $15.",
      hostName: 'Bear Pride Chicago',
      hostImg: imgs[10],
    },
    {
      id: 'grillin',
      name: "Grillin' at Montrose Beach",
      meta: 'Sat · Lakefront',
      day: '06', mo: 'Jun', img: imgs[8],
      when: 'Sat Jun 6 · 12:00 – 6:00 PM',
      badge: 'BYO · Potluck',
      venueName: 'Montrose Beach',
      venueAddr: '4400 N Lake Shore Dr · Uptown',
      going: 63, interested: 98, friends: 7,
      attendees: [8, 0, 3, 5, 11, 7, 4, 9],
      friendsLine: "<strong>Sam</strong>, <strong>Ben</strong> and 5 more of your bears are going",
      about: "First cookout of the summer. We bring the grills and charcoal, you bring something for the grill and something to share. Volleyball, speakers, swimming if you're brave. Look for the orange flag near the dog beach.",
      hostName: 'Windy City Bears',
      hostImg: imgs[8],
    },
  ];

  const worldwideEvents = [
    {
      id: 'ptown-bear-week',
      name: 'Provincetown Bear Week',
      meta: 'Jul 5–12 · P-Town, MA',
      day: '05', mo: 'Jul', img: imgs[1],
      when: 'Jul 5–12 · Week-long festival',
      badge: 'Flagship · Tickets',
      venueName: 'Provincetown, MA',
      venueAddr: 'Commercial St & the harbor',
      going: 4821, interested: 8932, friends: 22,
      attendees: [1, 0, 3, 4, 5, 7, 9, 10, 11, 6, 8, 2],
      friendsLine: "<strong>Marcus</strong>, <strong>Daniel</strong> and 20 more of your bears are going",
      about: "The biggest bear week in the world. Seven days of pool parties, beach bashes, tea dances at Boatslip, and afterhours at the A-House. Hotels sell out a year in advance — book now or sleep in a van.",
      hostName: 'P-Town Bears',
      hostImg: imgs[1],
    },
    {
      kind: 'promo',
      id: 'promo-wbear-plus',
      promoAccent: 'gold',
      promoBadge: 'W|Bear+',
      promoTitle: 'Fund the community',
      promoSubtitle: 'Ticket credits · verified host tools · ad-free',
      promoCta: 'Join the supporters',
    },
    {
      id: 'ibr-sf',
      name: 'International Bear Rendezvous',
      meta: 'Feb 2027 · San Francisco',
      day: '12', mo: 'Feb', img: imgs[0],
      when: 'Feb 12–15, 2027 · 4 days',
      badge: 'Tickets',
      venueName: 'Hyatt Regency SFO',
      venueAddr: 'Burlingame, CA · multiple venues',
      going: 2104, interested: 4102, friends: 14,
      attendees: [0, 3, 5, 11, 7, 1, 9, 4, 8, 10],
      friendsLine: "<strong>Leo</strong>, <strong>Chris</strong> and 12 more of your bears are going",
      about: "IBR has been the West Coast's flagship bear run since 1995. Sunday bear contest, Saturday leather night, vendor mart, and the infamous 2am jockstrap pool party.",
      hostName: 'Bears of San Francisco',
      hostImg: imgs[0],
    },
    {
      id: 'sitges-bears',
      name: 'Bears del Mar Sitges',
      meta: 'Sep 4–11 · Spain',
      day: '04', mo: 'Sep', img: imgs[10],
      when: 'Sep 4–11 · 8 days',
      badge: 'Tickets',
      venueName: 'Sitges, Catalonia',
      venueAddr: 'Passeig de la Ribera · beachfront',
      going: 3210, interested: 6502, friends: 9,
      attendees: [10, 1, 5, 7, 0, 3, 11, 4],
      friendsLine: "<strong>Diego</strong>, <strong>Rafa</strong> and 7 more of your bears are going",
      about: "Sun, sangria, and Spanish bears on the Mediterranean. Beach meetups by day, parties at Mediterráneo and Organic by night. 30-minute train from Barcelona.",
      hostName: 'Bears Sitges',
      hostImg: imgs[10],
    },
    {
      id: 'lazy-bear',
      name: 'Lazy Bear Week',
      meta: 'Aug 2–9 · Guerneville, CA',
      day: '02', mo: 'Aug', img: imgs[5],
      when: 'Aug 2–9 · Russian River',
      badge: 'Tickets · $350',
      venueName: 'Russian River Resort area',
      venueAddr: 'Guerneville, CA · NorCal woods',
      going: 1542, interested: 2890, friends: 6,
      attendees: [5, 0, 3, 11, 7],
      friendsLine: "<strong>Sam</strong> and 5 more of your bears are going",
      about: "Woodsy, outdoorsy, intimate vibe. River floating by day, pool parties and dance nights at Rainbow Cattle and Highlands by night. A non-profit event that funds HIV/AIDS services.",
      hostName: 'Lazy Bear Fund',
      hostImg: imgs[5],
    },
    {
      kind: 'promo',
      id: 'promo-pride-roundup',
      promoAccent: 'pride',
      promoBadge: 'Pride 2026',
      promoTitle: 'Worldwide Pride roundup',
      promoSubtitle: '42 pride events in June · find your bears',
      promoCta: 'Explore',
    },
    {
      id: 'hibearnation',
      name: 'HiBearnation',
      meta: 'Jun 19–22 · Melbourne',
      day: '19', mo: 'Jun', img: imgs[7],
      when: 'Jun 19–22 · Winter weekend',
      badge: 'Tickets',
      venueName: 'Laird Hotel',
      venueAddr: '149 Gipps St · Abbotsford, Melbourne',
      going: 892, interested: 1440, friends: 3,
      attendees: [7, 0, 11, 4],
      friendsLine: "<strong>Owen</strong>, <strong>Finn</strong> and 1 more of your bears are going",
      about: "Australia's premier bear weekend. Fur Ball Saturday night, mid-winter tea dance at The Laird, bush walk on Sunday. Compact, cozy, and very Australian.",
      hostName: 'Bears Melbourne',
      hostImg: imgs[7],
    },
    {
      id: 'mad-bear',
      name: 'Mad Bear',
      meta: 'Sep 24–27 · Madrid',
      day: '24', mo: 'Sep', img: imgs[3],
      when: 'Sep 24–27 · Chueca district',
      badge: 'Tickets',
      venueName: 'Chueca',
      venueAddr: 'Plaza Chueca · multiple venues',
      going: 1740, interested: 3280, friends: 5,
      attendees: [3, 0, 11, 1, 7, 10],
      friendsLine: "<strong>Mateo</strong>, <strong>Diego</strong> and 3 more of your bears are going",
      about: "Madrid's bear weekend in the gay heart of the city. Pool party at Eurobuilding, Saturday's Fur Ball at Teatro Barceló, tapas crawl through Chueca all weekend.",
      hostName: 'Osos Madrid',
      hostImg: imgs[3],
    },
    {
      id: 'amsterdam-leather',
      name: 'Amsterdam Leather Pride',
      meta: 'Oct 22–26 · Amsterdam',
      day: '22', mo: 'Oct', img: imgs[9],
      when: 'Oct 22–26 · 5 days',
      badge: 'Dress code',
      venueName: 'Argos, Eagle Amsterdam',
      venueAddr: 'Warmoesstraat district',
      going: 2085, interested: 3902, friends: 4,
      attendees: [9, 3, 11, 0, 7],
      friendsLine: "<strong>Axel</strong> and 3 more of your bears are going",
      about: "Five days of leather, rubber, and kink. Stiefeltag (Boot Day), Mr Leather NL contest, and the legendary SameSame cruise.",
      hostName: 'Leather Pride NL',
      hostImg: imgs[9],
    },
  ];

  const eventsById = {};
  [...events, ...worldwideEvents].forEach(e => { if (e.kind !== 'promo') eventsById[e.id] = e; });

  function renderEventsRail(list) {
    // Preserve the static anchor label; clear only the event cards.
    Array.from(rail.querySelectorAll('.event-card')).forEach(c => c.remove());
    list.forEach(e => {
      const card = document.createElement('div');
      if (e.kind === 'promo') {
        card.className = 'event-card event-promo ' + (e.promoAccent || 'gold');
        card.dataset.promoId = e.id;
        card.innerHTML = `
          <div class="event-promo-badge">${e.promoBadge}</div>
          <div class="event-body">
            <div class="event-name">${e.promoTitle}</div>
            <div class="event-meta">${e.promoSubtitle}</div>
            <div class="event-promo-cta">${e.promoCta} ›</div>
          </div>`;
      } else {
        card.className = 'event-card';
        card.dataset.eventId = e.id;
        card.style.backgroundImage = `url('${e.img}')`;
        card.innerHTML = `
          <div class="event-date">${e.mo}<strong>${e.day}</strong></div>
          ${e.badge && e.badge.toLowerCase().includes('ticket') ? '<div class="event-ticket">Tickets</div>' : ''}
          <div class="event-body">
            <div class="event-name">${e.name}</div>
            <div class="event-meta">${e.meta}</div>
          </div>`;
      }
      rail.appendChild(card);
    });
  }
  renderEventsRail(events);
  window._renderEventsRail = renderEventsRail;
  window._chicagoEvents    = events;
  window._worldwideEvents  = worldwideEvents;

  // Open event detail on card click
  function openEvent(id) {
    const e = eventsById[id];
    if (!e) return;

    document.getElementById('eventHero').style.backgroundImage = `url('${e.img}')`;
    document.getElementById('eventHeroBadge').textContent = e.badge || '';
    document.getElementById('eventHeroTitle').textContent = e.name;
    document.getElementById('eventHeroWhen').textContent = e.when;
    document.getElementById('eventDateTile').innerHTML = `<span class="mo">${e.mo}</span><span class="day">${e.day}</span>`;

    document.getElementById('eventVenueName').textContent = e.venueName;
    document.getElementById('eventVenueAddr').textContent = e.venueAddr;

    // "Verified inclusive space" on events from a trusted set of venues
    const VERIFIED_VENUES = ['Touché','Progress Bar','@mosphere','Marty\'s Martini Bar','Big Chicks'];
    const isVerifiedSpace = !!e.verifiedSpace || VERIFIED_VENUES.some(v => (e.venueName || '').includes(v));
    document.getElementById('eventVerifiedSpace').style.display = isVerifiedSpace ? '' : 'none';

    // "Here now" section — only when event is live
    const hereBlock = document.getElementById('eventHereNow');
    if (e.liveNow && e.hereNow && e.hereNow.length) {
      hereBlock.style.display = '';
      document.getElementById('eventHereCount').textContent = `${e.hereCount} bears · ${e.hereNow.slice(0, 2).map(i => NAME_POOL[i % NAME_POOL.length]).join(', ')} and more of your pack`;
      const hereAvatars = document.getElementById('eventHereAvatars');
      hereAvatars.innerHTML = '';
      e.hereNow.slice(0, 6).forEach(i => {
        const av = document.createElement('div');
        av.className = 'av';
        av.style.backgroundImage = `url('${imgs[i % imgs.length]}')`;
        hereAvatars.appendChild(av);
      });
      if (e.hereCount > 6) {
        const over = document.createElement('div');
        over.className = 'overflow';
        over.textContent = `+${e.hereCount - 6}`;
        hereAvatars.appendChild(over);
      }
      // Reset soft check-in: prompt visible, confirmed hidden
      document.querySelector('#eventCheckinPrompt .checkin-prompt-title').innerHTML = `You're at <strong>${e.venueName}</strong>`;
      document.getElementById('eventCheckinPrompt').style.display = '';
      document.getElementById('eventCheckinConfirmed').style.display = 'none';
    } else {
      hereBlock.style.display = 'none';
    }

    document.getElementById('eventGoing').textContent = e.going.toLocaleString();
    document.getElementById('eventInterested').textContent = e.interested.toLocaleString();
    document.getElementById('eventFriends').textContent = e.friends;

    const att = document.getElementById('eventAttendees');
    att.innerHTML = '';
    const shown = e.attendees.slice(0, 6);
    shown.forEach(idx => {
      const a = document.createElement('div');
      a.className = 'event-attendee';
      a.style.backgroundImage = `url('${imgs[idx % imgs.length]}')`;
      att.appendChild(a);
    });
    if (e.going > shown.length) {
      const more = document.createElement('div');
      more.className = 'event-attendee-more';
      more.textContent = '+' + (e.going - shown.length);
      att.appendChild(more);
    }
    document.getElementById('eventAttendeeNote').innerHTML = e.friendsLine;

    document.getElementById('eventAbout').textContent = e.about;

    document.getElementById('eventHostAvatar').style.backgroundImage = `url('${e.hostImg}')`;
    document.getElementById('eventHostName').textContent = e.hostName;

    // Reset RSVP state
    document.querySelectorAll('#screenEvent .event-rsvp-btn').forEach(b => {
      b.classList.remove('active');
      if (b.dataset.rsvp === 'going') b.classList.add('primary');
    });

    // Related events: other 3 events excluding current
    const related = document.getElementById('eventRelated');
    related.innerHTML = '';
    events.filter(x => x.id !== e.id).slice(0, 4).forEach(r => {
      const c = document.createElement('div');
      c.className = 'event-card';
      c.dataset.eventId = r.id;
      c.style.backgroundImage = `url('${r.img}')`;
      c.innerHTML = `
        <div class="event-date">${r.mo}<strong>${r.day}</strong></div>
        <div class="event-body">
          <div class="event-name">${r.name}</div>
          <div class="event-meta">${r.meta}</div>
        </div>`;
      c.addEventListener('click', () => openEvent(r.id));
      related.appendChild(c);
    });

    document.getElementById('screenEvent').classList.add('show');
  }

  rail.addEventListener('click', (ev) => {
    const card = ev.target.closest('.event-card');
    if (!card || !card.dataset.eventId) return;
    openEvent(card.dataset.eventId);
  });

  // RSVP toggle inside event screen
  document.querySelectorAll('#screenEvent .event-rsvp-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.rsvp === 'invite') return;
      const wasActive = btn.classList.contains('active') || btn.classList.contains('primary');
      document.querySelectorAll('#screenEvent .event-rsvp-btn').forEach(b => {
        b.classList.remove('active'); b.classList.remove('primary');
      });
      if (!wasActive) btn.classList.add('active');
    });
  });

  // Soft check-in: "You're at X — share with your pack?" (prompt → confirmed)
  const prompt    = document.getElementById('eventCheckinPrompt');
  const confirmed = document.getElementById('eventCheckinConfirmed');
  const confirmBtn= document.getElementById('eventCheckinConfirm');
  const dismissBtn= document.getElementById('eventCheckinDismiss');
  const undoBtn   = document.getElementById('eventCheckinUndo');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      prompt.style.display = 'none';
      confirmed.style.display = 'flex';
    });
  }
  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      prompt.style.display = 'none';
    });
  }
  if (undoBtn) {
    undoBtn.addEventListener('click', () => {
      confirmed.style.display = 'none';
      prompt.style.display = '';
    });
  }

  window._openEvent = openEvent;
})();

// ── Ticker for online count ──
(() => {
  const el = document.getElementById('liveCount');
  if (!el) return;
  let n = 12847;
  setInterval(() => {
    n += Math.floor(Math.random() * 7) - 2;
    el.textContent = n.toLocaleString();
  }, 2600);
})();

// ── Shared content pools ──
const NAME_POOL = ['Marcus','Jake','Daniel','Chris','Sam','Alex','Ben','Ryan','Leo','Tom','Kai','Nate','Ethan','Axel','Diego','Owen','Finn','Hugo','Jonas','Mateo','Rafa','Bodhi','Silas','Theo','Wyatt','Levi','Harvey','Ezra'];
const CAPTION_POOL = [
  'Golden hour at the lake','Hiking season is back','Sunday vibes','New city, new adventures',
  'Post-gym energy','Weekend getaway','Coffee and chill','Nature therapy',
  'Bear week P-town 🐻','Beard game strong today','Cabin weekend','Morning light',
  'Sunset swim','Back on the bike','Brunch with the pack','Ptown sunset',
];
const HEART_SVG = '<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
const HEART_SMALL_SVG = '<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';

const COMMENT_POOL = [
  'This view tho 🔥',
  'Cabin goals',
  'Where is this?? Need to go',
  'Damn bro 🐻',
  'Looking rugged af',
  'Pics 🔥🔥',
  'Bro this is art',
  'Lucky 🍀',
  'I\'m coming to Chicago fr',
  'Need this in my life',
  'Perfect light',
  'Heading there next month 🙌',
  'Soft boy era',
  'Handsome af',
  'Send loc plz',
  'That beard 🧔',
  'Weekend vibes',
  'Bears of summer 👀',
  'Mood',
  'Goals',
  'Miss P-town so much',
  'The golden hour did you right',
];
const COMMENT_TIME = ['2m','8m','17m','32m','1h','3h','5h'];
const REPLY_POOL = [
  'hard agree',
  'facts',
  '😂😂',
  'ikr',
  '💯',
  'same',
  'lol',
  'thanks bear 🐻',
  'appreciate it',
  'tell me more',
  'we should link up',
  'gonna send you a DM',
  'let me know when 🙌',
  'saving this',
  'can confirm',
  'bro stop 😮‍💨',
  'noted ✍️',
  'that\'s fair',
];
const CHECK_SVG = '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>';
const COMMENT_SVG = '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
const MORE_SVG = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>';
const fmtLikes = n => n >= 1000 ? (n/1000).toFixed(1).replace(/\.0$/, '') + 'k' : n;
const fmtTime = t => /^\d/.test(t) ? `${t} ago` : t;

// Rotate image order each batch so the same shot never appears twice in a row.
// ── Masonry: cache natural aspect ratios per image src ──
const imgAspectCache = new Map();

function computeSpan(ratio, tileWidth) {
  // Read the current grid-auto-rows + row-gap so span honors whatever
  // the active theme sets. height(N) = N*row + (N-1)*gap.
  const mas = document.getElementById('masonry');
  const cs = mas ? getComputedStyle(mas) : null;
  const row = cs ? parseFloat(cs.gridAutoRows) || 2 : 2;
  const gap = cs ? parseFloat(cs.rowGap || cs.gap) || 5 : 5;
  const targetH = tileWidth * ratio;
  return Math.max(3, Math.round((targetH + gap) / (row + gap)));
}

function setMasonryItemSpan(div, img) {
  const cached = imgAspectCache.get(img.src);
  const apply = (ratio) => {
    const width = div.clientWidth || (div.parentElement?.clientWidth || 375) / 3 - 10;
    div.style.gridRowEnd = `span ${computeSpan(ratio, width)}`;
  };
  if (cached !== undefined) {
    apply(cached);
    return;
  }
  if (img.complete && img.naturalWidth) {
    const ratio = img.naturalHeight / img.naturalWidth;
    imgAspectCache.set(img.src, ratio);
    apply(ratio);
    return;
  }
  img.addEventListener('load', () => {
    const ratio = img.naturalHeight / img.naturalWidth;
    imgAspectCache.set(img.src, ratio);
    apply(ratio);
  }, { once: true });
}

// Pre-warm the cache: load each image once to know its aspect before
// tiles get rendered. Keeps the grid from jumping as images load.
imgs.forEach(src => {
  const p = new Image();
  p.src = src;
  p.addEventListener('load', () => {
    imgAspectCache.set(src, p.naturalHeight / p.naturalWidth);
  }, { once: true });
});

function shuffledImgs(seed) {
  const arr = [...imgs];
  // Simple seeded shuffle (Fisher-Yates with LCG)
  let s = seed * 9301 + 49297;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── Filter config per tab ──
const FOLLOWING_NAMES = ['Marcus','Jake','Daniel','Chris','Sam','Alex','Leo'];
const SHARE_CONTEXTS = [
  { kind: 'dm',     label: 'Marcus sent you this' },
  { kind: 'dm',     label: 'Jake shared with you' },
  { kind: 'chat',   label: 'From Bear Pride Chicago' },
  { kind: 'tag',    label: 'Daniel tagged you' },
  { kind: 'album',  label: 'Added to Cabin weekend' },
  { kind: 'dm',     label: 'Leo sent you this' },
  { kind: 'chat',   label: 'From Lumberjack Social' },
  { kind: 'tag',    label: 'Chris tagged you' },
  { kind: 'album',  label: 'Added to Roadtrip \'26' },
  { kind: 'dm',     label: 'Alex shared with you' },
  { kind: 'chat',   label: 'From Woofs of Boystown' },
  { kind: 'tag',    label: 'Sam tagged you' },
];
const LOCAL_NEIGHBORHOODS = ['Boystown','Andersonville','Lakeview','Logan Sq.','Wicker Park','Edgewater','Pilsen','River North','Old Town','Hyde Park'];
const SHARE_ICON_SVG = '<svg viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>';
const TAG_ICON_SVG   = '<svg viewBox="0 0 24 24"><path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>';
const CHAT_ICON_SVG  = '<svg viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';
const ALBUM_ICON_SVG = '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
const PIN_ICON_SVG   = '<svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
const USERS_ICON_SVG = '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
const SHARE_BIG_SVG  = '<svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>';

let currentFilter = 'worldwide';

// ── Post detail (lightbox-ish) ──
const DM_SUGGESTED = [
  'Where was this taken?',
  'Looking 🔥',
  '😍',
  'Got plans this weekend?',
  'We should link up',
  'That beard 🧔',
];

function openPost(data) {
  const name      = data.postName || 'Bear';
  const img       = data.postImg;
  const avatarImg = data.postAvatar || img;
  const likes     = parseInt(data.postLikes || '0', 10);
  const verified  = data.postVerified === '1';
  const idx       = parseInt(data.postIdx || '0', 10);
  const caption   = data.postCaption || CAPTION_POOL[idx % CAPTION_POOL.length];
  const time      = data.postTime    || timeLabels[idx % timeLabels.length];
  const commentCount = Math.max(2, Math.floor(likes / 3));
  const hood = LOCAL_NEIGHBORHOODS[idx % LOCAL_NEIGHBORHOODS.length];

  document.getElementById('postHeaderAvatar').style.backgroundImage = `url('${avatarImg}')`;
  const postPronouns = ['he/him','they/them','he/they'][idx % 3];
  document.getElementById('postHeaderName').innerHTML = name + (verified ? ' <span class="feed-verified-mark">✓</span>' : '') + `<span class="pronoun-tag">${postPronouns}</span>`;
  document.getElementById('postHeaderMeta').textContent = `${hood} · ${fmtTime(time)}`;

  document.getElementById('postImg').src = img;
  document.getElementById('postLikeCount').textContent = fmtLikes(likes);
  document.getElementById('postCommentCount').textContent = fmtLikes(commentCount);
  document.getElementById('postCommentsCountInline').textContent = fmtLikes(commentCount);

  document.getElementById('postCaption').innerHTML =
    `<strong>${name}</strong> ${caption}` +
    `<div class="post-caption-meta">` +
      `<span><svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${hood}</span>` +
      `<span>${fmtTime(time)}</span>` +
      `<span>#bearlife</span>` +
      `<span>#chicago</span>` +
    `</div>`;

  // Online state is deterministic per bear — roughly 40% online
  const online = (idx * 7 + idx) % 5 < 2;
  const dmCta   = document.getElementById('postDmCta');
  const dmChips = document.getElementById('postDmChips');
  if (online) {
    document.getElementById('postDmName').textContent = name;
    const presence = document.getElementById('postConnectPresence');
    if (presence) presence.style.display = online ? '' : 'none';
    dmCta.style.display = '';
    dmChips.style.display = '';
    dmChips.innerHTML = '';
    DM_SUGGESTED.forEach(txt => {
      const c = document.createElement('div');
      c.className = 'post-dm-chip';
      c.textContent = txt;
      dmChips.appendChild(c);
    });
  } else {
    dmCta.style.display = 'none';
    dmChips.style.display = 'none';
  }

  // Comments: 8 generated, 1 with a two-reply thread (i%3===1-style idx)
  const commentsContainer = document.getElementById('postComments');
  commentsContainer.innerHTML = '';
  const shufImgs = shuffledImgs(idx + 50);
  for (let c = 0; c < 8; c++) {
    const cName  = (currentFilter === 'following' || currentFilter === 'shared' ? FOLLOWING_NAMES : NAME_POOL)[(idx * 5 + c * 3) % (currentFilter === 'following' ? FOLLOWING_NAMES.length : NAME_POOL.length)];
    const cText  = COMMENT_POOL[(idx * 3 + c * 7) % COMMENT_POOL.length];
    const cImg   = shufImgs[c % shufImgs.length];
    const cTime  = COMMENT_TIME[(idx + c) % COMMENT_TIME.length];
    const cLikes = ((idx * 13 + c * 11) % 28);
    const cLiked = (c % 5 === 2);

    const el = document.createElement('div');
    el.className = 'feed-comment';
    el.innerHTML = `
      <div class="feed-comment-avatar" style="background-image:url('${cImg}');"></div>
      <div class="feed-comment-body">
        <strong>${cName}</strong>
        <span class="feed-comment-text">${cText}</span>
        <span class="feed-comment-meta">
          <span>${cTime}</span>
          <span class="feed-comment-like ${cLiked ? 'liked' : ''}">${HEART_SMALL_SVG}<span>${cLikes}</span></span>
        </span>
      </div>`;
    commentsContainer.appendChild(el);

    // Thread under comment #2
    if (c === 2) {
      const thread = document.createElement('div');
      thread.className = 'feed-reply-thread';
      const replies = [
        { name: NAME_POOL[(idx + 1) % NAME_POOL.length], text: `<span class="feed-reply-mention">@${cName}</span> ${REPLY_POOL[idx % REPLY_POOL.length]}`, time: COMMENT_TIME[(idx+2) % COMMENT_TIME.length], likes: 3, img: shufImgs[(c+3) % shufImgs.length] },
        { name: NAME_POOL[(idx + 4) % NAME_POOL.length], text: REPLY_POOL[(idx + 5) % REPLY_POOL.length], time: COMMENT_TIME[(idx+4) % COMMENT_TIME.length], likes: 1, img: shufImgs[(c+5) % shufImgs.length] },
      ];
      replies.forEach(r => {
        thread.insertAdjacentHTML('beforeend', `
          <div class="feed-reply">
            <div class="feed-reply-avatar" style="background-image:url('${r.img}');"></div>
            <div class="feed-reply-body">
              <strong>${r.name}</strong>
              <span class="feed-comment-text">${r.text}</span>
              <span class="feed-reply-meta">
                <span>${r.time}</span>
                <span class="feed-comment-like">${HEART_SMALL_SVG}<span>${r.likes}</span></span>
              </span>
            </div>
          </div>`);
      });
      commentsContainer.appendChild(thread);
    }
  }

  // "More from X" grid (6 items)
  const related = document.getElementById('postRelated');
  document.getElementById('postRelatedName').textContent = name;
  related.innerHTML = '';
  for (let r = 0; r < 6; r++) {
    const it = document.createElement('div');
    it.className = 'post-related-item';
    it.style.backgroundImage = `url('${shufImgs[(r + 1) % shufImgs.length]}')`;
    related.appendChild(it);
  }

  document.getElementById('screenPost').classList.add('show');
  document.querySelector('#screenPost .post-body').scrollTop = 0;
}

// Click handlers on grid + feed
function wirePostClicks() {
  const masonry = document.getElementById('masonry');
  const feed = document.getElementById('feed');
  if (!masonry.dataset.wired) {
    masonry.addEventListener('click', (e) => {
      const item = e.target.closest('.masonry-item');
      if (!item) return;
      openPost(item.dataset);
    });
    masonry.dataset.wired = '1';
  }
  if (!feed.dataset.wired) {
    feed.addEventListener('click', (e) => {
      if (e.target.closest('button, input, .feed-action-btn, .feed-comment-like, .feed-add-comment, .feed-reply-toggle, .feed-more, .feed-comments-link')) return;
      const card = e.target.closest('.feed-card');
      if (card) openPost(card.dataset);
    });
    feed.dataset.wired = '1';
  }
}

// Toggle heart on the big post detail action
document.addEventListener('click', (e) => {
  const btn = e.target.closest('#postLikeBtn');
  if (btn) btn.classList.toggle('liked');
  const save = e.target.closest('#screenPost .post-save');
  if (save) save.classList.toggle('saved');
});

// ── Generate masonry grid (infinite) ──
const masonry = document.getElementById('masonry');
let masonryBatch = 0;
let masonryIndex = 0;
function appendMasonryBatch(count = 12) {
  const pool = shuffledImgs(masonryBatch);
  const f = currentFilter;
  for (let k = 0; k < count; k++) {
    const i = masonryIndex++;
    let name;
    if (f === 'following' || f === 'shared') {
      name = FOLLOWING_NAMES[i % FOLLOWING_NAMES.length];
    } else {
      name = NAME_POOL[i % NAME_POOL.length];
    }
    const likes = 12 + ((i * 97 + 31) % (f === 'following' ? 420 : f === 'shared' ? 180 : 1900));
    const verified = (f === 'following') ? (i % 2 === 0) : (i * 7 % 3 === 0);
    const featured = (f === 'worldwide') && ((i === 2) || ((i > 5) && (i % 23 === 0)));
    const alwaysOverlay = featured || (i % 3 === 0);
    const div = document.createElement('div');
    div.className = 'masonry-item' + (featured ? ' featured' : '');
    div.style.cursor = 'pointer';
    div.dataset.postImg = pool[k % pool.length];
    div.dataset.postName = name;
    div.dataset.postLikes = likes;
    div.dataset.postVerified = verified ? '1' : '';
    div.dataset.postIdx = i;
    const img = document.createElement('img');
    img.src = pool[k % pool.length];
    img.alt = `Photo by ${name}`;
    img.loading = 'lazy';
    // Size the tile to the image's natural aspect so there's no cropping.
    setMasonryItemSpan(div, img);
    div.appendChild(img);

    if (featured) {
      const boost = document.createElement('div');
      boost.className = 'grid-boost';
      boost.innerHTML = '<span class="grid-boost-mark">✦</span><span class="grid-boost-text">Featured</span>';
      div.appendChild(boost);
    } else if (f === 'shared') {
      const ctx = SHARE_CONTEXTS[i % SHARE_CONTEXTS.length];
      const icon = ctx.kind === 'chat' ? CHAT_ICON_SVG
                 : ctx.kind === 'tag'   ? TAG_ICON_SVG
                 : ctx.kind === 'album' ? ALBUM_ICON_SVG
                 : SHARE_ICON_SVG;
      const chip = document.createElement('div');
      chip.className = 'grid-chip shared';
      chip.innerHTML = `${icon}<span>${ctx.label}</span>`;
      div.appendChild(chip);
    } else if (verified) {
      const v = document.createElement('div');
      v.className = 'grid-verified';
      v.innerHTML = CHECK_SVG;
      div.appendChild(v);
    }

    const subtitle = f === 'local'
      ? `<span class="grid-name">${name} · ${LOCAL_NEIGHBORHOODS[i % LOCAL_NEIGHBORHOODS.length]}</span>`
      : `<span class="grid-name">${name}${verified ? ' ✓' : ''}</span>`;
    const overlay = document.createElement('div');
    overlay.className = 'grid-overlay' + (alwaysOverlay ? ' always' : '');
    overlay.innerHTML = `${subtitle}<span class="grid-likes">${HEART_SVG} ${fmtLikes(likes)}</span>`;
    div.appendChild(overlay);
    masonry.appendChild(div);
  }
  masonryBatch++;
}
appendMasonryBatch(18);

// ── Generate feed view (infinite) ──
const feed = document.getElementById('feed');
let feedBatch = 0;
let feedIndex = 0;
const timeLabels = ['2h','4h','6h','12h','1d','1d','2d','3d','3d','4d','5d','1w'];
function appendFeedBatch(count = 6) {
  const pool = shuffledImgs(feedBatch + 1000);
  const f = currentFilter;
  for (let k = 0; k < count; k++) {
    const i = feedIndex++;
    let name;
    if (f === 'following' || f === 'shared') {
      name = FOLLOWING_NAMES[(i * 3) % FOLLOWING_NAMES.length];
    } else {
      name = NAME_POOL[(i * 3) % NAME_POOL.length];
    }
    const avatarImg = pool[(k + 7) % pool.length];
    const postImg = pool[k % pool.length];
    const likes = 12 + ((i * 113 + 17) % (f === 'following' ? 320 : f === 'shared' ? 160 : 1400));
    const caption = CAPTION_POOL[i % CAPTION_POOL.length];
    const time = timeLabels[i % timeLabels.length];
    const liked = (i % 4 === 1);
    const verified = f === 'following' ? (i % 2 === 0) : (i % 5 === 0);

    let attribution = '';
    if (f === 'shared') {
      const ctx = SHARE_CONTEXTS[i % SHARE_CONTEXTS.length];
      const icon = ctx.kind === 'chat' ? CHAT_ICON_SVG
                 : ctx.kind === 'tag'   ? TAG_ICON_SVG
                 : ctx.kind === 'album' ? ALBUM_ICON_SVG
                 : SHARE_ICON_SVG;
      attribution = `<div class="feed-attribution shared">${icon}<span>${ctx.label}</span></div>`;
    } else if (f === 'local') {
      const dist = (0.2 + ((i * 37) % 98) / 10).toFixed(1);
      const hood = LOCAL_NEIGHBORHOODS[i % LOCAL_NEIGHBORHOODS.length];
      attribution = `<div class="feed-attribution">${PIN_ICON_SVG}<span>${dist} mi · ${hood}</span></div>`;
    }

    // Build 2 teaser comments from deterministic pool picks
    const commentCount = Math.max(2, Math.floor(likes / 3));
    const commenterPool = f === 'following' || f === 'shared' ? FOLLOWING_NAMES : NAME_POOL;
    const c1Name  = commenterPool[(i * 5 + 2) % commenterPool.length];
    const c2Name  = commenterPool[(i * 11 + 7) % commenterPool.length];
    const c1Text  = COMMENT_POOL[(i * 3) % COMMENT_POOL.length];
    const c2Text  = COMMENT_POOL[(i * 7 + 4) % COMMENT_POOL.length];
    const c1Img   = pool[(i + 2) % pool.length];
    const c2Img   = pool[(i + 5) % pool.length];
    const c1Time  = COMMENT_TIME[i % COMMENT_TIME.length];
    const c2Time  = COMMENT_TIME[(i + 3) % COMMENT_TIME.length];
    const c1Likes = ((i * 13 + 1) % 24) + 1;
    const c2Likes = ((i * 7 + 3) % 14);
    const c1Liked = (i % 5 === 2);

    // Threaded replies: some cards (i % 3 === 1) get a thread under c1,
    // a subset of those (i % 6 === 4) get an expanded mini-thread with
    // two replies instead of the single "View replies" collapser.
    let c1Thread = '';
    if (i % 3 === 1) {
      const r1Name  = commenterPool[(i * 2 + 9) % commenterPool.length];
      const r2Name  = commenterPool[(i * 4 + 3) % commenterPool.length];
      const r1Text  = REPLY_POOL[(i * 5) % REPLY_POOL.length];
      const r2Text  = REPLY_POOL[(i * 9 + 2) % REPLY_POOL.length];
      const r1Img   = pool[(i + 3) % pool.length];
      const r2Img   = pool[(i + 7) % pool.length];
      const r1Time  = COMMENT_TIME[(i + 1) % COMMENT_TIME.length];
      const r2Time  = COMMENT_TIME[(i + 4) % COMMENT_TIME.length];
      const r1Likes = ((i * 3) % 8) + 1;
      const expanded = i % 6 === 4;
      const moreCount = ((i * 17) % 7) + 2;
      if (expanded) {
        c1Thread = `
          <div class="feed-reply-thread">
            <div class="feed-reply">
              <div class="feed-reply-avatar" style="background-image:url('${r1Img}');"></div>
              <div class="feed-reply-body">
                <strong>${r1Name}</strong>
                <span class="feed-comment-text"><span class="feed-reply-mention">@${c1Name}</span> ${r1Text}</span>
                <span class="feed-reply-meta">
                  <span>${r1Time}</span>
                  <span class="feed-comment-like">${HEART_SMALL_SVG}<span>${r1Likes}</span></span>
                </span>
              </div>
            </div>
            <div class="feed-reply">
              <div class="feed-reply-avatar" style="background-image:url('${r2Img}');"></div>
              <div class="feed-reply-body">
                <strong>${r2Name}</strong>
                <span class="feed-comment-text">${r2Text}</span>
                <span class="feed-reply-meta">
                  <span>${r2Time}</span>
                  <span class="feed-comment-like">${HEART_SMALL_SVG}<span>0</span></span>
                </span>
              </div>
            </div>
            <div class="feed-reply-toggle">Hide replies</div>
          </div>`;
      } else {
        c1Thread = `
          <div class="feed-reply-thread">
            <div class="feed-reply-toggle">View ${moreCount} replies</div>
          </div>`;
      }
    }

    const card = document.createElement('div');
    card.className = 'feed-card';
    card.dataset.postImg = postImg;
    card.dataset.postAvatar = avatarImg;
    card.dataset.postName = name;
    card.dataset.postLikes = likes;
    card.dataset.postCaption = caption;
    card.dataset.postTime = time;
    card.dataset.postVerified = verified ? '1' : '';
    card.dataset.postIdx = i;
    card.innerHTML = `
      ${attribution}
      <div class="feed-header">
        <div class="feed-avatar" style="background-image:url('${avatarImg}');"></div>
        <div class="feed-user">
          <div class="feed-username">${name}${verified ? ' <span class="feed-verified-mark">✓</span>' : ''}<span class="pronoun-tag">${['he/him','they/them','he/they'][i % 3]}</span></div>
          <div class="feed-time">${fmtTime(time)}</div>
        </div>
        <button class="feed-more">${MORE_SVG}</button>
      </div>
      <img class="feed-img" src="${postImg}" alt="Post by ${name}" loading="lazy">
      <div class="feed-actions">
        <button class="feed-action-btn ${liked ? 'liked' : ''}">${HEART_SVG}<span>${fmtLikes(likes)}</span></button>
        <button class="feed-action-btn">${COMMENT_SVG}<span>${fmtLikes(commentCount)}</span></button>
      </div>
      <div class="feed-caption"><strong>${name}</strong> ${caption}</div>
      <div class="feed-comments-link">View all ${fmtLikes(commentCount)} comments</div>
      <div class="feed-comment">
        <div class="feed-comment-avatar" style="background-image:url('${c1Img}');"></div>
        <div class="feed-comment-body">
          <strong>${c1Name}</strong>
          <span class="feed-comment-text">${c1Text}</span>
          <span class="feed-comment-meta">
            <span>${c1Time}</span>
            <span class="feed-comment-like ${c1Liked ? 'liked' : ''}">${HEART_SMALL_SVG}<span>${c1Likes}</span></span>
          </span>
        </div>
      </div>
      ${c1Thread}
      <div class="feed-comment">
        <div class="feed-comment-avatar" style="background-image:url('${c2Img}');"></div>
        <div class="feed-comment-body">
          <strong>${c2Name}</strong>
          <span class="feed-comment-text">${c2Text}</span>
          <span class="feed-comment-meta">
            <span>${c2Time}</span>
            <span class="feed-comment-like">${HEART_SMALL_SVG}<span>${c2Likes}</span></span>
          </span>
        </div>
      </div>
      <div class="feed-add-comment">
        <div class="feed-add-avatar"></div>
        <input class="feed-add-input" placeholder="Add a comment…" readonly>
        <span class="feed-add-send">Post</span>
      </div>`;
    feed.appendChild(card);
  }
  feedBatch++;
}
appendFeedBatch(6);
wirePostClicks();

// Like toggle (delegated)
feed.addEventListener('click', (e) => {
  const btn = e.target.closest('.feed-action-btn');
  if (btn) {
    const isHeart = btn === btn.parentElement.firstElementChild;
    if (isHeart) btn.classList.toggle('liked');
    return;
  }
  const commentLike = e.target.closest('.feed-comment-like');
  if (commentLike) {
    commentLike.classList.toggle('liked');
    const counter = commentLike.querySelector('span');
    if (counter) {
      const n = parseInt(counter.textContent, 10) || 0;
      counter.textContent = commentLike.classList.contains('liked') ? n + 1 : Math.max(0, n - 1);
    }
  }
});

// ── Sticky filter bar "stuck" state — toggle a class when the zero-height
//    sentinel just above the filter bar scrolls past the sticky top offset.
//    That's the trick to detect sticky-pinned state in pure CSS+IO. ──
(() => {
  const pairs = [
    { sentinel: '.following-filter-sentinel', bar: '#followingFilterBar' },
    { sentinel: '.shared-filter-sentinel',    bar: '#sharedFilterBar' },
  ];
  pairs.forEach(({ sentinel: selS, bar: selB }) => {
    const sEl = document.querySelector(selS);
    const bEl = document.querySelector(selB);
    if (!sEl || !bEl) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        // When the sentinel is below the sticky threshold (not intersecting),
        // the bar is stuck — switch to the compact full-bleed style.
        bEl.classList.toggle('stuck', entry.intersectionRatio < 1);
      },
      { root: document.querySelector('.app-shell'), rootMargin: '-55px 0px 0px 0px', threshold: [1] }
    );
    io.observe(sEl);
  });
})();

// ── Hide sticky filter bars when the first grid photo reaches them ──
(() => {
  const root = document.querySelector('.app-shell');
  const gridScroll = document.querySelector('.grid-scroll');
  const masonry = document.getElementById('masonry');
  if (!root || !gridScroll || !masonry) return;
  const sentinel = document.createElement('div');
  sentinel.className = 'photo-touch-sentinel';
  sentinel.style.cssText = 'height:1px;width:100%;';
  gridScroll.insertBefore(sentinel, masonry);
  const targets = ['#followingFilterBar', '#sharedFilterBar']
    .map(s => document.querySelector(s)).filter(Boolean);
  const io = new IntersectionObserver(
    ([entry]) => {
      const aboveLine = !entry.isIntersecting && entry.boundingClientRect.top < 84;
      targets.forEach(bar => bar.classList.toggle('hidden-by-photo', aboveLine));
    },
    { root, rootMargin: '-84px 0px 0px 0px', threshold: [0, 1] }
  );
  io.observe(sentinel);
})();

// ── Infinite scroll observer ──
(() => {
  const scrollRoot = document.querySelector('.app-shell');
  const gridScroll = document.querySelector('.grid-scroll');
  // Sentinel appended once; we append batches *before* it so it stays last.
  const sentinel = document.createElement('div');
  sentinel.className = 'scroll-sentinel';
  sentinel.style.cssText = 'height:1px;width:100%;';
  gridScroll.appendChild(sentinel);

  let loading = false;
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting || loading) continue;
      loading = true;
      // Append to whichever view is active
      if (masonry.classList.contains('active')) {
        appendMasonryBatch(12);
      } else if (feed.classList.contains('active') && currentFilter !== 'shared') {
        appendFeedBatch(6);
      }
      // Keep sentinel at bottom, then re-observe so we get another callback
      // when the sentinel is still in the intersection zone after the append.
      gridScroll.appendChild(sentinel);
      io.unobserve(sentinel);
      requestAnimationFrame(() => {
        io.observe(sentinel);
        loading = false;
      });
    }
  }, { root: scrollRoot, rootMargin: '600px 0px' });
  io.observe(sentinel);
})();

// ── Hero collapse on scroll (Worldwide only) ──
(() => {
  const scrollRoot = document.querySelector('.app-shell');
  const liveStrip = document.getElementById('liveStrip');
  if (!scrollRoot || !liveStrip) return;

  liveStrip.style.transition =
    'opacity 0.12s linear, transform 0.12s linear, ' +
    'max-height 0.25s ease, margin-bottom 0.25s ease, ' +
    'padding-top 0.25s ease, padding-bottom 0.25s ease, ' +
    'border-width 0.25s ease';
  liveStrip.style.willChange = 'opacity, transform, max-height';

  let ticking = false;
  const DISTANCE = 64;

  const apply = (p) => {
    liveStrip.style.opacity = String(1 - p);
    liveStrip.style.transform = `translateY(${-p * 16}px)`;
    liveStrip.style.maxHeight = p >= 1 ? '0' : '80px';
    liveStrip.style.marginBottom = `${12 * (1 - p)}px`;
    liveStrip.style.paddingTop = `${10 * (1 - p)}px`;
    liveStrip.style.paddingBottom = `${10 * (1 - p)}px`;
    liveStrip.style.borderTopWidth = p >= 1 ? '0' : '1px';
    liveStrip.style.borderBottomWidth = p >= 1 ? '0' : '1px';
    liveStrip.style.overflow = 'hidden';
  };

  const update = () => {
    ticking = false;
    if (currentFilter !== 'worldwide') { apply(0); return; }
    const p = Math.min(1, Math.max(0, scrollRoot.scrollTop / DISTANCE));
    apply(p);
  };

  scrollRoot.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });

  // Reset when coming back to Worldwide
  window.__resetHeroCollapse = () => apply(0);
})();

// ── View toggle ──
(() => {
  const btnGrid = document.getElementById('btnGrid');
  const btnFeed = document.getElementById('btnFeed');
  const masonry = document.getElementById('masonry');
  const feed = document.getElementById('feed');

  btnGrid.addEventListener('click', () => {
    if (btnGrid.classList.contains('active')) {
      // Second tap on grid: toggle perfect uniform grid
      const isUniform = masonry.classList.toggle('uniform');
      btnGrid.classList.toggle('uniform', isUniform);
    } else {
      btnGrid.classList.add('active');
      btnFeed.classList.remove('active');
      masonry.classList.add('active');
      feed.classList.remove('active');
      // Fresh grid starts as masonry
      masonry.classList.remove('uniform');
      btnGrid.classList.remove('uniform');
    }
  });
  btnFeed.addEventListener('click', () => {
    btnFeed.classList.add('active');
    btnGrid.classList.remove('active');
    btnGrid.classList.remove('uniform');
    feed.classList.add('active');
    masonry.classList.remove('active');
    masonry.classList.remove('uniform');
  });
})();

// ── Generate explore grid ──
(() => {
  const grid = document.getElementById('exploreGrid');
  const h = [200, 160, 220, 180, 190, 170, 210, 150, 195, 175, 230, 160];
  for (let i = 0; i < 12; i++) {
    const div = document.createElement('div');
    div.className = 'explore-cell';
    div.style.height = h[i] + 'px';
    const img = document.createElement('img');
    img.src = imgs[(i + 3) % imgs.length];
    img.loading = 'lazy';
    div.appendChild(img);
    grid.appendChild(div);
  }
})();

// ── Generate chat list ──
(() => {
  const list = document.getElementById('chatList');
  const chats = [
    { name: 'Marcus', msg: 'typing…', time: 'now', img: imgs[0], online: true, verified: true, unread: 2, typing: true },
    { name: 'Jake', msg: 'That hike was incredible man', time: '15m', img: imgs[1], online: true, unread: 1 },
    { name: 'Daniel', msg: '📷 Sent you a photo', time: '1h', img: imgs[3], online: true, verified: true },
    { name: 'Chris', msg: 'Happy birthday! 🎂', time: '3h', img: imgs[9] },
    { name: 'Sam', msg: 'Are you coming to the meetup?', time: '5h', img: imgs[4], online: true },
    { name: 'Alex', msg: 'Nice profile pic 👍', time: '1d', img: imgs[5], verified: true },
    { name: 'Ben', msg: 'Let me know when you arrive', time: '1d', img: imgs[6] },
    { name: 'Ryan', msg: 'Thanks for the recommendation', time: '2d', img: imgs[7] },
  ];
  const checkSvg = '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>';
  chats.forEach(c => {
    const row = document.createElement('div');
    row.className = 'chat-row';
    row.innerHTML = `
      <div class="chat-avatar-wrap">
        <div class="chat-avatar" style="background-image:url('${c.img}');"></div>
        ${c.online ? '<div class="chat-online"></div>' : ''}
      </div>
      <div class="chat-info">
        <div class="chat-name-row">
          <span class="chat-name">${c.name}</span>
          ${c.verified ? `<span class="chat-verified">${checkSvg}</span>` : ''}
        </div>
        <div class="chat-preview${c.typing ? ' typing' : ''}">${c.msg}</div>
      </div>
      <div class="chat-right">
        <span class="chat-time">${c.time}</span>
        ${c.unread ? `<span class="chat-unread">${c.unread}</span>` : ''}
      </div>`;
    list.appendChild(row);
  });
})();

// ── Generate more menu ──
(() => {
  const list = document.getElementById('moreList');
  const items = [
    { label: 'Profile', icon: '<circle cx="12" cy="7" r="4"/><path d="M5.5 21a6.5 6.5 0 0 1 13 0"/>' },
    { label: 'Saved', icon: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>' },
    { label: 'Settings', icon: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>' },
    { label: 'Notifications', icon: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>' },
    { label: 'Privacy', icon: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>' },
    { label: 'Help', icon: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>' },
  ];
  items.forEach(item => {
    const row = document.createElement('div');
    row.className = 'more-row';
    row.innerHTML = `
      <div class="more-icon"><svg viewBox="0 0 24 24">${item.icon}</svg></div>
      <span class="more-label">${item.label}</span>`;
    list.appendChild(row);
  });
})();

// ── Generate profile community section ──
(() => {
  const list = document.getElementById('profileCommunity');
  if (!list) return;
  const items = [
    { label: 'My groups', icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>' },
    { label: 'Identity & pronouns', icon: '<circle cx="12" cy="8" r="4"/><path d="M6 21v-2a6 6 0 0 1 12 0v2"/>' },
    { label: 'Community guidelines', icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/>' },
    { label: 'Blocked & muted', icon: '<circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>' },
    { label: 'Report a problem', icon: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>' },
    { label: 'Request verification', icon: '<polyline points="20 6 9 17 4 12"/>' },
  ];
  items.forEach(item => {
    const row = document.createElement('div');
    row.className = 'more-row';
    row.innerHTML = `
      <div class="more-icon"><svg viewBox="0 0 24 24">${item.icon}</svg></div>
      <span class="more-label">${item.label}</span>`;
    list.appendChild(row);
  });
})();

// ── Generate profile settings ──
(() => {
  const list = document.getElementById('profileSettings');
  const items = [
    { label: 'Edit Profile', icon: '<circle cx="12" cy="7" r="4"/><path d="M5.5 21a6.5 6.5 0 0 1 13 0"/>' },
    { label: 'Notifications', icon: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>' },
    { label: 'Privacy', icon: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>' },
    { label: 'Saved', icon: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>' },
    { label: 'Appearance', icon: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>' },
    { label: 'Help', icon: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>' },
    { label: 'Log out', icon: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>' },
  ];
  items.forEach(item => {
    const row = document.createElement('div');
    row.className = 'more-row';
    row.innerHTML = `
      <div class="more-icon"><svg viewBox="0 0 24 24">${item.icon}</svg></div>
      <span class="more-label">${item.label}</span>`;
    list.appendChild(row);
  });
})();

// ── Top nav buttons ──
document.getElementById('avatarBtn').addEventListener('click', () => {
  document.getElementById('screenProfile').classList.add('show');
});
// ── Inbox (unified Messages + Activity) ──
function openInbox(segment = 'messages') {
  const screen = document.getElementById('screenInbox');
  // Select segment
  document.querySelectorAll('#screenInbox .inbox-segment').forEach(s => {
    s.classList.toggle('active', s.dataset.inboxTab === segment);
  });
  document.querySelectorAll('#screenInbox .inbox-panel').forEach(p => {
    p.classList.toggle('active', p.dataset.panel === segment);
  });
  // Compose button: visible only on Messages
  document.getElementById('chatComposeBtn').style.display = segment === 'messages' ? '' : 'none';
  screen.classList.add('show');
}
document.getElementById('inboxBtn').addEventListener('click', () => openInbox('messages'));
document.querySelectorAll('#screenInbox .inbox-segment').forEach(seg => {
  seg.addEventListener('click', () => openInbox(seg.dataset.inboxTab));
});
document.getElementById('openMapBtn').addEventListener('click', () => {
  document.getElementById('screenMap').classList.add('show');
});
document.getElementById('locBtn').addEventListener('click', () => {
  document.getElementById('screenMap').classList.add('show');
});
// Local heatmap card ("Open map" button + tap anywhere on the map area)
document.getElementById('tabContextSlot').addEventListener('click', (e) => {
  if (e.target.closest('.heatmap-cta') || e.target.closest('#heatmapCard')) {
    document.getElementById('screenMap').classList.add('show');
  }
});

// ── Populate map pins + nearby sheet ──
(() => {
  const canvas = document.getElementById('mapCanvas');
  const sheet = document.getElementById('mapSheetList');
  // [x%, y%, imgIdx, distFt, nameIdx, online]
  const pins = [
    [30, 35, 0, 420, 0, true],
    [68, 30, 1, 650, 1, true],
    [25, 62, 3, 780, 2, false],
    [75, 60, 4, 920, 3, true],
    [42, 22, 5, 1100, 4, true],
    [62, 72, 6, 1340, 5, false],
    [20, 40, 7, 1550, 6, true],
    [80, 45, 9, 1710, 7, false],
    [35, 80, 11, 1920, 8, true],
  ];
  pins.forEach(([x, y, img, dist, nameI, online]) => {
    const pin = document.createElement('div');
    pin.className = 'map-pin';
    pin.style.left = `calc(${x}% - 18px)`;
    pin.style.top = `calc(${y}% - 18px)`;
    pin.style.backgroundImage = `url('${imgs[img]}')`;
    if (online) {
      const dot = document.createElement('div');
      dot.className = 'map-pin-online';
      pin.appendChild(dot);
    }
    canvas.appendChild(pin);
  });

  const fmtDist = ft => ft < 1000 ? `${ft} ft` : `${(ft/5280).toFixed(1)} mi`;
  const sorted = [...pins].sort((a, b) => a[3] - b[3]);
  sorted.forEach(([, , img, dist, nameI, online]) => {
    const row = document.createElement('div');
    row.className = 'map-sheet-row';
    const name = NAME_POOL[nameI % NAME_POOL.length];
    row.innerHTML = `
      <div class="map-sheet-avatar" style="background-image:url('${imgs[img]}');">
        ${online ? '<div class="chat-online"></div>' : ''}
      </div>
      <div class="map-sheet-info">
        <div class="map-sheet-name">${name}</div>
        <div class="map-sheet-sub">${online ? 'Online now' : 'Active 2h ago'} · Bear · 34</div>
      </div>
      <span class="map-sheet-dist">${fmtDist(dist)}</span>
      <button class="map-sheet-action">Wave</button>`;
    sheet.appendChild(row);
  });
})();

// ── Theme cycle (Dark → Light → Ember Soft → Comfort → Dark) via Profile → Appearance ──
const THEME_ORDER = ['dark', 'light', 'ember', 'comfort'];
const THEME_LABEL = { dark: 'Dark', light: 'Light', ember: 'Ember Soft', comfort: 'Comfort (40+)' };
function applyTheme(theme) {
  const html = document.documentElement;
  html.classList.remove('light', 'ember', 'comfort');
  if (theme === 'light') html.classList.add('light');
  else if (theme === 'ember') html.classList.add('ember'); // Ember Soft = dark variant
  else if (theme === 'comfort') {
    // Comfort rides on top of the Sand (light) palette for maximum readability
    html.classList.add('light');
    html.classList.add('comfort');
  }
  html.dataset.theme = theme;
  document.querySelectorAll('#profileSettings .more-row').forEach(r => {
    const lbl = r.querySelector('.more-label');
    if (lbl && /^Appearance/.test(lbl.textContent)) {
      lbl.textContent = `Appearance · ${THEME_LABEL[theme]}`;
    }
  });
}
function currentTheme() {
  // Comfort (40+ readability on Sand) is now the default theme.
  return document.documentElement.dataset.theme || 'comfort';
}
applyTheme(currentTheme());

document.addEventListener('click', (e) => {
  const row = e.target.closest('#profileSettings .more-row');
  if (!row) return;
  const label = row.querySelector('.more-label')?.textContent || '';
  if (/^Appearance/.test(label)) {
    const idx = THEME_ORDER.indexOf(currentTheme());
    applyTheme(THEME_ORDER[(idx + 1) % THEME_ORDER.length]);
  }
});

// ── Filter tabs ──
const tabContextSlot = document.getElementById('tabContextSlot');
const liveStripEl    = document.getElementById('liveStrip');
const activityRail   = document.getElementById('activityRail');
const eventsSection  = document.getElementById('eventsSection');
const eventsRail     = document.getElementById('eventsRail');
const collectionsRail= document.getElementById('collectionsRail');
const eventsTitle    = document.getElementById('eventsTitle');
const feedSectionTitle = document.getElementById('feedSectionTitle');

const SHARED_COLLECTIONS = [
  { title: '🏠 Cabin weekend', meta: '18 pics · updated 2h ago', isNew: true,  i: [0,3,6,9],  members: [0,3,6,9] },
  { title: '🌊 Montrose vibes', meta: '31 pics · updated 1d',     isNew: false, i: [5,9,0,11], members: [5,9,0,11,1] },
  { title: '🍻 Best of Boystown', meta: '12 places · 2 contribs',  isNew: true,  i: [10,1,5,7], members: [10,1,5] },
  { title: '🎬 Watch together', meta: '8 shows · 4 bears',         isNew: false, i: [4,8,11,2], members: [4,8,11,2] },
  { title: '💪 Gym buddies', meta: '14 pics · 5 bears',            isNew: false, i: [2,6,1,7],  members: [2,6,1] },
];

const FRESH_DROPS = [
  { kind: 'photo',      img: imgs[4],  sender: 'Marcus', senderImg: imgs[0],  time: 'just now' },
  { kind: 'place',      img: imgs[10], sender: 'Jake',   senderImg: imgs[1],  time: '14m' },
  { kind: 'event',      img: imgs[3],  sender: 'Daniel', senderImg: imgs[3],  time: '1h' },
  { kind: 'collection', img: imgs[7],  sender: 'Chris',  senderImg: imgs[9],  time: '3h' },
  { kind: 'bear',       img: imgs[5],  sender: 'Leo',    senderImg: imgs[11], time: '5h' },
  { kind: 'photo',      img: imgs[8],  sender: 'Sam',    senderImg: imgs[4],  time: '1d' },
];
const FRESH_ICON = {
  photo:      '<svg viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
  place:      '<svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  event:      '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  collection: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
  bear:       '<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
};
// ── Groups (community-first Phase 1) ──
const GROUPS = [
  {
    id: 'bowl-league',
    emoji: '🎳',
    name: 'Chicago Bear Bowl League',
    type: 'open',
    verified: true,
    joined: true,
    hasNew: true,
    members: 42,
    postsWeek: 18,
    eventsCount: 3,
    cover: imgs[9],
    location: 'Timber Lanes · weekly Fridays',
    desc: 'Bowling every Friday since 2019. Beginners welcome — we lend shoes and bad puns.',
    rules: 'Be kind to new bowlers. Loudest lane at 9pm wins bar tabs. No shit-talking scores below 80.',
    memberList: [0, 3, 5, 7, 1, 9, 11, 4],
    recentPics: [0, 3, 6, 9, 11, 7],
    eventsList: ['bear-bowl', 'tgi-happy-hour'],
  },
  {
    id: 'sunday-gym',
    emoji: '💪',
    name: 'Sunday gym crew',
    type: 'open',
    verified: false,
    joined: true,
    hasNew: false,
    members: 18,
    postsWeek: 6,
    eventsCount: 1,
    cover: imgs[0],
    location: 'Cheetah Gym Boystown · 10am',
    desc: 'We lift, then brunch. Every Sunday 10 AM at Cheetah. All levels, no gymbro vibes.',
    rules: 'Zero body-shaming. Offer to spot. Brunch location rotates monthly.',
    memberList: [0, 5, 11, 4, 7],
    recentPics: [4, 0, 11, 7, 3, 5],
    eventsList: [],
  },
  {
    id: 'newcomers',
    emoji: '🐻',
    name: 'Newcomers Welcome Chicago',
    type: 'safe',
    verified: true,
    joined: true,
    hasNew: true,
    members: 127,
    postsWeek: 34,
    eventsCount: 2,
    cover: imgs[3],
    location: 'Moderated · Chicago',
    desc: 'Just moved to Chicago? Questions about the scene? Start here. No dumb questions, only welcoming bears.',
    rules: 'Moderators review first posts. Respect pronouns. No DMs to newcomers without consent.',
    memberList: [3, 1, 5, 9, 0, 11, 7, 4, 8, 10, 6, 2],
    recentPics: [3, 9, 1, 5, 7, 11],
    eventsList: ['tgi-happy-hour'],
  },
  {
    id: 'trans-bears',
    emoji: '🏳️‍⚧️',
    name: 'Trans Bears Chicago',
    type: 'private',
    verified: true,
    joined: false,
    hasNew: false,
    members: 34,
    postsWeek: 12,
    eventsCount: 1,
    cover: imgs[5],
    location: 'Invite-only · safe space',
    desc: 'Community and support for trans men and masc non-binary bears. Monthly meetups, online check-ins, resource sharing.',
    rules: 'Invite-only. Zero outing. No transphobic takes tolerated. Screenshot = instant ban.',
    memberList: [5, 3, 11, 9, 7],
    recentPics: [5, 7, 11, 3, 9, 0],
    eventsList: [],
  },
  {
    id: 'leather',
    emoji: '🧢',
    name: 'Chicago Leather',
    type: 'open',
    verified: false,
    joined: false,
    hasNew: false,
    members: 89,
    postsWeek: 22,
    eventsCount: 4,
    cover: imgs[3],
    location: 'Touché · monthly socials',
    desc: 'Leather nights, boot polish socials, mentorship for newer kinksters. Part of the Chicago Leather Community since 1983.',
    rules: 'Consent first. Newcomers welcome at vanilla events before kink nights. Respect protocol.',
    memberList: [3, 9, 0, 7, 1, 11],
    recentPics: [3, 9, 0, 5, 7, 11],
    eventsList: ['leather-sunday'],
  },
  {
    id: 'bear-book-club',
    emoji: '📚',
    name: 'Bear Book Club',
    type: 'open',
    verified: false,
    joined: true,
    hasNew: false,
    members: 27,
    postsWeek: 8,
    eventsCount: 1,
    cover: imgs[7],
    location: 'Andersonville · monthly',
    desc: 'One book a month, plus pastries. Currently reading Giovanni\'s Room by James Baldwin. Next meet: Apr 28 at Cafe Marie-Jeanne.',
    rules: 'No spoilers until meeting day. Bring one pastry. Lurkers welcome.',
    memberList: [7, 1, 9, 3, 5],
    recentPics: [7, 1, 9, 3, 11, 5],
    eventsList: [],
  },
  {
    id: 'watch-party',
    emoji: '🎬',
    name: 'Watch Together',
    type: 'open',
    verified: false,
    joined: false,
    hasNew: true,
    members: 54,
    postsWeek: 16,
    eventsCount: 2,
    cover: imgs[4],
    location: 'Online + @mosphere Sundays',
    desc: 'Drag Race, White Lotus, HBO, reality TV, bad movies. We pick, we watch, we chat. In-person at @mosphere Sundays.',
    rules: 'Vote weekly for next pick. Spoilers in threads only. No shaming reality TV.',
    memberList: [4, 9, 1, 7, 3, 11],
    recentPics: [4, 1, 9, 7, 3, 11],
    eventsList: ['drag-race', 'white-lotus'],
  },
  {
    id: 'bears-over-50',
    emoji: '🦉',
    name: 'Bears over 50',
    type: 'open',
    verified: true,
    joined: false,
    hasNew: false,
    members: 63,
    postsWeek: 11,
    eventsCount: 2,
    cover: imgs[10],
    location: 'Chicago · coffee + museum outings',
    desc: 'For the seasoned pack. Coffee mornings, museum trips, cabin retreats, sharing stories from 40+ years of Chicago bear scene.',
    rules: 'All ages welcome to read, 50+ to post. Respect different eras and experiences.',
    memberList: [10, 0, 3, 5, 7, 9],
    recentPics: [10, 5, 0, 7, 3, 11],
    eventsList: ['grillin'],
  },
  {
    id: 'dad-bears',
    emoji: '👨‍👦',
    name: 'Dad Bears Chicago',
    type: 'open',
    verified: false,
    joined: false,
    hasNew: false,
    members: 41,
    postsWeek: 9,
    eventsCount: 1,
    cover: imgs[8],
    location: 'Chicago · playdates + advice',
    desc: 'For gay dads and dads-to-be. Playdates, adoption/IVF/surrogacy community, parenting advice. Monthly parent-and-kids meetup.',
    rules: 'Keep children\'s identities private. No kid pics from other members without permission.',
    memberList: [8, 0, 3, 11],
    recentPics: [8, 3, 0, 11, 7, 5],
    eventsList: ['grillin'],
  },
  {
    id: 'sober-bears',
    emoji: '🍵',
    name: 'Sober Bears',
    type: 'safe',
    verified: true,
    joined: false,
    hasNew: false,
    members: 38,
    postsWeek: 14,
    eventsCount: 3,
    cover: imgs[11],
    location: 'Chicago · alcohol-free events',
    desc: 'Alcohol-free community. Coffee meets, hikes, movie nights, sober Pride contingent. Whether day 1 or year 10, you belong here.',
    rules: 'No relapse shaming. No "just one drink" talk. Anonymity respected.',
    memberList: [11, 0, 3, 7, 9],
    recentPics: [11, 3, 0, 7, 9, 5],
    eventsList: [],
  },
];
const GROUPS_BY_ID = {};
GROUPS.forEach(g => { GROUPS_BY_ID[g.id] = g; });

function groupAvatarHtml(g) {
  return `<div class="group-avatar" style="background-image:url('${g.cover}');"><span class="emoji">${g.emoji}</span></div>`;
}

function groupTypeBadge(g) {
  if (g.type === 'private') return '<span class="group-type-badge private"><svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Invite-only</span>';
  if (g.type === 'safe')    return '<span class="group-type-badge safe"><svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>Safe space</span>';
  return '';
}

function renderGroupsList(filter) {
  const list = document.getElementById('groupsList');
  list.innerHTML = '';
  let items = GROUPS.slice();
  if (filter === 'yours')    items = items.filter(g => g.joined);
  if (filter === 'discover') items = items.filter(g => !g.joined);
  // "near" — all groups, just reordered by verified first (proxy for prototype)
  if (filter === 'near') items = items.slice().sort((a, b) => (b.verified ? 1 : 0) - (a.verified ? 1 : 0));

  items.forEach(g => {
    const row = document.createElement('div');
    row.className = 'group-row';
    row.dataset.groupId = g.id;
    const verified = g.verified ? '<span class="group-verified"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span>' : '';
    const joinBtn = g.joined
      ? '<button class="group-join-inline joined">Joined</button>'
      : '<button class="group-join-inline">Join</button>';
    const badge = groupTypeBadge(g);
    row.innerHTML = `
      ${groupAvatarHtml(g)}
      <div class="group-body">
        <div class="group-name">${g.name}${verified}</div>
        <div class="group-meta">${g.members} members · ${g.location}</div>
        ${badge ? `<div class="group-meta-badges">${badge}</div>` : ''}
        <div class="group-desc">${g.desc}</div>
      </div>
      ${joinBtn}`;
    list.appendChild(row);
  });
  if (items.length === 0) {
    list.innerHTML = `<div style="padding:40px 16px; text-align:center; color:var(--text-tertiary); font-size:13px;">No groups in this view yet.</div>`;
  }
}

function renderSharedGroupsRail() {
  const rail = document.getElementById('packGroupsPanel');
  if (!rail || rail.dataset.ready === '1') return;
  rail.innerHTML = '';
  const joined = GROUPS.filter(g => g.joined);
  joined.forEach(g => {
    const pill = document.createElement('div');
    pill.className = 'group-pill' + (g.hasNew ? ' has-new' : '');
    pill.dataset.groupId = g.id;
    const members = g.memberList.slice(0, 4).map(i =>
      `<span class="av" style="background-image:url('${imgs[i % imgs.length]}');"></span>`
    ).join('');
    pill.innerHTML = `
      <div class="group-pill-head">
        <div class="group-pill-avatar" style="background-image:url('${g.cover}');"><span class="emoji">${g.emoji}</span></div>
        <div class="group-pill-name">${g.name}</div>
      </div>
      <div class="group-pill-meta">${g.members} members${g.hasNew ? ' · new activity' : ''}</div>
      <div class="group-pill-members">${members}</div>`;
    rail.appendChild(pill);
  });
  // "More groups" trailing card
  const more = document.createElement('div');
  more.className = 'group-pill-more';
  more.id = 'openGroupsHub';
  more.innerHTML = `
    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
    <span>Discover more groups</span>`;
  rail.appendChild(more);
  rail.dataset.ready = '1';
}

function openGroup(id) {
  const g = GROUPS_BY_ID[id];
  if (!g) return;
  document.getElementById('groupHero').style.backgroundImage = `url('${g.cover}')`;
  document.getElementById('groupHeroEmoji').textContent = g.emoji;
  document.getElementById('groupHeroTitle').textContent = g.name;
  document.getElementById('groupHeroMeta').innerHTML =
    `${g.members} members · ${g.location}` + (g.verified ? ' · <span style="color:#79C7FF;">✓ Verified</span>' : '');

  document.getElementById('groupStatMembers').textContent = g.members;
  document.getElementById('groupStatPosts').textContent = g.postsWeek;
  document.getElementById('groupStatEvents').textContent = g.eventsCount;
  document.getElementById('groupMemberCount').textContent = `See all ${g.members} ›`;

  const joinBtn = document.getElementById('groupJoinBtn');
  joinBtn.textContent = g.joined ? 'Joined ✓' : 'Join group';
  joinBtn.classList.toggle('joined', g.joined);

  document.getElementById('groupAbout').textContent = g.desc;
  document.getElementById('groupRules').innerHTML = `<strong>Group rules</strong>${g.rules}`;

  // Members rail
  const membersEl = document.getElementById('groupMembers');
  membersEl.innerHTML = '';
  g.memberList.slice(0, 10).forEach((m, idx) => {
    const el = document.createElement('div');
    el.className = 'group-member' + (idx < 2 ? ' mod' : '');
    el.innerHTML = `
      <div class="group-member-avatar" style="background-image:url('${imgs[m % imgs.length]}');"></div>
      <div class="group-member-name">${NAME_POOL[m % NAME_POOL.length]}</div>
      <div class="group-member-pronouns">${['he/him','they/them','he/they'][m % 3]}</div>`;
    membersEl.appendChild(el);
  });

  // Upcoming events
  const evEl = document.getElementById('groupEvents');
  evEl.innerHTML = '';
  if (g.eventsList.length === 0) {
    evEl.innerHTML = `<div style="padding:12px; text-align:center; color:var(--text-tertiary); font-size:12px; background:var(--bg-subtle); border-radius:12px;">No upcoming events. Propose one →</div>`;
  } else {
    g.eventsList.forEach(eid => {
      // Look up events from global
      const all = (window._chicagoEvents || []).concat(window._worldwideEvents || []);
      const e = all.find(ev => ev.id === eid);
      if (!e) return;
      const row = document.createElement('div');
      row.className = 'group-event-row';
      row.innerHTML = `
        <div class="group-event-date"><span class="mo">${e.mo}</span><span class="day">${e.day}</span></div>
        <div class="group-event-body">
          <div class="group-event-name">${e.name}</div>
          <div class="group-event-meta">${e.meta}</div>
        </div>`;
      evEl.appendChild(row);
    });
  }

  // Recent posts grid
  const recent = document.getElementById('groupRecent');
  recent.innerHTML = '';
  g.recentPics.forEach(p => {
    const it = document.createElement('div');
    it.className = 'group-recent-item';
    it.style.backgroundImage = `url('${imgs[p % imgs.length]}')`;
    recent.appendChild(it);
  });

  document.getElementById('screenGroupDetail').classList.add('show');
  document.querySelector('#screenGroupDetail .action-screen-body').scrollTop = 0;
}

function openGroupsHub() {
  document.getElementById('screenGroups').classList.add('show');
  renderGroupsList(document.querySelector('#screenGroups .groups-tab.active').dataset.groupsTab);
}

// Wire all interactions
document.addEventListener('click', (e) => {
  const pill = e.target.closest('.group-pill');
  if (pill && pill.dataset.groupId) { openGroup(pill.dataset.groupId); return; }
  const row = e.target.closest('.group-row');
  if (row && row.dataset.groupId) {
    if (e.target.closest('.group-join-inline')) {
      e.target.closest('.group-join-inline').classList.toggle('joined');
      e.target.closest('.group-join-inline').textContent =
        e.target.closest('.group-join-inline').classList.contains('joined') ? 'Joined' : 'Join';
      return;
    }
    openGroup(row.dataset.groupId); return;
  }
  if (e.target.closest('#openGroupsHub')) { openGroupsHub(); return; }
  if (e.target.closest('#sharedGroupsSeeAll')) { openGroupsHub(); return; }
  if (e.target.closest('#packShortcutSeeAll')) {
    // Action of the link depends on which panel is active
    const activePanel = document.querySelector('.pack-shortcut-tab.active')?.dataset.shortcut;
    if (activePanel === 'groups') openGroupsHub();
    return;
  }

  // Pack shortcut tabs — switch between Groups / Collections / Recent
  const pTab = e.target.closest('.pack-shortcut-tab');
  if (pTab) {
    const key = pTab.dataset.shortcut;
    document.querySelectorAll('.pack-shortcut-tab').forEach(t => t.classList.remove('active'));
    pTab.classList.add('active');
    document.querySelectorAll('.pack-shortcut-panel').forEach(p => {
      p.classList.toggle('active', p.dataset.panel === key);
    });
    return;
  }

  // Groups hub tab switching
  const gTab = e.target.closest('.groups-tab');
  if (gTab) {
    document.querySelectorAll('#screenGroups .groups-tab').forEach(t => t.classList.remove('active'));
    gTab.classList.add('active');
    renderGroupsList(gTab.dataset.groupsTab);
    return;
  }

  // Group detail Join/Leave toggle
  const joinBtn = e.target.closest('#groupJoinBtn');
  if (joinBtn) {
    const joined = joinBtn.classList.toggle('joined');
    joinBtn.textContent = joined ? 'Joined ✓' : 'Join group';
    return;
  }
});

// Mixed social timeline for Shared tab — mix of content types
const SOCIAL_REPLY_SVG = '<svg viewBox="0 0 24 24"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>';
const SOCIAL_MORE_SVG  = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/><circle cx="5" cy="12" r="1.6"/></svg>';

const SHARED_TIMELINE = [
  {
    kind: 'checkin',
    sender: { name: 'Marcus', img: 0, online: true },
    action: '<strong>Marcus</strong> checked in',
    time: 'just now',
    content: {
      venueName: 'Touché',
      event: 'Leather Sunday · started 40m ago',
      here: [1, 3, 9],
      hereText: "<strong>Jake</strong> and <strong>Daniel</strong> are here too",
    },
    reactions: '🙋🔥',
    reactionCount: 8,
    saves: null,
    fromGroup: 'Chicago Leather',
  },
  {
    kind: 'photo',
    sender: { name: 'Marcus', img: 0, online: true },
    action: '<strong>Marcus</strong> sent you a photo',
    time: '12m',
    content: { img: 4, note: 'golden hour was unreal last night 🌅' },
    reactions: '❤🔥',
    reactionCount: 4,
    saves: 'You saved this',
  },
  {
    kind: 'place',
    sender: { name: 'Jake', img: 1, online: true },
    action: '<strong>Jake</strong> shared a spot',
    time: '38m',
    content: {
      category: 'Cocktail bar',
      name: "Marty's Martini Bar",
      addr: '1511 W Balmoral · Andersonville',
      note: 'trivia night is 🔥, get there before 7:30',
    },
    reactions: '❤👀',
    reactionCount: 2,
    saves: null,
  },
  {
    kind: 'event',
    sender: { name: 'Daniel', img: 3, online: false },
    action: '<strong>Daniel</strong> shared an event',
    time: '2h',
    content: {
      mo: 'Apr', day: '24',
      name: 'Bear Bowl Night',
      meta: 'Fri · Timber Lanes · $15',
      going: [1, 9, 11],
      goingText: "Jake and 2 of your bears going",
    },
    reactions: '❤🔥',
    reactionCount: 3,
    saves: null,
    fromGroup: '🎳 Chicago Bear Bowl League',
  },
  {
    kind: 'collection',
    sender: { name: 'Chris', img: 9, online: true },
    action: '<strong>Chris</strong> added 3 pics to <em>Cabin weekend</em>',
    time: '4h',
    fromGroup: '💪 Sunday gym crew',
    content: {
      title: '🏠 Cabin weekend',
      meta: '18 pics · updated just now',
      stack: [0, 3, 6, 9],
      members: [0, 3, 6, 9],
    },
    reactions: '❤🔥😂',
    reactionCount: 5,
    saves: '<strong>You + 3</strong> bears saved',
  },
  {
    kind: 'bear',
    sender: { name: 'Leo', img: 11, online: false },
    action: '<strong>Leo</strong> thought you\'d like this bear',
    time: '6h',
    content: {
      name: 'Hugo',
      meta: '34 · 2.3 mi · Uptown',
      avatarImg: 5,
      online: true,
    },
    reactions: '❤',
    reactionCount: 1,
    saves: null,
  },
  {
    kind: 'photo',
    sender: { name: 'Alex', img: 4, online: false },
    action: '<strong>Alex tagged you</strong>',
    time: '1d',
    content: { img: 2, note: null },
    reactions: '❤😂',
    reactionCount: 8,
    saves: '<strong>You + 4</strong> bears saved',
  },
  {
    kind: 'place',
    sender: { name: 'Bear Pride Chicago chat', img: 10, online: false, isChat: true },
    action: 'From <em>Bear Pride Chicago</em> chat',
    time: '2d',
    content: {
      category: 'Gay bar · Leather',
      name: 'Touché',
      addr: '6412 N Clark St · Rogers Park',
      note: 'Leather Sunday starts at 9, dress code gets you $2 off',
    },
    reactions: '❤🔥',
    reactionCount: 12,
    saves: null,
  },
];

// ── "With you" tab renderer ──
// Builds 5 sections: Happening now / Sent to you / Tagged / Invites / In your circles
function renderWithYou() {
  const root = document.getElementById('withYouView');
  if (!root) return;

  const NAMES = (typeof FOLLOWING_NAMES !== 'undefined' && FOLLOWING_NAMES.length)
    ? FOLLOWING_NAMES : NAME_POOL;

  const svgArrow = '<polyline points="9 18 15 12 9 6"/>';
  const svgTag = '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>';
  const svgAt = '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>';
  const svgCal = '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>';
  const svgAlbum = '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>';
  const svgUsers = '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>';

  // — Section 1: Happening now —
  const hero = `
    <section class="wy-section">
      <div class="wy-hero-card">
        <div class="wy-hero-map"></div>
        <div class="wy-hero-dot" style="top:38%; left:28%;"></div>
        <div class="wy-hero-dot ember" style="top:55%; left:62%; animation-delay:.4s;"></div>
        <div class="wy-hero-dot" style="top:30%; left:72%; animation-delay:.8s;"></div>
        <div class="wy-hero-body">
          <div class="wy-hero-text">
            <span class="wy-hero-eyebrow">Happening now</span>
            <div class="wy-hero-title">Marcus &amp; 2 others at Touché</div>
            <div class="wy-hero-sub">1.2 mi · Leather Sunday · 40m in</div>
          </div>
          <button class="wy-hero-cta" data-wy-action="join-here">Join them ›</button>
        </div>
      </div>
    </section>`;

  // — Section 2: Sent to you —
  const sentItems = [
    { name: 'Marcus', avatar: imgs[0], thumb: imgs[4],  count: 3, meta: 'Photo · 2h' },
    { name: 'Daniel', avatar: imgs[3], thumb: imgs[7],  meta: 'Collection · Cabin weekend · 4h' },
    { name: 'Jake',   avatar: imgs[1], thumb: imgs[5],  count: 2, meta: 'Photo · 6h' },
    { name: 'Chris',  avatar: imgs[5], thumb: imgs[2],  meta: 'Post · Yesterday' },
  ];
  const sentCards = sentItems.map(it => `
    <div class="wy-sent-card">
      <div class="wy-sent-thumb" style="background-image:url('${it.thumb}');">
        ${it.count ? `<span class="wy-sent-thumb-count">${it.count}</span>` : ''}
      </div>
      <div class="wy-sent-body">
        <div class="wy-sent-sender">
          <div class="wy-sent-avatar" style="background-image:url('${it.avatar}');"></div>
          <span>${it.name}</span>
        </div>
        <div class="wy-sent-meta">${it.meta}</div>
      </div>
    </div>`).join('');
  const sent = `
    <section class="wy-section">
      <div class="wy-section-head">
        <h2 class="wy-section-title">Sent to you</h2>
        <span class="wy-see-all" data-see-all="sent">See all ›</span>
      </div>
      <div class="wy-section-sub">Photos and collections shared directly with you</div>
      <div class="wy-rail">${sentCards}</div>
    </section>`;

  // — Section 3: Tagged —
  const taggedItems = [
    { thumb: imgs[2], by: 'Sam' },
    { thumb: imgs[6], by: 'Alex' },
    { thumb: imgs[1], by: 'Ryan' },
    { thumb: imgs[9], by: 'Leo' },
  ];
  const taggedCards = taggedItems.map(it => `
    <div class="wy-tag-item" style="background-image:url('${it.thumb}');">
      <span class="wy-tag-badge"><svg viewBox="0 0 24 24">${svgTag}</svg>${it.by}</span>
    </div>`).join('');
  const tagged = `
    <section class="wy-section">
      <div class="wy-section-head">
        <h2 class="wy-section-title">Where you appear</h2>
        <span class="wy-see-all" data-see-all="tagged">See all ›</span>
      </div>
      <div class="wy-section-sub">Photos others posted where you're tagged</div>
      <div class="wy-rail">${taggedCards}</div>
    </section>`;

  // — Section 4: Invites — event invitations coming from circles you're in
  const invites = [
    {
      title: 'TGI Bears Happy Hour',
      when: 'Tonight · Touché',
      fromGroup: 'Chicago Bear Social',
      invitedBy: 'Marcus',
    },
    {
      title: 'Leather Sunday',
      when: 'Sun Apr 19 · Touché',
      fromGroup: 'Chicago Leather',
      invitedBy: 'Daniel',
    },
  ];
  const inviteCards = invites.map(inv => `
    <div class="wy-invite">
      <div class="wy-invite-icon"><svg viewBox="0 0 24 24">${svgCal}</svg></div>
      <div class="wy-invite-body">
        <div class="wy-invite-title">${inv.title}</div>
        <div class="wy-invite-sub">${inv.when} · <strong>${inv.fromGroup}</strong> · from ${inv.invitedBy}</div>
      </div>
      <button class="wy-hero-cta wy-invite-cta" data-wy-action="join-here">Accept</button>
    </div>`).join('');
  const invitesSec = `
    <section class="wy-section">
      <div class="wy-section-head">
        <h2 class="wy-section-title">Invites</h2>
      </div>
      <div class="wy-section-sub">Event invitations from your circles</div>
      ${inviteCards}
    </section>`;

  // — Section 5: What's new in your circles — AI-synthesized digest per group
  // Mock: in prod the `brief` + `actions` come from a server-side pre-compute
  // (1×/hour or on-login) using an LLM over the group's new activity. The
  // UI stays a plain render — no live inference, no cost in the hot path.
  const circleDigests = [
    {
      name: 'Chicago Bear Social',
      emoji: '🐻',
      avatarIdx: 0,
      newCount: 12, forYou: 2,
      brief: `<strong>Marcus</strong> checked in at <strong>Touché</strong> tonight with 3 of your gym crew, <strong>Jake</strong> just joined, and you haven't RSVP'd to <strong>TGI Bears Happy Hour</strong>.`,
      actions: [
        { label: 'Join at Touché', kind: 'primary' },
        { label: 'RSVP Happy Hour', kind: 'secondary' },
      ],
    },
    {
      name: 'Chicago Leather',
      emoji: '🖤',
      avatarIdx: 7,
      newCount: 4, forYou: 1,
      brief: `<strong>Daniel</strong> is asking who has a spare harness for <strong>Leather Sunday</strong> — 12 going, including 4 from your circles.`,
      actions: [
        { label: 'Reply to Daniel', kind: 'primary' },
        { label: 'RSVP Leather Sunday', kind: 'secondary' },
      ],
    },
    {
      name: 'Sunday gym crew',
      emoji: '🏋️',
      avatarIdx: 4,
      newCount: 7, forYou: 1,
      brief: `The crew is split 4–2 on Saturday's spot — <strong>Steamworks</strong> leading, but <strong>Sam</strong> and <strong>Chris</strong> (who you train with) picked <strong>Cheetah</strong>.`,
      actions: [
        { label: 'Vote', kind: 'primary' },
        { label: 'See thread', kind: 'secondary' },
      ],
    },
  ];

  const digestCards = circleDigests.map(c => {
    const forYouPill = c.forYou
      ? ` · <span class="wy-digest-foryou">${c.forYou} for you</span>`
      : '';
    const actions = c.actions.map(a =>
      `<button class="wy-digest-action wy-digest-action-${a.kind}">${a.label}</button>`
    ).join('');
    return `
      <article class="wy-digest">
        <header class="wy-digest-head">
          <div class="wy-digest-cover" style="background-image:url('${imgs[c.avatarIdx]}');">
            <span class="wy-digest-emoji">${c.emoji}</span>
          </div>
          <div class="wy-digest-info">
            <div class="wy-digest-name">${c.name}</div>
            <div class="wy-digest-count"><span class="wy-digest-dot"></span>${c.newCount} new${forYouPill}</div>
          </div>
          <span class="wy-digest-chevron">›</span>
        </header>
        <div class="wy-digest-brief">
          <span class="wy-digest-ai" aria-label="AI-generated"><svg viewBox="0 0 24 24"><path d="M12 2 L14 9 L21 12 L14 15 L12 22 L10 15 L3 12 L10 9 Z"/></svg></span>
          <p>${c.brief}</p>
        </div>
        <div class="wy-digest-actions">${actions}</div>
      </article>`;
  }).join('');

  const circlesSec = `
    <section class="wy-section">
      <div class="wy-section-head">
        <h2 class="wy-section-title">What's new in your circles</h2>
        <span class="wy-see-all" data-see-all="circles">See all ›</span>
      </div>
      <div class="wy-section-sub">Latest activity from the groups you're in</div>
      ${digestCards}
    </section>`;

  // Section order: task-oriented — time-urgent / action-required items up top,
  // browseable content below. Happening now → Invites (decisions) →
  // Sent to you → Where you appear → In your circles.
  root.innerHTML = hero + invitesSec + sent + tagged;
}

// ── Renderers for "See all" screens from With you ──

function renderSentToYouFull() {
  const list = document.getElementById('sentList');
  if (!list) return;
  const svgPhoto = '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>';
  const svgAlbum = '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>';
  const svgLink  = '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>';
  const items = [
    { sender: 'Marcus', avatar: imgs[0], thumb: imgs[4],  kind: 'photo', count: 3, desc: '3 photos', time: '2h' },
    { sender: 'Daniel', avatar: imgs[3], thumb: imgs[7],  kind: 'album', desc: 'Collection · Cabin weekend',  time: '4h' },
    { sender: 'Jake',   avatar: imgs[1], thumb: imgs[5],  kind: 'photo', count: 2, desc: '2 photos', time: '6h' },
    { sender: 'Chris',  avatar: imgs[5], thumb: imgs[2],  kind: 'photo', desc: 'Post from @touche_bears',   time: 'Yesterday' },
    { sender: 'Sam',    avatar: imgs[4], thumb: imgs[9],  kind: 'link',  desc: 'Link · Bear Pride tickets', time: 'Yesterday' },
    { sender: 'Alex',   avatar: imgs[6], thumb: imgs[1],  kind: 'album', desc: 'Collection · Montrose vibes', time: '2d' },
    { sender: 'Daniel', avatar: imgs[3], thumb: imgs[8],  kind: 'photo', count: 5, desc: '5 photos',          time: '2d' },
    { sender: 'Ben',    avatar: imgs[6], thumb: imgs[11], kind: 'photo', desc: 'Post from @chicagoleather',   time: '3d' },
    { sender: 'Ryan',   avatar: imgs[7], thumb: imgs[3],  kind: 'photo', desc: 'Post from @touche_bears',    time: '4d' },
    { sender: 'Leo',    avatar: imgs[11], thumb: imgs[0], kind: 'album', desc: 'Collection · Best of 2024',  time: '5d' },
    { sender: 'Tom',    avatar: imgs[8], thumb: imgs[2],  kind: 'photo', count: 4, desc: '4 photos',          time: '1w' },
    { sender: 'Nate',   avatar: imgs[5], thumb: imgs[7],  kind: 'link',  desc: 'Link · Steamworks pool party', time: '1w' },
  ];
  const kindIcon = { photo: svgPhoto, album: svgAlbum, link: svgLink };
  list.innerHTML = items.map(it => `
    <div class="sent-row">
      <div class="sent-thumb" style="background-image:url('${it.thumb}');">
        <div class="sent-thumb-kind"><svg viewBox="0 0 24 24">${kindIcon[it.kind] || svgPhoto}</svg></div>
      </div>
      <div class="sent-body">
        <div class="sent-sender">
          <div class="sent-sender-avatar" style="background-image:url('${it.avatar}');"></div>
          <span>${it.sender}</span>
        </div>
        <div class="sent-desc">${it.desc}</div>
      </div>
      <span class="sent-time">${it.time}</span>
    </div>`).join('');
}

function renderTaggedFull() {
  const grid = document.getElementById('taggedGrid');
  if (!grid) return;
  const svgTag = '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>';
  const taggers = ['Sam', 'Alex', 'Ryan', 'Leo', 'Jake', 'Daniel', 'Chris', 'Ben', 'Marcus', 'Tom', 'Nate', 'Owen'];
  // 24 tiles with rotating images + taggers
  const items = Array.from({ length: 24 }, (_, i) => ({
    thumb: imgs[i % imgs.length],
    by: taggers[i % taggers.length],
  }));
  grid.innerHTML = items.map(it => `
    <div class="tagged-cell" style="background-image:url('${it.thumb}');">
      <span class="tagged-cell-badge"><svg viewBox="0 0 24 24">${svgTag}</svg>${it.by}</span>
    </div>`).join('');
}

// Wire "See all" links in With you → open the corresponding full screen
document.addEventListener('click', (e) => {
  const link = e.target.closest('[data-see-all]');
  if (!link) return;
  const kind = link.dataset.seeAll;
  if (kind === 'circles') {
    // Reuse the Groups hub, pre-selecting "Your groups"
    const yoursTab = document.querySelector('#screenGroups .groups-tab[data-groups-tab="yours"]');
    if (yoursTab) {
      document.querySelectorAll('#screenGroups .groups-tab').forEach(t => t.classList.remove('active'));
      yoursTab.classList.add('active');
    }
    if (typeof openGroupsHub === 'function') openGroupsHub();
    else document.getElementById('screenGroups')?.classList.add('show');
  } else if (kind === 'sent') {
    renderSentToYouFull();
    document.getElementById('screenSent')?.classList.add('show');
  } else if (kind === 'tagged') {
    renderTaggedFull();
    document.getElementById('screenTagged')?.classList.add('show');
  }
});

// ── Happening now → Join them celebration ──
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-wy-action="join-here"]');
  if (!btn) return;
  if (btn.dataset.state === 'joined') return; // already joined, ignore repeat tap

  btn.classList.add('joining');
  setTimeout(() => btn.classList.remove('joining'), 220);

  // Confetti burst — 16 particles in 5 palette colors, radial spread upward
  const palette = ['c1', 'c2', 'c3', 'c4', 'c5'];
  for (let i = 0; i < 16; i++) {
    const p = document.createElement('div');
    p.className = 'wy-confetti ' + palette[i % palette.length];
    const angle = (-Math.PI * 0.9) + (Math.PI * 0.8 * (i / 15)); // -162° → -18° (upper half)
    const dist = 60 + Math.random() * 80;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    p.style.setProperty('--dx', dx.toFixed(1) + 'px');
    p.style.setProperty('--dy', dy.toFixed(1) + 'px');
    p.style.animationDelay = (i * 25) + 'ms';
    const size = 5 + Math.random() * 6;
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    btn.appendChild(p);
    setTimeout(() => p.remove(), 2400);
  }

  // Random emoji/phrase pair — rotating vibes for a gay community app
  // (bear community + broader queer icons, flex/gym, fire, pride, cheers…)
  const toasts = [
    "On my way 🐻",
    "Count me in 🔥",
    "Let's go 💪",
    "🍻 See you there",
    "🎉 Pulling up",
    "Showing up 🌈",
    "With you ❤️‍🔥",
    "🐺 Rolling deep",
    "✨ Can't wait",
    "😈 I'm there",
    "🏳️‍🌈 See you bears",
    "Pulling up 👀",
  ];
  const toast = document.createElement('span');
  toast.className = 'wy-join-toast';
  toast.textContent = toasts[Math.floor(Math.random() * toasts.length)];
  btn.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);

  // Settle into joined state — wait longer so the burst peaks first.
  // Invite CTAs shrink to a round green check; the hero CTA keeps a full label.
  const isInvite = btn.classList.contains('wy-invite-cta');
  setTimeout(() => {
    btn.classList.add('joined');
    btn.dataset.state = 'joined';
    btn.textContent = isInvite ? '✓' : "You're going";
    if (isInvite) btn.setAttribute('aria-label', 'Accepted');
  }, 650);

  // Haptic pattern
  if (navigator.vibrate) navigator.vibrate([15, 50, 15, 40, 25]);
});

function renderSharedTimeline() {
  const feed = document.getElementById('feed');
  SHARED_TIMELINE.forEach(item => {
    const card = document.createElement('div');
    card.className = 'social-card';
    const avatarOnlineClass = item.sender.online ? ' online' : '';
    const replyTarget = item.sender.isChat ? 'chat' : item.sender.name;

    let content = '';
    switch (item.kind) {
      case 'photo':
        content = `
          <div class="social-content-photo"><img src="${imgs[item.content.img % imgs.length]}" loading="lazy"></div>
          ${item.content.note ? `<div class="social-content-note">${item.content.note}</div>` : ''}`;
        break;
      case 'place':
        content = `
          <div class="social-content-place">
            <div class="social-content-place-map"></div>
            <div class="social-content-place-body">
              <div class="social-content-place-cat">${item.content.category}</div>
              <div class="social-content-place-name">${item.content.name}</div>
              <div class="social-content-place-addr">${item.content.addr}</div>
            </div>
          </div>
          ${item.content.note ? `<div class="social-content-note" style="padding-top:0;padding-bottom:12px;">${item.content.note}</div>` : ''}`;
        break;
      case 'event':
        const goingAvatars = item.content.going.map(i => `<span class="av" style="background-image:url('${imgs[i % imgs.length]}');"></span>`).join('');
        content = `
          <div class="social-content-event">
            <div class="social-content-event-date">
              <span class="mo">${item.content.mo}</span>
              <span class="day">${item.content.day}</span>
            </div>
            <div class="social-content-event-body">
              <div class="social-content-event-name">${item.content.name}</div>
              <div class="social-content-event-meta">${item.content.meta}</div>
              <div class="social-content-event-going">
                <span class="social-content-event-going-avatars">${goingAvatars}</span>
                <span>${item.content.goingText}</span>
              </div>
            </div>
          </div>`;
        break;
      case 'collection':
        const stackImgs = item.content.stack.map(i => `<img src="${imgs[i % imgs.length]}" loading="lazy">`).join('');
        const memberAvs = item.content.members.slice(0, 4).map(i => `<span class="av" style="background-image:url('${imgs[i % imgs.length]}');"></span>`).join('');
        content = `
          <div class="social-content-collection">
            <div class="social-content-collection-stack">${stackImgs}</div>
            <div class="social-content-collection-body">
              <div class="social-content-collection-label">Collection</div>
              <div class="social-content-collection-name">${item.content.title}</div>
              <div class="social-content-collection-meta">${item.content.meta}</div>
              <div class="social-content-collection-members">${memberAvs}</div>
            </div>
          </div>`;
        break;
      case 'checkin':
        const hereAvs = item.content.here.map(i => `<span class="av" style="background-image:url('${imgs[i % imgs.length]}');"></span>`).join('');
        content = `
          <div class="social-content-checkin">
            <div class="social-content-checkin-venue"><div class="pin"></div></div>
            <div class="social-content-checkin-body">
              <span class="social-content-checkin-label">Here now</span>
              <div class="social-content-checkin-venue-name">${item.content.venueName}</div>
              <div class="social-content-checkin-event">${item.content.event}</div>
              <div class="social-content-checkin-here">
                <span class="social-content-checkin-here-avatars">${hereAvs}</span>
                <span>${item.content.hereText}</span>
              </div>
            </div>
          </div>`;
        break;
      case 'bear':
        content = `
          <div class="social-content-bear">
            <div class="social-content-bear-avatar" style="background-image:url('${imgs[item.content.avatarImg % imgs.length]}');">
              ${item.content.online ? '<div class="social-content-bear-online">ONLINE</div>' : ''}
            </div>
            <div class="social-content-bear-body">
              <div class="social-content-bear-label">Bear profile</div>
              <div class="social-content-bear-name">${item.content.name}<span class="pronoun-tag">he/him</span></div>
              <div class="social-content-bear-meta">${item.content.meta} · 3 groups in common</div>
              <div class="identity-chips inline" style="margin:6px 0 0; max-width:none;">
                <span class="id-chip bear-type">Otter</span>
                <span class="id-chip flag bear"><span class="em">🐻</span>Bear</span>
                <span class="id-chip flag pride"><span class="em">🏳️‍🌈</span>Pride</span>
              </div>
              <span class="social-content-bear-cta" style="margin-top:10px;">Introduce yourself ›</span>
            </div>
          </div>`;
        break;
    }

    const groupChip = item.fromGroup
      ? `<div class="social-card-from-group"><svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>via <strong>${item.fromGroup}</strong></div>`
      : '';
    card.innerHTML = `
      ${groupChip}
      <div class="social-card-head">
        <div class="social-card-avatar${avatarOnlineClass}" style="background-image:url('${imgs[item.sender.img % imgs.length]}');"></div>
        <div class="social-card-head-body">
          <div class="social-card-action">${item.action}</div>
          <div class="social-card-time">${fmtTime(item.time)}</div>
        </div>
        <button class="social-card-more">${SOCIAL_MORE_SVG}</button>
      </div>
      ${content}
      ${item.saves ? `<div class="social-saves-inline">${item.saves}</div>` : ''}
      <div class="social-card-foot">
        <div class="social-reactions">
          <span class="social-reactions-emojis">${item.reactions}</span>
          <span class="social-reactions-count">${item.reactionCount}</span>
        </div>
        ${(() => {
          const icons = {
            checkin:    '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
            photo:      '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
            place:      '<svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
            event:      '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>',
            collection: '<svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',
            bear:       '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>',
          };
          const labels = {
            checkin:    item.sender.isChat ? 'Reply in chat' : 'Reply',
            photo:      item.sender.isChat ? 'Reply in chat' : 'Reply',
            place:      'Save place',
            event:      'Going',
            collection: 'Open',
            bear:       'Introduce yourself',
          };
          return `<button class="social-primary-cta ${item.kind}">${icons[item.kind] || ''}${labels[item.kind] || 'Reply'}</button>`;
        })()}
      </div>`;
    feed.appendChild(card);
  });
}

const EDITORIAL_ITEMS = [
  {
    kind: 'countdown',
    label: 'Coming up',
    title: 'Bear Pride Chicago',
    sub: 'May 15–17 · Boystown · tickets on sale',
    days: 29,
    eventId: 'bear-pride',
  },
  {
    kind: 'feature',
    label: 'Bear of the week',
    title: 'Meet Tomás, our featured cub',
    sub: '5 min read · by the W|Bear editors',
    img: imgs[5],
    post: {
      postName: 'Tomás Rivera',
      postAvatar: imgs[5],
      postImg: imgs[5],
      postLikes: '1482',
      postVerified: '1',
      postIdx: '3',
      postCaption: "This week's featured cub: Tomás, 28, from Pilsen. Barista by day, harmonica player by night. \"The bear community gave me a home when Chicago felt too big.\" Full interview in the W|Bear editorial.",
      postTime: '2d',
    },
  },
  {
    kind: 'spotlight',
    label: 'Bear-owned spot',
    title: 'Kopi Cafe in Andersonville',
    sub: 'Best iced latte on Clark · open 7am',
    img: imgs[7],
    post: {
      postName: 'Kopi Cafe',
      postAvatar: imgs[7],
      postImg: imgs[7],
      postLikes: '612',
      postVerified: '1',
      postIdx: '7',
      postCaption: "Bear-owned since 2018. Iced oat lattes, a back patio with shade, and no laptops after 11am rule. 5317 N Clark · open 7am daily. Show your W|Bear for 10% off the first week.",
      postTime: '5d',
    },
  },
  {
    kind: 'story',
    label: 'Community story',
    title: 'How Touché rebuilt after the 2021 fire',
    sub: '8 min read · with interviews',
    img: imgs[3],
    post: {
      postName: 'W|Bear Editorial',
      postAvatar: imgs[3],
      postImg: imgs[3],
      postLikes: '2104',
      postVerified: '1',
      postIdx: '11',
      postCaption: "Four years after the fire that nearly shut them down, Touché is back — and busier than ever. We sat down with the owners, the regulars, and the neighbors who kept the lights on. An 8-minute read from our community desk.",
      postTime: '1w',
    },
  },
  {
    kind: 'milestone',
    label: '30 years',
    title: 'Three decades of International Bear Rendezvous',
    sub: 'A history of the West Coast\'s flagship',
    img: imgs[0],
    eventId: 'ibr-sf',
  },
  {
    kind: 'notice',
    label: 'New in app',
    title: 'Community guidelines — updated for 2026',
    sub: 'Safer spaces, clearer moderation · 3 min',
    img: imgs[10],
    post: {
      postName: 'W|Bear Team',
      postAvatar: imgs[10],
      postImg: imgs[10],
      postLikes: '892',
      postVerified: '1',
      postIdx: '1',
      postCaption: "Our 2026 community guidelines are live. Clearer language on consent, safer-space expectations, and a faster path for moderator escalation. Three-minute read — take a look before your next post.",
      postTime: '3d',
    },
  },
];

// ── V3 prototype: inject editorial items as story rings in the activity rail ──
(() => {
  const rail = document.getElementById('activityRail');
  if (!rail) return;
  // Short display names for under-circle labels
  const SHORT = ['Pride', 'Tomás', 'Kopi', 'Touché', 'IBR 30', 'Rules'];
  // Insert right after "Your story" (first child) and before the regular people
  const anchor = rail.children[1] || null;
  EDITORIAL_ITEMS.forEach((e, i) => {
    const item = document.createElement('div');
    item.className = 'activity-item activity-editorial' + (e.kind === 'countdown' ? ' activity-countdown' : '');
    item.dataset.editorialIdx = String(i);
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');

    if (e.kind === 'countdown') {
      // Progress arc: assume 30-day window, fill = (30 - days) / 30
      const remaining = Math.max(0, Math.min(30, e.days || 0));
      const progress = Math.round(((30 - remaining) / 30) * 100);
      item.style.setProperty('--progress', progress + '%');
      item.innerHTML = `
        <div class="activity-avatar">
          <div class="activity-ring">
            <div class="activity-img">${remaining}<span class="countdown-unit">days</span></div>
          </div>
        </div>
        <span class="activity-name">${SHORT[i] || e.label}</span>`;
    } else {
      item.innerHTML = `
        <div class="activity-avatar">
          <div class="activity-ring">
            <div class="activity-img" style="background:url('${e.img}') center/cover;"></div>
          </div>
        </div>
        <span class="activity-name">${SHORT[i] || e.label}</span>`;
    }

    // Reuse the existing editorial click pipeline
    item.addEventListener('click', () => {
      const ev = EDITORIAL_ITEMS[i];
      if (ev.eventId && window._openEvent) { window._openEvent(ev.eventId); return; }
      if (ev.post && typeof openPostScreen === 'function') { openPostScreen(ev.post); return; }
    });

    if (anchor) rail.insertBefore(item, anchor);
    else rail.appendChild(item);
  });
})();

function renderEditorialRail() {
  const rail = document.getElementById('editorialRail');
  if (rail.dataset.ready === '1') return;
  rail.innerHTML = '';

  EDITORIAL_ITEMS.forEach((e, i) => {
    const card = document.createElement('div');
    card.className = 'editorial-card';
    card.dataset.editorialIdx = String(i);
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    const media = (e.kind === 'countdown')
      ? `<div class="editorial-card-media editorial-card-countdown">
           <div class="editorial-card-countdown-num">${e.days}</div>
           <div class="editorial-card-countdown-unit">days</div>
         </div>`
      : `<div class="editorial-card-media" style="background-image:url('${e.img}');"></div>`;
    card.innerHTML = `
      ${media}
      <span class="editorial-card-label">${e.label}</span>
      <div class="editorial-card-body">
        <div class="editorial-card-title">${e.title}</div>
        <div class="editorial-card-sub">${e.sub}</div>
      </div>`;
    rail.appendChild(card);
  });
  // See-all trailing card
  const seeAll = document.createElement('div');
  seeAll.className = 'editorial-card editorial-card-seeall';
  seeAll.setAttribute('role', 'button');
  seeAll.setAttribute('tabindex', '0');
  seeAll.innerHTML = '<div class="editorial-seeall-inner"><span>See all</span><span class="editorial-seeall-arrow">›</span></div>';
  rail.appendChild(seeAll);
  rail.addEventListener('click', (ev) => {
    const card = ev.target.closest('.editorial-card');
    if (!card) return;
    const item = EDITORIAL_ITEMS[Number(card.dataset.editorialIdx)];
    if (!item) return;
    if (item.eventId && window._openEvent) {
      window._openEvent(item.eventId);
      return;
    }
    if (item.post && typeof openPost === 'function') {
      openPost(item.post);
      return;
    }
    card.classList.add('pressed');
    setTimeout(() => card.classList.remove('pressed'), 160);
  });
  rail.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter' && ev.key !== ' ') return;
    const card = ev.target.closest('.editorial-card');
    if (!card) return;
    ev.preventDefault();
    card.click();
  });
  rail.dataset.ready = '1';
}

function renderFreshDrops() {
  const rail = document.getElementById('packRecentPanel');
  if (!rail || rail.dataset.ready === '1') return;
  FRESH_DROPS.forEach(d => {
    const drop = document.createElement('div');
    drop.className = 'fresh-drop';
    drop.innerHTML = `
      <div class="fresh-drop-media" style="background-image:url('${d.img}');">
        <div class="fresh-drop-type">${FRESH_ICON[d.kind]}${d.kind}</div>
        <div class="fresh-drop-sender">
          <div class="fresh-drop-sender-avatar" style="background-image:url('${d.senderImg}');"></div>
          <div class="fresh-drop-sender-name">${d.sender}</div>
        </div>
      </div>
      <div class="fresh-drop-time">${d.time}</div>`;
    rail.appendChild(drop);
  });
  rail.dataset.ready = '1';
}

function renderCollections() {
  const rail = document.getElementById('packCollectionsPanel');
  if (!rail || rail.dataset.ready === '1') return;
  rail.innerHTML = '';
  SHARED_COLLECTIONS.forEach(c => {
    const card = document.createElement('div');
    card.className = 'collection-card';
    const stack = c.i.map(ii => `<img src="${imgs[ii % imgs.length]}" alt="">`).join('');
    const memberStack = c.members.slice(0, 4).map(m =>
      `<span class="collection-member" style="background-image:url('${imgs[m % imgs.length]}');"></span>`
    ).join('');
    const overflow = c.members.length > 4 ? `<span class="collection-member overflow">+${c.members.length - 4}</span>` : '';
    card.innerHTML = `
      ${c.isNew ? '<div class="collection-new">NEW</div>' : ''}
      <div class="collection-stack">${stack}</div>
      <div class="collection-title">${c.title}</div>
      <div class="collection-meta">${c.meta}</div>
      <div class="collection-members">${memberStack}${overflow}</div>`;
    rail.appendChild(card);
  });
  rail.dataset.ready = '1';
}

function setContext(filter) {
  tabContextSlot.innerHTML = '';
  const filterBar = document.getElementById('followingFilterBar');
  if (filterBar && filter !== 'following') {
    filterBar.style.display = 'none';
    filterBar.innerHTML = '';
  }
  const sharedBar = document.getElementById('sharedFilterBar');
  if (sharedBar && filter !== 'shared') {
    sharedBar.style.display = 'none';
    sharedBar.innerHTML = '';
  }
  if (filter === 'worldwide') return;

  if (filter === 'local') {
    tabContextSlot.innerHTML = `
      <div class="heatmap-card" id="heatmapCard">
        <div class="heatmap-map"></div>
        <div class="heatmap-body">
          <div class="heatmap-text">
            <span class="heatmap-eyebrow">Chicago · Now</span>
            <div class="heatmap-stat-big">
              <strong class="heatmap-big-num">42</strong>
              <span class="heatmap-big-label">bears nearby</span>
            </div>
            <div class="heatmap-sub">8 under 1 mi</div>
          </div>
          <button class="heatmap-cta-btn">Explore ›</button>
        </div>
      </div>`;
  } else if (filter === 'following') {
    tabContextSlot.innerHTML = `
      <div class="following-card">
        <div class="following-stats">
          <div class="following-stat">
            <div class="following-stat-value">12.4k</div>
            <div class="following-stat-label">Followers</div>
          </div>
          <div class="following-stat">
            <div class="following-stat-value">384</div>
            <div class="following-stat-label">Following</div>
          </div>
          <div class="following-stat">
            <div class="following-stat-value"><span class="online-dot"></span>23</div>
            <div class="following-stat-label">Online now</div>
          </div>
        </div>
      </div>`;
    // Populate the sticky filter bar (direct child of grid-scroll so it
    // sticks across the whole scroll height, not just inside tabContextSlot)
    const filterBar = document.getElementById('followingFilterBar');
    filterBar.innerHTML = `
      <div class="following-filters">
        <div class="following-filter active" data-kind="all">All</div>
        <div class="following-filter" data-kind="photo">
          <svg viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          Photos
        </div>
        <div class="following-filter" data-kind="video">
          <svg viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
          Videos
        </div>
        <div class="following-filter" data-kind="private">
          <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Private
        </div>
        <div class="following-filter" data-kind="live">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07M8.46 15.54a5 5 0 0 1 0-7.07M4.93 19.07a10 10 0 0 1 0-14.14"/></svg>
          Live
        </div>
      </div>`;
    filterBar.style.display = '';
    // Filter pill toggle
    filterBar.querySelectorAll('.following-filter').forEach(f => {
      f.addEventListener('click', () => {
        filterBar.querySelectorAll('.following-filter').forEach(x => x.classList.remove('active'));
        f.classList.add('active');
      });
    });
  }
  // "With you" (filter === 'shared') has no context banner or chips —
  // sections inside #withYouView speak for themselves.
}

// Stories shown as masonry tiles on Worldwide — mirrors the data
// that used to live in the horizontal activity-rail.
const STORIES_TILES = [
  { name: 'Your story', img: imgs[2], add: true },
  { name: 'Marcus',     img: imgs[0], unread: true, live: true },
  { name: 'Jake',       img: imgs[1], unread: true },
  { name: 'Daniel',     img: imgs[3], unread: true },
  { name: 'Chris',      img: imgs[9], unread: false },
  { name: 'Sam',        img: imgs[4], unread: false },
];

function prependStoryTilesToMasonry() {
  const mas = document.getElementById('masonry');
  if (!mas) return;
  STORIES_TILES.forEach((p, idx) => {
    const tile = document.createElement('div');
    tile.className = 'masonry-item masonry-story'
      + (p.add ? ' masonry-story-add' : '')
      + (p.live ? ' masonry-story-live' : '')
      + (p.unread ? ' masonry-story-unread' : ' masonry-story-seen');
    tile.dataset.storyName = p.name;
    // Use computeSpan with 1:1 ratio so tiles are square-ish in the grid.
    // tileWidth is the current column width — fetch it from a temp child.
    const tileWidth = (mas.clientWidth || 375) / 3 - 8;
    tile.style.gridRowEnd = `span ${computeSpan(1, tileWidth)}`;
    if (p.add) {
      tile.innerHTML = `
        <div class="story-tile-add">
          <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <div class="story-tile-name">${p.name}</div>
        </div>`;
    } else {
      tile.innerHTML = `
        <div class="story-tile-img" style="background-image:url('${p.img}');"></div>
        ${p.live ? '<span class="story-tile-live"><span class="story-tile-live-dot"></span><span>Live</span></span>' : ''}
        <div class="story-tile-name">${p.name}</div>`;
    }
    mas.appendChild(tile);
  });
}

function applyFilter(filter) {
  currentFilter = filter;

  // Tab change: reset scroll + hero collapse state
  document.querySelector('.app-shell')?.scrollTo({ top: 0 });
  window.__resetHeroCollapse?.();

  // Show/hide top-level sections. eventsSection visibility is decided
  // further down (only shown on Local).
  liveStripEl.style.display   = (filter === 'worldwide') ? '' : 'none';
  // Stories bar disabled on Worldwide — they now appear as tiles in the feed
  activityRail.style.display  = 'none';
  // Slim location strip is only shown on Worldwide. On Local the hero heatmap
  // already surfaces the city + nearby count, so the strip would be redundant.
  const locStrip = document.getElementById('openMapBtn');
  if (locStrip) locStrip.style.display = (filter === 'worldwide') ? '' : 'none';

  // Chicago pin stays hidden across all tabs — the city context lives in the
  // hero pill (Worldwide) or the heatmap card (Local); Following/Shared don't
  // surface location at all.
  const locBtn = document.getElementById('locBtn');
  const nearbyLabel = document.getElementById('nearbyLabel');
  if (locBtn) locBtn.style.display = 'none';
  if (nearbyLabel) {
    nearbyLabel.textContent = (filter === 'worldwide') ? 'Chicago · 42 nearby' : '42 nearby';
  }

  // Context banner (heatmap or info strip)
  setContext(filter);

  // Events / collections rail swap
  // Editorial rail: only on Worldwide (community voice)
  const editorialSection = document.getElementById('editorialSection');
  if (editorialSection) {
    editorialSection.style.display = (filter === 'worldwide') ? '' : 'none';
    if (filter === 'worldwide') renderEditorialRail();
  }

  // Deprecated Pack shortcuts (Groups/Collections/Recent) — With you now has its own sections
  const packShortcuts = document.getElementById('packShortcuts');
  if (packShortcuts) packShortcuts.style.display = 'none';

  // Events rail swap — only shown on Local. Worldwide delegates global
  // context to the editorial rail, Following/Shared have their own surfaces,
  // so the events section is hidden everywhere else.
  const eventsSectionEl = document.getElementById('eventsSection');
  if (filter === 'local') {
    if (eventsSectionEl) eventsSectionEl.style.display = '';
    eventsRail.style.display = 'flex';
    collectionsRail.style.display = 'none';
    if (window._renderEventsRail && window._chicagoEvents) window._renderEventsRail(window._chicagoEvents);
  } else if (eventsSectionEl) {
    eventsSectionEl.style.display = 'none';
  }

  // With you uses its own curated view; other filters use masonry/feed
  const withYouView = document.getElementById('withYouView');
  const feedHeaderRow = document.querySelector('.feed-header-row');
  const isShared = filter === 'shared';

  if (feedHeaderRow) feedHeaderRow.style.display = isShared ? 'none' : '';
  if (withYouView)   withYouView.style.display   = isShared ? '' : 'none';
  masonry.style.display = isShared ? 'none' : '';
  feed.style.display    = isShared ? 'none' : '';

  // Feed section title (only for non-shared)
  feedSectionTitle.innerHTML =
    filter === 'local'     ? 'Latest posts around you' :
    filter === 'following' ? 'Latest from who you follow' :
                             'Community feed';

  // Rebuild masonry + feed
  masonry.innerHTML = '';
  feed.innerHTML = '';
  masonryBatch = 0; masonryIndex = 0;
  feedBatch = 0;   feedIndex = 0;

  // On Worldwide, stories are injected as the first row of the masonry
  // (instead of living in a separate horizontal bar above)
  if (filter === 'worldwide') {
    prependStoryTilesToMasonry();
  }

  if (isShared) {
    renderWithYou();
  } else {
    const masonryCount = filter === 'following' ? 9 : 18;
    const feedCount    = filter === 'following' ? 4 : 6;
    appendMasonryBatch(masonryCount);
    appendFeedBatch(feedCount);
  }

  // Default view per tab
  //   Worldwide → masonry (source ratios kept, dense 3-col)
  //   Local     → uniform grid (every tile 4:5, equal size)
  //   Following → feed (long-form posts)
  if (!isShared) {
    const btnGrid = document.getElementById('btnGrid');
    const btnFeed = document.getElementById('btnFeed');
    const wantsFeed    = filter === 'following';
    const wantsUniform = filter === 'local';

    if (wantsFeed) {
      btnFeed.classList.add('active');
      btnGrid.classList.remove('active', 'uniform');
      feed.classList.add('active');
      masonry.classList.remove('active', 'uniform');
    } else {
      btnGrid.classList.add('active');
      btnFeed.classList.remove('active');
      feed.classList.remove('active');
      masonry.classList.add('active');
      masonry.classList.toggle('uniform', wantsUniform);
      btnGrid.classList.toggle('uniform', wantsUniform);
    }
  }

  // Keep sentinel at bottom for infinite scroll
  const gridScroll = document.querySelector('.grid-scroll');
  const sentinel = document.querySelector('.scroll-sentinel');
  if (sentinel) gridScroll.appendChild(sentinel);
}

document.querySelectorAll('.filter-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelector('.filter-tab.active').classList.remove('active');
    tab.classList.add('active');
    applyFilter(tab.dataset.filter || 'worldwide');
  });
});

// Sync initial UI with the active tab so the first paint matches the
// worldwide layout (editorial rail shown, events section hidden) — without
// this, #eventsSection is visible by default until the user switches tab.
applyFilter(document.querySelector('.filter-tab.active')?.dataset.filter || 'worldwide');

// ── FAB Logic ──
const fab = document.getElementById('fab');
const scrim = document.getElementById('scrim');
const screens = {
  Camera:    document.getElementById('screenCamera'),
  Photo:     document.getElementById('screenCamera'),
  Home:      null, // FAB "Worldwide" — handled specially (switches tab, no modal)
  Groups:    document.getElementById('screenGroups'),
  Groupe:    document.getElementById('screenGroups'),
  Explore:   document.getElementById('screenMap'),
  Recherche: document.getElementById('screenExplore'),
  Chat:      document.getElementById('screenInbox'),
  Message:   document.getElementById('screenInbox'),
  Profile:   document.getElementById('screenProfile'),
};
const actions = document.querySelectorAll('.mini-action');
const labels = document.querySelectorAll('.action-label');
const rows = document.querySelectorAll('.action-row');
const cameraLines = document.querySelectorAll('.icon-camera');
const xLines = document.querySelectorAll('.icon-x');

let expanded = false;
let activeAction = null;
let isDragging = false;
let hasDragged = false;
let coachShown = false;

const STAGGER_IN = 60;
const STAGGER_OUT = 40;

// ── Coach mark ──
const fabCoach = document.getElementById('fabCoach');
setTimeout(() => {
  if (!coachShown) {
    fabCoach.classList.add('show');
    coachShown = true;
    setTimeout(() => fabCoach.classList.remove('show'), 3500);
  }
}, 1200);

function expand() {
  expanded = true;
  hasDragged = false;
  fab.classList.add('expanded');
  fab.setAttribute('aria-expanded', 'true');
  scrim.classList.add('active');
  fabCoach.classList.remove('show');

  cameraLines.forEach(l => l.style.opacity = '0');
  xLines.forEach(l => l.style.opacity = '1');

  const actionList = [...actions].reverse();
  const labelList = [...labels].reverse();
  actionList.forEach((btn, i) => {
    btn.style.transition = `opacity 0.3s cubic-bezier(0.34,1.56,0.64,1) ${i * STAGGER_IN}ms, transform 0.3s cubic-bezier(0.34,1.56,0.64,1) ${i * STAGGER_IN}ms`;
    requestAnimationFrame(() => btn.classList.add('visible'));
  });
  labelList.forEach((lbl, i) => {
    lbl.style.transition = `opacity 0.25s ease ${(i * STAGGER_IN) + 50}ms, transform 0.25s ease ${(i * STAGGER_IN) + 50}ms`;
    requestAnimationFrame(() => lbl.classList.add('visible'));
  });

  if (navigator.vibrate) navigator.vibrate(10);
}

function collapse() {
  expanded = false;
  activeAction = null;
  fab.classList.remove('expanded');
  fab.setAttribute('aria-expanded', 'false');
  scrim.classList.remove('active');

  cameraLines.forEach(l => l.style.opacity = '1');
  xLines.forEach(l => l.style.opacity = '0');

  actions.forEach((btn, i) => {
    btn.style.transition = `opacity 0.15s ease ${i * STAGGER_OUT}ms, transform 0.15s ease ${i * STAGGER_OUT}ms`;
    btn.classList.remove('visible', 'pressed', 'dimmed');
  });
  labels.forEach((lbl, i) => {
    lbl.style.transition = `opacity 0.12s ease ${i * STAGGER_OUT}ms, transform 0.12s ease ${i * STAGGER_OUT}ms`;
    lbl.classList.remove('visible', 'highlight', 'dimmed');
  });
}

function triggerAction(name) {
  collapse();
  if (navigator.vibrate) navigator.vibrate(5);

  // FAB "Worldwide" — no modal, just switch to the Worldwide tab and scroll top
  if (name === 'Home') {
    const wwTab = document.querySelector('.filter-tab[data-filter="worldwide"]');
    if (wwTab && !wwTab.classList.contains('active')) {
      document.querySelector('.filter-tab.active')?.classList.remove('active');
      wwTab.classList.add('active');
      applyFilter('worldwide');
    }
    document.querySelector('.app-shell')?.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  // FAB "Groups" / "Groupe" — populate the list and open the community hub
  if (name === 'Groups' || name === 'Groupe') {
    if (typeof openGroupsHub === 'function') {
      requestAnimationFrame(openGroupsHub);
    } else {
      const s = document.getElementById('screenGroups');
      if (s) requestAnimationFrame(() => s.classList.add('show'));
    }
    return;
  }

  // FAB "Chat" / "Message" → open unified Inbox on Messages segment
  if (name === 'Chat' || name === 'Message') {
    requestAnimationFrame(() => openInbox('messages'));
    return;
  }

  const screen = screens[name];
  if (!screen) return;
  requestAnimationFrame(() => screen.classList.add('show'));
}

function closeScreen(screen) {
  screen.classList.remove('show');
}

document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', () => closeScreen(btn.closest('.action-screen')));
  btn.addEventListener('touchend', (e) => { e.preventDefault(); closeScreen(btn.closest('.action-screen')); });
});

function getActionAtPoint(x, y) {
  const pad = 14;
  for (const row of rows) {
    const rect = row.getBoundingClientRect();
    if (y >= rect.top - pad && y <= rect.bottom + pad &&
        x >= rect.left - pad && x <= rect.right + pad) {
      return row.dataset.action;
    }
  }
  return null;
}

function highlightAction(actionName) {
  if (actionName === activeAction) return;
  activeAction = actionName;

  rows.forEach(row => {
    const btn = row.querySelector('.mini-action');
    const lbl = row.querySelector('.action-label');

    if (actionName === null) {
      btn.classList.remove('pressed', 'dimmed');
      lbl.classList.remove('highlight', 'dimmed');
    } else if (row.dataset.action === actionName) {
      btn.classList.add('pressed');
      btn.classList.remove('dimmed');
      lbl.classList.add('highlight');
      lbl.classList.remove('dimmed');
    } else {
      btn.classList.remove('pressed');
      btn.classList.add('dimmed');
      lbl.classList.remove('highlight');
      lbl.classList.add('dimmed');
    }
  });

  if (actionName && navigator.vibrate) navigator.vibrate(5);
}

// ── Scrim tap = cancel (fix #3) ──
scrim.addEventListener('click', () => {
  if (isOnboarding) { dismissFabOnboarding(); return; }
  if (expanded) collapse();
});
scrim.addEventListener('touchend', (e) => {
  e.preventDefault();
  if (isOnboarding) { dismissFabOnboarding(); return; }
  if (expanded) collapse();
}, { passive: false });

// ── FAB onboarding — shown on the first FAB gesture of every page load.
//    Session-scoped (no localStorage); reloading the page resets it. ──
const fabOnboardingEl = document.getElementById('fabOnboarding');
let isOnboarding = false;
let fabOnboardingSeen = false;
function maybeShowFabOnboarding() {
  if (fabOnboardingSeen || isOnboarding || !fabOnboardingEl) return false;
  isOnboarding = true;
  fabOnboardingEl.classList.add('show');
  return true;
}
// Called AFTER expand() so the icon overrides stick, and so the ring
// can be positioned once the container has its final layout size.
function applyOnboardingOverlay() {
  const fab = document.getElementById('fab');
  const ring = document.querySelector('.fab-onboarding-ring');
  if (!fab || !ring) return;
  const r = fab.getBoundingClientRect();
  const ringSize = 80;
  ring.style.left   = (r.left + r.width  / 2 - ringSize / 2) + 'px';
  ring.style.top    = (r.top  + r.height / 2 - ringSize / 2) + 'px';
  ring.style.right  = 'auto';
  ring.style.bottom = 'auto';
  // Keep the main FAB showing the camera icon during the onboarding
  // even though expand() swapped it to the X close icon.
  document.querySelectorAll('#fab .icon-camera').forEach(l => l.style.opacity = '1');
  document.querySelectorAll('#fab .icon-x').forEach(l => l.style.opacity = '0');
}
function dismissFabOnboarding() {
  if (!isOnboarding) return;
  isOnboarding = false;
  fabOnboardingSeen = true;
  fabOnboardingEl?.classList.remove('show');
}

// ── Scroll-to-top mode: when the hero has scrolled away (only sticky bars
//    remain), the FAB morphs into an up-arrow. Tap = jump to top. ──
(() => {
  const scrollRoot = document.querySelector('.app-shell');
  if (!scrollRoot || !fab) return;
  const THRESHOLD = 220;
  const update = () => fab.classList.toggle('scroll-top', scrollRoot.scrollTop > THRESHOLD);
  scrollRoot.addEventListener('scroll', update, { passive: true });
  update();
})();
function isScrollTopMode() { return fab.classList.contains('scroll-top'); }
function scrollToTop() {
  const scrollRoot = document.querySelector('.app-shell');
  if (!scrollRoot) return;
  if (navigator.vibrate) navigator.vibrate(8);
  const start = scrollRoot.scrollTop;
  if (start <= 0) return;
  // Duration scales with distance but capped — far scrolls feel snappy
  // (1000px → 280ms, 5000px → 480ms, 10000px → 600ms cap).
  const duration = Math.min(600, 180 + Math.sqrt(start) * 4);
  const t0 = performance.now();
  const ease = (t) => 1 - Math.pow(1 - t, 3); // easeOutCubic
  const step = (now) => {
    const t = Math.min(1, (now - t0) / duration);
    scrollRoot.scrollTop = start * (1 - ease(t));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ── Touch: press-and-drag ──
fab.addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (isScrollTopMode()) { scrollToTop(); return; }
  const showedOnboarding = maybeShowFabOnboarding();
  isDragging = true;
  expand();
  if (showedOnboarding) applyOnboardingOverlay();
}, { passive: false });

document.addEventListener('touchmove', (e) => {
  if (!isDragging || !expanded) return;
  hasDragged = true;
  const t = e.touches[0];
  highlightAction(getActionAtPoint(t.clientX, t.clientY));
}, { passive: true });

document.addEventListener('touchend', () => {
  if (!isDragging) return;
  isDragging = false;
  if (!expanded) return;
  // If user dragged to an action, trigger it. Otherwise just collapse (cancel).
  if (activeAction) {
    triggerAction(activeAction);
  } else if (!hasDragged) {
    // Quick tap with no drag = open Camera (default)
    triggerAction('Camera');
  } else {
    // Dragged but released on empty space = cancel
    collapse();
  }
  dismissFabOnboarding();
});

document.addEventListener('touchcancel', () => {
  if (isDragging) { isDragging = false; collapse(); }
});

// ── Mouse: same gesture for desktop ──
fab.addEventListener('mousedown', (e) => {
  e.preventDefault();
  if (isScrollTopMode()) { scrollToTop(); return; }
  const showedOnboarding = maybeShowFabOnboarding();
  isDragging = true;
  expand();
  if (showedOnboarding) applyOnboardingOverlay();
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging || !expanded) return;
  hasDragged = true;
  highlightAction(getActionAtPoint(e.clientX, e.clientY));
});

document.addEventListener('mouseup', () => {
  if (!isDragging) return;
  isDragging = false;
  if (!expanded) return;
  if (activeAction) {
    triggerAction(activeAction);
  } else if (!hasDragged) {
    triggerAction('Camera');
  } else {
    collapse();
  }
  dismissFabOnboarding();
});

// ── Keyboard: Enter/Space toggle, arrows navigate, Escape cancel (fix #7) ──
fab.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    if (maybeShowFabOnboarding()) return;
    expanded ? collapse() : expand();
  } else if (e.key === 'Escape' && expanded) {
    collapse();
  } else if (expanded && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
    e.preventDefault();
    const names = [...rows].map(r => r.dataset.action);
    const idx = activeAction ? names.indexOf(activeAction) : -1;
    const next = e.key === 'ArrowUp'
      ? (idx <= 0 ? names.length - 1 : idx - 1)
      : (idx >= names.length - 1 ? 0 : idx + 1);
    highlightAction(names[next]);
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // Close any open action screen
    document.querySelectorAll('.action-screen.show').forEach(s => closeScreen(s));
    if (expanded) collapse();
  }
});

// ── Swipe-down to dismiss action screens (fix #6) ──
(() => {
  let startY = 0;
  document.querySelectorAll('.action-screen').forEach(screen => {
    screen.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
    }, { passive: true });
    screen.addEventListener('touchend', (e) => {
      const dy = e.changedTouches[0].clientY - startY;
      if (dy > 100) closeScreen(screen);
    }, { passive: true });
  });
})();
