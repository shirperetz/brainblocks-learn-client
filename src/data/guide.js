/**
 * The kids' guide (2026-11-19, Shir: "explain to every child what everything is, and have a place on
 * the side for whoever didn't understand"). Directions א׳+ב׳ from the sketch: the first time a child
 * opens a screen the dolphin walks them through it (spotlight + bubble, read aloud for those who hear
 * questions read), and a "?" tab on the side of every screen lists the same explanations.
 *
 * A step: { target, title, text, center? }
 *   target - a CSS selector, or "text:<words>" = the first button/link whose text contains <words>.
 *   center - show it in the middle with no spotlight (the screen as a whole).
 *   A step whose target never shows up on this screen is skipped in the tour (and greyed in the list).
 */

const COMPANION = {
  target: ".companion__dolphin",
  title: "זה אני, הדולפין 🐬",
  text: "לחצו עליי כשאתם צריכים עידוד. אחרי טעות אני גם נותן רמז, בלי לגלות את התשובה.",
};
const SOUND = { target: ".sound-toggle", title: "🔊 קולות", text: "הכפתור הזה מדליק ומכבה את הקולות באתר." };
const MY_ISLAND = { target: ".my-island-btn", title: "🏝️ האי שלי", text: "כאן רואים כמה מטבעות יש לכם, ונכנסים לבנות את האי שלכם." };
const ROOM = { target: ".room-entry", title: "🎮 משחק עם הכיתה", text: "המורה פתחה משחק? לוחצים כאן ומקלידים את הקוד שעל הלוח." };
const WEEKLY = { target: ".weekly", title: "📅 משימה מהמורה", text: "משימה שהמורה נתנה. הפס מראה כמה כבר עשיתם." };
const HELP_CHIP = { target: ".help-chip", title: "🤔 לא הבנתי", text: "מקבלים הסבר איך לפתור, בלי לגלות את התשובה." };

const PAGES = [
  {
    key: "home-staff",
    match: (path, p) => path === "/" && (p?.teacher || p?.admin),
    name: "מסך הבית",
    steps: [
      { target: "text:פתיחת חדר משחק", title: "🎮 חדר משחק", text: "פותחים משחק חי לכיתה: בוחרים נושאים, מראים את הקוד על הלוח, והילדים נכנסים." },
      { target: "text:הכיתות שלי", title: "📊 הכיתות שלי", text: "הכיתות, הילדים, הדוחות והמשימות שלך." },
      { target: "text:התקדמות הילדים", title: "📊 התקדמות הילדים", text: "דוחות לכל ילד: מה קל, מה קשה ואיזו טעות חוזרת." },
      SOUND,
    ],
  },
  {
    key: "home",
    match: (path, p) => path === "/" && !!p,
    name: "מסך הבית",
    steps: [
      { center: true, title: "שלום! אני הדולפין 🐬", text: "אני אראה לכם מה יש באתר. לחצו \"הבא\" כדי להמשיך, או \"דלג\" אם אתם כבר יודעים." },
      { target: "text:להמשיך לשחק", title: "▶️ להמשיך לשחק", text: "מכאן ממשיכים לשחק מאיפה שעצרתם." },
      { target: "text:יש לי קוד מהמורה", title: "🎮 קוד מהמורה", text: "המורה פותחת משחק לכל הכיתה ומראה קוד על הלוח. לוחצים כאן ומקלידים אותו." },
      { target: "text:האי שלי", title: "🏝️ האי שלי", text: "האי שלכם! בונים בו בתים ומבנים עם המטבעות שמרוויחים במשחקים." },
      { target: "text:הצטרפות לכיתה", title: "🏫 הצטרפות לכיתה", text: "קיבלתם קוד כיתה מהמורה? כאן מצטרפים לכיתה שלה." },
      { target: "text:הגדרות", title: "⚙️ הגדרות", text: "מחליפים דמות, כיתה או סיסמה, ומדליקים הקראה של השאלות." },
      SOUND,
      { center: true, title: "יש שאלה? ❓", text: "בצד של כל מסך יש כפתור \"?\". לוחצים עליו ורואים מה כל דבר עושה." },
    ],
  },
  {
    key: "sea",
    match: (path) => path === "/island",
    name: "ים האיים",
    steps: [
      { target: ".sea-path, .isle-card", title: "🏝️ ים האיים", text: "כל אי הוא נושא, ובכל אי יש משחקים. לוחצים על אי כדי לשחק." },
      { target: ".isle-card__bar", title: "⭐ כוכבים", text: "הפס מראה כמה כוכבים אספתם באי. כשאוספים מספיק כוכבים, נפתח האי הבא." },
      MY_ISLAND,
      ROOM,
      WEEKLY,
      COMPANION,
    ],
  },
  {
    key: "isle",
    match: (path) => /^\/isle\/[^/]+$/.test(path) || /^\/sea\/[^/]+$/.test(path),
    name: "האי",
    steps: [
      { target: ".island__grid", title: "🏠 המשחקים של האי", text: "כל בית הוא משחק. לוחצים עליו כדי להתחיל." },
      { target: ".hut__stars", title: "⭐ הכוכבים שלכם", text: "כמה כוכבים קיבלתם במשחק הזה." },
      { target: ".hut__lock", title: "🔒 נעול", text: "משחק נעול נפתח כשמתקדמים במשחקים שלפניו." },
      COMPANION,
    ],
  },
  {
    key: "levels",
    match: (path) => /^\/island\/[^/]+$/.test(path),
    name: "השלבים",
    steps: [
      { target: ".levels", title: "🪨 השלבים", text: "מתחילים מהשלב הראשון. כל שלב שעוברים פותח את השלב הבא." },
      { target: ".stone__stars", title: "⭐ עד 3 כוכבים", text: "יותר תשובות נכונות נותנות יותר כוכבים." },
    ],
  },
  {
    key: "island-game",
    match: (path) => /^\/island\/[^/]+\/[^/]+$/.test(path) || /^\/sea\/[^/]+\/[^/]+\/[^/]+$/.test(path),
    name: "משחק",
    steps: [
      { center: true, title: "🎲 משחק", text: "קוראים או מקשיבים לשאלה ובוחרים את התשובה. אם טעיתם, התרגיל יחזור עוד מעט כדי שתצליחו." },
      HELP_CHIP,
      COMPANION,
    ],
  },
  {
    key: "topics",
    match: (path) => path === "/topics",
    name: "מה משחקים היום?",
    steps: [
      { target: ".challenge-row", title: "⚡ משחקים קצרים", text: "אתגר יומי, 60 שניות וחזרה על טעויות. אפשר לשחק בהם כל יום." },
      { target: ".topics-toggle", title: "📚 תרגול לפי נושא", text: "לוחצים כאן ובוחרים נושא לתרגול: חיבור, כפל, שברים ועוד." },
      ROOM,
      WEEKLY,
      MY_ISLAND,
      COMPANION,
    ],
  },
  {
    key: "stage-map",
    match: (path) => /^\/map\/[^/]+$/.test(path),
    name: "מפת השלבים",
    steps: [
      { target: ".island-stop__go, .island-stop", title: "🪨 השלב הבא", text: "כל אבן היא שלב. לוחצים על האבן שכתוב עליה \"שחקו!\"." },
      { target: ".topic-island__stars", title: "⭐ כל הכוכבים", text: "כמה כוכבים אספתם בכל השלבים של הנושא." },
      COMPANION,
    ],
  },
  {
    key: "play",
    match: (path) => /^\/play\//.test(path) || /^\/sea\/[^/]+\/q\//.test(path),
    name: "תרגיל",
    steps: [
      { target: ".play__question", title: "❓ התרגיל", text: "זה התרגיל. קוראים אותו טוב לפני שעונים." },
      { target: ".play__answers", title: "👆 התשובות", text: "לוחצים על התשובה הנכונה. אם טעיתם, רואים את התשובה הנכונה והסבר." },
      { target: ".read-aloud", title: "🔊 הקראה", text: "לוחצים כאן כדי לשמוע את השאלה בקול." },
      HELP_CHIP,
      { target: ".play__counter, .play__points", title: "🔢 כמה נשאר", text: "כמה שאלות כבר עניתם בסבב." },
      COMPANION,
      { target: ".play__exit", title: "🚪 יציאה", text: "יוצאים מהשלב באמצע. ההתקדמות של הסבב לא נשמרת." },
    ],
  },
  {
    key: "daily",
    match: (path) => path === "/daily",
    name: "אתגר יומי",
    steps: [{ target: ".challenge__intro, .challenge", title: "📅 אתגר יומי", text: "כמה שאלות פעם ביום. מי שמסיים מקבל מטבעות 🪙, ובכל יום שלישי ברצף יש בונוס." }],
  },
  {
    key: "timed",
    match: (path) => path === "/timed",
    name: "60 שניות",
    steps: [
      { target: ".challenge__intro, .challenge", title: "⏱ 60 שניות", text: "כמה תרגילים תספיקו בדקה אחת? טעות עולה בזמן, אז עדיף לחשוב רגע." },
      { target: ".timer", title: "⏳ השעון", text: "הפס מראה כמה זמן נשאר." },
    ],
  },
  {
    key: "review",
    match: (path) => path === "/review",
    name: "חזרה על טעויות",
    steps: [{ target: ".challenge__intro, .challenge", title: "🔁 חזרה", text: "תרגילים שטעיתם בהם חוזרים לפה. אחרי כמה תשובות נכונות בימים שונים, הם נעלמים." }],
  },
  {
    key: "my-island",
    match: (path) => path === "/my-island",
    name: "האי שלי",
    steps: [
      { center: true, title: "🏝️ האי שלכם", text: "על כל כוכב שאתם מקבלים במשחקים מקבלים מטבע 🪙. כאן בונים איתם את האי." },
      { center: true, title: "🛒 החנות", text: "בוחרים מבנה בחנות, ואז לוחצים על מקום פנוי באי. אפשר גם לשדרג מבנה שכבר בניתם." },
      { center: true, title: "🎁 אוצרות", text: "כשמסיימים אי של משחקים, מחכה לכם תיבת אוצר. כשהאי שלכם מלא, נפתח אי חדש." },
    ],
  },
  {
    key: "room-join",
    match: (path) => path === "/room",
    name: "כניסה למשחק",
    steps: [{ target: ".room-code-input", title: "🔢 הקוד", text: "מקלידים כאן את הקוד שהמורה מראה על הלוח, ונכנסים למשחק של הכיתה." }],
  },
  {
    key: "room-play",
    match: (path) => /^\/room\/[^/]+$/.test(path),
    name: "משחק כיתה",
    steps: [{ center: true, title: "🎮 משחק עם הכיתה", text: "כולם עונים באותו זמן, והמורה רואה טבלה. כל תשובה נכונה נותנת נקודות. אין צורך למהר, עדיף לצדוק." }],
  },
  {
    key: "settings",
    match: (path) => path === "/settings",
    name: "הגדרות",
    steps: [
      { target: ".char-grid", title: "🧒 הדמות", text: "בוחרים את הדמות שלכם." },
      { target: ".settings__grade", title: "🏫 הכיתה", text: "באיזו כיתה אתם. התרגילים מתאימים לכיתה." },
      { center: true, title: "🔊 הקראה", text: "אפשר להדליק כאן הקראה של כל שאלה בקול." },
    ],
  },
  {
    key: "staff",
    match: (path) => path === "/staff",
    name: "הכיתות שלי",
    steps: [
      { center: true, title: "📊 הכיתות שלך", text: "בוחרים כיתה ורואים את הילדים: מי ממתין לאישור, מי מתקשה ובמה." },
      { center: true, title: "📋 דוח לילד", text: "לחיצה על ילד פותחת דוח: מה חזק, מה קשה, איזו טעות חוזרת, ותרגול אישי בשבילו." },
    ],
  },
];

/** The guide for this screen, or null (no guide on admin/login/sign-up screens). */
export function guideFor(pathname, profile) {
  if (!profile) return null;
  return PAGES.find((g) => g.match(pathname, profile)) || null;
}

const SEEN_KEY = (id) => `lc_guide_seen_${id}`;

export function seenGuides(profileId) {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY(profileId)) || "[]"));
  } catch {
    return new Set();
  }
}

export function markGuideSeen(profileId, key) {
  try {
    const s = seenGuides(profileId);
    s.add(key);
    localStorage.setItem(SEEN_KEY(profileId), JSON.stringify([...s]));
  } catch {
    /* private mode - the tour may show again, that's fine */
  }
}

export function resetGuides(profileId) {
  try {
    localStorage.removeItem(SEEN_KEY(profileId));
  } catch {
    /* ignore */
  }
}

/** Finds a step's element: a CSS selector, or "text:<words>" in a button/link. */
export function findTarget(target) {
  if (!target) return null;
  if (target.startsWith("text:")) {
    const words = target.slice(5);
    return [...document.querySelectorAll("button, a")].find((el) => el.textContent.includes(words) && el.offsetParent) || null;
  }
  for (const sel of target.split(",")) {
    const el = document.querySelector(sel.trim());
    if (el && (el.offsetParent || el.getClientRects().length)) return el;
  }
  return null;
}
