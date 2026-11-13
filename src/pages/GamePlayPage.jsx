import { useEffect, useMemo, useRef, useState } from "react";
import DolphinPerch from "../components/DolphinPerch";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { getGame } from "../game/games";
import {
  LEVELS_PER_GAME,
  balloonRounds,
  balloonSpeech,
  balloonText,
  bridgeRounds,
  bridgeSpeech,
  bridgeText,
  dragonRounds,
  trainRounds,
  trainSpeech,
  trainText,
} from "../game/levels";
import { preload, say, sayUrl, sfx, stopVoice } from "../game/audio";
import CLIPS from "../game/clips.json";
import DragonRound from "../game/DragonRound";
import BalloonRound from "../game/BalloonRound";
import BridgeRound from "../game/BridgeRound";
import TrainRound from "../game/TrainRound";
import ClockRound from "../game/ClockRound";
import ShopRound from "../game/ShopRound";
import CoinsRound from "../game/CoinsRound";
import { clockRounds, coinsRounds, fewestCoins, shopRounds } from "../game/levelsClock";
import "../styles/pages/clock-isle.css";
import "../styles/pages/islands3.css";
import { patternRounds, patternText, shapeNameRounds, shapeNameSpeech, shapeNameText, sidesRounds, sidesSpeech, sidesText, SHAPE_NAMES } from "../game/levelsShapes";
import { arraysRounds, arraysText, groupsRounds, groupsText, remLabel, shareRounds, shareText } from "../game/levelsTimes";
import { biggerRounds, biggerText, fmt, lineRounds, lineText, placeValueRounds, placeValueText } from "../game/levelsBig";
import { PatternRound, ShapeNameRound, SidesRound } from "../game/ShapesGames";
import { ArraysRound, GroupsRound, ShareRound } from "../game/TimesGames";
import { BiggerRound, LineRound, PlaceValueRound } from "../game/BigGames";
import { speakUrl, submitIsleSession, submitSession } from "../services/learnApi";
import { lastWrong, recentKeys, rememberKeys, rememberWrong } from "../game/recent";
import { cheer } from "../game/companion";
import HelpButton from "../components/HelpButton";
import { useProfile } from "../context/profileStore";
import { useRequireProfile } from "../hooks/useRequireProfile";
import "../styles/pages/island.css";

// Per game: how to build the rounds, what to say, how to log a round for the server.
const KINDS = {
  dragon: {
    rounds: dragonRounds,
    speech: (r) => [`want${r.want}`],
    text: (r) => (r.start ? `לדרקון יש ${r.start}, הוא רוצה ${r.want} תותים` : `הדרקון רוצה ${r.want} תותים`),
    answer: (r) => String(r.want),
    explain: (r) => (r.start ? `סופרים מ-${r.start} והלאה עד ${r.want}` : `סופרים תות-תות עד ${r.want}`),
    // Read aloud when the AI is off - never says the number itself.
    hint: (r) =>
      r.start
        ? "יש כבר תותים בצלחת. מתחילים לספור מהם, ומוסיפים תות אחד בכל פעם עד המספר של הדרקון."
        : "לוחצים על תות אחד בכל פעם, וסופרים בקול: אחת, שתיים, שלוש, עד המספר של הדרקון.",
    Round: DragonRound,
  },
  balloons: {
    rounds: balloonRounds,
    speech: balloonSpeech,
    text: balloonText,
    answer: (r) => String(r.answer),
    explain: (r) => `${r.a} ${r.op} ${r.b} = ${r.answer}`,
    hint: (r) =>
      r.op === "+"
        ? "סופרים את כל התפוחים בתמונה, האדומים והירוקים, אחד אחד."
        : "סופרים רק את התפוחים שלא מחוקים, אחד אחד.",
    Round: BalloonRound,
  },
  // 2026-11-11
  bridge: {
    rounds: bridgeRounds,
    speech: bridgeSpeech,
    text: bridgeText,
    answer: (r) => String(r.answer),
    explain: (r) => `${r.have} + ${r.answer} = ${r.target}`,
    hint: (r) =>
      `סופרים את המקומות הריקים בגשר, אחד אחד. אפשר גם לספור קדימה מ-${r.have} עד ${r.target}, ולספור כמה צעדים עשינו.`,
    Round: BridgeRound,
  },
  train: {
    rounds: trainRounds,
    speech: trainSpeech,
    text: trainText,
    answer: (r) => String(r.answer),
    explain: (r) => `${r.step > 0 ? "מוסיפים" : "מורידים"} ${Math.abs(r.step)} בכל קרון: ${r.wagons.join(", ")}`,
    hint: (r) =>
      `בודקים כמה ${r.step > 0 ? "גדל" : "קטן"} המספר מקרון לקרון, וממשיכים באותה צורה עד הקרון עם סימן השאלה.`,
    Round: TrainRound,
  },
  // 2026-11-12: 🕐 אי השעון והכסף
  clock: {
    rounds: clockRounds,
    speech: (r) => [r.mode === "pick" ? "clock_pick" : "clock_q"],
    text: (r) => `מה השעה בשעון? (המחוג הקצר ליד ${r.h}, המחוג הארוך על ${r.m === 0 ? 12 : r.m / 5})`,
    answer: (r) => r.answer,
    explain: (r) => `המחוג הקצר ליד ${r.h}, הארוך על ${r.m === 0 ? 12 : r.m / 5} - השעה ${r.answer}`,
    hint: () =>
      "קודם מסתכלים על המחוג הקצר - הוא מראה את השעה. אחר כך על המחוג הארוך: על 12 זה בדיוק, על 6 זה וחצי, על 3 זה ורבע, על 9 זה רבע ל.",
    Round: ClockRound,
  },
  shop: {
    rounds: shopRounds,
    speech: (r) => (r.two ? ["shop_two"] : r.price <= 20 ? ["shop_price", `n${r.price}`, "shekels"] : ["shop_pay"]),
    text: (r) => (r.two ? `לשלם בדיוק על שני דברים: ${r.prices.join(" + ")} שקלים` : `לשלם בדיוק ${r.price} שקלים במטבעות`),
    answer: (r) => String(r.price),
    explain: (r) => `${fewestCoins(r.price, r.coins).join(" + ")} = ${r.price}`,
    hint: () =>
      "מתחילים מהמטבע הכי גדול שלא עובר את המחיר, ואז מוסיפים מטבעות קטנים, וסופרים כל פעם כמה יש, עד שמגיעים בדיוק למחיר.",
    Round: ShopRound,
  },
  coins: {
    rounds: coinsRounds,
    speech: (r) => [r.change ? "coins_change" : "coins_q"],
    text: (r) => (r.change ? `היו לי ${r.had} שקלים, קניתי ב-${r.price} שקלים. כמה נשאר?` : `כמה כסף יש: ${r.money.join(" + ")} שקלים`),
    answer: (r) => String(r.answer),
    explain: (r) => (r.change ? `${r.had} - ${r.price} = ${r.answer}` : `${r.money.join(" + ")} = ${r.answer}`),
    hint: (r) =>
      r.change
        ? "מתחילים מהמחיר וסופרים קדימה עד הכסף שהיה, או מורידים את המחיר מהכסף שהיה."
        : "מתחילים מהמטבע הגדול, ומוסיפים כל פעם את המטבע הבא, וסופרים בקול.",
    Round: CoinsRound,
  },
  // 2026-11-13: 🔷 אי הצורות
  shapename: {
    rounds: shapeNameRounds,
    speech: shapeNameSpeech,
    text: shapeNameText,
    answer: (r) => SHAPE_NAMES[r.target],
    explain: (r) => `זה ה${SHAPE_NAMES[r.target]}`,
    hint: (r) => (r.mode === "like" ? "חושבים על הצורה של הדבר: עגול מכל הצדדים? יש לו פינות? יש לו חוד?" : "סופרים לכל צורה כמה צלעות ופינות יש לה."),
    Round: ShapeNameRound,
  },
  sides: {
    rounds: sidesRounds,
    speech: sidesSpeech,
    text: sidesText,
    answer: (r) => (r.mode === "find" ? `${r.n} צלעות` : String(r.answer)),
    explain: (r) => (r.mode === "find" ? `לצורה הזאת ${r.n} צלעות` : `סופרים אחת-אחת: ${r.answer}`),
    hint: () => "שמים אצבע על פינה אחת, וסופרים כל פינה או צלע עד שחוזרים להתחלה.",
    Round: SidesRound,
  },
  pattern: {
    rounds: patternRounds,
    speech: () => ["pattern_q"],
    text: patternText,
    answer: (r) => r.labels[r.answer],
    explain: (r) => `הדבר שחוזר: ${r.labels[r.answer]}`,
    hint: () => "מחפשים איזה חלק חוזר שוב ושוב, וממשיכים אותו.",
    Round: PatternRound,
  },
  // ✖️ אי הכפל והחילוק
  groups: {
    rounds: groupsRounds,
    speech: () => ["groups_q"],
    text: groupsText,
    answer: (r) => String(r.answer),
    explain: (r) => `${r.n} × ${r.k} = ${r.answer}`,
    hint: (r) => `סופרים סל אחרי סל: ${r.k}, ${r.k * 2}, ${r.k * 3} וכך הלאה.`,
    Round: GroupsRound,
  },
  share: {
    rounds: shareRounds,
    speech: (r) => [r.mode === "kids" ? "share_kids_q" : r.mode === "rem" ? "share_rem_q" : "share_q"],
    text: shareText,
    answer: (r) => (r.mode === "rem" ? remLabel(r.answer) : String(r.answer)),
    explain: (r) => (r.mode === "kids" ? `${r.total} : ${r.each} = ${r.kids}` : r.mode === "rem" ? `${r.total} : ${r.kids} = ${r.each} ושארית ${r.rem}` : `${r.total} : ${r.kids} = ${r.each}`),
    hint: () => "מחלקים עוגייה אחת לכל ילד, שוב ושוב, עד שנגמרות.",
    Round: ShareRound,
  },
  arrays: {
    rounds: arraysRounds,
    speech: (r) => [r.mode === "which" ? "arrays_which" : r.mode === "floors" ? "arrays_floors" : "arrays_q"],
    text: arraysText,
    answer: (r) => String(r.answer),
    explain: (r) => `${r.rows} × ${r.cols} = ${r.total}`,
    hint: () => "סופרים כמה חלונות יש בקומה אחת, וכמה קומות - ואז כופלים.",
    Round: ArraysRound,
  },
  // 🏰 אי המספרים הגדולים
  placevalue: {
    rounds: placeValueRounds,
    speech: (r) => [r.mode === "digit" ? "pv_digit" : r.mode === "build" ? "pv_which" : "pv_q"],
    text: placeValueText,
    answer: (r) => (r.mode === "build" ? fmt(r.value) : fmt(r.answer)),
    explain: (r) => (r.mode === "digit" ? `הספרה ${r.digit} שווה ${fmt(r.answer)}` : `${fmt(r.value)}`),
    hint: () => "לוח גדול הוא מאה, מקל הוא עשר, וקובייה קטנה היא אחד.",
    Round: PlaceValueRound,
  },
  numline: {
    rounds: lineRounds,
    speech: (r) => [r.estimate ? "nl_est" : "nl_q"],
    text: lineText,
    answer: (r) => fmt(r.answer),
    explain: (r) => `כל קפיצה היא ${r.tick}, והחץ על ${fmt(r.answer)}`,
    hint: () => "בודקים בכמה גדל המספר בכל קפיצה, וסופרים קפיצות מהמספר שכתוב.",
    Round: LineRound,
  },
  bigger: {
    rounds: biggerRounds,
    speech: (r) => [{ max: "big_max", min: "big_min", sign: "big_sign", round10: "round_10", round100: "round_100" }[r.mode]],
    text: biggerText,
    answer: (r) => (r.mode === "sign" ? r.answer : fmt(r.answer)),
    explain: (r) => biggerText(r),
    hint: () => "משווים קודם את הספרה הכי שמאלית. אם היא שווה, עוברים לבאה.",
    Round: BiggerRound,
  },
};

/** Remounts per level, so "next level" starts clean. */
export default function GamePlayPage() {
  const { game, level, isleKey } = useParams();
  return <GamePlay key={`${isleKey ?? ""}-${game}-${level}`} />;
}

/** How much harder a shared base island is for the older grades. */
const BASE_TIER = { G2: 1, G3: 2 };

/** The biggest island tier for each grade's games (higher islands repeat this level with fresh rounds). */
const TIER_CAP = { G1: 2, G2: 3, G3: 6 };

/** 2026-11-13: "gen-3" -> 3 (a generated island's tier); a base island -> 0. */
function tierOf(isleKey) {
  const m = /^gen-(\d+)$/.exec(isleKey ?? "");
  return m ? Number(m[1]) : 0;
}

/**
 * Says a round's question: the recorded clips when every number has one (0-20 and the tens), else
 * the round's text in the computer's voice (bigger numbers on the generated islands).
 */
function speakRound(kind, round, before = []) {
  const keys = [...before, ...kind.speech(round)];
  if (keys.every((k) => CLIPS[k])) return say(...keys);
  return speakUrl(kind.text(round)).then((url) => (url ? sayUrl(url) : say(...before)));
}

/** Plays one level of an island game, then sends the result to the server for stars. */
function GamePlay() {
  const { game: gameKey, level: levelParam, isleKey } = useParams();
  const { profile: me } = useProfile();
  // 2026-11-13: numbers grow island after island, but never past the child's grade (א׳ stays small)
  const tier = Math.min(tierOf(isleKey), TIER_CAP[me?.grade] ?? 99);
  // 2026-11-13 (Shir: "ב׳ shouldn't get א׳ material"): an island shared by several grades is played a
  // level harder by the older ones (ב׳ +1, ג׳ +2); the generated islands keep their own tier.
  const playTier = tier || (BASE_TIER[me?.grade] ?? 0);
  // Where this level lives: a generated island's page, or the base island's game map.
  const back = tier ? `/sea/${isleKey}` : null;
  const memoryKey = tier ? `${gameKey}@${isleKey}` : gameKey;
  const game = getGame(gameKey);
  const kind = KINDS[gameKey];
  const level = Math.min(Math.max(Number(levelParam) || 1, 1), LEVELS_PER_GAME);
  const navigate = useNavigate();
  const { profile, ready } = useRequireProfile();
  const { refreshProfile } = useProfile();

  const [runId, setRunId] = useState(0); // bump to play the level again with new rounds
  // 2026-11-13 (Shir: "help limited in a round, unless the child is struggling"): 3 rounds with help,
  // unlimited after 2 mistakes in this run.
  const [helpCount, setHelpCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  // 2026-11-12 (Shir: "no repeating questions"): avoid what this child played lately on this device.
  const rounds = useMemo(
    () => (kind ? kind.rounds(level, Math.random, recentKeys(profile?.id, memoryKey, level), playTier) : []),
    [kind, level, runId, profile?.id], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const answers = useRef([]);
  const startedAt = useRef(0);

  const round = rounds[index];

  useEffect(() => {
    if (!kind) return;
    const keys = new Set(["good1", "good2", "good3", "try", "hint", "level_done", "level_retry", game.intro]);
    rounds.forEach((r) => kind.speech(r).forEach((k) => CLIPS[k] && keys.add(k)));
    if (gameKey === "dragon") ["dragon_more", "dragon_less", "dragon_yum"].forEach((k) => keys.add(k));
    if (gameKey === "bridge") keys.add("bridge_done");
    if (gameKey === "train") keys.add("train_go");
    if (gameKey === "shop") ["shop_more", "shop_less", "shop_thanks"].forEach((k) => keys.add(k));
    preload([...keys]);
  }, [kind, rounds, game, gameKey]);

  // Say each round's question; before the first round, the game's instructions.
  useEffect(() => {
    if (!ready || !round || result) return;
    if (index === 0) {
      startedAt.current = Date.now();
      speakRound(kind, round, [game.intro]);
    } else {
      speakRound(kind, round);
    }
  }, [ready, round, index, result, game, kind]);

  useEffect(() => stopVoice, []);

  // 2026-11-11: each new round restarts the companion's "stuck?" timer.
  useEffect(() => {
    if (round && !result) cheer("question");
  }, [round, result]);

  if (!game || !game.ready || !kind) return <Navigate to="/island" replace />;
  if (!ready) return null;

  function onRoundDone({ correct, chosen, hintUsed }) {
    // 2026-11-12 (Shir: "if the child didn't know it, the exercise comes back at some point, to see the
    // progress"): only what was right the first time is kept out of the next runs - a mistake may return.
    if (correct && round?._key) rememberKeys(profile?.id, memoryKey, level, [round._key]);
    if (!correct && round?._key) rememberWrong(profile?.id, `${memoryKey}:${round._key}`, chosen);
    cheer(correct ? "correct" : "wrong");
    if (!correct) setWrongCount((n) => n + 1);
    answers.current.push({
      questionText: kind.text(round),
      chosenAnswer: chosen,
      correctAnswer: kind.answer(round),
      correct,
      hintUsed,
      topic: game.topic,
      explanation: kind.explain(round),
    });
    if (index + 1 < rounds.length) {
      setIndex(index + 1);
      return;
    }
    const sent = tier
      ? // 2026-11-13: a generated island keeps its own stages (and every answer) on the server.
        submitIsleSession(profile.id, isleKey, {
          topic: game.topic,
          stage: level,
          durationMs: Date.now() - startedAt.current,
          answers: answers.current,
        }).then((s) => ({
          ...s,
          correct: answers.current.filter((a) => a.correct).length,
          total: answers.current.length,
        }))
      : submitSession({
          profileId: profile.id,
          topic: game.topic,
          stage: level,
          mode: "STAGE",
          durationMs: Date.now() - startedAt.current,
          answers: answers.current,
        });
    sent
      .then((summary) => {
        refreshProfile();
        setResult(summary);
        cheer(summary.passed ? "levelPassed" : "levelFailed");
        if (summary.passed) {
          sfx.star();
          say("level_done");
        } else {
          say("level_retry");
        }
      })
      .catch((e) => setError(e.message));
  }

  function again() {
    answers.current = [];
    setHelpCount(0);
    setWrongCount(0);
    setResult(null);
    setIndex(0);
    setRunId((n) => n + 1);
  }

  const { Round } = kind;

  return (
    <div className="app-shell island-shell game-shell" style={{ "--hut": game.color }}>
      <header className="island__top">
        <button
          className="round-btn"
          onClick={() => {
            stopVoice();
            navigate(back ?? `/island/${game.key}`);
          }}
          aria-label="יציאה"
        >
          ✕
        </button>
        <div className="round-dots" aria-label={`סיבוב ${index + 1} מתוך ${rounds.length}`}>
          {rounds.map((_, i) => (
            <span key={i} className={i < index || result ? "is-done" : i === index ? "is-now" : ""} />
          ))}
        </div>
        <button className="round-btn" onClick={() => round && speakRound(kind, round)} aria-label="לשמוע שוב">
          🔊
        </button>
      </header>
      <DolphinPerch side />

      {error && <p className="form-error">{error}</p>}

      {round && !result && helpCount >= 3 && wrongCount < 2 && (
        <p className="game-help game-help--done">🦉 העזרה נגמרה - נסו לבד!</p>
      )}
      {round && !result && (helpCount < 3 || wrongCount >= 2) && (
        <div className="game-help">
          <HelpButton
            key={`${runId}-${index}`}
            compact
            speak
            grade={profile.grade}
            onUsed={() => setHelpCount((n) => n + 1)}
            question={{
              text: kind.text(round),
              correct: kind.answer(round),
              chosen: round._key ? lastWrong(profile?.id, `${memoryKey}:${round._key}`) : undefined,
              hint: kind.hint(round),
            }}
          />
        </div>
      )}

      {tier > 0 && !result && <p className="game-tier">{`אי ${tierOf(isleKey)} · שלב ${level}`}</p>}
      {round && !result && <Round key={`${runId}-${index}`} round={round} onDone={onRoundDone} />}

      {result && (
        <div className="result" role="dialog" aria-label="סוף השלב">
          <div className="result__stars" aria-label={`${result.stars} כוכבים`}>
            {[1, 2, 3].map((n) => (
              <span key={n} className={n <= result.stars ? "is-on" : ""} style={{ "--i": n }}>
                ★
              </span>
            ))}
          </div>
          <p className="result__score" dir="ltr">
            {result.correct} / {result.total}
          </p>
          {result.newIsleOpened && <p className="result__new-isle">🏝️ נפתח אי חדש!</p>}
          {result.passed && !tier && (
            <button className="result__gift" onClick={() => navigate("/my-island")}>
              🎁 חלק חדש לאי שלי!
            </button>
          )}
          <div className="result__actions">
            <button className="round-btn round-btn--big" onClick={again} aria-label="לשחק שוב">
              🔁
            </button>
            {result.passed && level < LEVELS_PER_GAME && (
              <button
                className="round-btn round-btn--big round-btn--go"
                onClick={() => navigate(tier ? `/sea/${isleKey}/${game.key}/${level + 1}` : `/island/${game.key}/${level + 1}`)}
                aria-label="לשלב הבא"
              >
                ◀
              </button>
            )}
            <button className="round-btn round-btn--big" onClick={() => navigate(back ?? `/isle/${game.isle}`)} aria-label="לאי">
              🏝️
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
