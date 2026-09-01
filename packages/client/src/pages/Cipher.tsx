import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  caseHintsActive,
  choiceToAnswer,
  drawMiniPrompt,
  drawPrompt,
  gradeCipher,
  miniCaseHintsActive,
  timeLimitFor,
  timeLimitForMini,
} from '@logiq/engine';
import type { CipherGrade, CipherPrompt, TokenPrompt } from '@logiq/engine';
import { IconArrowRight, IconBack, IconRestart, IconTarget } from '../components/Icons';
import { ThemeToggle } from '../components/ThemeToggle';
import { usePlayer } from '../lib/player';
import { play as playCue } from '../lib/sfx';
import './cipher.css';

type CipherVariant = 'full' | 'mini';

interface CipherConfig {
  accent: string;
  title: string;
  drawPrompt: typeof drawPrompt;
  timeLimitFor: (prompt: CipherPrompt) => number;
  caseHintsActive: (cracked: number) => boolean;
  briefTitle: string;
  rules: string[];
  walletLabel: string;
  securityBadge: string;
  typingHelp: string;
  quizHelp: string;
  inputAria: string;
  verdictOk: string;
  verdictTimeout: string;
  verdictMiss: string;
  nextLabel: string;
  backLabel: string;
  quizAdvanceMs: number;
  rootClass: string;
}

const VARIANTS: Record<CipherVariant, CipherConfig> = {
  full: {
    accent: 'gold',
    title: 'Case Cipher',
    drawPrompt,
    timeLimitFor,
    caseHintsActive,
    briefTitle: 'Type it exactly. Capitals count.',
    rules: [
      'Reproduce the password as written — case, dashes and underscores all matter.',
      'It sends itself on the last character. Beat the clock or you lose money.',
      'A clean break pays. A miss takes money back.',
      'Every so often a JavaScript question pops up. Those pay more — and cost more.',
    ],
    walletLabel: 'Heist wallet',
    securityBadge: 'Security question',
    typingHelp: 'Capitals, underscores and dashes all count. It sends itself on the last character.',
    quizHelp: 'Answer to bank the bonus — number keys work too.',
    inputAria: 'Type the token exactly',
    verdictOk: 'Clean break.',
    verdictTimeout: 'Out of time.',
    verdictMiss: 'Trace fee charged.',
    nextLabel: 'Next target',
    backLabel: 'Back to the password',
    quizAdvanceMs: 2600,
    rootClass: 'cipher',
  },
  mini: {
    accent: 'sky',
    title: 'Case Cipher Mini',
    drawPrompt: drawMiniPrompt,
    timeLimitFor: timeLimitForMini,
    caseHintsActive: miniCaseHintsActive,
    briefTitle: 'Type the word. Take your time.',
    rules: [
      'Type simple words — just letters, all lowercase.',
      'You get plenty of time, so no need to rush.',
      'Get it right to earn coins. A miss loses a few.',
      'Every few words, a fun bonus question pops up — games, cartoons and keyboard facts.',
    ],
    walletLabel: 'Coin pouch',
    securityBadge: 'Bonus question',
    typingHelp: 'Type each letter of the word. It checks itself when you finish the last letter.',
    quizHelp: 'Tap an answer — or press 1, 2, 3 or 4 on your keyboard.',
    inputAria: 'Type the word',
    verdictOk: 'Nice typing!',
    verdictTimeout: 'Time ran out.',
    verdictMiss: 'Not quite.',
    nextLabel: 'Next word',
    backLabel: 'Back to the word',
    quizAdvanceMs: 3200,
    rootClass: 'cipher cipher--mini',
  },
};

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const JS_TOKEN =
  /(\/\/.*$)|('[^']*'|"[^"]*")|\b(const|let|var|for|if|return|await|typeof|new|function)\b|\b(true|false|null|undefined)\b|\b(\d+)\b/gm;

function highlightJs(code: string) {
  const parts: Array<{ text: string; cls: string }> = [];
  let cursor = 0;
  for (const match of code.matchAll(JS_TOKEN)) {
    const at = match.index ?? 0;
    if (at > cursor) parts.push({ text: code.slice(cursor, at), cls: 'tok' });
    const [raw, comment, string, keyword, literal, digits] = match;
    parts.push({
      text: raw,
      cls: comment
        ? 'tok tok--comment'
        : string
          ? 'tok tok--string'
          : keyword
            ? 'tok tok--keyword'
            : literal || digits
              ? 'tok tok--number'
              : 'tok',
    });
    cursor = at + raw.length;
  }
  if (cursor < code.length) parts.push({ text: code.slice(cursor), cls: 'tok' });
  return parts.map((part, index) => (
    <span key={index} className={part.cls}>
      {part.text}
    </span>
  ));
}

interface Session {
  cracked: number;
  failed: number;
  streak: number;
  bestStreak: number;
  earned: number;
  lost: number;
}

const EMPTY_SESSION: Session = {
  cracked: 0,
  failed: 0,
  streak: 0,
  bestStreak: 0,
  earned: 0,
  lost: 0,
};

function CipherView({ variant }: { variant: CipherVariant }) {
  const config = VARIANTS[variant];
  const player = usePlayer();
  const [round, setRound] = useState(0);
  const [prompt, setPrompt] = useState<CipherPrompt>(() =>
    config.drawPrompt({ round: 0, cracked: 0 }),
  );
  const [typed, setTyped] = useState('');
  const [choice, setChoice] = useState<number | null>(null);
  const [grade, setGrade] = useState<CipherGrade | null>(null);
  const [ranOut, setRanOut] = useState(false);
  const [session, setSession] = useState<Session>(EMPTY_SESSION);
  const [recent, setRecent] = useState<string[]>([]);
  const [ended, setEnded] = useState(false);
  const [started, setStarted] = useState(false);
  const [lastToken, setLastToken] = useState<TokenPrompt | null>(() =>
    prompt.kind === 'token' ? prompt : null,
  );

  const limit = config.timeLimitFor(prompt);
  const [remaining, setRemaining] = useState(limit);
  const deadline = useRef(Date.now() + limit);
  const settled = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reviewing = grade !== null;
  const hintsOn = config.caseHintsActive(session.cracked);

  const focusInput = useCallback(() => {
    if (prompt.kind === 'token') inputRef.current?.focus();
  }, [prompt.kind]);

  const nextRound = useCallback(
    (crackedOverride?: number) => {
      const nextRecent = [prompt.id, ...recent].slice(0, 8);
      const next = round + 1;
      const drawn = config.drawPrompt({
        round: next,
        cracked: crackedOverride ?? session.cracked,
        recentIds: nextRecent,
      });

      setRecent(nextRecent);
      setRound(next);
      setPrompt(drawn);
      if (drawn.kind === 'token') setLastToken(drawn);
      setTyped('');
      setChoice(null);
      setGrade(null);
      setRanOut(false);
      settled.current = false;
      deadline.current = Date.now() + config.timeLimitFor(drawn);
      setRemaining(config.timeLimitFor(drawn));
      window.setTimeout(() => inputRef.current?.focus(), 0);
    },
    [config, prompt.id, recent, round, session.cracked],
  );

  const finish = useCallback(
    (answer: string, viaTimeout: boolean) => {
      if (settled.current) return;
      settled.current = true;

      const elapsedMs = limit - Math.max(0, deadline.current - Date.now());
      const result = gradeCipher(prompt, answer, { streak: session.streak, elapsedMs });

      setGrade(result);
      setRanOut(viaTimeout);
      setRemaining(viaTimeout ? 0 : Math.max(0, deadline.current - Date.now()));
      playCue(result.correct ? 'eat' : 'fail');

      setSession((current) => {
        const streak = result.correct ? current.streak + 1 : 0;
        return {
          cracked: current.cracked + (result.correct ? 1 : 0),
          failed: current.failed + (result.correct ? 0 : 1),
          streak,
          bestStreak: Math.max(current.bestStreak, streak),
          earned: current.earned + Math.max(0, result.delta),
          lost: current.lost + Math.max(0, -result.delta),
        };
      });

      player.recordCipherRound({
        promptId: prompt.id,
        typed: answer,
        elapsedMs,
        streak: session.streak,
        delta: result.delta,
        correct: result.correct,
      });
    },
    [prompt, limit, session.streak, player],
  );

  const pick = useCallback(
    (index: number) => {
      if (reviewing) return;
      setChoice(index);
      finish(choiceToAnswer(index), false);
    },
    [finish, reviewing],
  );

  useEffect(() => {
    if (!started || prompt.kind !== 'token' || reviewing) return;
    if (typed.length >= prompt.answer.length) finish(typed, false);
  }, [started, typed, prompt, reviewing, finish]);

  const timeUp = useRef(() => {});
  useEffect(() => {
    timeUp.current = () => finish(prompt.kind === 'token' ? typed : '', true);
  }, [finish, prompt.kind, typed]);

  useEffect(() => {
    if (!started || reviewing) return undefined;
    const ticker = window.setInterval(() => {
      const left = deadline.current - Date.now();
      setRemaining(Math.max(0, left));
      if (left <= 0) timeUp.current();
    }, 80);
    return () => window.clearInterval(ticker);
  }, [started, reviewing, round]);

  useEffect(() => {
    if (!grade?.correct) return undefined;
    const timer = window.setTimeout(
      () => nextRound(),
      prompt.kind === 'quiz' ? config.quizAdvanceMs : 1000,
    );
    return () => window.clearTimeout(timer);
  }, [grade, nextRound, prompt.kind, config.quizAdvanceMs]);

  useEffect(() => {
    if (started) focusInput();
  }, [started, focusInput]);

  const begin = useCallback(() => {
    deadline.current = Date.now() + config.timeLimitFor(prompt);
    setRemaining(config.timeLimitFor(prompt));
    settled.current = false;
    setStarted(true);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [config, prompt]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (ended || !started) return;
      if (event.key === 'Enter' && reviewing) {
        event.preventDefault();
        nextRound();
        return;
      }
      if (reviewing || prompt.kind !== 'quiz') return;
      const index = Number.parseInt(event.key, 10) - 1;
      if (index >= 0 && index < prompt.options.length) {
        event.preventDefault();
        pick(index);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ended, started, reviewing, prompt, pick, nextRound]);

  const board = prompt.kind === 'token' ? prompt : lastToken;
  const asking = prompt.kind === 'quiz';

  const characters = useMemo(() => {
    if (!board) return [];
    return board.answer.split('').map((char, index) => {
      const typedChar = typed[index];
      const consumed = index < typed.length;
      const isUpper = char !== char.toLowerCase();
      const isLower = char !== char.toUpperCase();
      return {
        char,
        key: `${index}-${char}`,
        caseClass: hintsOn ? (isUpper ? 'is-upper' : isLower ? 'is-lower' : 'is-symbol') : '',
        markClass: hintsOn && consumed ? (typedChar === char ? 'is-ok' : 'is-bad') : '',
        isCaret: index === typed.length,
      };
    });
  }, [board, typed, hintsOn]);

  const left = Math.max(0, Math.min(100, (remaining / limit) * 100));
  const clockState = left > 55 ? 'ok' : left > 25 ? 'warn' : 'danger';
  const net = session.earned - session.lost;

  const clock = (
    <div className="clock" data-state={clockState}>
      <span className="clock__track">
        <span className="clock__fill" style={{ width: `${left}%` }} />
      </span>
      <span className="clock__time">{(remaining / 1000).toFixed(1)}s</span>
    </div>
  );

  const verdict = grade && (
    <div className={`verdict${grade.correct ? ' verdict--ok' : ' verdict--bad'}`}>
      <span className="verdict__delta">
        {grade.delta >= 0 ? '+' : '−'}
        {money.format(Math.abs(grade.delta))}
      </span>
      <span className="verdict__text">
        {grade.correct ? (
          <>
            {config.verdictOk}
            {grade.speedBonus > 0 && ` Speed bonus ${money.format(grade.speedBonus)}.`}
            {grade.streakBonus > 0 && ` Streak bonus ${money.format(grade.streakBonus)}.`}
          </>
        ) : (
          <>
            {ranOut ? config.verdictTimeout : config.verdictMiss} The answer was{' '}
            <code>{grade.expected}</code>
          </>
        )}
      </span>
      {asking && <span className="verdict__why">{prompt.explain}</span>}
      {!grade.correct && (
        <button type="button" className="btn btn--primary verdict__next" onClick={() => nextRound()}>
          {asking ? config.backLabel : config.nextLabel}
          <IconArrowRight width={16} height={16} />
        </button>
      )}
    </div>
  );

  return (
    <div className={config.rootClass} data-accent={config.accent} onClick={focusInput}>
      <header className="cipher__bar">
        <Link className="btn btn--ghost cipher__back" to="/">
          <IconBack width={18} height={18} />
          Library
        </Link>
        {started && (
          <div className="wallet">
            <span className="wallet__label">{config.walletLabel}</span>
            <strong className="wallet__value">{money.format(player.wallet.balance)}</strong>
          </div>
        )}
        <span className="cipher__name">
          {config.title}
          <ThemeToggle />
        </span>
      </header>

      {!started ? (
        <section className="brief">
          <p className="eyebrow">How it works</p>
          <h1 className="brief__title">{config.briefTitle}</h1>
          <ol className="brief__rules">
            {config.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ol>
          <button type="button" className="btn btn--primary brief__go" onClick={begin}>
            Start
            <IconArrowRight width={16} height={16} />
          </button>
        </section>
      ) : (
        <main className={`cipher__stage${asking ? ' cipher__stage--held' : ''}`} aria-hidden={asking}>
          <div className="cipher__meta">
            <span className="eyebrow">{board?.label}</span>
            {session.streak > 1 && <span className="cipher__streak">streak ×{session.streak}</span>}
          </div>

          {!asking && clock}

          <div className={`target${hintsOn ? ' target--hinted' : ''}`}>
            {characters.map((character) => (
              <span
                key={character.key}
                className={`target__char ${character.caseClass} ${character.markClass}${
                  character.isCaret && !reviewing && !asking ? ' target__char--caret' : ''
                }`}
              >
                {character.char === ' ' ? '\u00a0' : character.char}
              </span>
            ))}
          </div>

          <input
            ref={inputRef}
            className={`entry${grade && !asking ? (grade.correct ? ' entry--ok' : ' entry--bad') : ''}`}
            value={typed}
            readOnly={reviewing || asking}
            maxLength={board?.answer.length}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            aria-label={config.inputAria}
            placeholder="start typing…"
            onChange={(event) => setTyped(event.target.value)}
            onPaste={(event) => event.preventDefault()}
          />

          <div className="cipher__result" role="status">
            {!asking && grade ? (
              verdict
            ) : (
              <p className="cipher__prompt-help">
                <IconTarget width={15} height={15} />
                <span>{config.typingHelp}</span>
              </p>
            )}
          </div>
        </main>
      )}

      {started && asking && (
        <div className="popup" role="dialog" aria-modal="true" aria-label={config.securityBadge}>
          <div className="popup__scrim" />
          <div className="popup__card">
            <header className="popup__head">
              <span className="popup__badge">{config.securityBadge}</span>
            </header>

            {clock}

            <p className="quiz__ask">{prompt.ask}</p>
            {prompt.code && (
              <pre className="snippet">
                <code>{highlightJs(prompt.code)}</code>
              </pre>
            )}

            <div className={`choices choices--${prompt.layout}`}>
              {prompt.options.map((option, index) => {
                const state = !reviewing
                  ? ''
                  : index === prompt.correct
                    ? ' choice--right'
                    : index === choice
                      ? ' choice--wrong'
                      : ' choice--dim';
                return (
                  <button
                    key={option}
                    type="button"
                    className={`choice${state}`}
                    disabled={reviewing}
                    onClick={() => pick(index)}
                  >
                    <span className="choice__key">{index + 1}</span>
                    {prompt.layout === 'code' ? (
                      <code className="choice__code">{highlightJs(option)}</code>
                    ) : (
                      <span className="choice__label">{option}</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="cipher__result" role="status">
              {grade ? (
                verdict
              ) : (
                <p className="cipher__prompt-help">
                  <IconTarget width={15} height={15} />
                  <span>{config.quizHelp}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {started && (
        <footer className="cipher__foot">
          <dl className="cipher__stats">
            <div>
              <dt>{variant === 'mini' ? 'Typed' : 'Cracked'}</dt>
              <dd>{session.cracked}</dd>
            </div>
            <div>
              <dt>Missed</dt>
              <dd>{session.failed}</dd>
            </div>
            <div>
              <dt>Best streak</dt>
              <dd>{session.bestStreak}</dd>
            </div>
            <div>
              <dt>This run</dt>
              <dd className={net >= 0 ? 'is-up' : 'is-down'}>
                {net >= 0 ? '+' : '−'}
                {money.format(Math.abs(net))}
              </dd>
            </div>
          </dl>
          <button
            type="button"
            className="btn"
            onClick={() => setEnded(true)}
            disabled={session.cracked + session.failed === 0}
          >
            End run
          </button>
        </footer>
      )}

      {ended && (
        <div className="sheet" role="dialog" aria-modal="true" aria-label="Run summary">
          <div className="sheet__scrim" onClick={() => setEnded(false)} />
          <div className="sheet__card sheet__card--win">
            <h2 className="sheet__title">Run banked</h2>
            <p className="sheet__body">
              {session.cracked} {variant === 'mini' ? 'words typed' : 'cracked'}, {session.failed}{' '}
              missed. Your {variant === 'mini' ? 'coins' : 'wallet'} carries over to the next run.
            </p>
            <dl className="sheet__stats">
              <div>
                <dt>Earned</dt>
                <dd>{money.format(session.earned)}</dd>
              </div>
              <div>
                <dt>Lost</dt>
                <dd>{money.format(session.lost)}</dd>
              </div>
              <div>
                <dt>{variant === 'mini' ? 'Coins' : 'Wallet'}</dt>
                <dd>{money.format(player.wallet.balance)}</dd>
              </div>
            </dl>
            <div className="sheet__actions">
              <Link className="btn btn--ghost" to="/">
                Back to library
              </Link>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => {
                  setSession(EMPTY_SESSION);
                  setEnded(false);
                  nextRound(0);
                }}
              >
                <IconRestart width={16} height={16} />
                New run
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Cipher() {
  return <CipherView variant="full" />;
}

export function CipherMini() {
  return <CipherView variant="mini" />;
}
