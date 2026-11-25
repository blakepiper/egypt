import { Link } from '../../app/state';
import { href } from '../../app/routes';
import { sailingCompanion, tripDates, tripDays, tripDescription, tripDetails, tripTitle } from './itinerary';

const itineraryPath = '/itinerary/';
const detailsPath = '/itinerary/#trip-details';

function dayId(date: string) {
  return `day-${date}`;
}

function postcard(name: string) {
  return href(`/trip/${name}.webp`);
}

export function TripHome() {
  return (
    <div className="page trip trip--home">
      <section className="trip-window trip-hero" aria-labelledby="trip-title">
        <div className="trip-titlebar">
          <span>Private dahabiya</span>
          <span>Luxor → Aswan</span>
        </div>
        <div className="trip-hero__layout">
          <div className="trip-hero__copy">
            <p className="trip-kicker">{tripDates}</p>
            <h1 id="trip-title">{tripTitle}</h1>
            <p className="trip-hero__intro">Five days on the Nile with Sydney’s friends, from the temples of Luxor to the banks of Aswan.</p>
            <div className="trip-actions">
              <Link className="archive-button archive-button--primary" to={itineraryPath}>Explore the itinerary <span aria-hidden="true">↗</span></Link>
              <Link className="trip-textlink" to="/faq/">Travel FAQ</Link>
            </div>
          </div>
          <figure className="trip-hero__image">
            <picture>
              <source media="(max-width: 640px)" srcSet={postcard('dahabiya-small')} />
              <img src={postcard('dahabiya')} alt="A twin-sailed dahabiya on the Nile, pictured in the group’s cruise quote" width="1200" height="800" fetchPriority="high" />
            </picture>
            <figcaption>
              Photo from the cruise quote
            </figcaption>
          </figure>
        </div>
        <Link className="trip-hero__birthday" to={`${itineraryPath}#${dayId('2027-01-14')}`}>
          <time dateTime="2027-01-14">Thu, Jan 14</time>
          <strong>Sydney’s 30th birthday</strong>
          <span aria-hidden="true">↗</span>
        </Link>
      </section>

      <section aria-labelledby="week-heading">
        <div className="trip-section-heading">
          <h2 id="week-heading">Five days on the Nile</h2>
          <Link className="trip-textlink" to={itineraryPath}>Full itinerary <span aria-hidden="true">↗</span></Link>
        </div>
        <ol className="trip-postcards">
          {tripDays.map((day) => (
            <li key={day.date}>
              <Link className={day.birthday ? 'trip-postcard trip-postcard--birthday' : 'trip-postcard'} to={`${itineraryPath}#${dayId(day.date)}`}>
                <img src={postcard(day.image)} alt="" width="768" height="512" />
                {day.birthday && <span className="trip-postcard__hat" aria-hidden="true" />}
                <div className="trip-postcard__copy">
                  <time dateTime={day.date}>{day.label}</time>
                  <strong>{day.title}</strong>
                  <span>{day.highlight}</span>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="trip-archive">
        <div>
          <h2>Learn About Ancient Egypt</h2>
          <p>Get to know the temples, towns, and stories along our route.</p>
        </div>
        <Link className="archive-button" to="/learn/">Open The Living Archive <span aria-hidden="true">↗</span></Link>
      </section>
    </div>
  );
}

export function TripItinerary() {
  return (
    <div className="page trip trip--itinerary">
      <header className="trip-itinerary-header">
        <div>
          <p className="trip-kicker">{tripDates} · Luxor → Aswan</p>
          <h1>Itinerary</h1>
          <p className="trip-print-title">{tripTitle}</p>
          <p>{tripDescription}</p>
        </div>
        <div className="trip-actions">
          <Link className="trip-textlink" to={detailsPath}>Trip details ↓</Link>
          <button className="archive-button" type="button" onClick={() => window.print()}>Print itinerary</button>
        </div>
      </header>

      <nav aria-label="Itinerary days" className="trip-day-nav">
        {tripDays.map((day) => (
          <Link key={day.date} to={`${itineraryPath}#${dayId(day.date)}`}>
            <time dateTime={day.date}>{day.label}</time>
          </Link>
        ))}
      </nav>

      {tripDays.map((day) => (
        <section key={day.date} id={dayId(day.date)} className={day.birthday ? 'trip-window trip-day trip-day--birthday' : 'trip-window trip-day'} tabIndex={-1}>
          <div className="trip-titlebar">
            <time dateTime={day.date}>{day.label}</time>
            {day.birthday && <strong>Sydney’s 30th birthday</strong>}
          </div>
          <div className="trip-day__layout">
            <figure>
              <img src={postcard(day.image)} alt="" width="768" height="512" loading="lazy" />
              <figcaption>{day.imageCaption} · illustration</figcaption>
            </figure>
            <div className="trip-day__copy">
              <h2>{day.title}</h2>
              <ul>{day.stops.map((stop) => <li key={stop}>{stop}</li>)}</ul>
              {day.note && <p className="trip-day__note">{day.note}</p>}
              {day.reading && <Link className="trip-textlink trip-reading" to={day.reading.path}>{day.reading.label} <span aria-hidden="true">↗</span></Link>}
            </div>
          </div>
        </section>
      ))}

      <section id="trip-details" className="trip-window trip-details" tabIndex={-1} aria-labelledby="trip-details-heading">
        <div className="trip-titlebar"><h2 id="trip-details-heading">Trip details</h2></div>
        <div className="trip-details__grid">
          {tripDetails.map((group) => (
            <section key={group.title}>
              <h3>{group.title}</h3>
              <ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul>
            </section>
          ))}
        </div>
      </section>

      <p className="trip-reading"><Link to={sailingCompanion}>Explore the route in The Living Archive</Link></p>
    </div>
  );
}
