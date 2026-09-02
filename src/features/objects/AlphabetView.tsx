// The alphabet study is generated from the sign-lineage table in the wiki
// article. Keeping the rows in generated data prevents the view from becoming
// a second, silently divergent letter registry.

import { Link } from '../../app/state';
import { alphabetRows, allPages } from '../../generated';
import { PageHeader, Section } from '../../design-system/components';

export function AlphabetView() {
  const article = allPages.find((page) => page.slug === 'from-canaan-to-phoenician-greek-and-latin');

  return (
    <div className="page">
      <PageHeader
        eyebrow="Tool · generated from the wiki table"
        title="Alphabet lineage"
        lead="A comparative table of proposed Egyptian source signs, Proto-Sinaitic forms, Semitic words, and later Phoenician, Greek, and Latin letters. Confidence applies to the whole proposed lineage in each row."
        actions={article && <Link className="archive-button" to={article.route}>Read the full article</Link>}
      />
      <Section title="The sign-lineage table" description="The article remains the canonical evidence table; this view only changes its presentation.">
        <div className="alphabet-table-wrap" tabIndex={0} aria-label="Scrollable alphabet lineage table">
          <table className="alphabet-table">
            <caption className="sr-only">Egyptian source signs and proposed alphabetic descendants</caption>
            <thead>
              <tr>
                <th scope="col">Egyptian source sign</th>
                <th scope="col">Proto-Sinaitic form</th>
                <th scope="col">Semitic word and meaning</th>
                <th scope="col">Phoenician</th>
                <th scope="col">Greek</th>
                <th scope="col">Latin</th>
                <th scope="col">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {alphabetRows.map((row, index) => (
                <tr key={`${row.phoenicianLetter}-${index}`}>
                  <td>{row.egyptianSourceSign}</td>
                  <td>{row.protoSinaiticForm}</td>
                  <td>{row.semiticWordAndMeaning}</td>
                  <td>{row.phoenicianLetter}</td>
                  <td>{row.greekLetter}</td>
                  <td>{row.latinLetter}</td>
                  <td><span className={`alphabet-confidence alphabet-confidence--${row.confidence}`}>{row.confidence}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      <p className="muted">Rows are emitted from the Markdown table in <Link to={article?.route ?? '/wiki/'}>From Canaan to Phoenician, Greek, and Latin</Link>; no letter data is authored separately in the application.</p>
    </div>
  );
}
