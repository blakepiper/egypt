import { Link } from '../../app/state';
import { faqIntro, faqTopics } from './faq';

export function TripFaq() {
  return (
    <div className="page trip trip-faq">
      <header className="trip-itinerary-header">
        <div>
          <p className="trip-kicker">Egypt · January 2027</p>
          <h1>Travel FAQ</h1>
          <p>{faqIntro}</p>
        </div>
      </header>
      <div className="trip-faq__grid">
        {faqTopics.map((topic) => (
          <section className="trip-window trip-faq__topic" key={topic.id} id={topic.id} tabIndex={-1}>
            <div className="trip-titlebar"><h2>{topic.title}</h2></div>
            {topic.answers.map((answer) => (
              <details key={answer.question}>
                <summary>{answer.question}</summary>
                {answer.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {answer.links && <ul>{answer.links.map((link) => <li key={link.path}><Link to={link.path}>{link.label}</Link></li>)}</ul>}
              </details>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
