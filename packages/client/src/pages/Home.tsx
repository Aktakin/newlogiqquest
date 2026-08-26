import { Link } from 'react-router-dom';
import { SEED_BALANCE, games, library } from '@logiq/engine';
import { IconArrowRight } from '../components/Icons';
import { Frog, GoldenLily, LilyPad } from '../components/PondArt';
import { ThemeToggle } from '../components/ThemeToggle';
import { usePlayer } from '../lib/player';
import './home.css';

export function Home() {
  const player = usePlayer();
  const totalStars = games.reduce((sum, game) => sum + player.starsInGame(game.id), 0);
  const banked = player.wallet.balance !== SEED_BALANCE || player.wallet.cracked > 0;

  const progressFor = (entryId: string) => {
    if (entryId === 'case-cipher') {
      return player.wallet.cracked > 0 ? `${player.wallet.cracked} cracked` : null;
    }
    const game = games.find((candidate) => candidate.id === entryId);
    if (!game) return null;
    const solved = game.levels.filter((level) => player.progressFor(game.id, level.id)).length;
    return solved > 0 ? `${solved} of ${game.levels.length}` : null;
  };

  return (
    <div className="home">
      <header className="home__top">
        <span className="wordmark">
          <span className="wordmark__frog" aria-hidden>
            <Frog />
          </span>
          LOGIQ
        </span>
        <span className="home__tally">
          {totalStars > 0 && <span>{totalStars} stars</span>}
          {banked && <span>${player.wallet.balance.toLocaleString('en-US')}</span>}
          <ThemeToggle />
        </span>
      </header>

      <main className="home__body">
        <section className="hero">
          <div className="pond" aria-hidden>
            <span className="pond__tile pond__tile--a">
              <LilyPad seed={0.2} />
            </span>
            <span className="pond__tile pond__tile--b">
              <LilyPad seed={0.7} />
            </span>
            <span className="pond__tile pond__tile--c">
              <GoldenLily />
            </span>
            <span className="pond__frog">
              <Frog />
            </span>
          </div>

          <h1 className="hero__title">Learn to think like a program.</h1>
          <p className="hero__line">Three ways in. No syntax to memorise.</p>
        </section>

        <nav className="activities" aria-label="Activities">
          {library.map((entry, index) => (
            <Link key={entry.id} to={entry.path} className="activity" data-accent={entry.accent}>
              <span className="activity__index">{String(index + 1).padStart(2, '0')}</span>
              <span className="activity__text">
                <span className="activity__name">{entry.title}</span>
                <span className="activity__blurb">{entry.blurb}</span>
              </span>
              <span className="activity__meta">{progressFor(entry.id) ?? entry.meta}</span>
              <IconArrowRight className="activity__arrow" width={18} height={18} />
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
