import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { getGame } from "../game/games";
import {
  LEVELS_PER_GAME,
  balloonRounds,
  balloonSpeech,
  balloonText,
  dragonRounds,
} from "../game/levels";
import { preload, say, sfx, stopVoice } from "../game/audio";
import DragonRound from "../game/DragonRound";
import BalloonRound from "../game/BalloonRound";
import { submitSession } from "../services/learnApi";
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
};

/** Remounts per level, so "next level" starts clean. */
export default function GamePlayPage() {
  const { game, level } = useParams();
  return <GamePlay key={`${game}-${level}`} />;
}

/** Plays one level of an island game, then sends the result to the server for stars. */
function GamePlay() {
  const { game: gameKey, level: levelParam } = useParams();
  const game = getGame(gameKey);
  const kind = KINDS[gameKey];
  const level = Math.min(Math.max(Number(levelParam) || 1, 1), LEVELS_PER_GAME);
  const navigate = useNavigate();
  const { profile, ready } = useRequireProfile();
  const { refreshProfile } = useProfile();

  const [runId, setRunId] = useState(0); // bump to play the level again with new rounds
  const rounds = useMemo(() => (kind ? kind.rounds(level) : []), [kind, level, runId]); // eslint-disable-line react-hooks/exhaustive-deps
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const answers = useRef([]);
  const startedAt = useRef(0);

  const round = rounds[index];

  useEffect(() => {
    if (!kind) return;
    const keys = new Set(["good1", "good2", "good3", "try", "hint", "level_done", "level_retry", game.intro]);
    rounds.forEach((r) => kind.speech(r).forEach((k) => keys.add(k)));
    if (gameKey === "dragon") ["dragon_more", "dragon_less", "dragon_yum"].forEach((k) => keys.add(k));
    preload([...keys]);
  }, [kind, rounds, game, gameKey]);

  // Say each round's question; before the first round, the game's instructions.
  useEffect(() => {
    if (!ready || !round || result) return;
    if (index === 0) {
      startedAt.current = Date.now();
      say(game.intro, kind.speech(round));
    } else {
      say(kind.speech(round));
    }
  }, [ready, round, index, result, game, kind]);

  useEffect(() => stopVoice, []);

  if (!game || !game.ready || !kind) return <Navigate to="/island" replace />;
  if (!ready) return null;

  function onRoundDone({ correct, chosen, hintUsed }) {
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
    submitSession({
      profileId: profile.id,
      topic: game.topic,
      stage: level,
      mode: "STAGE",
      durationMs: Date.now() - startedAt.current,
      answers: answers.current,
    })
      .then((summary) => {
        refreshProfile();
        setResult(summary);
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
            navigate(`/island/${game.key}`);
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
        <button className="round-btn" onClick={() => round && say(kind.speech(round))} aria-label="לשמוע שוב">
          🔊
        </button>
      </header>

      {error && <p className="form-error">{error}</p>}

      {round && !result && (
        <div className="game-help">
          <HelpButton
            key={`${runId}-${index}`}
            compact
            speak
            grade={profile.grade}
            question={{ text: kind.text(round), correct: kind.answer(round), hint: kind.hint(round) }}
          />
        </div>
      )}

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
          <div className="result__actions">
            <button className="round-btn round-btn--big" onClick={again} aria-label="לשחק שוב">
              🔁
            </button>
            {result.passed && level < LEVELS_PER_GAME && (
              <button
                className="round-btn round-btn--big round-btn--go"
                onClick={() => navigate(`/island/${game.key}/${level + 1}`)}
                aria-label="לשלב הבא"
              >
                ◀
              </button>
            )}
            <button className="round-btn round-btn--big" onClick={() => navigate("/island")} aria-label="לאי">
              🏝️
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
