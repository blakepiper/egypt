import '../../app.css';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Button, Callout, EvidenceBadge, Icon, Window, type EvidenceKind } from '../../design-system';

type View = 'explore' | 'journeys' | 'system';
type SeasonId = 'akhet' | 'peret' | 'shemu';

interface Topic {
  id: string;
  label: string;
  eyebrow: string;
  summary: string;
  evidence: EvidenceKind;
  source: string;
  x: number;
  y: number;
}

const topics: Topic[] = [
  {
    id: 'continuity', label: 'Renewable continuity', eyebrow: 'Core synthesis', x: 50, y: 48,
    summary: 'Creation, kingship, temple cult, heka, and afterlife share a grammar of threatened order restored through repeated right action.',
    evidence: 'archive', source: 'start-here.md · C01 / C02 / C03 / C04',
  },
  {
    id: 'creation', label: 'Creation', eyebrow: 'Cosmology', x: 19, y: 20,
    summary: 'Creation was not safely finished. Temples, offerings, and the solar cycle continued the work of differentiation against relapse into formlessness.',
    evidence: 'scholarship', source: 'creation-traditions.md · C02 / C03',
  },
  {
    id: 'maat', label: 'Maat & isfet', eyebrow: 'Order', x: 78, y: 19,
    summary: 'Maat joined truth, justice, proper relation, and cosmic order. Its opposite was not eliminated once; disorder remained a recurring possibility.',
    evidence: 'archive', source: 'maat-isfet-and-kingship.md · C02 / C03',
  },
  {
    id: 'temple', label: 'Temple practice', eyebrow: 'Institution', x: 16, y: 76,
    summary: 'Priests awakened, washed, clothed, perfumed, fed, and secluded cult images. Repetition maintained divine presence and the created world.',
    evidence: 'scholarship', source: 'temples-priests-and-offerings.md · C03 / C22',
  },
  {
    id: 'lived', label: 'Lived religion', eyebrow: 'Home & festival', x: 82, y: 73,
    summary: 'People met gods through festivals, hearing-ear chapels, votives, dreams, household protectors, work communities, and relationships with the dead.',
    evidence: 'scholarship', source: 'festivals-oracles-and-personal-piety.md · C03',
  },
  {
    id: 'afterlife', label: 'Personhood', eyebrow: 'Death & renewal', x: 51, y: 88,
    summary: 'Survival required body, heart, name, shadow, ka, ba, and akh to retain integrity, mobility, memory, provisioning, and vindication.',
    evidence: 'archive', source: 'personhood-and-the-afterlife.md · C02 / C03',
  },
];

const seasons: Record<SeasonId, { label: string; title: string; description: string; task: string; level: string }> = {
  akhet: { label: 'Akhet', title: 'Inundation', description: 'Floodwater and silt renewed the cultivated valley. The scale and timing varied, and modern dams have transformed the cycle.', task: 'Repair tools · move goods · serve local institutions', level: '88%' },
  peret: { label: 'Peret', title: 'Emergence', description: 'As water receded, fields emerged for sowing and cultivation. Agricultural life tied ecology, taxation, labor, and ritual together.', task: 'Sow grain · tend fields · maintain canals', level: '46%' },
  shemu: { label: 'Shemu', title: 'Harvest', description: 'Harvest and dry months brought gathering, accounting, transport, and preparation for the returning flood.', task: 'Reap · thresh · measure · store', level: '18%' },
};

const navItems: { id: View; label: string; icon: 'network' | 'compass' | 'archive' }[] = [
  { id: 'explore', label: 'Explore', icon: 'network' },
  { id: 'journeys', label: 'Journeys', icon: 'compass' },
  { id: 'system', label: 'System', icon: 'archive' },
];

function SearchDialog({ open, onClose, onSelect }: { open: boolean; onClose: () => void; onSelect: (topic: Topic) => void }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => topics.filter((topic) => `${topic.label} ${topic.summary}`.toLowerCase().includes(query.toLowerCase())), [query]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    requestAnimationFrame(() => inputRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="search-dialog archive-window" role="dialog" aria-modal="true" aria-labelledby="search-title">
        <div className="search-dialog__head">
          <div><span className="kicker">Find a path</span><h2 id="search-title">Search the archive</h2></div>
          <Button variant="quiet" iconOnly aria-label="Close search" onClick={onClose}><Icon name="close" /></Button>
        </div>
        <label className="search-field">
          <Icon name="search" />
          <span className="sr-only">Search topics</span>
          <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try “festival” or “creation”…" />
          <kbd>ESC</kbd>
        </label>
        <div className="search-results" aria-live="polite">
          {results.map((topic) => (
            <button key={topic.id} onClick={() => { onSelect(topic); onClose(); }}>
              <span><strong>{topic.label}</strong><small>{topic.eyebrow}</small></span><span aria-hidden="true">↗</span>
            </button>
          ))}
          {!results.length && <p>No path found. Try a broader idea.</p>}
        </div>
      </div>
    </div>
  );
}

function ConceptWeb({ active, onSelect }: { active: Topic; onSelect: (topic: Topic) => void }) {
  return (
    <div className="concept-web" aria-label="Conceptual web connecting six themes">
      <svg className="concept-web__lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M50 48 19 20M50 48 78 19M50 48 16 76M50 48 82 73M50 48 51 88M19 20 78 19M16 76 51 88 82 73" />
        <path className="concept-web__river" d="M50 -5C38 15 64 29 50 48S61 78 51 105" />
        <path className="concept-web__current archive-motion-flow" d="M50 -5C38 15 64 29 50 48S61 78 51 105" />
      </svg>
      <div className="concept-web__sun" aria-hidden="true" />
      {topics.map((topic) => (
        <button
          key={topic.id}
          className={`concept-node concept-node--${topic.id} ${active.id === topic.id ? 'is-active' : ''}`}
          style={{ '--x': `${topic.x}%`, '--y': `${topic.y}%` } as CSSProperties}
          aria-pressed={active.id === topic.id}
          onClick={() => onSelect(topic)}
        >
          <small>{topic.eyebrow}</small><span>{topic.label}</span>
        </button>
      ))}
    </div>
  );
}

function TopicReading({ topic }: { topic: Topic }) {
  return (
    <article key={topic.id} className="topic-reading archive-motion-unfold" aria-live="polite">
      <div className="topic-reading__head"><div><span className="kicker">Selected thread</span><h2>{topic.label}</h2></div><EvidenceBadge kind={topic.evidence} /></div>
      <p>{topic.summary}</p>
      <div className="source-row"><span>Archive trail</span><code>{topic.source}</code></div>
      <Callout label="Interpretive boundary">This specimen condenses the source archive. The full application should keep period, place, evidence type, and uncertainty visible beside every immersive reconstruction.</Callout>
    </article>
  );
}

function NileCycle({ onClose }: { onClose: () => void }) {
  const [season, setSeason] = useState<SeasonId>('akhet');
  const current = seasons[season];
  return (
    <Window title="The Nile year" status="Ecological lens" statusEnd="3 seasons" className="nile-window" managed onClose={onClose}>
      <div className="season-switcher" role="tablist" aria-label="Ancient Egyptian seasons">
        {(Object.keys(seasons) as SeasonId[]).map((id) => <button key={id} role="tab" aria-selected={season === id} onClick={() => setSeason(id)}>{seasons[id].label}</button>)}
      </div>
      <div className={`nilometer nilometer--${season}`} aria-label={`Illustrative water level ${current.level}`}>
        <div className="nilometer__sky archive-motion-solar"><Icon name="sun" size={22} /></div>
        <div className="nilometer__bank"><i/><i/><i/><i/><i/></div>
        <div className="nilometer__water archive-motion-flow"><span>{current.level}</span></div>
      </div>
      <span className="kicker">{current.label} · seasonal lens</span>
      <h3>{current.title}</h3>
      <p>{current.description}</p>
      <dl className="season-task"><dt>Possible rhythms</dt><dd>{current.task}</dd></dl>
    </Window>
  );
}

function Explorer({ active, onSelect, onStartJourney }: { active: Topic; onSelect: (topic: Topic) => void; onStartJourney: () => void }) {
  return (
    <>
      <Window title="Concept atlas · start here" status="6 connected themes" statusEnd="REL 395 archive" className="atlas-window" padded={false} managed>
        <header className="atlas-hero">
          <div>
            <span className="kicker">A system kept alive by repetition</span>
            <h1>Religion as a<br/><em>living order</em></h1>
          </div>
          <div className="atlas-hero__intro">
            <p>Ancient Egyptian religion was not one creed. Explore how gods and humans maintained life, presence, and continuity against disintegration.</p>
            <Button variant="primary" onClick={onStartJourney}><Icon name="compass" /> Begin guided passage</Button>
          </div>
        </header>
        <ConceptWeb active={active} onSelect={onSelect} />
        <TopicReading topic={active} />
      </Window>
    </>
  );
}

function Journeys() {
  const stages = [
    { hour: 'Threshold 01', title: 'The cultivated edge', text: 'Begin with Kemet and Deshret—not a simple good/evil pair, but a productive order defined beside dangerous and useful margins.', evidence: 'scholarship' as EvidenceKind },
    { hour: 'Threshold 02', title: 'At the temple margin', text: 'Ordinary worshippers might approach hearing-ear chapels, rear walls, processions, and intercessory statues without entering the sanctuary.', evidence: 'scholarship' as EvidenceKind },
    { hour: 'Threshold 03', title: 'A god in procession', text: 'A veiled portable shrine moved through streets and river routes, expanding divine presence while people watched, feasted, petitioned, and listened.', evidence: 'archive' as EvidenceKind },
    { hour: 'Threshold 04', title: 'What cannot be recovered', text: 'No interface can reproduce a universal Ancient Egyptian interior life. Here the experience stops and marks the surviving evidence’s edge.', evidence: 'speculative' as EvidenceKind },
  ];
  return (
    <Window title="Guided passage · approaches to presence" status="4 thresholds" statusEnd="12–15 min" className="journey-window" padded={false} managed>
      <div className="journey-hero">
        <span className="kicker">Evidence-led immersion</span>
        <h1>Approaching<br/>the divine</h1>
        <p>A guided route from landscape to festival, with the limits of reconstruction left visible.</p>
      </div>
      <ol className="journey-stages archive-motion-procession">
        {stages.map((stage, index) => <li key={stage.hour}><div className="stage-marker"><span>{String(index + 1).padStart(2, '0')}</span></div><div><span className="kicker">{stage.hour}</span><h2>{stage.title}</h2><p>{stage.text}</p><EvidenceBadge kind={stage.evidence}/></div></li>)}
      </ol>
    </Window>
  );
}

function SystemSpecimen() {
  const colors = [
    ['Papyrus', 'surface'], ['Limestone', 'surface-raised'], ['Nile', 'primary'], ['Faience', 'primary-soft'], ['Ochre', 'secondary'], ['Egyptian blue', 'sacred'], ['Gold', 'gold'], ['Red ochre', 'danger'],
  ];
  return (
    <Window title="Design system · foundations" status="v0.1" statusEnd="Static-ready" className="system-window" managed>
      <header className="system-intro"><span className="kicker">The Living Archive</span><h1>Digital field instrument,<br/><em>not themed spectacle.</em></h1><p>Classic Macintosh clarity translated through papyrus, mineral pigment, axial thresholds, register lines, and Nile movement.</p></header>
      <section className="spec-section"><span className="section-number">01</span><div><h2>Color has material roles</h2><p>Warm surfaces carry scholarship. Nile and faience signal navigation. Ochre marks temporal movement; Egyptian blue is reserved for sacred or cosmological emphasis.</p><div className="swatch-grid">{colors.map(([name, token]) => <div className="swatch" key={token}><i style={{ background: `var(--archive-color-${token})` }}/><span>{name}</span><code>--{token}</code></div>)}</div></div></section>
      <section className="spec-section"><span className="section-number">02</span><div><h2>Three textual voices</h2><div className="type-specimens"><p className="type-display">Renewable continuity</p><p className="type-reading">Long-form scholarship uses a generous reading face and measure. The interface should remain quiet enough for complicated, qualified arguments.</p><p className="type-data">C03 · NEW KINGDOM · c. 1550–1069 BCE</p></div></div></section>
      <section className="spec-section"><span className="section-number">03</span><div><h2>Evidence is interface</h2><p>Source status travels with content; it is never hidden in an afterthought.</p><div className="badge-row"><EvidenceBadge kind="primary"/><EvidenceBadge kind="archive"/><EvidenceBadge kind="scholarship"/><EvidenceBadge kind="speculative"/></div></div></section>
      <section className="spec-section"><span className="section-number">04</span><div><h2>Controls retain the Floop skeleton</h2><p>Borders define action, hard shadows show elevation, and mechanical presses make state legible. Soft shadows, neon, faux-hieroglyph fonts, and decorative symbols are excluded.</p><div className="button-row"><Button variant="primary">Follow thread</Button><Button>Open source</Button><Button variant="quiet">Quiet action</Button></div></div></section>
      <section className="spec-section"><span className="section-number">05</span><div><h2>Motion carries meaning</h2><p>Each primitive belongs to a historical or ecological idea and becomes still when reduced motion is requested.</p><div className="motion-grid">
        <div className="motion-card motion-card--flow"><i className="archive-motion-flow"/><strong>Flow</strong><small>River · route · continuity</small></div>
        <div className="motion-card motion-card--unfold"><i className="archive-motion-unfold"/><strong>Unfold</strong><small>Papyrus · annotation · page</small></div>
        <div className="motion-card motion-card--procession"><span className="archive-motion-procession"><i/><i/><i/></span><strong>Procession</strong><small>Threshold · sequence · approach</small></div>
        <div className="motion-card motion-card--cycle"><i className="archive-motion-solar"/><strong>Cycle</strong><small>Solar · seasonal · recurring</small></div>
      </div></div></section>
    </Window>
  );
}

export function Specimen() {
  const [view, setView] = useState<View>('explore');
  const [activeTopic, setActiveTopic] = useState(topics[0]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [theme, setTheme] = useState<'day' | 'duat'>('day');
  const [openWindows, setOpenWindows] = useState({ nile: true, evidence: true });

  useEffect(() => {
    document.documentElement.dataset.theme = theme === 'duat' ? 'duat' : '';
  }, [theme]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setSearchOpen(true); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const selectTopic = (topic: Topic) => { setActiveTopic(topic); setView('explore'); };

  return (
    <div className="site-frame">
      <header className="site-header">
        <button className="brand" onClick={() => setView('explore')} aria-label="The Living Archive, home">
          <span className="brand__mark" aria-hidden="true"><img src={`${import.meta.env.BASE_URL}media/archive-app-icon.png`} alt="" /></span>
          <span><strong>The Living Archive</strong><small>Religion of Ancient Egypt</small></span>
        </button>
        <div className="site-header__actions">
          <button className="header-search" aria-label="Search the archive" onClick={() => setSearchOpen(true)}><Icon name="search"/><span>Search the archive</span><kbd>⌘ K</kbd></button>
          <Button iconOnly variant="quiet" aria-label={theme === 'day' ? 'Enter Duat night theme' : 'Return to daylight theme'} onClick={() => setTheme(theme === 'day' ? 'duat' : 'day')}><Icon name={theme === 'day' ? 'moon' : 'sun'}/></Button>
        </div>
      </header>

      <div className="site-layout">
        <nav className="rail" aria-label="Primary navigation">
          <span className="rail__label">Ways in</span>
          {navItems.map((item) => <button key={item.id} className={view === item.id ? 'is-active' : ''} aria-current={view === item.id ? 'page' : undefined} onClick={() => setView(item.id)}><Icon name={item.icon}/><span>{item.label}</span><small>{item.id === 'explore' ? '01' : item.id === 'journeys' ? '02' : '03'}</small></button>)}
          <div className="rail__orientation"><span>N</span><i/><small>Nile flows north</small></div>
        </nav>

        <main id="main-content" className="main-stage">
          {view === 'explore' && <Explorer active={activeTopic} onSelect={setActiveTopic} onStartJourney={() => setView('journeys')} />}
          {view === 'journeys' && <Journeys />}
          {view === 'system' && <SystemSpecimen />}
        </main>

        <aside className="context-rail" aria-label="Context and evidence">
          {openWindows.nile && <NileCycle onClose={() => setOpenWindows((current) => ({ ...current, nile: false }))} />}
          {openWindows.evidence && <Window title="Evidence key" flat status="Always visible" managed onClose={() => setOpenWindows((current) => ({ ...current, evidence: false }))}>
            <div className="evidence-list"><EvidenceBadge kind="primary"/><p>Ancient text, image, or object.</p><EvidenceBadge kind="archive"/><p>Reconstruction from the source collection.</p><EvidenceBadge kind="scholarship"/><p>Modern scholarly interpretation.</p><EvidenceBadge kind="speculative"/><p>Contested or artistic reconstruction.</p></div>
          </Window>}
        </aside>
      </div>

      {(!openWindows.nile || !openWindows.evidence) && <div className="window-shelf" aria-label="Closed windows">
        <span>Restore</span>
        {!openWindows.nile && <button onClick={() => setOpenWindows((current) => ({ ...current, nile: true }))}><Icon name="water"/> Nile year</button>}
        {!openWindows.evidence && <button onClick={() => setOpenWindows((current) => ({ ...current, evidence: true }))}><Icon name="book"/> Evidence key</button>}
      </div>}

      <footer className="site-footer"><span>The Living Archive · design-system specimen</span><span>Static by design · GitHub Pages ready</span></footer>
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} onSelect={selectTopic}/>
    </div>
  );
}
