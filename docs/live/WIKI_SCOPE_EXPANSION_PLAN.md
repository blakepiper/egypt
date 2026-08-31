# Wiki scope expansion plan

Status: implementation plan only

Prepared: 2026-08-30

Target implementer: Luna Max, working directly on `main`

Repository: `/Users/blake/egypt`

## 1. Executive summary

The application is technically complete and internally coherent, but its editorial scope is still close to the REL 395 archive from which it grew. It explains Egyptian religion well on its own terms. It does not yet do four things the expanded wiki should do:

1. Use ancient Egypt as a disciplined case study for asking what religion is and how scholars study it.
2. Place Predynastic and Early Dynastic Egypt beside Mesopotamia without turning the comparison into a race for the title of "first civilization."
3. Explore what ritual, continuity, death, and uncertainty can tell us about human behavior while keeping modern clinical categories, especially OCD, out of ancient diagnosis.
4. Trace Egypt's later reception through Greek, Roman, Coptic, Islamic, European, African diasporic, museum, design, occult, and popular-cultural settings.

The expansion should add twenty-eight substantial articles, revise the core articles that readers already enter through, and make provenance visible throughout the interface. Eight of those articles support a new place-based journey following the supplied January 2027 dahabiya itinerary from Esna to Aswan. The added scope must cover not only order and continuity, but also suffering, illness, ritual failure, nonhuman agency, monument building, biblical memory, human-remains ethics, living religious reconstruction, river travel, provincial towns, quarry landscapes, and modern Nubian and Nile-valley communities. Course-derived material and new research must remain distinguishable. Provenance is not the same as evidentiary strength, so the implementation must keep those two dimensions separate.

The recommended release sequence is:

1. Add provenance and research-source infrastructure.
2. Repair general historical coverage and write the state-formation cluster.
3. Write the religion, ritual, suffering, healing, nonhuman-agency, and Buddhist comparison cluster.
4. Write the monuments, biblical-memory, reception, and legacy cluster.
5. Write the Esna-to-Aswan route articles and build the cruise journey from the verified itinerary sequence.
6. Strengthen definitions, contextual links, graph relations, search, hubs, journeys, and learning paths.
7. Complete factual, humanizer, accessibility, dignity, rights, and regression review.

No content in `raw/` should be changed. Existing course source IDs `C01` through `C36` remain stable. New scholarship should receive stable `R001`-style IDs in a separate public research catalog.

## 2. Current-state audit

### 2.1 Baseline captured on 2026-08-30

The following baseline was produced from the repository, not from an older status document:

| Measure | Current value | Planning consequence |
|---|---:|---|
| Markdown pages | 41 | Replace hard-coded page-count checks before adding content. |
| Generated routes | 67 | Route generation works, but all new pages must be represented in navigation and static output. |
| Wiki words | 25,715 | Scope expansion should favor focused articles over another single long overview. |
| Graph nodes | 208 | The graph already has enough structure to absorb a new cluster. |
| Graph edges | 654 | Relationship vocabulary needs a small reception-oriented extension. |
| Explicit article-to-article `links_to` edges | 266 | Link volume is uneven; several important pages have only one or two contextual outgoing links. |
| Course source groups | 36 | Preserve `C01` through `C36` and keep them visibly separate from new research. |
| Files in `raw/` | 72 | Treat as immutable course/archive evidence. |
| Media records | 10 | New media is optional and must pass the existing rights gate. |
| Glossary entries | about 45 | Add historical, comparative, methodological, and reception terms. |

`npm run content:check` passed at the time of this audit with 41 of 41 pages, 67 routes, 10 media records, and no errors or warnings.

### 2.2 What the application already does well

- It has a clear content source of truth in `llm-wiki/`, with generated manifests, search data, graph data, routes, and article payloads.
- Core Egyptian religious concepts are present: maat and isfet, heka, personhood, creation, the solar cycle, gods, temples, festivals, death, funerary texts, Amarna, personal piety, and contested claims.
- It supports wiki links, backlinks, related pages, graph neighborhoods, glossary annotations, media records, journeys, an atlas, chronology, object studies, and reading paths.
- It distinguishes broad evidence categories in the UI and has explicit uncertainty and contested-claim callouts.
- Content and media review fields already exist in frontmatter.
- The course archive is auditable through `source-catalog.md` and stable `C` identifiers.

These strengths should be extended rather than replaced.

### 2.3 Structural constraints discovered in the code

| Constraint | Current location | Required response |
|---|---|---|
| Page count is fixed at 41. | `scripts/content/check-content.ts`; `tests/unit/content.test.ts` | Compare the generated manifest with publishable files on disk. Do not encode a new magic number. |
| Section and hub membership are manual slug lists. | `scripts/content/lib/site.ts` | Add the new slugs deliberately in the first release. Consider frontmatter-driven hubs only after parity tests. |
| Source parsing recognizes the course catalog and `C` IDs only. | `scripts/content/build-content.ts`; `scripts/content/lib/markdown.ts` | Support both course and research catalogs, map every ID to its own catalog route, and test `C19` plus `R001`. |
| Every source link currently resolves to `source-catalog`. | `scripts/content/build-content.ts` | Resolve source routes by ID prefix or a source registry, not a fixed route. |
| `hasSources` looks for a heading beginning "Sources in this archive." | `scripts/content/build-content.ts` | Derive it from parsed source IDs so supplemental headings work too. |
| Evidence is inferred from page type and tags. | `evidenceFor()` in `scripts/content/build-content.ts` | Add an optional explicit evidence field with the current behavior as backward-compatible fallback. Do not use origin to infer evidence. |
| There is no provenance field. | `PageFrontmatter` and `PageSummary` in `src/types/content.ts` | Add `origin: course | supplemental | mixed` and propagate it through build, search, UI, and tests. |
| Callouts do not mark supplemental additions. | `CalloutKind` and Markdown parser | Add a narrowly named `research` callout for mixed pages. Do not label whole supplemental pages paragraph by paragraph. |
| Place regions are Egypt-specific. | `Place.region` in `src/types/content.ts` | Do not force Mesopotamia, Sri Lanka, or Europe into the sacred atlas. Keep comparative geography separate until a general region model exists. |
| Review lint expects every page to be marked reviewed. | `scripts/content/check-content.ts` | Allow work-in-progress checks to report pending review clearly, then require reviewed status at the release gate. |

### 2.4 Coverage indicators

The current wiki barely mentions or does not mention several subjects required by the new scope. A repository-wide text scan found no substantive page coverage of Mesopotamia, Sumer, Buddhism, Theravada, impermanence, Coptic history, Egyptomania, mathematics, or slavery. Predynastic Egypt, agriculture, literacy, gender, Nubia, and colonial collecting appear only briefly or unevenly.

This does not mean each keyword needs a standalone page. It means a reader cannot yet answer ordinary follow-up questions such as:

- What existed before dynastic Egypt, and how did a territorial state form?
- In what sense were Egypt and Sumer early civilizations, and what changes when the criteria change?
- How much of religion can be reconstructed from royal monuments and elite texts?
- Did Egyptian ritual reduce uncertainty, express order, or do something else?
- Why is calling Egyptian ritual "OCD" historically and clinically unsafe?
- Does early Buddhism reject ritual, or does it reject particular claims about what ritual can accomplish?
- What happened to Egyptian traditions under Greek, Roman, Christian, and Islamic rule?
- Which features of modern "Egypt" are direct transmissions, adaptations, invented traditions, or commercial imagery?
- How did colonial excavation and museum collecting shape what Western audiences think ancient Egypt was?
- What happened when ritual seemed to fail, suffering appeared undeserved, or divine help did not arrive?
- How did Egyptians combine remedies, spells, objects, specialists, and divine assistance when bodies became vulnerable?
- Why were animals, images, statues, and the dead treated as potential agents rather than inert symbols?
- What did monument building require from workers, resources, administration, and religious imagination?
- How did biblical memories of Egypt shape Jewish and Christian traditions even where historical reconstruction remains uncertain?
- What ethical obligations apply when a wiki displays mummified human remains or describes living Kemetic religions?
- How can a present-day Nile journey connect places without treating modern villages as survivals of an unchanging ancient culture?
- What becomes visible when readers move from temple to settlement, quarry, market, farm, museum, and living community along one river route?

## 3. Reconstructed coverage-gap assessment

The earlier missing-content assessment was not saved, so this section reconstructs it from the current corpus and the stated goals.

### 3.1 Historical setting and state formation

Missing or too thin:

- Paleolithic, Neolithic, Badarian, Maadi-Buto, Naqada, and Early Dynastic transitions.
- Village life, settlement patterns, agricultural surplus, craft specialization, exchange, warfare, administration, and territorial integration.
- The relation between iconography, elite display, ritual centers, mortuary practice, and emerging kingship.
- Comparison of Egypt's territorial state with southern Mesopotamian city-states.
- The independent development, interaction, and uncertain dating of early writing systems.
- A clear explanation that "civilization" is an analytical and value-laden category, not a trophy with a single winner.

### 3.2 Society beyond kings, priests, and tomb owners

Missing or too thin:

- Households, children, work crews, farmers, craft workers, servants, enslaved people, and mobile populations.
- Gender, status, age, disability, and regional differences as constraints on religious access.
- Taxation, corvee labor, temple estates, redistribution, markets, and the limits of surviving economic evidence.
- Education, scribal training, literacy, numeracy, medicine, and the social power of writing.
- Nubia, the Levant, Libya, desert routes, migration, and border making.
- The unequal distribution of burial goods, ritual expertise, and textual technologies.

### 3.3 Religion as a general human and scholarly problem

Missing or too thin:

- Definitions of religion and the limits of mapping a modern category onto ancient Egypt.
- Material religion, lived religion, ritual, myth, institution, ethics, embodiment, and sensory practice.
- How historians reason from selective objects, texts, spaces, and later copies.
- The difference between an ancient claim, a modern scholarly interpretation, a cross-cultural analogy, and a psychological hypothesis.
- Variation over more than three millennia and across locality, class, office, and period.

### 3.4 Ritual, uncertainty, continuity, and human behavior

Missing or too thin:

- Repetition, exactness, calendrical recurrence, purification, repair, and renewal as different ritual functions.
- The tension between durable ideals and recurrent restoration. Egyptian permanence was often something repeatedly made, not static timelessness.
- A careful account of uncertainty: ecological variation, illness, death, political breakdown, failed succession, and incomplete knowledge.
- The modern experimental finding that patterned action can affect anxiety, presented only as a modern comparison.
- A clear prohibition on diagnosing ancient Egyptians or Egyptian culture with OCD.
- The clinical meaning of OCD and the distinction between disorder, ordinary ritualization, and culturally shared rites.

### 3.5 Comparative Buddhism

Missing entirely:

- `anicca`, dependent change, practice, sacrifice, merit, and ritual in early Buddhist sources and Theravada traditions.
- The distinction between early Buddhist discourses and historically diverse Theravada communities.
- The fact that early Buddhist texts criticize some sacrifices and salvific claims without eliminating ritual life.
- A bounded comparison between Egyptian renewable continuity and Buddhist training in impermanence.
- A method section explaining that the comparison is thematic, not a claim of contact, common origin, or total opposition.

### 3.6 Reception and legacy

Missing almost entirely:

- Ptolemaic and Roman transformations, Isis and Serapis, obelisks, and Mediterranean religious exchange.
- Coptic Egypt and the problem with narratives in which Egyptian culture simply disappears.
- Arabic and Islamic-era scholarship about monuments and ancient knowledge.
- Hermetism, Renaissance Egypt, esotericism, alchemy, and the changing identification of Hermes and Thoth.
- Napoleon's expedition, the `Description de l'Egypte`, decipherment, professional Egyptology, collecting markets, museums, and colonial power.
- Egyptian Revival design, Tutankhamun, Art Deco, film, games, music, tourism, fashion, and occult imagery.
- African diasporic art, Black intellectual history, Afrocentrism, modern Egyptian identities, and debates over who may claim Egypt.
- Provenance, excavation shares, repatriation, and the modern ethics of collections.

### 3.7 Suffering, healing, and the limits of restored order

Missing or too thin:

- Innocent suffering, pain, grief, divine distance, injustice, and the relation between earthly failure and postmortem judgment.
- The difference between Egyptian problems of divine justice and later monotheistic formulations of the problem of evil.
- What people did when protection, healing, divination, or ritual action did not produce the hoped-for result.
- Illness and disability as lived bodily conditions, not merely metaphors for cosmic disorder.
- The overlapping use of remedies, incantations, amulets, physicians, ritual specialists, healing statues, cippi, dreams, and household care.
- A Buddhist comparison that includes `dukkha` and `anatta` alongside `anicca`, without translating any one of them into a simple Western slogan.

### 3.8 Material, sensory, and more-than-human religion

Missing or too thin:

- Divine animal forms, individual cult animals, votive animal mummies, dangerous creatures, food animals, and household protectors as different relationships.
- Nonhuman agency and the problem with reducing animal imagery, statues, names, or written signs to inert symbols.
- Scent, sound, touch, taste, light, heat, darkness, movement, music, dance, feasting, intoxication, grief, fear, intimacy, and joy.
- Monument building as religious practice, state logistics, skilled labor, resource extraction, engineering, maintenance, reuse, and political display.
- The gap between archaeological evidence for construction and modern stories about slaves, aliens, or lost technology.

### 3.9 Authority, change, violence, and living reconstruction

Missing or too thin:

- Religious authority without a single canon, creed, or centralized orthodoxy.
- Tradition as an active process of copying, selection, recombination, translation, repair, archaism, and innovation.
- Political fragmentation and re-formation as a counterweight to the language of permanence.
- Smiting scenes, execration, war, captives, imperial extraction, enemy-making, and the violent work sometimes done in the name of maat.
- Biblical Egypt as bondage, refuge, wisdom, tyranny, and cultural memory; the evidentiary limits surrounding Exodus and Moses-Akhenaten claims.
- Modern Kemetic religions as living, internally varied reconstructions rather than either unbroken survivals or popular-culture curiosities.
- Human remains as deceased people whose display raises questions of dignity and consultation beyond copyright and ownership.

### 3.10 Place-based learning along the Nile

Missing or too thin:

- A route that connects the wiki's abstract themes to an actual southbound journey from Esna to Aswan.
- Site-level context for Esna, El Kab/Nekheb, Edfu, Gebel el-Silsila, and Kom Ombo.
- A distinction between temple precincts and the settlements, markets, work, and transport systems around them.
- The Nile as a route of movement and labor in different periods, not a timeless scenic backdrop.
- The effects of barrages, locks, dams, managed water, tourism, conservation, and adaptive reuse on the landscape encountered today.
- Modern Nubian history, displacement, language, cultural life, and political claims beyond a short ancient-history sidebar.
- Ethical guidance for village visits, photography, hospitality, shopping, fishing, and other encounters with living communities.
- A warning against using contemporary farming, bread making, markets, or fishing as direct reconstructions of ancient life.
- Scene-level links that let a reader open the relevant site, deity, practice, society, and legacy articles at each stop.

## 4. Editorial and comparative principles

These are implementation rules, not optional tone suggestions.

### 4.1 Start from evidence, then name the interpretation

Every substantial section should let the reader tell which layer they are reading:

1. Surviving evidence: an object, inscription, archaeological context, ancient text, later copy, or institutional record.
2. Historical reconstruction: what specialists infer from that evidence.
3. Comparative interpretation: a concept used to put cases beside one another.
4. Modern hypothesis: a claim from psychology, philosophy, or cultural theory that is not evidence about an ancient person's mental state.

Use existing `evidence`, `uncertainty`, `contested`, and `reconstruction` callouts when a distinction would otherwise be easy to miss.

### 4.2 Do not make Egypt uniform

Avoid claims beginning "The Egyptians believed" unless the evidence supports the time, place, and group implied. Prefer formulations such as "New Kingdom temple texts present," "some surviving household objects suggest," or "elite funerary sources increasingly make available."

Every new article must state its period and evidence limits near the beginning. A page spanning the Predynastic period to late antiquity must be organized chronologically or explicitly explain why it is comparing noncontemporaneous evidence.

### 4.3 Do not make "civilization" a race

The Egypt-Mesopotamia page must compare criteria rather than announce a winner. At minimum it should separate:

- permanent settlements and agricultural intensification;
- urban scale and settlement hierarchy;
- social stratification and specialized labor;
- temples, palaces, and administrative institutions;
- city-state and territorial-state organization;
- writing and record keeping;
- monumental construction;
- long-distance exchange;
- chronological confidence and the type of surviving evidence.

Different criteria produce different answers. Southern Mesopotamia's early urban development and Egypt's early territorial unification are not the same achievement. Dates before 664 BCE are approximate in standard Egyptian chronologies, and Predynastic dating is especially dependent on archaeological sequences and radiocarbon models [R003, R010].

### 4.4 Use comparison as a question, not a verdict

The Egypt-Buddhism comparison must:

- explain why these cases were selected;
- define the unit being compared;
- distinguish Egyptian sources from early Buddhist discourses and later Theravada practice;
- compare at least one meaningful similarity as well as differences;
- state that no historical contact or common origin is being proposed;
- avoid flattening either tradition into a slogan;
- return the reader to the evidence limits at the end.

The preferred comparison is not "Egypt loved permanence, Buddhism loved change." It is more precise:

- Egyptian temple and funerary systems often seek continuity through repeated renewal, correct relations, maintained names, transformed bodies, and recurring cosmic cycles.
- Early Buddhist teachings relate impermanence to `dukkha`, non-self, attachment, and training perception, while Buddhist communities also developed rich ritual cultures.
- Both traditions use disciplined, repeated practices, but they frame the problem and desired transformation differently.

### 4.5 Never diagnose a civilization

Do not call Egyptian religion, ritual, priests, or culture "OCD," "obsessive-compulsive," or "mentally ill." OCD is a modern clinical diagnosis involving obsessions, compulsions, distress, and impairment [R025]. Shared ritual exactness is not sufficient evidence for a diagnosis. Cross-cultural clinical work also shows that culture shapes how symptoms are experienced and expressed [R026].

Permitted framing:

- "Modern experiments suggest predictable behavioral sequences can sometimes affect anxiety; this offers a question to test, not an explanation of Egyptian ritual" [R024].
- "Ritual exactness can organize responsibility and uncertainty without being a symptom."
- "The surviving evidence does not give access to individual diagnosis."

Required page callout:

> Clinical caution: OCD is a modern diagnosis. The comparison on this page concerns ritualized behavior and uncertainty, not a diagnosis of ancient people or an entire culture.

### 4.6 Treat legacy as reception and transformation

Do not build a list of supposed Egyptian inventions that "became the West." For every legacy claim, classify the path:

| Path | Meaning | Example type |
|---|---|---|
| Documented transmission | A traceable object, text, institution, or practice moves through known intermediaries. | Obelisks moved to Rome; Greek and Roman cults of Isis. |
| Adaptation | Later users preserve recognizable material while changing its setting or meaning. | Roman Isis; Renaissance Hermetic interpretation. |
| Rediscovery | Material becomes newly accessible through excavation, publication, translation, or decipherment. | `Description de l'Egypte`; hieroglyphic decipherment. |
| Reinvention | Egypt supplies symbols for a later concern with weak or selective historical continuity. | Egyptian Revival interiors; some occult systems. |
| Commodity or stereotype | Egyptian signs become a marketable visual shorthand. | Film mummies, themed products, game aesthetics. |
| Counter-memory and identity claim | Egypt is used to challenge exclusion or build collective identity. | African diasporic art and Black intellectual traditions. |

The legacy cluster must include Greek, Roman, Christian, Islamic, modern Egyptian, European, and African diasporic receptions. "Western culture" should appear as one receiving context, not the final owner of Egypt.

### 4.7 Write for an interested non-specialist

- Define a technical term at first meaningful use.
- Give dates and locations when a change matters.
- Prefer concrete examples before abstractions.
- Explain scholarly disagreement without staging false balance.
- Avoid grand claims about "humanity" based on one tradition.
- End each comparison with what it clarifies and what it cannot establish.
- Run every new or substantially rewritten user-facing passage through `/humanizer` in file mode. Preserve citations, IDs, Markdown links, dates, and frontmatter exactly while doing so.

### 4.8 Do not make successful ritual the only ritual

The uncertainty cluster must ask what happened when expected outcomes did not arrive. Evidence may preserve renewed petitions, changed diagnoses, blame, additional rites, appeals to different powers, reinterpretation, or silence. Do not infer private disbelief from failure, and do not infer confidence merely because a rite was repeated. When direct evidence for a response is absent, state that absence rather than completing the story psychologically.

### 4.9 Keep medicine, magic, and religion porous but specific

Do not sort Egyptian healing practices into a modern contest between science and superstition. Describe what an intervention did, who performed it, what materials and words it used, and what evidence survives. Distinguish retrospective medical evaluation from historical explanation. Do not claim that a remedy was clinically effective without appropriate biomedical evidence, and do not treat symbolic or spoken action as proof that empirical observation was absent.

### 4.10 Treat animals and objects as relationships, not code words

Do not say that an animal "represented" a god when the evidence concerns embodiment, manifestation, cult service, votive offering, danger, or divine presence. Identify the specific relation and period. The same species may occupy several relations, and animal-headed divine imagery is not interchangeable with maintaining a living cult animal or dedicating a mummified creature.

### 4.11 Separate biblical memory from Egyptian history

The biblical-memory article must keep at least four layers apart:

1. Egyptian evidence about relations with Levantine populations.
2. Biblical texts and their literary-historical settings.
3. Later Jewish and Christian reception of biblical Egypt.
4. Modern attempts to identify biblical people or events with particular pharaohs.

State clearly when archaeology cannot confirm a narrative. Similarity between Atenism and later monotheism does not establish Akhenaten as Moses or direct descent from one religion to another.

### 4.12 Apply dignity review as well as rights review

Human remains are not ordinary media assets. Before publishing an identifiable mummy, body part, CT reconstruction, burial image, or open coffin, record the educational need, identity if known, archaeological context, source institution, display policy, and dignity assessment. Consider less exposing alternatives. Copyright clearance and museum permission do not settle whether publication is respectful.

Living Kemetic religions require a related safeguard: describe communities through current scholarship and, where appropriate, their own public self-descriptions. Do not present modern practice as uninterrupted Pharaonic survival, but do not file it under fantasy, occultism, or entertainment merely because it is reconstructive.

### 4.13 Do not turn living communities into antiquity

The cruise journey crosses inhabited towns, farms, islands, markets, and Nubian communities. Present-day practices may illuminate how river environments and social relationships are experienced now, but they are not ethnographic windows into Pharaonic life. Do not describe hosts as timeless, untouched, harmonious with nature, or representative of all Egyptian or Nubian people. Name the contemporary date and setting, avoid identifying a private household, and distinguish an itinerary's promotional language from independently supported description.

Photography, audio, personal stories, recipes, and quotations from hosts require informed permission for publication, not merely participation in the tour. Do not turn requested conservative dress, bargaining, fishing, bread making, camel handling, or hospitality into generic claims about a culture. When community-centered sourcing is unavailable, keep the scene to the documented activity and explicitly mark the interpretive limit.

## 5. Research method and source policy

### 5.1 Research workflow for each article

The implementing agent should follow this sequence for every new article:

1. Write a one-sentence research question and a claim inventory before drafting prose.
2. Start with the candidate sources in section 14. Open the actual source, not a search-result summary.
3. Add newer or more specific scholarship when the candidate source does not cover a claim adequately.
4. Record bibliographic metadata, stable URL or DOI, access status, date accessed, intended use, limitations, and reuse rights in `research-catalog.md` before citing the source in an article.
5. Triangulate disputed or synthetic claims with at least two independent scholarly sources.
6. Prefer peer-reviewed reference works, monographs, chapters, archaeological reports, text editions, and institutional collections. Use museum essays for object and reception histories, not as the only support for broad historical claims.
7. Use primary sources through reliable editions or translations. State when a translation is modern and when its license limits quotation.
8. Keep direct quotation short. Paraphrase most scholarship and retain enough citation detail that a reader can check the claim.
9. Add an `uncertainty` or `contested` callout where specialists disagree or the evidence is structurally incomplete.
10. Run a citation audit after the draft: every important factual claim should have a nearby source ID or belong to a clearly cited paragraph.
11. Run `/humanizer` on the final article text. Then compare the result with the pre-humanized draft to confirm that facts, qualifications, citations, IDs, headings, and links did not change.

For the cruise cluster, add one preliminary step: use the supplied itinerary only to establish the planned dates, order, transport, included stops, and promised activities. It is a contemporary commercial primary source, not authority for ancient chronology, archaeology, Nubian identity, ecological continuity, or superlatives such as "oldest," "authentic," and "in harmony with the Nile." Verify those subjects independently before drafting.

### 5.2 Source hierarchy

| Tier | Preferred use | Examples in the seed bibliography |
|---|---|---|
| A | Core factual and methodological claims | UCLA Encyclopedia of Egyptology, primary text editions, major scholarly handbooks. |
| B | Focused arguments and comparative interpretation | Peer-reviewed articles, university-press books and chapters. |
| C | Collection histories, objects, public reception, current site projects, and orientation | Met, BnF, National Museums Scotland, Manchester Museum, UCL teaching resources, Egyptian Ministry site records, excavation projects. |
| D | Carefully bounded modern analogy | NIMH clinical definition, modern ritual-and-anxiety experiment, transcultural psychiatry. |
| E | Itinerary sequence and contemporary encounter claims only | The supplied private cruise PDF, dated local documents, and first-person material used with permission. |

Tier D sources must never be used to infer an ancient diagnosis. Tier E material must never carry historical, archaeological, or community-wide claims without stronger sources. Search snippets, general encyclopedias, commercial history sites, unsourced videos, and generative summaries may help discover terms but may not support published claims.

The implementing model may use its background knowledge to propose search terms, connections, and outlines. It must not treat that knowledge as a citation or use it to bypass verification. Published factual claims still need support from an opened, cataloged source.

### 5.3 Citation density

- Opening definitions: at least one strong source.
- Paragraphs containing dates, archaeological sequences, institutional history, or a scholar's interpretation: cite the relevant source ID.
- Comparison tables: cite each row or group of rows.
- Primary-source claims: cite the edition or translation and, where feasible, the passage.
- Common connective prose does not need a citation on every sentence.
- A bibliography at the bottom of a page does not substitute for local attribution when the reader cannot tell which source supports which claim.

### 5.4 Copyright and media

- A linked web page is not a license to copy its prose or images.
- Store bibliographic records and paraphrases, not downloaded copyrighted texts, unless the license clearly allows local preservation.
- Check the license of every translation before quoting. SuttaCentral translations may have translator-specific licenses.
- New images are optional. Prefer public-domain or clearly licensed institutional assets.
- Every proposed image must first enter `content/media-manifest.json` with creator, institution, object ID, source, license, attribution, access date, caption, alternative text, and review status.
- Do not mark media `cleared` until the exact asset and license have been verified.

## 6. Proposed provenance model

### 6.1 Three distinct questions

The UI and data model should keep these separate:

| Question | Field | Values |
|---|---|---|
| Where did this page originate? | `origin` | `course`, `supplemental`, `mixed` |
| What kind of evidence dominates this page? | `evidence` | current evidence vocabulary |
| Has review occurred? | `review` | factual, humanizer, media rights, editorial statuses |

A course-derived page can contain scholarship. A supplemental page can study a primary text. A mixed page can still have a page-wide scholarship badge. None of these combinations is contradictory.

### 6.2 Frontmatter contract

Add a required field to every publishable Markdown page:

```yaml
origin: course
```

Allowed values and user-facing labels:

| Value | Badge text | Meaning |
|---|---|---|
| `course` | Course archive | Substantive content was derived from the original course files and their cataloged sources. |
| `supplemental` | Supplemental research | The article was created for this expanded wiki from sources outside the original course archive. |
| `mixed` | Course + research | The article retains course-derived material and has substantial externally researched additions. |

Add optional explicit evidence frontmatter:

```yaml
evidence: scholarship
```

Keep `evidenceFor()` as a compatibility fallback until all 41 current pages have been reviewed and assigned explicit values. Log a build warning when fallback inference is used after migration phase 1.

Apply the same provenance distinction to user-facing structured content. J01 and the new cruise-preparation path must have `origin: supplemental`; existing journeys and paths must be audited as `course` or `mixed`. Newly added place records should retain supplemental provenance in generated metadata even when the atlas does not display a badge. This prevents a supplemental journey from looking as if it came from the original course merely because it is JSON rather than Markdown.

### 6.3 Mixed-page section markers

Add one callout type:

```markdown
> [!research] Supplemental research
> This section extends the course archive with later scholarship cataloged as R004, R008, and R014.
```

Use it once at the start of a substantial supplemental section in a mixed page. Do not wrap every paragraph. A fully supplemental page needs only its page badge and normal citations.

### 6.4 Research catalog

Create `llm-wiki/research-catalog.md` with `origin: supplemental`. Candidate IDs begin at `R001` and use three digits. Never recycle an ID after publication.

Each record must include:

- full citation and title;
- source class;
- stable URL or DOI;
- access status and date accessed;
- what the wiki uses it for;
- known limitations;
- quotation or reuse note;
- pages that cite it, generated by the build where possible.

Keep the course catalog as `source-catalog.md`. The article source panel may present one combined list, but each item must be labeled "Course archive" or "Supplemental research" and link to the correct catalog.

### 6.5 Migration rules

1. Add `origin: course` to current pages that are genuinely course-derived.
2. Audit `web-research-supplement.md`, `contested-interpretations.md`, and any article already incorporating external web research. Mark them `mixed` or `supplemental` according to actual content, not filename.
3. Do not infer origin from the presence of a `course` field.
4. Do not renumber any `C` ID.
5. Extend the source-token parser from `C\d{2}` to the accepted source registry. Test false positives, lowercase text, unknown IDs, and source IDs next to punctuation.
6. Make origin searchable and filterable in Browse. Show the badge on article headers, search results, and source/catalog pages. Add it to graph node metadata, but do not make it a new graph node.

### 6.6 Provenance acceptance tests

- Every publishable Markdown page has one valid `origin` value.
- Every `R` reference resolves to `research-catalog.md`; every `C` reference still resolves to `source-catalog.md`.
- Unknown IDs fail the content build.
- Search can filter `course`, `supplemental`, and `mixed`.
- A mixed page shows one page badge and any authored `research` callouts.
- Screen readers receive the full badge label, not a color-only distinction.
- Origin colors meet contrast requirements and remain distinguishable without color.

### 6.7 Supplied itinerary ingestion

Register the supplied PDF as R069, a private contemporary itinerary held at:

`raw/Private Dahabiya-NS–DA-5–1 Dahabiya Nile Sailing - 5 days - Luxor -Dahabiya- Aswan - without Luxor and Aswan Tours (7).pdf`

The filename actually uses en dashes around `DA-5`; resolve it from the repository rather than retyping it in scripts. Keep the twelve-page PDF unchanged and do not publish a direct raw-file link. The internal catalog record should state:

- itinerary title: *Dahabiya Sailing on the Nile - 5 Days - 4 Nights - Luxor to Aswan*;
- planned dates: 11 January 2027 through 15 January 2027;
- cruise scope: pickup in Luxor, embarkation at Esna, four nights sailing, checkout at Aswan;
- included route: Esna, El Hegz, El Kab, Edfu, Bisaw, Gebel el-Silsila, Kom Ombo, Daraw, a Nubian town, and Aswan arrival;
- excluded core scope: the separately listed optional Luxor and Aswan tours;
- limitations: promotional document, itinerary subject to sailing changes, unidentified private hosts and Nubian town, inconsistent transliteration, and unsourced historical and cultural claims;
- allowed use: sequence, dates, included activities, and the questions a traveler will need answered;
- prohibited use: price display, contact/payment material, guide claims, safety advice, historical superlatives, cultural generalization, or proof of ancient facts.

SHA-256 recorded at ingestion on 2026-08-30: `8dc4ebbe2a41c3ff78fd1986ffe0d2dcbd4677bb19e322432301b88513bbf9bd`. Recheck it at implementation start so later file replacement is detectable. The source parser must allow a repository-local locator instead of a public URL for this record. The user-facing source panel should display "Private itinerary supplied by the project owner; not publicly downloadable." Articles should cite R069 only when discussing this particular planned route. Historical sections should cite the appropriate R070+ research sources instead.

## 7. New article inventory

The inventory is ordered by dependency. Slugs are normative unless an existing page is merged during implementation. All new articles start with `origin: supplemental`.

### N01. Studying religion through ancient Egypt

- Slug: `studying-religion-through-egypt`
- Priority: P0
- Purpose: Establish the method for the expanded wiki and explain why Egypt is a useful but incomplete case for studying religion.
- Target length: 2,000 to 2,800 words.
- Required sections:
  1. Why "religion" is a question rather than a neutral container.
  2. What survives from Egypt and who produced it.
  3. Belief, ritual, material religion, lived religion, institutions, ethics, embodiment, emotion, and sensory practice.
  4. Who authorizes religious knowledge when there is no single canon, creed, or centralized orthodoxy.
  5. Royal and elite evidence versus household and local practice.
  6. How to move from evidence to interpretation.
  7. What one case can and cannot teach about religion generally.
- Anchor sources: R001, R016, R020, R021, R022, R023, R058, R059.
- Required links out: `how-egyptian-religion-works`, `temples-priests-and-offerings`, `festivals-oracles-and-personal-piety`, `contested-interpretations`, N04, N18.
- Terms to define: religion, ritual, material religion, lived religion, personal piety, analogy, presentism, canon, orthodoxy, religious authority, sensory religion.
- Acceptance: contains an evidence-limits table, at least one ordinary-life example alongside a royal or temple example, and an explanation of authority that does not mistake the absence of a universal canon for the absence of institutions.

### N02. Predynastic Egypt and the formation of the state

- Slug: `predynastic-egypt-and-state-formation`
- Priority: P0
- Purpose: Supply the missing history before the First Dynasty and show how political formation, ritual, landscape, exchange, and representation interacted.
- Target length: 2,800 to 3,600 words.
- Required sections:
  1. Chronology and dating cautions.
  2. Nile environments and early food production without hydraulic determinism.
  3. Badarian, Maadi-Buto, Naqada I to III, and regional diversity.
  4. Cemeteries, craft specialization, exchange networks, violence, and elite display.
  5. Upper and Lower Egypt as changing regions, not timeless opposites.
  6. Writing, kingship, ceremonial imagery, and territorial integration.
  7. What "unification" explains and conceals.
- Anchor sources: R002, R003, R004, R010, R011, R012.
- Required links out: `chronology`, `sacred-geography`, `maat-isfet-and-kingship`, `creation-traditions`, N03, N09.
- Terms to define: Predynastic, Badarian, Maadi-Buto, Naqada, state formation, social stratification, territorial state.
- Acceptance: includes a dated sequence table with uncertainty notes and does not narrate state formation as an inevitable march toward monarchy.

### N03. Egypt and Mesopotamia: comparing early civilizations

- Slug: `egypt-and-mesopotamia-compared`
- Priority: P0
- Purpose: Answer the "which was first?" question by showing why it depends on the measure used.
- Target length: 2,600 to 3,400 words.
- Required sections:
  1. Why "first civilization" is a misleading question.
  2. What counts as a civilization and who chose those criteria.
  3. Paired chronology from the late fifth through early third millennia BCE.
  4. Uruk urbanism and southern Mesopotamian city-states.
  5. Egyptian settlement hierarchy and early territorial monarchy.
  6. Writing: chronology, function, medium, and uncertainty.
  7. Temples, administration, labor, exchange, and political scale.
  8. Contact and parallel development.
  9. Answers under different criteria.
- Anchor sources: R004, R006, R007, R008, R009, R011, R012, R013, R017.
- Required links out: N02, N08, `chronology`, `temples-priests-and-offerings`, `maat-isfet-and-kingship`.
- Terms to define: civilization, urbanism, city-state, territorial state, Uruk, Sumer, cuneiform, hieroglyphic writing.
- Required visual form: an accessible Markdown comparison table and paired timeline. Do not build a new custom visualization for the first release unless the table fails usability testing.
- Acceptance: the conclusion gives conditional answers under at least three criteria and names the evidence uncertainty behind each answer.

### N04. Ritual, uncertainty, and continuity

- Slug: `ritual-uncertainty-and-continuity`
- Priority: P0
- Purpose: Explore how repeated action can organize danger, responsibility, and incomplete knowledge without reducing religion to anxiety management.
- Target length: 2,400 to 3,200 words.
- Required sections:
  1. What scholars mean by ritual.
  2. Egyptian cases: daily temple service, festival recurrence, protection, healing, funerary provision, and calendrical renewal.
  3. Exactness, repetition, delegation, and responsibility.
  4. Environmental and political uncertainty without a single-cause theory.
  5. Dreams, oracles, omens, divine decrees, allotted destiny, and letters to the dead as ways of making decisions under uncertainty.
  6. Ritual failure, ambiguous results, renewed petitions, changed explanations, and the limits of the evidence for private doubt.
  7. Modern ritual-and-anxiety research as a bounded analogy.
  8. Clinical caution on OCD.
  9. What ritual also does: constitute authority, presence, identity, memory, exchange, and community.
- Anchor sources: R021, R022, R023, R024, R025, R026, R027, R049, plus Egyptian ritual sources already cataloged as C02 and C03.
- Required links out: `heka-and-operative-ritual`, `temples-priests-and-offerings`, `festivals-oracles-and-personal-piety`, `death-funeral-and-the-dead`, N01, N05, N16, N17.
- Terms to define: ritualization, uncertainty, compulsion, purification, efficacy, recurrence, divination, oracle, omen, fate, ritual failure.
- Acceptance: contains the exact clinical caution from section 4.5, never uses OCD as a metaphor for Egyptian culture, and distinguishes an ineffective outcome from evidence that participants abandoned the ritual system.

### N05. Permanence through renewal

- Slug: `permanence-renewal-and-impermanence`
- Priority: P0
- Purpose: Clarify the project's central insight that Egyptian continuity was repeatedly produced, then prepare the Buddhist comparison.
- Target length: 2,000 to 2,800 words.
- Required sections:
  1. Durable monuments versus maintained relations.
  2. Maat, kingship, names, images, offerings, and bodily integrity.
  3. Solar and lunar recurrence.
  4. Rupture, repair, and renewal.
  5. Political fragmentation, regional power, re-formation, and the rhetoric of restoration.
  6. Tradition as copying, selection, recombination, translation, archaism, innovation, and repair.
  7. Why "fixation on permanence" is too simple.
  8. Questions that can be compared across traditions.
- Anchor sources: R019, R020, R063, C02, C03, and the current pages' primary-source IDs.
- Required links out: `start-here`, `maat-isfet-and-kingship`, `solar-cycle`, `personhood-and-the-afterlife`, `death-funeral-and-the-dead`, `chronology`, N04, N06, N16, N19.
- Terms to define: permanence, continuity, renewal, recurrence, monumentality, archaism, innovation, fragmentation, political re-formation.
- Acceptance: explicitly distinguishes preservation, repetition, regeneration, and timelessness; uses at least two dated cases to show that apparent continuity was actively produced rather than culturally automatic.

### N06. Egypt and early Buddhism: ritual, practice, and impermanence

- Slug: `egypt-and-early-buddhism`
- Priority: P1, after N01 and N05
- Purpose: Conduct one narrow, transparent comparison rather than survey all of Buddhism.
- Target length: 2,600 to 3,400 words.
- Required sections:
  1. Why compare these cases and why the comparison is limited.
  2. Which Egypt and which Buddhism.
  3. `Anicca`, `dukkha`, and `anatta` in early discourses, including why none has a one-word English equivalent.
  4. Attachment, training perception, and the relation between impermanence and dissatisfaction.
  5. Critiques of sacrifice and claims made for rites.
  6. Ritual in historical Theravada communities.
  7. Repeated practice in both cases.
  8. Renewable continuity versus loosening attachment.
  9. Death, memory, material support, and community.
  10. What the comparison reveals and what it cannot prove.
- Anchor sources: R028, R029, R030, R031, R032, R033, R034, R065, with N04, N05, and N16's Egyptian sources.
- Required links out: N01, N04, N05, N16, `death-funeral-and-the-dead`, `festivals-oracles-and-personal-piety`.
- Terms to define: Buddhism, early Buddhist discourses, Theravada, anicca, dukkha, anatta, aggregate, attachment, sacrifice, merit.
- Acceptance: includes at least one similarity, at least three qualified differences, a callout stating that early Buddhist teachings and modern Theravada communities are not interchangeable, and a warning that `dukkha` is broader than ordinary physical suffering.

### N07. Households, work, and unequal access

- Slug: `households-work-and-unequal-access`
- Priority: P0
- Purpose: Correct the wiki's elite and mortuary bias by putting ordinary social life around religious practice.
- Target length: 3,000 to 3,800 words.
- Required sections:
  1. Why ordinary life is hard to recover.
  2. Households, kin, children, and local cult.
  3. Farmers, work crews, craft specialists, and temple labor.
  4. Tax, corvee, service, dependence, and slavery terminology.
  5. Gendered religious labor, priestly and musical offices, and queenship without reducing women to fertility roles.
  6. Sexuality, reproduction, childbirth protection, family formation, and the sparse evidence for same-sex relations.
  7. Age, illness, disability, status, and access to ritual resources.
  8. Burial inequality and the spread of texts and objects.
  9. Case studies rather than a timeless composite household.
- Anchor sources: R014, R015, R016, R018, R021, R022, R049, R060, plus additional specialist household, childhood, labor, disability, and bioarchaeological studies to be added during implementation.
- Required links out: `festivals-oracles-and-personal-piety`, `temples-priests-and-offerings`, `death-funeral-and-the-dead`, `personhood-and-the-afterlife`, N08, N09, N17.
- Terms to define: household cult, corvee, estate, redistribution, slavery, status, access, religious labor, reproductive life, disability.
- Acceptance: names the period and evidence type for every case study, does not use elite prescriptions as a transparent account of all social groups, and does not create a timeless composite category called "Egyptian women."

### N08. Writing, knowledge, and administration

- Slug: `writing-knowledge-and-administration`
- Priority: P0
- Purpose: Connect early writing, scribal institutions, numeracy, medicine, ritual speech, and state power.
- Target length: 2,400 to 3,200 words.
- Required sections:
  1. Earliest evidence and dating caution.
  2. Hieroglyphic, hieratic, Demotic, and changing functions.
  3. Administration, labels, lists, accounts, and monumental display.
  4. Education, apprenticeship, and restricted literacy.
  5. Numeracy, measurement, calendars, and medicine.
  6. Writing as effective presence in religious settings.
  7. Comparison with Mesopotamian scribal traditions.
- Anchor sources: R011, R012, R013, R015, R017 and additional current scholarship on medicine and Demotic literacy.
- Required links out: `heka-and-operative-ritual`, `ptahhotep-and-ethical-life`, `funerary-text-tradition`, `visual-decoder`, N02, N03, N07.
- Terms to define: hieroglyphic, hieratic, Demotic, scribe, literacy, numeracy, performative writing.
- Acceptance: separates evidence for writing's origin from later evidence for schooling and avoids reporting a single literacy rate unsupported by the record.

### N09. Egypt and its neighbors

- Slug: `egypt-and-its-neighbors`
- Priority: P1
- Purpose: Replace the image of an isolated Nile civilization with a history of movement, exchange, violence, migration, and border making.
- Target length: 2,600 to 3,400 words.
- Required sections:
  1. Nile corridor, deserts, Mediterranean, and Red Sea.
  2. Nubia and the problem of one-way influence.
  3. Levantine exchange, migration, and imperial control.
  4. Libya, oases, and western routes.
  5. Mesopotamian contacts in the fourth millennium BCE.
  6. Foreigners in Egyptian classification versus people in practice.
  7. Mobility, intermarriage, soldiers, laborers, captives, and traders.
  8. Smiting scenes, execration, imperial extraction, enemy-making, and the difference between state image and wartime practice.
- Anchor sources: R002, R004, R018, R061, R062 and additional specialist work on Nubia, the Levant, Libya, empire, and mobility.
- Required links out: `sacred-geography`, `chronology`, `maat-isfet-and-kingship`, N02, N03, N07, N11, N19.
- Terms to define: Nubia, Levant, Libya, border, migration, exchange, entanglement, empire, execration, enemy-making.
- Acceptance: includes Egyptian and neighboring perspectives where evidence allows, never treats present national borders as ancient ones, and distinguishes ideological images of enemies from evidence for actual violence and incorporation.

### N10. The afterlives of ancient Egypt

- Slug: `legacy-of-ancient-egypt`
- Priority: P0 hub
- Purpose: Route readers through documented transmission, adaptation, rediscovery, reinvention, commodity, and identity claims.
- Target length: 1,800 to 2,400 words.
- Required sections: the reception model from section 4.6, a chronological orientation, a "how to evaluate a legacy claim" checklist, and summaries linking to N11 through N15 and N20.
- Anchor sources: R035 through R045 and R051 through R055.
- Required links out: N11, N12, N13, N14, N15, N20, `contested-interpretations`.
- Terms to define: reception, legacy, transmission, adaptation, reinvention, appropriation.
- Acceptance: no unsupported list of Egyptian "firsts" and no implication that modern Western reception is the tradition's sole destination.

### N11. Egyptian religion in Greek and Roman worlds

- Slug: `egyptian-religion-in-greek-and-roman-worlds`
- Priority: P1
- Purpose: Trace transformation under Ptolemaic and Roman rule and the movement of Egyptian gods, objects, and learned traditions.
- Target length: 2,400 to 3,200 words.
- Required sections: Ptolemaic institutions; Isis, Osiris, and Serapis; temples and multilingual communities; Rome and obelisks; Mediterranean cult; Hermetic texts; continuity and change.
- Anchor sources: R035, R036, R039, R040, R041 plus additional Ptolemaic and Roman Egypt scholarship.
- Required links out: `amarna-and-late-transformations`, `osiris-isis-horus-and-set`, `temples-priests-and-offerings`, N09, N10, N12.
- Terms to define: Ptolemaic, Hellenistic, Roman Egypt, Serapis, interpretatio, Hermetica.
- Acceptance: distinguishes Egyptian practice in Egypt from cults and images adapted elsewhere in the Mediterranean.

### N12. Egypt after the pharaohs: Coptic and Islamic receptions

- Slug: `egypt-after-the-pharaohs`
- Priority: P1
- Purpose: Prevent the story from ending at Roman conquest and show later Egyptian engagement with the ancient landscape.
- Target length: 2,400 to 3,200 words.
- Required sections: late antique religious change; Coptic language and Christian Egypt; Alexandrian theology and desert monasticism; reuse and memory of temples; medieval Arabic authors and monuments; knowledge traditions; modern Egyptian engagements; why "survival" is often the wrong model.
- Anchor sources: R040, R041, R052 and additional Coptic, monastic, late antique, and Arabic reception scholarship.
- Required links out: N10, N11, N13, N20, `chronology`, `sacred-geography`.
- Terms to define: Coptic, late antiquity, Islamicate, reception, reuse, antiquarianism.
- Acceptance: uses Egyptian, Coptic, and Arabic sources or scholarship, not only European accounts of later Egypt.

### N13. Egyptology, museums, and colonial power

- Slug: `egyptology-museums-and-colonialism`
- Priority: P0
- Purpose: Explain how discovery, classification, excavation, export, and display shaped the archive readers now encounter.
- Target length: 3,000 to 3,800 words.
- Required sections:
  1. Antiquarian traditions before Napoleon.
  2. Expedition, documentation, and the `Description de l'Egypte`.
  3. Decipherment and the formation of Egyptology.
  4. Excavation labor, dealers, partage, collectors, and museums.
  5. Egyptian expertise and voices hidden by institutional records.
  6. Provenance, repatriation, and decolonization debates.
  7. Mummified people, body parts, tomb photography, CT scans, content warnings, consultation, and the ethics of display.
  8. How collection history changes interpretation.
- Anchor sources: R038, R042, R043, R044, R045, R056, R057 and additional scholarship by Egyptian and decolonial historians of archaeology.
- Required links out: N10, N12, N14, N15, N17, N20, `source-catalog`, `contested-interpretations`.
- Terms to define: Egyptology, Orientalism, colonialism, provenance, partage, repatriation, decolonization, human remains, dignity review, consultation.
- Acceptance: does not present museums only through their own institutional narratives, names uncertainty in object provenance, and evaluates human-remains display separately from copyright and ownership.

### N14. Egyptomania and popular culture

- Slug: `egyptomania-and-popular-culture`
- Priority: P1
- Purpose: Show how a small visual vocabulary became modern design, entertainment, tourism, esotericism, and commerce.
- Target length: 2,600 to 3,400 words.
- Required sections: Egyptian Revival before 1922; Tutankhamun and mass media; Art Deco; mummy fiction and film; music, fashion, tourism, games, and branding; occult Egypt; stereotypes and creative reuse; methods for tracing a modern motif.
- Anchor sources: R036, R037, R039, R040, R041 plus medium-specific scholarship added during implementation.
- Required links out: N10, N11, N13, N15, `visual-decoder`, `contested-interpretations`.
- Terms to define: Egyptomania, Egyptian Revival, Art Deco, esotericism, Orientalism, stereotype.
- Acceptance: each case labels whether it is transmission, adaptation, rediscovery, reinvention, commodity, or counter-memory.

### N15. Egypt, Africa, and modern identity

- Slug: `egypt-africa-and-modern-identity`
- Priority: P1
- Purpose: Treat modern claims on Egypt with historical care and include African diasporic art and thought that standard reception histories often omit.
- Target length: 2,600 to 3,400 words.
- Required sections: Egypt within Africa; the history of modern racial categories; colonial and nationalist narratives; Pan-African and African diasporic uses; Afrocentrism as a varied intellectual field; Black artists and ancient Egypt; modern Egyptian identities; contemporary Kemetic religions and digital communities; reconstruction, adaptation, and claims of continuity; evaluating ancestry and ownership claims.
- Anchor sources: R035, R037, R044, R054, R055 and additional African, African diasporic, Egyptian, and lived-religion scholarship.
- Required links out: N01, N09, N10, N13, N14, N20, `contested-interpretations`.
- Terms to define: African diaspora, Pan-Africanism, Afrocentrism, race, identity, counter-memory, Kemeticism, reconstruction, revival religion, digital religion.
- Acceptance: avoids treating Africa, Black identity, Afrocentrism, modern Egypt, or Kemetic religions as internally uniform; distinguishes cultural reception from biological ancestry claims; and treats contemporary practitioners as living communities without asserting uninterrupted Pharaonic continuity.

### N16. Misfortune, suffering, and divine justice

- Slug: `suffering-misfortune-and-divine-justice`
- Priority: P0, before N06
- Purpose: Supply the missing counterweight to the wiki's emphasis on restored order by asking how Egyptian sources handled pain, grief, injustice, divine distance, and apparently undeserved suffering.
- Target length: 2,400 to 3,200 words.
- Required sections:
  1. Why "theodicy" is useful but historically dangerous as a label.
  2. Pain, illness, anguish, and rupture in maat.
  3. Innocent suffering, social injustice, and the limits of retributive explanations.
  4. Divine distance, mercy, rescue, lament, and personal petition.
  5. Earthly redress, postmortem judgment, and cases in which resolution remains incomplete.
  6. Political crisis texts and the problem of reading literary rhetoric as autobiography or direct social report.
  7. What suffering reveals about Egyptian ideas of responsibility, personhood, and the gods.
  8. A bridge to `dukkha` that preserves the differences between the traditions.
- Anchor sources: R046, R047, R016, R020, C02, C03, plus specialist editions of each Egyptian literary or devotional text discussed.
- Required links out: `maat-isfet-and-kingship`, `ptahhotep-and-ethical-life`, `festivals-oracles-and-personal-piety`, `personhood-and-the-afterlife`, N04, N06, N17.
- Terms to define: suffering, pain, theodicy, divine justice, divine distance, mercy, lament, retribution.
- Acceptance: never assumes that maat guaranteed visible justice in every life; distinguishes literary composition, devotional evidence, and modern philosophical framing; and includes at least one case that does not end in easy restoration.

### N17. Illness, healing, and protection

- Slug: `illness-healing-and-protection`
- Priority: P0
- Purpose: Show how bodily vulnerability brought together observation, remedies, speech, divine power, household care, specialists, and material objects without forcing them into modern medicine-versus-magic categories.
- Target length: 2,800 to 3,600 words.
- Required sections:
  1. Bodies, disease, injury, pain, disability, pregnancy, childbirth, and dangerous environments.
  2. What medical papyri can and cannot reveal about practice.
  3. Physicians, household caregivers, ritual specialists, and overlapping expertise.
  4. Remedies, incantations, amulets, cippi, healing statues, incubation, and protective decrees.
  5. Serpents, scorpions, childhood danger, reproductive health, and prophylaxis.
  6. Material efficacy: words, images, placement, touch, water, ingestion, and transfer.
  7. Bioarchaeological evidence and the gap between prescribed treatment and lived outcome.
  8. Failure, repeated treatment, and the limits of retrospective diagnosis.
- Anchor sources: R048, R049, R064, R014, C03 and additional current work on medical papyri, bioarchaeology, disability, and reproductive health.
- Required links out: `heka-and-operative-ritual`, `festivals-oracles-and-personal-piety`, `deity-field-guide`, N04, N07, N08, N16, N18.
- Terms to define: prophylaxis, remedy, incantation, cippus, healing statue, apotropaic, incubation, retrospective diagnosis, bioarchaeology.
- Acceptance: identifies the evidence type and period for every treatment case, separates historical use from modern clinical efficacy, and includes bodily outcomes rather than describing illness only as a symbol of disorder.

### N18. Animals, gods, and nonhuman agency

- Slug: `animals-gods-and-nonhuman-agency`
- Priority: P1
- Purpose: Explain the several ways animals and material forms participated in religion and use Egypt to ask how religious worlds distribute agency beyond humans.
- Target length: 2,400 to 3,200 words.
- Required sections:
  1. Why "animal worship" is an inadequate category.
  2. Divine animal form and mixed human-animal iconography.
  3. Individual living cult animals and ceremonial burial.
  4. Votive animal mummies and the Late Period growth of animal-cult economies.
  5. Household protectors, dangerous animals, hunting, food, and environmental encounter.
  6. Statues, images, names, and bodies as possible loci of presence or action.
  7. Species identification, archaeological evidence, breeding, killing, and ethical questions.
  8. Greek, Roman, and modern caricatures of Egyptian animal religion.
- Anchor sources: R050, R023, R019, C02, C03 and specialist zooarchaeological and animal-mummy research added during drafting.
- Required links out: `deity-field-guide`, `sobek`, `set`, `heka-and-operative-ritual`, `festivals-oracles-and-personal-piety`, N01, N09, N17.
- Terms to define: nonhuman agency, cult animal, votive mummy, manifestation, embodiment, zooarchaeology, species identification.
- Acceptance: never treats iconography, a living cult animal, and a votive mummy as the same relation; includes both devotion and the material economies of breeding, killing, preservation, and pilgrimage.

### N19. Building eternity: monuments, labor, and engineering

- Slug: `monuments-labor-and-building-eternity`
- Priority: P0
- Purpose: Connect pyramids, temples, tombs, and obelisks to religion, state capacity, skilled work, extraction, logistics, maintenance, and modern pseudohistory.
- Target length: 3,000 to 3,800 words.
- Required sections:
  1. Monumentality as ritual, political, and social technology.
  2. Pyramid complexes as tombs, cult institutions, settlements, workshops, routes, and changing landscapes.
  3. Quarrying, tools, transport, surveying, ramps, boats, fitting, and the limits of reconstruction.
  4. Skilled workers, rotating crews, administrators, provisioning, coercion, and why "slaves built the pyramids" is inadequate.
  5. Resource extraction, regional networks, state capacity, and environmental cost.
  6. Building, maintenance, repair, unfinished work, reuse, dismantling, and stone recycling.
  7. Monumental permanence versus short-lived infrastructure and repeated human care.
  8. Aliens, lost technology, racialized denial of Egyptian achievement, and how archaeology evaluates construction claims.
- Anchor sources: R004, R014, R066, R067, R068 and additional site reports for Giza, Dahshur, quarry landscapes, transport papyri, and work settlements.
- Required links out: `pyramid-texts`, `temples-priests-and-offerings`, `sacred-geography`, `maat-isfet-and-kingship`, N02, N05, N07, N08, N13.
- Terms to define: monumentality, pyramid complex, quarry, work crew, corvee, logistics, state capacity, experimental archaeology, pseudohistory.
- Acceptance: separates known evidence, plausible reconstruction, unresolved engineering questions, and pseudohistorical assertion; treats workers as skilled historical actors; and links material construction to continuing cult rather than describing a pyramid as a finished isolated object.

### N20. Egypt in biblical, Jewish, and Christian memory

- Slug: `egypt-in-biblical-and-christian-memory`
- Priority: P0 within the legacy cluster
- Purpose: Cover the most consequential missing route by which Egypt entered Western religious and cultural memory while separating literary reception from recoverable Egyptian history.
- Target length: 3,000 to 3,800 words.
- Required sections:
  1. Historical relations among Egypt, the Levant, Israel, Judah, and later Jewish communities in Egypt.
  2. Egypt as refuge, abundance, wisdom, bondage, idolatry, and imperial danger in biblical texts.
  3. Exodus as narrative, ritual memory, political language, and contested historical problem.
  4. Egyptian and biblical wisdom, poetry, names, motifs, and the difference between contact, analogy, and direct borrowing.
  5. Moses, Akhenaten, monotheism, and why identification theories require stronger evidence than resemblance.
  6. Jewish life in Hellenistic and Roman Egypt and the complexity of Egypt beyond the bondage narrative.
  7. Alexandria, Egyptian Christianity, Coptic tradition, desert monasticism, and later Christian uses of Egypt.
  8. Exodus in abolition, liberation, nationalism, film, and modern politics as later reception.
- Anchor sources: R051, R052, R053, R035, R040 and additional specialists in Hebrew Bible, archaeology of Israel and Judah, Egyptian-Jewish history, Coptic Christianity, and monasticism.
- Required links out: N09, N10, N11, N12, N13, N14, `amarna-and-late-transformations`, `contested-interpretations`.
- Terms to define: biblical Egypt, Exodus, cultural memory, historicity, monotheism, reception history, Alexandria, Coptic Christianity, monasticism.
- Acceptance: states what external evidence can and cannot confirm, never identifies Moses with Akhenaten as established history, distinguishes biblical portrayals from Egyptian self-representation, and treats Jewish and Christian receptions as historically varied rather than one continuous Western view.

### N21. Nile travel, dahabiyas, and a changing river

- Slug: `nile-travel-dahabiyas-and-changing-river`
- Priority: P0 for the cruise cluster
- Purpose: Orient readers to the vessel, route, and transformed river before the first stop, while showing how transport, tourism, barrages, locks, and dams changed what Nile travel means.
- Target length: 2,200 to 3,000 words.
- Required sections: the Nile as corridor rather than backdrop; ancient river transport and evidentiary limits; the documented history of the dahabiya and nineteenth-century travel; tourism and the colonial gaze; Esna's barrages and locks; modern flow management; sailing, wind, towing, and itinerary variability; how to observe without claiming timeless continuity.
- Anchor sources: R069, R078, C02, and additional specialist histories of Nile navigation, boats, colonial travel, Esna barrages, and modern river management required before drafting.
- Required links out: `sacred-geography`, `chronology`, `nile-year` journey, N12, N13, N14, N19, N27, N28.
- Terms to define: dahabiya, barrage, lock, cataract, river corridor, travel writing, colonial gaze, managed flow.
- Acceptance: labels 11–15 January 2027 as a planned itinerary rather than a historical reconstruction; does not repeat the brochure's "authentic" superlatives; and clearly states that the cruise itself begins at Esna, not Luxor.

### N22. Esna: Khnum, temple, and layered town

- Slug: `esna-khnum-temple-and-layered-town`
- Priority: P0 for the cruise cluster
- Purpose: Connect late temple theology to the inhabited town, conservation work, Wakalat al-Geddawi, al-Qisariyya market, craft production, and adaptive reuse.
- Target length: 2,400 to 3,200 words.
- Required sections: Esna/Iunyt/Latopolis and location; Khnum and the local divine family; Ptolemaic and Roman construction and inscription; why the surviving hypostyle hall lies below the modern street; current conservation and recovered color; the eighteenth-century caravanserai and market; heritage revitalization, livelihoods, and risks of a monument-only story.
- Anchor sources: R069, R070, R071, C12, plus specialist publication of Esna's inscriptions and urban history.
- Required links out: `creation-traditions`, `deity-field-guide`, `temples-priests-and-offerings`, `sacred-geography`, N08, N11, N12, N21, N27.
- Terms to define: Khnum, hypostyle hall, Graeco-Roman temple, caravanserai, wakala, adaptive reuse, conservation.
- Acceptance: distinguishes late temple evidence from earlier Egyptian religion, distinguishes archaeological level from a claim that the whole temple was "buried," and presents the restored historic city as more than scenery around Khnum's temple.

### N23. El Kab and Nekheb: city, goddess, and provincial memory

- Slug: `el-kab-nekheb-city-and-provincial-memory`
- Priority: P0 for the cruise cluster
- Purpose: Use a rare surviving settlement-and-necropolis landscape to connect Predynastic occupation, city walls, Nekhbet's cult, New Kingdom officials, and autobiographical evidence.
- Target length: 2,400 to 3,200 words.
- Required sections: El Kab/Nekheb and naming; settlement sequence and what is actually preserved; the walls and their different dates; Nekhbet and Upper Egyptian kingship; temples and shrines; tombs of Paheri, Ahmose son of Abana, and Ahmose Pennekhbet; biography as selective elite evidence; regional history beyond royal capitals.
- Anchor sources: R069, R072, R002, R004, with Belgian mission reports and current epigraphic editions added before drafting.
- Required links out: `deity-field-guide`, `maat-isfet-and-kingship`, `chronology`, N02, N07, N08, N09, N21.
- Terms to define: Nekheb, Nekhbet, necropolis, provincial elite, tomb biography, mudbrick enclosure.
- Acceptance: does not date all visible walls or remains to 3000 BCE, does not treat tomb autobiography as neutral eyewitness reporting, and explains why a settlement is unusual within the wiki's monument-heavy evidence.

### N24. Edfu: temple, town, and the making of sacred history

- Slug: `edfu-temple-town-and-sacred-history`
- Priority: P0 for the cruise cluster
- Purpose: Put Horus's monumental Ptolemaic temple beside Tell Edfu's much longer settlement record and show how late priests organized local ritual history.
- Target length: 2,600 to 3,400 words.
- Required sections: Behdet/Edfu and route position; Tell Edfu's settlement sequence; construction and decoration of the surviving temple; Horus of Behdet; festival, procession, kingship, and the ritual defeat of enemies; inscriptions as late scholarly synthesis; original color and conservation; town, temple economy, and modern market without continuity shortcuts.
- Anchor sources: R069, R073, R081, C02, plus Edfu Project publications and editions of the temple inscriptions.
- Required links out: `osiris-isis-horus-and-set`, `set`, `temples-priests-and-offerings`, `festivals-oracles-and-personal-piety`, N05, N08, N09, N11, N21.
- Terms to define: Edfu, Behdet, Horus of Behdet, tell, temple enclosure, ritual drama, Ptolemaic.
- Acceptance: keeps Old Kingdom settlement evidence separate from the standing Graeco-Roman temple, rejects a timeless composite account, and distinguishes hostile Sethian temple imagery from Set's history elsewhere.

### N25. Gebel el-Silsila: quarrying a sacred landscape

- Slug: `gebel-el-silsila-quarrying-sacred-landscape`
- Priority: P0 for the cruise cluster
- Purpose: Let readers see how extraction, skilled work, transport, shrines, royal display, and temple building occupied the same landscape.
- Target length: 2,200 to 3,000 words.
- Required sections: river geography and ancient names; sandstone geology; quarry chronology and evidence; tools, marks, crews, and transport; connection to temple construction including Thebes; the Speos of Horemheb; private chapels, stelae, and inscriptions; industrial and sacred uses without treating them as opposites; current archaeological work and site conservation.
- Anchor sources: R066, R068, R069, R074, R075.
- Required links out: `sacred-geography`, `temples-priests-and-offerings`, `visual-decoder`, N07, N08, N09, N19, N21, N24, N26.
- Terms to define: Gebel el-Silsila, quarry, speos, stela, quarry mark, extraction landscape.
- Acceptance: connects visible cut rock to labor and logistics without inventing a work scene, distinguishes the speos from the quarry as a whole, and makes the material route from quarry to temple explicit.

### N26. Kom Ombo: two cults, one temple, and crocodile afterlives

- Slug: `kom-ombo-sobek-harwer-and-crocodiles`
- Priority: P0 for the cruise cluster
- Purpose: Explain the paired temple axes of Sobek and Harwer/Horus the Elder, the local religious program, and what the adjacent Crocodile Museum reveals and obscures about animal cult.
- Target length: 2,400 to 3,200 words.
- Required sections: site name and period; earlier sanctuary versus surviving Graeco-Roman structure; paired plan and divine families; Sobek and Harwer without collapsing distinct Horus forms; calendars, reliefs, and disputed "surgical instruments" interpretation; crocodile cult relationships; mummification, excavation, and museum display; river ecology then and now.
- Anchor sources: R050, R069, R076, R077, C20, C21, plus current zooarchaeological study of the displayed crocodiles.
- Required links out: `sobek`, `deity-field-guide`, `temples-priests-and-offerings`, `visual-decoder`, N11, N17, N18, N21, N25.
- Terms to define: Kom Ombo, Harwer, paired sanctuary, cult animal, animal mummy, crocodile cult.
- Acceptance: does not label every crocodile mummy a god, distinguishes Horus the Elder from Horus son of Isis where the sources do, treats the instruments scene as interpreted rather than self-evident, and applies respectful display language to animal remains.

### N27. Living Nile communities: work, food, markets, and hospitality

- Slug: `living-nile-communities-work-food-and-hospitality`
- Priority: P0 for the cruise cluster, but publication is blocked until community-centered sources are secured
- Purpose: Prepare readers for El Hegz, Bisaw, and Daraw through contemporary social and economic context while preventing the journey from turning residents into exhibits or proxies for antiquity.
- Target length: 2,200 to 3,000 words.
- Required sections: what the itinerary promises and what it does not document; El Hegz and Bisaw place-name verification; household hospitality and guide mediation; farming and home bread making as present practices; fishing knowledge and river change; Daraw's market and regional exchange; camel trade and animal welfare; visitor consent, photography, payment, bargaining, dress, and reciprocity; why "timeless village" is a harmful frame.
- Anchor sources: R069 only for itinerary claims; add recent Arabic- and/or Nubian-informed regional studies, local public-history sources, and community or organizer confirmation before publication.
- Required links out: `sacred-geography`, N01, N07, N09, N14, N15, N21, N28.
- Terms to define: participant consent, hospitality, reciprocity, cultural tourism, living heritage, mediation, presentism.
- Acceptance: confirms spellings and locations, publishes no identifying detail about host families, never calls residents "authentic" or "unchanged," does not infer ancient continuity from a modern activity, and separates observed or consented testimony from general research.

### N28. Nubia and Kush: ancient relations, displacement, and living identity

- Slug: `nubia-kush-displacement-and-living-identity`
- Priority: P0 for the cruise cluster
- Purpose: Give the Nubian-community stop enough depth to connect ancient Nubian and Kushite histories with modern displacement, cultural persistence, language, heritage politics, and visitor responsibility.
- Target length: 3,000 to 3,800 words.
- Required sections: Nubia as a changing region rather than one people across all time; Nile Valley communities before Egyptian state formation; exchange, colonization, conflict, and entanglement with Egypt; Kerma, Napata, Kush, and Dynasty 25; later Christian and Islamic Nubian histories; old dams, the High Dam, Lake Nasser, and displacement; the UNESCO monument campaign alongside the fate of communities; modern Nubian languages, identities, arts, claims, and internal diversity; tourism and self-representation.
- Anchor sources: R018, R069, R078, R079, R080, plus Nubian-authored and Arabic-language scholarship required before drafting.
- Required links out: `chronology`, `sacred-geography`, N02, N09, N12, N13, N15, N21, N27.
- Terms to define: Nubia, Kush, Kerma, Napata, Dynasty 25, displacement, salvage archaeology, living heritage, Nubian languages.
- Acceptance: removes the brochure's unsupported "one of the oldest" formula, distinguishes Nubia, Kush, and modern Nubian identities, gives displacement and living culture at least as much attention as rescued monuments, and avoids presenting one visited town as representative of all Nubians.

## 8. Existing article expansion inventory

These revisions should preserve the useful course-derived core. Mark the page `mixed` only when substantial new research has actually been integrated.

| Existing page | Required change | New links | Likely origin after revision |
|---|---|---|---|
| `start-here.md` | Add a short "Where this wiki now goes" section routing to religion, state formation, vulnerability, material worlds, reception, and the place-based Nile journey. Keep the original renewable-continuity introduction concise. | N01, N02, N04, N10, N16, N19, J01 | `mixed` |
| `how-egyptian-religion-works.md` | Add material and lived religion, sensory practice, religious authority without a universal canon, nonhuman agency, and the modern category problem; qualify belief-centered language. | N01, N04, N07, N18 | `mixed` |
| `chronology.md` | Add Predynastic sequence, dating caveats, Early Dynastic state formation, fragmentation and re-formation, Ptolemaic/Roman orientation, and a clear endpoint note routing to later receptions. | N02, N03, N05, N11, N12 | `mixed` |
| `sacred-geography.md` | Add settlement and environmental variation, routes beyond the Nile Valley, a warning against simple environmental determinism, and a dated distinction between the ancient inundation and the managed river seen on the cruise. | N02, N09, N21, N23, N25, N28 | `mixed` |
| `maat-isfet-and-kingship.md` | Relate royal ideology to state formation and administration; distinguish normative claim from political practice; add injustice, enemy-making, smiting, execration, and the violent enforcement of order. | N02, N05, N07, N09, N16 | `mixed` |
| `heka-and-operative-ritual.md` | Add ritual theory, written and material efficacy, healing, ritual failure, and caution against irrational/rational or medicine/magic binaries. | N01, N04, N08, N17, N18 | `mixed` |
| `temples-priests-and-offerings.md` | Add labor, estates, restricted access, sensory environments, delegation, building and maintenance, and institutional change over time; use Esna, Edfu, and Kom Ombo as explicitly late, local cases. | N04, N07, N08, N11, N19, N22, N24, N26 | `mixed` |
| `festivals-oracles-and-personal-piety.md` | Add household practice, social access, sensory and emotional religion, divination procedures, ambiguous results, and the scholarly history of "personal piety." | N01, N04, N07, N16, N17, N18 | `mixed` |
| `death-funeral-and-the-dead.md` | Add unequal access, children and households where evidence supports it, the difference between ideal provision and actual burial, and a route to modern human-remains ethics. | N04, N05, N06, N07, N13, N16 | `mixed` |
| `personhood-and-the-afterlife.md` | Connect bodily integrity, names, memory, and renewable continuity; avoid a universal "Egyptian soul" model. | N05, N06, N07 | `mixed` |
| `funerary-text-tradition.md` | Add production, literacy, access, copying, and material carriers. | N07, N08 | `mixed` |
| `ptahhotep-and-ethical-life.md` | Add scribal context, elite social location, education, and the limits of treating one text as general Egyptian ethics. | N01, N07, N08 | `mixed` |
| `amarna-and-late-transformations.md` | Tighten the period scope, treat Amarna within broader tradition and innovation, reject unsupported Moses-Akhenaten identification, and add routes to Ptolemaic, Roman, Coptic, and later reception. | N05, N10, N11, N12, N20 | `mixed` |
| `deity-field-guide.md` | Distinguish animal-headed iconography, living cult animals, votive animals, household protectors, and healing deities; strengthen entries for Khnum, Nekhbet, Horus of Behdet, Harwer, and Sobek with local and period-specific cautions. | N17, N18, N22, N23, N24, N26 | `mixed` |
| `sobek.md` | Expand Kom Ombo from a short case into a route to N26; distinguish Sobek's paired local cult, living crocodiles, animal mummies, and modern museum display. | N18, N26 | `mixed` |
| `egypt-trip-field-guide.md` | Turn the broad checklist into the launch page for J01. Label the core Esna-to-Aswan cruise separately from optional Luxor and Aswan extensions, link every included stop, and retain practical claims only when dated and verified. | N21 through N28, J01 | `mixed` |
| `visual-decoder.md` | Add sensory context and distinguish depiction, manifestation, embodiment, and cult object rather than treating every sign as symbolic code. | N01, N18, N19 | `mixed` |
| `pyramid-texts.md` | Situate the corpus within pyramid complexes, building labor, continuing mortuary cult, later transmission, and modern construction pseudohistory. | N05, N08, N19 | `mixed` |
| `contested-interpretations.md` | Add a reusable framework for analogy, presentism, pseudohistory, race claims, psychology claims, medical efficacy, animal-worship caricatures, biblical historicity, lost-technology claims, legacy claims, timeless-village tropes, and promotional superlatives. | N01, N03, N04, N10, N13, N15, N17, N18, N19, N20, N27, N28 | `mixed` |
| `glossary.md` | Add the definitions listed in section 9.2 and cross-link each term to its main article. | All clusters | `mixed` |
| `index.md` | Add all new pages, comparison terms, legacy terms, and aliases. | All new pages | `mixed` |
| `web-research-supplement.md` | Audit what has already been imported, assign `R` sources where possible, and turn the page into a dated research-change log or retire it with redirects if it duplicates the new catalog. | `research-catalog` | Audit required |
| `coverage-map.md` | Replace the old gap list with a generated or dated status table for this expansion. | New cluster hubs | `mixed` |
| `course-reading-guide.md` | Preserve the course path and label it explicitly as course-derived. Add a separate route to expanded learning paths rather than blending assignments with new material. | New paths | `course` |
| `source-catalog.md` | Add an explanation that `C` sources belong to the original archive and link to the research catalog. Do not rewrite records for stylistic consistency. | `research-catalog` | `course` |

## 9. Links, definitions, graph, and learning paths

### 9.1 Contextual-link policy

The current graph has many edges, but some central articles contain only one or two useful body links. Apply these rules to substantive articles:

- Minimum three contextual outgoing wiki links in body prose. Source links, tags, previous/next navigation, and the generated related panel do not count.
- Minimum two contextual inbound links from other substantive pages after the cluster is complete.
- New articles should normally plan four or more links in each direction.
- Link the first meaningful occurrence in a section. Do not turn every repeated term into a link.
- Use descriptive linked phrases, not repeated "click here" text.
- Add links where they answer the reader's next question, not only where two pages share a keyword.
- Exempt catalogs, logs, and narrow control pages from numeric link targets.

Add an advisory link-health report to `content:check` showing:

- pages below the outgoing target;
- pages below the inbound target;
- orphan pages;
- broken anchors;
- duplicate aliases;
- links whose visible text gives no context;
- unlinked first mentions of high-value glossary terms.

Initially warn rather than fail on link-count targets. Promote orphan and broken-anchor checks to errors immediately. Promote numeric targets only after existing pages have been brought into compliance.

### 9.2 Glossary additions

Add concise definitions, aliases, and main-article links for at least these terms:

| Cluster | Terms |
|---|---|
| Method | religion, ritual, material religion, lived religion, sensory religion, religious authority, canon, orthodoxy, analogy, presentism, anachronism, evidence, reconstruction |
| State formation | Predynastic, Badarian, Maadi-Buto, Naqada, state formation, civilization, urbanism, city-state, territorial state, social stratification |
| Writing and society | cuneiform, hieroglyphic, hieratic, Demotic, scribe, literacy, numeracy, corvee, redistribution, household cult, religious labor, disability |
| Human questions | uncertainty, ritualization, compulsion, continuity, renewal, recurrence, suffering, pain, theodicy, divine justice, lament, ritual failure, divination, oracle, omen, fate |
| Bodies and healing | prophylaxis, remedy, incantation, cippus, healing statue, apotropaic, incubation, retrospective diagnosis, bioarchaeology |
| Animals and material agency | nonhuman agency, cult animal, votive mummy, manifestation, embodiment, zooarchaeology, species identification |
| Monuments | monumentality, pyramid complex, quarry, work crew, logistics, state capacity, experimental archaeology, pseudohistory |
| Nile route and sites | dahabiya, barrage, lock, cataract, river corridor, Khnum, Nekhbet, Horus of Behdet, Harwer, hypostyle hall, tell, necropolis, speos, quarry mark, paired sanctuary |
| Living communities | participant consent, reciprocity, cultural tourism, living heritage, mediation, Nubia, Kush, Kerma, Napata, Dynasty 25, displacement, salvage archaeology, Nubian languages |
| Buddhism | Buddhism, early Buddhist discourses, Theravada, anicca, dukkha, anatta, aggregate, attachment, merit |
| Reception | reception, transmission, adaptation, reinvention, Egyptomania, Egyptian Revival, Hermetism, esotericism, Orientalism, provenance, partage, repatriation, decolonization, Afrocentrism, counter-memory, biblical Egypt, Exodus, cultural memory, historicity, Kemeticism, revival religion, digital religion, human remains, dignity review |

Definitions should describe how the wiki uses a term, not pretend that disputed concepts have one final definition. Terms such as civilization, religion, ritual, race, and Afrocentrism need a short caution or link to the page where disagreement is explained.

The existing glossary annotator can continue supplying first-use definitions. Add tests for multiword terms, aliases, capitalization, linked terms, headings, and words that merely contain a glossary term.

### 9.3 Graph changes

Keep the graph readable. Add only relations that users can interpret:

| Relation | Use | Example |
|---|---|---|
| `transmitted_through` | A documented intermediary carries material forward. | Egyptian obelisk -> Roman imperial setting. |
| `adapted_by` | A later community or tradition changes inherited material. | Isis traditions -> Roman Mediterranean cult. |
| `reinterpreted_by` | A later reading assigns substantially new meaning. | Thoth/Hermes material -> Renaissance Hermetism. |
| `manifested_in` | A source describes a deity or power as present through a specific living being, image, or object. | Apis -> a selected living bull in a dated cult setting. |
| `encountered_at` | A journey scene points to a documented place or article without claiming historical causation. | J01 Kom Ombo scene -> Kom Ombo place and N26. |

Do not add a generic `influenced` edge. It hides the difference between direct transmission, loose resemblance, and later reinvention.

Before adding a new node kind such as `tradition`, test whether article, concept, period, and source nodes can express the required graph without clutter. If a new kind is added, update graph filters, legends, accessible labels, serialization tests, and visual regression snapshots together.

Every new article needs:

- at least two curated semantic relations in frontmatter;
- ordinary body links that generate `links_to` edges;
- source IDs that generate `draws_from` edges;
- a graph-neighborhood review for duplicated or misleading relations.

### 9.4 New learning paths

Create eight paths in `content/paths/` after their required articles exist:

1. **What religion does**: N01 -> `how-egyptian-religion-works` -> `temples-priests-and-offerings` -> N04 -> N18 -> `contested-interpretations`.
2. **How an early state formed**: `sacred-geography` -> N02 -> N08 -> N19 -> `maat-isfet-and-kingship` -> N03.
3. **Ritual, continuity, and uncertainty**: `start-here` -> `heka-and-operative-ritual` -> N04 -> N05 -> N16 -> `death-funeral-and-the-dead`.
4. **Permanence, suffering, and impermanence**: N05 -> N16 -> N06 -> `personhood-and-the-afterlife` -> `festivals-oracles-and-personal-piety`.
5. **The afterlives of Egypt**: N10 -> N11 -> N20 -> N12 -> N13 -> N14 -> N15.
6. **Vulnerable bodies and practical care**: N07 -> N17 -> `heka-and-operative-ritual` -> N04 -> N16 -> `death-funeral-and-the-dead`.
7. **Material and more-than-human religion**: `sacred-geography` -> N18 -> `deity-field-guide` -> N19 -> `temples-priests-and-offerings` -> `festivals-oracles-and-personal-piety`.
8. **Prepare for the Esna-to-Aswan journey**: N21 -> N22 -> N23 -> N24 -> N25 -> N26 -> N27 -> N28 -> `egypt-trip-field-guide`.

Each path needs a purpose statement, a reason for the order, one reflection question per step, and a final "what this path leaves out" note.

### 9.5 Hub organization

Extend the encyclopedia hubs with these groups:

- Studying religion
- Origins and early states
- Society and knowledge
- Vulnerability, healing, and human questions
- Material and more-than-human religion
- Monuments and political power
- Comparison
- Reception and legacy
- Places along the Nile
- Living Nile and Nubian communities

Keep the original course and archive hubs intact. The start page should offer both a course-derived route and an expanded thematic route.

### 9.6 New itinerary journey

Create `content/journeys/esna-to-aswan-dahabiya.json` with ID `esna-to-aswan-dahabiya` and public label **Sailing south: Esna to Aswan**. Refer to it as J01 inside this plan. It is a guided companion to a specific planned cruise, not a simulation of an ancient voyage.

Journey-level contract:

- `question`: How does moving along this stretch of the Nile connect temple religion, provincial life, extraction, food and work, animal cult, Nubian history, and the modern river?
- `origin`: `supplemental`.
- `period`: "Multiple periods, from Predynastic occupation to a planned journey on 11–15 January 2027."
- `place`: "The Nile from Esna to Aswan, with pickup from Luxor."
- `sourceIds`: R069 plus all historical sources actually used by the scenes.
- `sourcePages`: N21 through N28 and the existing pages linked below.
- `evidenceBoundary`: state that the route and activities come from a private promotional itinerary; site history comes from separately cataloged research; modern encounters cannot reconstruct ancient everyday life; and the actual sailing order may change.
- `reconstruction`: state that no ancient person's thoughts, sounds, smells, dialogue, weather, or precise movement are invented. The journey organizes documented context around a modern route.
- `accessibleSummary`: include every stage, day, stop, activity, article link, and evidence caution in text. The map, if added, must be redundant with this transcript.

Required stages:

| Day | Stage | PDF-based activity | Interpretive focus | Required article links |
|---|---|---|---|---|
| 1 | Luxor pickup to Esna | Road transfer; the sailing itself begins at Esna. | Scope boundary, north-to-south orientation, and why the locks affect embarkation. | N21, `sacred-geography` |
| 1 | Esna | Temple of Khnum, Wakalat al-Geddawi, al-Qisariyya market. | Late temple theology, recovered color, layered urban history, craft, conservation, adaptive reuse. | N22, `creation-traditions`, `temples-priests-and-offerings` |
| 1 | Sailing to El Hegz | Lunch aboard; village household visit. | Dahabiya travel, mediated hospitality, consent, and the limit of the "authentic village" frame. | N21, N27 |
| 2 | El Kab/Nekheb | Ancient town walls, temples/shrines, New Kingdom tombs. | Settlement evidence, Nekhbet, provincial office, tomb biography, and changing walls. | N23, N02, N07, N09 |
| 2 | Edfu | Horus temple, view of Tell Edfu, possible market walk. | Monument versus settlement, late priestly synthesis, Horus/Set ritual, and conservation. | N24, `osiris-isis-horus-and-set`, `set` |
| 3 | Bisaw | Farm walk, household bread making, fishing with local fishers. | Contemporary livelihoods, food, skill, reciprocity, river change, and the ban on projecting modern practice backward. | N27, N21, N07 |
| 3 | Gebel el-Silsila | Quarry, Speos of Horemheb, shrines, stelae, inscriptions. | Stone extraction, labor, transport, sacred landscape, and the temple-building network. | N25, N19, N08 |
| 4 | Kom Ombo | Double temple and Crocodile Museum. | Sobek and Harwer, paired cult axes, animal embodiment and mummification, museum interpretation. | N26, `sobek`, N18, N17 |
| 4 | Daraw | Market shopping and camel barn/trade. | Regional exchange, visitor participation, animal welfare, and claims the itinerary cannot establish. | N27, N09, N18 |
| 4 | Nubian community | Visit to an unnamed town. | Ancient Nubian plurality, Kushite rule, modern displacement, living identity, and the ethics of representation. | N28, N09, N15 |
| 4 | Final sailing to Aswan | Optional swimming or kayaking; farewell dinner. | The modern managed river, embodied observation, and reflection without invented danger or safety advice. | N21, N28, `sacred-geography` |
| 5 | Aswan checkout | Cruise ends; no included Aswan sightseeing. | Separate core route from optional extensions and route readers to the existing trip guide. | `egypt-trip-field-guide`, N21, N28 |

Optional Luxor and Aswan items in R069 must appear only in an **Extensions not included in this journey** panel. Link existing coverage for the Luxor west bank, Karnak, Luxor Temple, Philae, Elephantine, Abu Simbel, Kalabsha, the High Dam, and Nubian Museum where it is adequate. Create no additional article solely because it appears in the sales document's optional list; add it to the backlog only if the current article cannot answer the reader's likely question.

Every stage must expose scene-specific `sourcePages`, not only the journey-wide list. Add `day`, `sourcePages`, and `stopType: transfer | archaeological-site | living-community | sailing | museum | market | arrival` to `JourneyScene`. Keep `place` optional because El Hegz, Bisaw, and the unnamed Nubian town must not receive atlas records until their locations and public naming are verified. Render a compact "Read about this stop" list within the active scene and include it in the transcript.

If a route map is added, derive its ordered points from verified `Place` records rather than hard-coded screen coordinates. Add Esna, El Kab, Edfu, Gebel el-Silsila, Kom Ombo, Daraw, and Aswan as needed; do not pin the private household or unnamed Nubian town. The map must support keyboard access, readable stop order, reduced motion, and a no-map transcript. The journey remains complete without a custom map in the first release.

## 10. Application and schema changes

### 10.1 Required touchpoints

| Area | Files likely affected | Work |
|---|---|---|
| Content types | `src/types/content.ts` | Add `ContentOrigin`; add frontmatter, summary, search, and graph metadata; optionally accept explicit `evidence`. |
| Frontmatter parsing | `scripts/content/build-content.ts` | Parse and validate origin; preserve fallback behavior during migration. |
| Research sources | `scripts/content/build-content.ts`; `scripts/content/lib/markdown.ts` | Read two catalogs, generalize source IDs, map IDs to routes, generate citations. |
| Source types | `src/types/content.ts` | Add source origin, URL or private local locator, source class, accessed date, limitations, and reuse note while keeping local course files optional. Never expose private raw locators as public links. |
| Search | `scripts/content/build-search.ts`; search client and views | Index origin, new tags, aliases, glossary terms, and both source prefixes. Add an Origin filter. |
| Article header | `src/features/articles/ArticleView.tsx`; design system | Render the origin badge and explain it with accessible text or help copy. |
| Source list | article/source components | Group or label course and research sources and support external source records safely. |
| Browse and index | browse components and generated nav | Expose the expanded hub groups and origin filter. |
| Graph | `scripts/content/build-graph.ts`; graph components | Carry origin metadata and add only approved reception relations. |
| Markdown callouts | parser, block types, design-system callout | Add `research` callout with accessible default label. |
| Static navigation | `scripts/content/lib/site.ts` | Add new slugs to sections and hubs. Do not leave new pages discoverable only through search. |
| Content checks | `scripts/content/check-content.ts` | Remove magic count; validate origin, source registries, links, definitions, and review fields. |
| Unit tests | `tests/unit/content.test.ts` and relevant suites | Make page ingestion data-driven; add source, origin, callout, glossary, search, and graph cases. |
| App tests | `tests/application.spec.ts` | Test origin display/filtering, research source navigation, one new learning path, and new hub discovery. |
| Cruise journey | `src/types/content.ts`; `content/journeys/`; `src/features/journeys/JourneyView.tsx`; build and graph scripts | Add J01 with supplemental provenance, scene-level day/type/article links, private-source handling, transcript parity, and optional ordered route mapping. Audit origin for the six existing journeys. |
| Places | `content/places.json`; atlas and place checks | Add or revise only publicly identifiable route stops; validate north-to-south order and do not expose private household or unnamed-community locations. |
| Human-remains media | `src/types/content.ts`; `content/media-manifest.json`; media rendering and checks | Add explicit human-remains metadata, dignity-review status, optional content warning, and tests that prevent unreviewed publication. |
| Wiki conventions and log | `llm-wiki/AGENTS.md`; `llm-wiki/log.md` | Document supplemental frontmatter and source headings; append a concise entry for each coherent content phase. |
| Documentation | `README.md`; `docs/live/IMPLEMENTATION_STATUS.md` | Generate or update counts only after content lands; document the two source catalogs. |

### 10.2 Recommended data contracts

```ts
export type ContentOrigin = 'course' | 'supplemental' | 'mixed';

export interface PageFrontmatter {
  origin: ContentOrigin;
  evidence?: EvidenceKind;
  // existing fields remain
}

export interface SourceEntry {
  id: string;
  origin: 'course' | 'supplemental';
  title: string;
  sourceClass: string;
  status: string;
  use: string;
  url?: string;
  localLocator?: string;
  publicDownload?: boolean;
  accessed?: string;
  limitations?: string;
  reuse?: string;
  files: { label: string; path: string }[];
  citedBy: string[];
  catalogSlug: 'source-catalog' | 'research-catalog';
}
```

For J01, minimally extend the current journey shape:

```ts
export type JourneyStopType =
  | 'transfer'
  | 'archaeological-site'
  | 'living-community'
  | 'sailing'
  | 'museum'
  | 'market'
  | 'arrival';

export interface JourneyScene {
  // existing fields remain
  day?: number;
  stopType?: JourneyStopType;
  sourcePages?: string[];
}

export interface Journey {
  // existing fields remain
  origin: ContentOrigin;
}

export interface KnowledgePath {
  // existing fields remain
  origin: ContentOrigin;
}
```

Keep these fields optional so the six existing journeys remain valid without a migration. Validate every J01 `sourcePages` slug and every non-private `place` reference. The generated graph should add `encountered_at` edges from J01 scenes to place/article nodes, while continuing to use `draws_from` for sources.

If any media includes human remains, extend the media contract rather than hiding the decision in prose:

```ts
containsHumanRemains?: boolean;
dignityReview?: 'reviewed' | 'pending' | 'not-applicable';
contentWarning?: string;
educationalRationale?: string;
```

A cleared license must not imply a completed dignity review. `media:check` should fail publication when `containsHumanRemains` is true and dignity review, rationale, or the required warning is missing.

Do not make every new field mandatory for old `C` records in the first migration. Normalize missing values in the parser, then improve the course catalog separately if useful.

Use this frontmatter shape for a new supplemental article:

```yaml
---
type: topic
tags: [comparison, religion]
origin: supplemental
evidence: scholarship
updated: 2026-08-30
aliases: []
periods: []
places: []
entities: []
relations: []
review:
  factual: pending
  humanizer: pending
  media_rights: reviewed
  editorial: pending-human
---
```

Update `llm-wiki/AGENTS.md` so `course` is required for course-derived and mixed pages but omitted from wholly supplemental pages. Keep `## Sources in this archive` for course citations. Use `## Supplemental research` for `R` citations. A mixed page may have both headings. The build should derive source presence from parsed IDs rather than either heading's wording.

### 10.3 Research catalog parser

The parser should accept current course headings and new research headings without making punctuation part of the identifier. Prefer a registry built from parsed records over a broad regex. Required cases:

- `C01` through `C36` continue to work.
- `R001` and future `R1000` work without another schema change.
- `R001,` and `(R001)` link correctly.
- Unknown `R999` remains plain text only if it is inside code; otherwise it is a build error.
- A wiki link to a catalog heading and a bare source ID resolve to the same anchor.
- Source IDs in frontmatter relations or curated JSON are validated against both catalogs.
- R069 resolves to a catalog record with a non-public local locator; its raw path is never emitted as an anchor or download URL.

### 10.4 Chronology and geography boundaries

Do not append Mesopotamian, Buddhist, medieval European, and modern reception records to the Egyptian sacred atlas.

For phase 1:

- Keep paired comparative chronologies as accessible article tables.
- Add Predynastic and Early Dynastic Egyptian records to the existing chronology with explicit uncertainty.
- Use article metadata and graph concepts for non-Egyptian comparative regions.
- Add a separate comparative chronology data model only if two or more pages need the same structured dataset.

This keeps the first implementation small and avoids implying that every comparison belongs on one geographic or chronological scale.

### 10.5 User-facing copy

Every new label, help message, badge explanation, empty state, path description, article passage, media caption, and alternative text must pass the `/humanizer` skill. In file mode, the skill's output should be the revised file text only. After replacement, the implementer must verify that it did not alter:

- dates and period qualifiers;
- source IDs and links;
- transliterated terms;
- headings and anchors;
- frontmatter and review status;
- copyright or clinical cautions.

## 11. Phased implementation

Each phase ends with a coherent, reviewable outcome. Work directly on `main`, preserve unrelated worktree changes, and stage only files belonging to the phase.

### Phase 0. Reconfirm the baseline

1. Read repository `AGENTS.md`, `llm-wiki/AGENTS.md`, and any applicable `CLAUDE.md` files.
2. Inspect `git status` and save the list of pre-existing modified files. Do not overwrite or stage them accidentally.
3. Run `npm run content:check`, `npm run typecheck`, and `npm run test:unit`.
4. Recompute page, route, link, graph, source, and glossary counts. If they differ from section 2, update the implementation notes, not historical claims in this plan.
5. Confirm R069 exists at the supplied path, record its page count and SHA-256 checksum, and do not edit `raw/`.

Exit gate: the implementer can distinguish baseline failures from expansion failures and has documented any overlapping user changes.

### Phase 1. Provenance and source infrastructure

1. Add `ContentOrigin` and propagate it through generated content.
2. Add origin to all current Markdown pages, journeys, and learning paths after an actual provenance audit.
3. Add optional explicit evidence frontmatter and fallback warnings.
4. Create `research-catalog.md` and seed it with the approved sources from section 14, including R069 as a non-public local record.
5. Generalize source parsing and routing.
6. Add the origin badge, Browse filter, search indexing, and accessible explanations.
7. Add the `research` callout.
8. Remove hard-coded page totals and update tests.
9. Update `llm-wiki/AGENTS.md` with the new frontmatter and source conventions.
10. Add provenance and source-registry tests before writing new articles.

Exit gate: a one-paragraph supplemental test page can cite `R001`, render the correct badge, appear under the correct filter, link to the research catalog, and pass unit and application tests. Remove the test fixture or convert it into N01.

### Phase 2. Historical context and society

Write and integrate, in order:

1. N02 Predynastic Egypt and state formation.
2. N19 Building eternity: monuments, labor, and engineering.
3. N08 Writing, knowledge, and administration.
4. N03 Egypt and Mesopotamia compared.
5. N07 Households, work, and unequal access.
6. N09 Egypt and its neighbors.

Then revise `chronology`, `sacred-geography`, `maat-isfet-and-kingship`, `temples-priests-and-offerings`, `pyramid-texts`, `ptahhotep-and-ethical-life`, `contested-interpretations`, and the relevant glossary/index entries.

Exit gate: a reader can answer the early-civilization question with conditional criteria, trace the basic Predynastic sequence, explain monuments through evidence rather than slaves or lost technology, and find ordinary social contexts without leaving the wiki.

### Phase 3. Religion, ritual, and comparison

Write and integrate, in order:

1. N01 Studying religion through ancient Egypt.
2. N04 Ritual, uncertainty, and continuity.
3. N17 Illness, healing, and protection.
4. N16 Misfortune, suffering, and divine justice.
5. N05 Permanence through renewal.
6. N18 Animals, gods, and nonhuman agency.
7. N06 Egypt and early Buddhism.

Then revise `start-here`, `how-egyptian-religion-works`, `heka-and-operative-ritual`, `festivals-oracles-and-personal-piety`, `death-funeral-and-the-dead`, `personhood-and-the-afterlife`, `deity-field-guide`, `visual-decoder`, and `contested-interpretations`.

Exit gate: all psychological, medical, and Buddhist comparisons carry the required limits; no page diagnoses ancient people; healing does not use a rational-versus-magical binary; ritual failure and unresolved suffering are visible; animal relations are distinguished; the Buddhist comparison includes `anicca`, `dukkha`, and `anatta`; origin and evidence labels remain correct.

### Phase 4. Reception and legacy

Write N10 first as a routing hub, then N11, N20, and N12 through N15. Revisit N10 after the child articles exist so its summaries match them. N20 must precede final revisions to Amarna, Coptic reception, and modern popular culture because it supplies their biblical-memory boundary.

Revise `amarna-and-late-transformations`, `chronology`, `visual-decoder`, `contested-interpretations`, `source-catalog`, and `web-research-supplement` as specified in section 8.

Exit gate: every major legacy claim is classified by reception path and has a traceable source. Biblical narrative is separated from Egyptian history, Moses-Akhenaten claims are handled as contested reception, contemporary Kemetic religions are treated as living communities, and the cluster includes non-European and modern Egyptian receptions.

### Phase 5. Esna-to-Aswan cruise cluster and journey

1. Re-extract R069 and make a route-facts table that contains only dates, order, transport, included activities, and optional exclusions.
2. Complete the specialist and community-centered research gaps for N21 through N28. Do not draft N27 from the brochure alone.
3. Confirm the public spellings, identities, and approximate route order of El Hegz, El Kab, Edfu, Bisaw, Gebel el-Silsila, Kom Ombo, and Daraw. Keep the Nubian town and private household unpinned unless the operator or user identifies them for public use.
4. Write N21 through N28 in dependency order, then revise `sacred-geography`, `creation-traditions`, `deity-field-guide`, `sobek`, `temples-priests-and-offerings`, `contested-interpretations`, and `egypt-trip-field-guide`.
5. Add or update verified public place records for the archaeological and town stops. Check aliases, banks, coordinates, source IDs, and route order manually.
6. Extend `JourneyScene` with optional `day`, `stopType`, and scene-level `sourcePages`; update build validation, the journey UI, graph generation, and tests.
7. Create J01 exactly from section 9.6, including the evidence boundary, complete text transcript, and scene-specific reading links.
8. Put optional Luxor and Aswan visits in a clearly excluded extensions panel; do not represent them as completed journey stages.

Exit gate: J01 follows the PDF's verified sequence, every historical claim uses research beyond R069, every living-community scene carries the section 4.13 safeguard, every stop has useful contextual links, and a reader can tell what is included, optional, uncertain, ancient, and contemporary.

### Phase 6. Navigation, definitions, and graph

1. Add the glossary terms from section 9.2.
2. Add all new aliases and index entries.
3. Create the eight learning paths.
4. Add hub groups and intentional previous/next order.
5. Run the link-health report and repair low-link pages.
6. Add curated reception and `encountered_at` relations and inspect graph neighborhoods, including J01.
7. Check search queries listed in section 12.4.

Exit gate: no new page is orphaned, every new page has its required links and relations, J01 is discoverable from Home or the trip guide and Journeys, and readers can enter each cluster from Home, Browse, Search, a learning path, and at least one existing article.

### Phase 7. Review and release

1. Run a claim-by-claim source audit.
2. Run `/humanizer` on all new and materially rewritten user-facing text.
3. Compare humanized files with their pre-humanized versions for factual drift.
4. Complete media rights, human-remains dignity, and accessibility review.
5. Mark review fields accurately. Do not mark factual or media review complete merely to satisfy lint.
6. Run all checks in section 12.
7. Inspect `git diff`, `git diff --check`, and `git status`.
8. Stage only scope-expansion files. Keep unrelated user changes untouched.
9. Update counts in README and implementation status from generated output.

Exit gate: every checklist item in section 16 passes.

## 12. Testing and review matrix

### 12.1 Automated commands

Run these after each relevant phase and all of them at the final gate:

```sh
npm run content:check
npm run review:check
npm run media:check
npm run typecheck
npm run test:unit
npm run build
npx playwright test tests/application.spec.ts
npm run check
git diff --check
```

Run `npm run media:build` only when adding cleared assets. Run visual tests when intentional UI changes affect badges, filters, callouts, article headers, Browse, Search, or graph legends. Review snapshot diffs rather than accepting them automatically.

### 12.2 Content model tests

| Test | Expected result |
|---|---|
| Every publishable Markdown file is ingested. | Manifest length equals discovered publishable files; no fixed total. |
| Every page has valid origin. | Missing or unknown value fails. |
| Evidence fallback during migration. | Builds with a warning; final migrated corpus has no fallback warnings. |
| `C19` link | Resolves to course catalog anchor. |
| `R001` link | Resolves to research catalog anchor. |
| `R069` private record | Resolves to catalog metadata without emitting a raw-file link or filesystem path in public output. |
| Unknown source | Fails with page and ID. |
| Research callout | Parses, renders, and has a useful accessible label. |
| New relation types | Serialize, filter, and render with readable labels. |
| Catalog citation counts | `citedBy` includes all pages using each source. |
| Source links | External links use safe attributes; local course files still work. |
| Human-remains media | Publication fails unless dignity review, educational rationale, and any required content warning are complete. |
| Existing journeys | All six current journey files parse and render unchanged after the optional scene fields are added. |
| Structured provenance | Existing journeys and paths show audited origin; J01 and the cruise-preparation path show `supplemental`. |
| J01 route | Days and stages match section 9.6 and R069; optional Luxor/Aswan tours are not counted as cruise stages. |
| J01 scene links | Every `sourcePages` slug and public `place` resolves; private or unidentified stops are not mapped. |
| J01 transcript | Contains the same stage titles, context, links, and cautions as the interactive stepper. |

### 12.3 Editorial review matrix

Every new article receives a row in a temporary review ledger or issue with these checks:

| Review | Pass condition |
|---|---|
| Scope | Answers its stated question and does not absorb a neighboring article. |
| Chronology | Dates, period labels, and sequence agree with cited scholarship; uncertainty is visible. |
| Geography | Ancient regions are not mapped onto modern borders without explanation. |
| Evidence | Primary evidence, reconstruction, comparison, and modern hypothesis remain distinguishable. |
| Citation | Major claims have nearby source IDs; every ID exists and supports its use. |
| Comparison | Units and limits are explicit; similarities and differences are both present. |
| Clinical safety | No ancient diagnosis; OCD caution is present where required. |
| Medical framing | Historical practice is not sorted into rational medicine versus irrational magic; modern efficacy claims are separately sourced. |
| Suffering | The article permits unresolved pain and failed expectations rather than forcing every case into restoration. |
| Nonhuman relations | Divine form, manifestation, living cult animal, votive mummy, and ordinary animal use remain distinct. |
| Biblical memory | Biblical representation, Egyptian evidence, later reception, and modern identification theories remain separate. |
| Living religion | Contemporary Kemetic communities are neither treated as unbroken survivals nor reduced to entertainment or occult stereotype. |
| Living communities | Modern Nile and Nubian residents are not proxies for antiquity; identity, privacy, consent, mediation, and internal diversity are explicit. |
| Itinerary boundary | R069 supports only the planned route and activities; promotional claims and practical details are not presented as durable facts. |
| Site interpretation | Temple, settlement, quarry, market, museum, and modern town are distinguished instead of blended into one timeless place. |
| Reception | Claims identify transmission path and intermediaries or admit uncertainty. |
| Representation | Elite, non-elite, Egyptian, neighboring, and later receiving perspectives are not collapsed. |
| Language | `/humanizer` completed; no factual drift introduced. |
| Links | Outbound, inbound, glossary, and graph targets meet policy. |
| Accessibility | Tables, headings, link text, badges, callouts, and media work for keyboard and screen-reader users. |
| Rights | Quotes and media comply with source and license limits. |
| Dignity | Human-remains media has a documented educational rationale, consultation record where available, and appropriate display treatment. |

### 12.4 Search and navigation scenarios

Test these exact user intents, not only title matches:

- "who was first Egypt or Sumer"
- "first civilization"
- "Predynastic state formation"
- "why so much ritual"
- "Egyptian religion OCD"
- "ritual and anxiety"
- "permanence versus impermanence"
- "Egypt and Buddhism"
- "did Buddha reject ritual"
- "dukkha and Egyptian suffering"
- "what happened when ritual failed"
- "did Egyptians believe rituals always worked"
- "Egyptian fate dreams and oracles"
- "Egyptian medicine magic healing"
- "childbirth protection ancient Egypt"
- "sacred animals animal mummies"
- "did Egyptians worship animals"
- "how were pyramids built"
- "slaves built the pyramids"
- "aliens built the pyramids"
- "ordinary people religion"
- "women work and literacy"
- "gender sexuality religion ancient Egypt"
- "music scent dance Egyptian religion"
- "Egypt Nubia Levant"
- "Egyptian war empire smiting enemies"
- "Coptic Egypt"
- "Islamic writers ancient Egypt"
- "Exodus historical evidence Egypt"
- "Moses and Akhenaten"
- "Egypt in the Bible"
- "Egypt influenced Western culture"
- "Egyptomania Art Deco"
- "museums colonialism provenance"
- "Egypt Africa Afrocentrism"
- "modern Kemetic religion"
- "should museums display mummies"
- "course sources only"
- "supplemental research only"
- "dahabiya Nile journey"
- "Esna Khnum temple and market"
- "El Kab Nekhbet tombs"
- "Edfu temple and Tell Edfu"
- "Gebel el-Silsila quarry Horemheb"
- "Kom Ombo Sobek crocodile museum"
- "Bisaw fishing and bread"
- "Daraw camel market"
- "Nubian displacement High Dam"
- "Esna to Aswan cruise stops"

For each query, verify that the intended page appears in the first useful results, the snippet explains why, origin is visible, and a reader can continue through a contextual link.

### 12.5 Accessibility checks

- Keyboard access to origin filters, source groups, glossary definitions, article contents, and graph controls.
- Screen-reader announcement of origin and evidence as separate labels.
- Headings remain hierarchical after new callouts and source sections.
- Comparison tables have headers and remain understandable in linear reading order.
- Color is never the only signal for origin, evidence, graph relation, or uncertainty.
- Long pages retain useful table-of-contents behavior on mobile and desktop.
- New external source links announce their destination clearly without noisy repeated text.
- Human-remains warnings are announced before revealing media, do not trap focus, and offer an accessible way to continue without viewing the image.
- J01 can be completed with keyboard alone; changing scenes moves neither keyboard focus nor scroll position unexpectedly.
- J01's day, stop number, stop type, article links, and progress are announced as text rather than conveyed by map position or color alone.
- The full itinerary transcript preserves route order and exclusions when CSS, JavaScript, animation, or the optional map is unavailable.

## 13. Risks and safeguards

| Risk | Likely failure | Safeguard |
|---|---|---|
| Scope sprawl | Each page becomes a miniature general history. | Keep the research question and target length fixed; link to adjacent pages. |
| "First civilization" ranking | A false single winner based on one date. | Use the criteria matrix and conditional conclusion in N03. |
| Egypt as timeless | Evidence from distant periods is blended. | Date every case and use chronological sections. |
| Elite-source bias | Normative temple and funerary texts stand for everyone. | Add N07, name evidence producers, and include unequal access in core pages. |
| Environmental determinism | Nile ecology is treated as a sufficient cause of state or religion. | Pair environment with institutions, conflict, labor, exchange, and ideology. |
| Clinical anachronism | Ritual is labeled OCD. | Apply the absolute rule and caution in sections 4.5 and N04. |
| Buddhism as anti-ritual | Early teachings and lived Theravada are flattened. | Use primary discourses plus ritual scholarship; distinguish claims about ritual from ritual practice. |
| Simplistic permanence contrast | Egypt equals permanence and Buddhism equals impermanence. | Use renewable continuity and disciplined practice as the more precise comparison. |
| Restoration bias | Every disruption is made to end in successful renewal. | Add N16 and ritual-failure cases; preserve unresolved outcomes and evidentiary silence. |
| Medicine-versus-magic binary | Remedies are praised as rational while spoken or material rites are dismissed. | Describe practitioners, operations, evidence, and outcomes before applying modern evaluation. |
| Retrospective diagnosis | Texts or human remains receive confident modern diagnoses. | Use qualified specialist assessment and distinguish possible diagnosis from historical identity. |
| Animal-worship caricature | All animal relations are collapsed into zoolatry. | Apply section 4.10 and N18's relation-by-relation distinctions. |
| Monument pseudohistory | Slaves, aliens, or lost technology replace archaeological explanation. | Separate evidence, reconstruction, open engineering questions, and unsupported assertion in N19. |
| Biblical history collapse | Exodus or Moses-Akhenaten identification is presented as established Egyptian history. | Apply the four-layer boundary in section 4.11 and N20. |
| Living-religion dismissal | Kemetic practice is treated as fantasy or as unchanged antiquity. | Use current lived-religion scholarship and distinguish reconstruction, adaptation, and continuity claims. |
| Legacy as ownership | "The West inherited Egypt" erases other receptions. | Use the reception taxonomy and include N12 and N15. |
| Influence by resemblance | Similar forms are asserted to have a historical link. | Require an intermediary for transmission; otherwise label adaptation, reinvention, or coincidence. |
| Colonial sources reproduce colonial framing | Museum or expedition narratives become neutral history. | Pair institutional records with critical histories and Egyptian scholarship. |
| Afrocentrism handled as a caricature | Diverse arguments and identities are collapsed. | Define terms, identify authors and claims, and distinguish reception, identity, history, and ancestry. |
| Source laundering | Search summaries or AI prose become citations. | Catalog and read the underlying source before drafting. |
| Copyright violations | Long quotations or unlicensed images enter the repository. | Paraphrase, check translator licenses, and enforce media manifest review. |
| Human-remains exposure | Legally usable images are published without dignity review. | Require explicit metadata, rationale, warning, and review independent of rights clearance. |
| Brochure as scholarship | Promotional copy supplies history, superlatives, or cultural claims. | Restrict R069 to sequence and planned activities; cite independent research for every interpretive claim. |
| Route drift | Optional tours or later operator changes are silently folded into the core journey. | Pin J01 to the 11–15 January 2027 document version and checksum; label optional extensions and itinerary variability. |
| Timeless-village tourism | El Hegz, Bisaw, Daraw, or a Nubian town is presented as living antiquity. | Apply section 4.13, N27, contemporary dates, community-centered sources, and explicit non-continuity cautions. |
| Privacy and consent | A host family, resident, story, image, or exact location is published without authorization. | Use no identifying details from R069; require informed publication consent and keep private stops off the atlas. |
| Nubia collapsed into Egypt | Ancient Kush, modern Nubian identities, and an Egyptian tourism stop become one category. | Use N28's chronology, Nubian-authored sources, displacement history, and distinction among region, polities, languages, and present communities. |
| Monument-only salvage story | UNESCO rescue eclipses people displaced by the High Dam. | Pair monument campaign sources with social history and Nubian perspectives; give communities equal or greater narrative weight. |
| Route map overclaims precision | Unverified villages or changing moorings appear as exact public points. | Map only verified public stops; make the text sequence canonical and the map optional. |
| Provenance confusion | Supplemental origin is displayed as weak evidence. | Keep origin and evidence separate in schema and UI. |
| Graph clutter | Generic influence edges overwhelm useful relationships. | Add only the approved reception and manifestation relations and inspect neighborhoods. |
| Humanizer factual drift | Qualifications, IDs, or dates change during prose editing. | Diff before and after humanizing; rerun citation and content checks. |
| Dirty-worktree collision | Existing user edits are overwritten or staged. | Record baseline status and stage coherent files only. |

## 14. Research bibliography and source ledger

These are candidate supplemental records, researched on 2026-08-30. They are a starting ledger, not permission to cite unread sources. The implementing agent must open the full source available to it, verify bibliographic details, and record any paywall or license restriction before publication. Source titles are preserved even when their punctuation differs from this plan's house style.

### 14.1 Egypt, state formation, society, and knowledge

| ID | Source | Intended use | Limits and access note |
|---|---|---|---|
| R001 | [UCLA Encyclopedia of Egyptology](https://uee.ucla.edu/) | Peer-reviewed reference base and route to specialist entries. | Use individual entries for claims; the home page itself is only platform metadata. |
| R002 | Béatrix Midant-Reynes, [Prehistoric Regional Cultures](https://escholarship.org/uc/item/4zz9t461) (UEE, 2014) | Maadi-Buto, Naqada, regional difference, and later material convergence. | A synthetic entry; check newer site-specific work for disputed sequences. |
| R003 | Thomas Schneider, [Chronology](https://uee.ucla.edu/chronology) (UEE) | Egyptian date bands and warnings about precision. | Predynastic and early dates remain approximate; do not turn ranges into exact years. |
| R004 | Emily Teeter, ed., [Before the Pyramids: The Origins of Egyptian Civilization](https://isac-idb.uchicago.edu/id/a260c913-552d-4b3b-a7cc-24913a01dddb) (Oriental Institute, 2011) | Predynastic material, state formation, objects, writing, and regional contexts. | Open-access exhibition volume; individual chapters have distinct authors and claims. |
| R005 | Nadine Moeller, [Urban Life and Form in Ancient Egypt](https://www.cambridge.org/core/elements/abs/urban-life-and-form-in-ancient-egypt/7DB332D7468856E715716DE1FF90B780) (Cambridge, 2026) | Settlements, urbanism, archaeological visibility, and the "Egypt had no cities" problem. | Use the full text, not the abstract; a broad synthesis still needs site examples. |
| R006 | Bruce G. Trigger, [Understanding Early Civilizations](https://www.cambridge.org/core/books/understanding-early-civilizations/4E22C3F88D6A41563441A9422767ADA7) (Cambridge, 2003) | Comparative method across early civilizations. | Older comparative synthesis; identify its categories and do not treat them as neutral universals. |
| R007 | Bruce G. Trigger, [States: City and Territorial](https://www.cambridge.org/core/books/abs/understanding-early-civilizations/states-city-and-territorial/E2BF4F7ED911467AF6FC469FD3507CCB) | City-state and territorial-state distinction for Egypt and Mesopotamia. | Chapter access may be limited; verify from the full chapter before detailed citation. |
| R008 | Juan Carlos Moreno García and Seth Richardson, [Monarchies and the Organization of Power: Ancient Egypt and Babylonia Compared](https://www.cambridge.org/core/elements/abs/monarchies-and-the-organization-of-power/8ECF691A957BB4B22F5B5D0CB50D1D90) (Cambridge, 2025) | Comparative power, administration, local agency, and monarchy. | Focuses mainly on 2100 to 1750 BCE, so it cannot answer origins by itself. |
| R009 | [Birth of the State](https://www.cambridge.org/core/books/worlds-of-the-indian-ocean/birth-of-the-state/B1C0C980A44DFF3EC38C4FFBBA0F7D12), in *Worlds of the Indian Ocean* (Cambridge, 2019) | Broad comparison of Egypt and Mesopotamia, trade, geography, and political organization. | Wide synthesis; check specialist archaeology before adopting causal claims. |
| R010 | Alice Stevenson, [Telling Times: Time and Ritual in the Realization of the Early Egyptian State](https://www.cambridge.org/core/journals/cambridge-archaeological-journal/article/abs/telling-times-time-and-ritual-in-the-realization-of-the-early-egyptian-state/9B8917F9DC4F01C9ACE01DAB04D16E51) (2015) | Ritual, temporality, absolute dating, and alternatives to linear state-formation narratives. | Article argument, not a general chronology; full text may require access. |
| R011 | Christopher Woods, ed., [Visible Language: Inventions of Writing in the Ancient Middle East and Beyond](https://oi.uchicago.edu/sites/default/files/uploads/shared/docs/oimp32.pdf) (Oriental Institute, 2010) | Earliest writing in Egypt and Mesopotamia; functions and media. | Chapter-level citation required; confirm the institutional mirror and reuse terms. |
| R012 | Stephen D. Houston, ed., [The First Writing: Script Invention as History and Process](https://assets.cambridge.org/052183/8614/frontmatter/0521838614_frontmatter.htm) (Cambridge, 2004) | Comparative writing origins and routes to the Egypt and Mesopotamia chapters. | Frontmatter is not evidence for chapter claims; obtain the relevant chapters. |
| R013 | Christopher Woods and Andréas Stauder, [Ancient Near Eastern Linguistic Traditions: Mesopotamia, Egypt](https://www.cambridge.org/core/books/abs/cambridge-history-of-linguistics/ancient-near-eastern-linguistic-traditions-mesopotamia-egypt/BE28BCF5AF3898EF5E746ABB4B436090) (Cambridge, 2023) | Scripts, scribal training, language awareness, and diglossia. | Full text may require access; broad linguistic history rather than social history alone. |
| R014 | Ben Haring, [Economy](https://escholarship.org/content/qt2t01s4qj/qt2t01s4qj.pdf) (UEE, 2009) | Labor, corvee, slavery, exchange, estates, and temple economy. | Older synthesis; refresh terminology and examples with recent social-economic research. |
| R015 | Nikolaos Lazaridis, [Education and Apprenticeship](https://escholarship.org/content/qt1026h44g/qt1026h44g.pdf) (UEE, 2010) | Scribal education, craft apprenticeship, and evidence limits. | Surviving evidence favors particular periods and institutions. |
| R016 | Maria Michela Luiselli, [Personal Piety (modern theories related to)](https://escholarship.org/content/qt49q0397q/qt49q0397q.pdf) (UEE, 2008) | History and limits of the term "personal piety." | Older historiographic entry; pair with newer lived-religion scholarship. |
| R017 | Annette Imhausen, [Calculation](https://escholarship.org/uc/nelc_uee) (UEE repository, 2026 listing) | Egyptian and Mesopotamian professional numeracy. | Locate and catalog the stable article item, not the repository landing page, before use. |
| R018 | Danielle Candelora, [Immigration and Borders in Ancient Egypt](https://www.cambridge.org/core/elements/abs/immigration-and-borders-in-ancient-egypt/8D0DB8C5598F957AC58258EB7CA8B489) (Cambridge, 2026) | Mobility, foreigner categories, boundary making, and critiques of isolation. | Use full text and pair with region-specific Nubian, Levantine, and Libyan work. |
| R019 | Victoria Altmann-Wendling, [Conceptualizations of the Moon](https://escholarship.org/content/qt3g7673v5/qt3g7673v5.pdf) (UEE, 2024) | Lunar cycles, predictability, change, and recurrence. | Lunar evidence is a case study, not proof of one Egyptian attitude toward uncertainty. |
| R020 | Barry J. Kemp, [How Religious Were the Ancient Egyptians?](https://www.cambridge.org/core/journals/cambridge-archaeological-journal/article/abs/how-religious-were-the-ancient-egyptians/81132C94CDC5B8D3D83D081070BD61D3) (1995) | The religion category, behavior, and limits of modern interpretation. | Influential but older and interpretive; pair with material and lived religion approaches. |
| R021 | Helen De Cruz, [The Concept of Religion](https://plato.stanford.edu/archives/spr2026/entries/concept-religion/) (Stanford Encyclopedia of Philosophy, Spring 2026) | Definitions of religion and critiques of the category. | Philosophy reference, not Egypt-specific evidence. |
| R022 | Roy A. Rappaport, [The Ritual Form](https://www.cambridge.org/core/books/abs/ritual-and-religion-in-the-making-of-humanity/ritual-form/8397B1D58ABC7860766EFDD91D542A5F), in *Ritual and Religion in the Making of Humanity* (1999) | Formal properties and social effects of ritual. | One theoretical framework; do not make it the definition all evidence must fit. |
| R023 | Matthew Engelke, [Material Religion](https://www.cambridge.org/core/books/abs/cambridge-companion-to-religious-studies/material-religion/3587B339AC6C0BD8CE0C25839C5BF793) (2011) | Materiality and the limits of belief-centered accounts. | General religious-studies framework; demonstrate its usefulness with Egyptian cases. |

### 14.2 Ritual, anxiety, and clinical caution

| ID | Source | Intended use | Limits and access note |
|---|---|---|---|
| R024 | [Effects of Predictable Behavioral Patterns on Anxiety Dynamics](https://pmc.ncbi.nlm.nih.gov/articles/PMC9649661/) (*Scientific Reports*, 2022) | A modern experimental comparison concerning patterned behavior and anxiety. | Modern laboratory research, not evidence about Egypt and not a license to diagnose ancient people. |
| R025 | National Institute of Mental Health, [Obsessive-Compulsive Disorder statistics and definition](https://www.nimh.nih.gov/health/statistics/obsessive-compulsive-disorder-ocd) | Authoritative modern clinical orientation and terminology. | Not a diagnostic tool and not historical evidence. |
| R026 | Robert Lemelson, [Obsessive-compulsive disorder in Bali: the cultural shaping of a neuropsychiatric disorder](https://pubmed.ncbi.nlm.nih.gov/14649851/) (*Transcultural Psychiatry*, 2003) | Caution that culture shapes symptom expression and interpretation. | Small modern clinical study in a different setting; use only for methodological caution. |
| R027 | Joanna Brück, [Ritual and Rationality: Some Problems of Interpretation in European Archaeology](https://www.cambridge.org/core/journals/european-journal-of-archaeology/article/abs/ritual-and-rationality-some-problems-of-interpretation-in-european-archaeology/6029514E5ED31C4A09EF9D39FA2B381F) | Critique of modern ritual/rationality binaries in archaeology. | European archaeological discussion; transfer the methodological question, not its cases. |

### 14.3 Early Buddhism and Theravada

| ID | Source | Intended use | Limits and access note |
|---|---|---|---|
| R028 | *Aniccasañña Sutta*, [SN 22.102](https://suttacentral.net/sn22.102/en/bodhi), translated by Bhikkhu Bodhi | Primary translated passage on cultivating perception of impermanence. | Check translator-specific license; cite passage and translation, and quote sparingly. |
| R029 | *Aniccā Sutta*, [SN 22.12](https://suttacentral.net/sn22.12/en/sujato), translated by Bhikkhu Sujato | Primary translated passage on the aggregates as impermanent. | A translated textual witness, not direct access to a single historical Buddha's words. |
| R030 | *Udayi Sutta*, [AN 4.40](https://suttacentral.net/an4.40/en/sujato), translated by Bhikkhu Sujato | Shows a distinction among kinds of sacrifice rather than a simple rejection of all rites. | Interpret within the collection and translation history. |
| R031 | *The Questions of Punnaka*, [Snp 5.4](https://suttacentral.net/snp5.4/en/sujato), translated by Bhikkhu Sujato | Critique of sacrifice as a means of escaping aging and rebirth. | A specific poetic discourse; do not generalize it into a complete ritual theory. |
| R032 | John Clifford Holt, [Theravada Traditions: Buddhist Ritual Cultures in Contemporary Southeast Asia and Sri Lanka](https://academic.oup.com/hawaii-scholarship-online/book/24204) (2017) | Diversity of monastic and lay ritual in lived Theravada settings. | Modern regional practice, not early Buddhist doctrine. |
| R033 | Rita Langer, [From Riches to Rags: How New Clothes for the Dead Become Old Robes for Monks](https://www.cambridge.org/core/journals/journal-of-the-royal-asiatic-society/article/abs/from-riches-to-rags-how-new-clothes-for-the-dead-become-old-robes-for-monks1/FBEDFADC7688086A6F91CD41F72A03F8) (2014) | Focused case of Theravada funerary ritual, continuity, and change. | One regional practice; full text may require access. |
| R034 | Susan E. Babbitt, [Early Buddhism as Philosophy of Existence](https://www.cambridge.org/core/books/abs/early-buddhism-as-philosophy-of-existence/introduction/7D406A3E4A512EF08CCC166BA4CE41AF) (2022) | Philosophical interpretation of impermanence, death, and freedom. | A modern philosophical reading; balance with Buddhist studies and primary texts. |

### 14.4 Reception, legacy, museums, and identity

| ID | Source | Intended use | Limits and access note |
|---|---|---|---|
| R035 | Florian Ebeling, [Reception of Ancient Egypt](https://academic.oup.com/edited-volume/34502/chapter-abstract/292741793), in *The Oxford Handbook of Egyptology* (2020) | Reception method, Hermetism, Platonism, and modern claims. | Abstract access may be limited; obtain the chapter before detailed use. |
| R036 | Sara Ickow, [Egyptian Revival](https://www.metmuseum.org/de/essays/egyptian-revival) (Met, 2012) | Egyptian Revival design, Tutankhamun, and Art Deco orientation. | Museum essay focused on design; pair with reception scholarship. |
| R037 | Akili Tommasino et al., [Flight into Egypt: Black Artists and Ancient Egypt, 1876-Now](https://www.metmuseum.org/de/met-publications/flight-into-egypt-black-artists-and-ancient-egypt-1876-now) (Met, 2024) | Black artists, African diasporic reception, and modern Egyptian artists. | Exhibition and publication with a defined curatorial argument, not a general social history. |
| R038 | Bibliothèque nationale de France, [La Description de l'Égypte](https://heritage.bnf.fr/bibliothequesorient/description-legypte-0) | Official digitized collection and publication history of the French expedition. | French-language institutional source; pair with critical colonial histories. |
| R039 | The Metropolitan Museum of Art, [The Year One: Art of the Ancient World East and West](https://resources.metmuseum.org/resources/metpublications/pdf/The_Year_One_Art_of_the_Ancient_World_East_and_West.pdf) (2000) | Roman Egypt, Isis, obelisks, and objects in cross-regional context. | Exhibition synthesis; use object entries and named authors precisely. |
| R040 | Antoine Faivre, [Renaissance Hermetism](https://www.cambridge.org/core/books/cambridge-handbook-of-western-mysticism-and-esotericism/renaissance-hermetism/1157C1288F0DE7091BDC8B7B4E7FEAF9) | Corpus Hermeticum, Hermes/Thoth, and Renaissance reception. | Later Western reception, not evidence for Pharaonic doctrine; access may be limited. |
| R041 | Michael Cooperson, [Reception of Pharaonic Egypt in Islamic Egypt](https://onlinelibrary.wiley.com/doi/abs/10.1002/9781444320053.ch48) (2010) | Al-Masudi, al-Mamun, Abd al-Latif, and Islamic-era engagement with monuments. | Chapter access may be limited; supplement with primary and newer Arabic reception studies. |
| R042 | British Museum, [Department of Egypt and Sudan](https://www.britishmuseum.org/our-work/departments/egypt-and-sudan) | Collection formation, institutional chronology, excavation, and acquisition leads. | Museum self-history; verify contested acquisitions with independent provenance research. |
| R043 | Marcos Lemos, [Decolonising ancient Egypt?](https://www.cambridge.org/core/journals/antiquity/article/decolonising-ancient-egypt/40A84045242915B11A45889CB74C7A10) (*Antiquity*, 2025/2026 issue) | Eurocentrism, coloniality, elite-text bias, and current disciplinary debate. | Review essay with an argumentative stance; follow its bibliography and include Egyptian scholarship. |
| R044 | National Museums Scotland, [Buying Power: The Business of British Archaeology and the Antiquities Market in Egypt and Sudan 1880-1939](https://www.nms.ac.uk/collections/departments/global-arts-cultures-design/projects/buying-power) | Current provenance research on money, markets, excavation, and museums. | Project overview; published case studies should support specific claims. |
| R045 | Manchester Museum, [Egypt and Sudan collection](https://www.museum.manchester.ac.uk/collections/egypt-and-sudan) | Collection history, colonial context, and object biographies. | Museum interpretation; use as a case and compare with external histories. |

### 14.5 Suffering, healing, material worlds, biblical memory, and living reception

| ID | Source | Intended use | Limits and access note |
|---|---|---|---|
| R046 | Roland Enmarch, [Theodicy](https://escholarship.org/uc/item/46m4v876) (UEE, 2024) | Divine and human responsibility, suffering, earthly injustice, political legitimacy, and postmortem redress. | A synthetic category with a long later history; cite the Egyptian texts and editions behind individual cases. |
| R047 | Emily A. Strand, [Exploring Pain in Ancient Egypt](https://knowledge.uchicago.edu/records/mkhvj-j6c11) | Pain, anguish, illness, the heart, and rupture in maat through textual analysis. | A focused modern argument; test its conceptual synthesis against the primary texts and other specialists. |
| R048 | Michael Chen, [Healing Statues in Late Period Egypt](https://escholarship.org/uc/item/1kx4j7bw) (2020) | Healing statues, charged liquids, placement of texts and images, elite commemoration, and material efficacy. | Dissertation focused on the Late Period and elite monuments; it cannot stand for all Egyptian healing. |
| R049 | Anna Stevens, [Domestic Religious Practices](https://escholarship.org/uc/item/7s07628w) (UEE, 2009) | Household protection, oral spells, children, reproductive concerns, amulets, and domestic evidence. | Older synthesis with uneven preservation by site and period; refresh individual cases. |
| R050 | Aidan Dodson, [Rituals Related to Animal Cults](https://escholarship.org/uc/item/6wk541n0) (UEE, 2009) | Living cult animals, ceremonial burial, votive animal mummies, and chronological distinctions. | Brief and older; pair with current zooarchaeological, breeding, and animal-mummy research. |
| R051 | Christopher Hays, [Egypt in the Old Testament](https://academic.oup.com/edited-volume/62249/chapter-abstract/551362256) (Oxford Research Encyclopedia of Religion, 2018) | Egypt in Israelite and Judean memory, biblical diversity, cultural interaction, and Exodus historicity limits. | Full text may require access; its proposed historical kernel is an interpretation, not external confirmation of Exodus. |
| R052 | Alastair Hamilton, [The Copts and the West, 1439-1822](https://academic.oup.com/book/47966) (Oxford, 2006) | European discovery and construction of Coptic antiquity, language, theology, and ancient wisdom. | Concerns European-Coptic encounters in a defined period, not a general history of Coptic Christianity. |
| R053 | J. Gwyn Griffiths, [The Legacy of Egypt in Judaism](https://www.cambridge.org/core/books/abs/cambridge-history-of-judaism/legacy-of-egypt-in-judaism/915DEF6E66F1C34552DCB096132EF0DB), in *The Cambridge History of Judaism* (1999) | Egyptian-Jewish contact, Elephantine, Hellenistic and Roman diaspora, religious concepts, and reception. | Older synthesis; update historical and influence claims with current biblical, archaeological, and Jewish-studies scholarship. |
| R054 | Marilyn C. Krogh and Brooke Ashley Pillifant, [Kemetic Orthodoxy: Ancient Egyptian Religion on the Internet](https://academic.oup.com/socrel/article-abstract/65/2/167/1623156) (2004) | Early case study of digital religion, ritual authority, conversion, and online Kemetic community. | One organization and an early internet period; do not generalize to all contemporary Kemetic religions. |
| R055 | Paul Harrison, [Profane Egyptologists: The Modern Revival of Ancient Egyptian Religion](https://www.routledge.com/Profane-Egyptologists-The-Modern-Revival-of-Ancient-Egyptian-Religion/Harrison/p/book/9780367891015) (2017/2018) | Kemetic reconstruction, practitioner relationships with Egyptology, authenticity, and modern religious identity. | A pioneering monograph with a defined sample and interpretive position; supplement with newer and practitioner-centered work. |
| R056 | Chau Chak Wing Museum and University of Sydney, [Human Remains Research Project](https://www.sydney.edu.au/museum/our-research/human-remains.html) | Egypt-specific research, consultation in Egypt, and development of display and care policy. | Current institutional project; distinguish research findings from policy still under development. |
| R057 | Chau Chak Wing Museum, [Guidelines for the Care of Ancient Egyptian Mummified Human Remains](https://www.sydney.edu.au/content/dam/corporate/documents/chau-chak-wing/our-research/guidelines-for-the-care-of-ancient-egyptian-mummified-human-remains_september-25.pdf) | Concrete dignity, care, display, interpretation, and consultation criteria. | Institutional guidance, not a universal consensus; compare Egyptian museum practice and other professional codes. |
| R058 | Angela McDonald, [Emotions](https://escholarship.org/uc/item/1t5224vj) (UEE, 2020) | Vocabulary, bodily expression, fear, grief, devotion, and methodological limits in studying ancient emotion. | Emotion categories and representations are culturally and genre specific; avoid reading images as transparent inner states. |
| R059 | Robyn Sophia Price, [Sensing the Fundamentals: An Examination of Scent as Integral to Ancient Egyptian Society](https://escholarship.org/uc/item/2534b3wm) (2022) | Scent, purification, healing, hierarchy, economy, identity, and sensory method in New Kingdom Egypt. | Dissertation and period-specific case; scent does not substitute for a full multisensory history. |
| R060 | Deborah Sweeney, [Sex and Gender](https://escholarship.org/uc/item/3rv0t4np) (UEE, 2011) | Gender construction, sexuality, same-sex evidence, queenship, and evidentiary cautions. | Older synthesis; update terminology and avoid making elite textual norms stand for lived experience. |
| R061 | John C. Darnell, [Hunting and Warfare: The Ritualisation of Military Violence in Ancient Egypt](https://www.cambridge.org/core/books/abs/cambridge-world-history-of-violence/hunting-and-warfarethe-ritualisation-of-military-violence-in-ancient-egypt/E0A6289393CD7C077B39B0412E9F1E96) (Cambridge, 2020) | Hunting-war parallels, smiting, execration, prisoners, warfare, and ritualized enemy images. | A synthetic chapter; distinguish representation, sanctioned ideology, and reconstructed battlefield practice. |
| R062 | Kerry Muhlestein, [Violence](https://escholarship.org/uc/item/9661n6rn) (UEE, 2015) | Social and royal violence, punishment, ritual action, and the asymmetry between expected royal and ordinary conduct. | Interpretive synthesis in a contested field; triangulate claims about ritual killing and legal practice. |
| R063 | Jochem Kahl, [Archaism](https://escholarship.org/uc/item/3tn7q1pf) (UEE, 2010) | Deliberate reuse of older forms, cultural memory, political selection, and innovation through archaism. | Older typology; apply only to dated cases with evidence for deliberate backward reference. |
| R064 | Anne Austin, [Contending with Illness in Ancient Egypt: A Textual and Osteological Study of Health Care at Deir el-Medina](https://escholarship.org/uc/item/4rw1m0cz) | Lived illness, health care, textual prescriptions, human remains, work absence, and the medicine-magic binary. | One unusually documented New Kingdom community; do not generalize its institutions to all periods or classes. |
| R065 | *Anicca Sutta*, [SN 22.45](https://suttacentral.net/sn22.45/en/bodhi), translated by Bhikkhu Bodhi | Primary translated passage explicitly relating impermanence, `dukkha`, non-self, non-clinging, and liberation. | Check translator license, quote sparingly, and avoid treating one discourse as the whole early Buddhist position. |
| R066 | James A. Harrell, [Building Stones](https://escholarship.org/uc/item/3fd124g0) (UEE, 2012) | Stone types, quarries, construction uses, and the material base of temples, pyramids, and tombs. | Material survey, not a labor or construction history by itself. |
| R067 | Richard Bussmann, [Pyramid Age: Huni to Radjedef](https://escholarship.org/uc/item/9wz0c837) (UEE, 2015) | Pyramid landscapes, settlements, resource exploitation, trade, administration, and contextual approaches. | Defined chronological scope; inscriptions and later annals require source criticism. |
| R068 | Elizabeth Bloxam, [Quarrying and Mining (Stone)](https://escholarship.org/uc/item/9bb918sd) (UEE, 2010) | Extraction technologies, quarry landscapes, skilled kin groups, labor organization, and gaps between text and archaeology. | Older overview in a developing field; update technologies and site evidence from recent fieldwork. |
| R069 | *Dahabiya Sailing on the Nile - 5 Days - 4 Nights - Luxor to Aswan*, private itinerary PDF supplied by the project owner, 12 pages, planned for 11–15 January 2027 | The exact sequence, included transport and activities, optional-tour boundary, and traveler-facing questions for J01. | Contemporary promotional primary source; private and non-downloadable; subject to change; cannot support historical, archaeological, safety, authenticity, or community-wide claims. SHA-256: `8dc4ebbe2a41c3ff78fd1986ffe0d2dcbd4677bb19e322432301b88513bbf9bd`. |
| R070 | University of Tübingen, [The Temple of Esna](https://uni-tuebingen.de/en/faculties/faculty-of-humanities/departments/ancient-studies-and-art-history/institute-for-ancient-near-eastern-studies/research/egyptology/research-projects/the-temple-of-esna/) | Graeco-Roman construction and decoration, the inscription project, conservation, and recovered color at Esna. | Current project overview rather than full publication of the temple texts; use project reports and editions for detailed theological claims. |
| R071 | Aga Khan Trust for Culture, [Revitalisation of Historic Esna](https://the.akdn/en/how-we-work/our-agencies/aga-khan-trust-culture/akaa/revitalisation-of-historic-esna) | Wakalat al-Geddawi, al-Qisariyya, adaptive reuse, craft and livelihood goals, and the town-scale conservation project. | Award and project presentation; supplement institutional claims with local evaluation and resident perspectives. |
| R072 | Egyptian Ministry of Tourism and Antiquities, [Elkab](https://egymonuments.gov.eg/en/archaeological-sites/elkab/) | Official site orientation, Nekhbet's cult center, walls, temples, New Kingdom tombs, and named tomb biographies. | Visitor overview; verify dates, wall phases, and biographies in excavation and epigraphic publications. |
| R073 | Institute for the Study of Ancient Cultures, University of Chicago, [Tell Edfu Project](https://isac.uchicago.edu/research/projects/tell-edfu/latest-news) | Settlement archaeology, town walls, temple personnel, and the long history beside Edfu's standing temple. | Project news is selective and season-based; cite final reports for mature claims and do not merge the tell's chronology with the Ptolemaic temple. |
| R074 | Egyptian Ministry of Tourism and Antiquities, [Gebel al-Silsila](https://egymonuments.gov.eg/en/archaeological-sites/gebel-el-silsila) | Official site orientation, sandstone quarries, tool marks, workers' inscriptions, the Speos of Horemheb, and rock chapels. | Visitor overview; detailed labor organization, chronology, and quarry-to-building claims require archaeological publication. |
| R075 | Gebel el-Silsila Archaeological Project, [project site](https://www.gebelelsilsilaarchaeologicalproject.com/) | Current survey, documentation, conservation, geology, quarry evidence, and local outreach. | Mission self-description; use reports and peer-reviewed publications for specific discoveries and interpretations. |
| R076 | Egyptian Ministry of Tourism and Antiquities, [Kom Ombo Temple](https://egymonuments.gov.eg/en/monuments/kom-ombo-temple) | Period, paired axes, Sobek and Harwer cults, divine families, calendars, reliefs, and visitor orientation. | Official interpretive page; the "surgical instruments" claim and theological synthesis need specialist corroboration. |
| R077 | Egyptian Ministry of Tourism and Antiquities, [Crocodile Museum](https://egymonuments.gov.eg/en/museums/crocodile-museum/) | Museum history, displayed crocodile remains, associated objects, and present institutional interpretation. | Visitor information is mutable and not a zooarchaeological study; access details must be date-stamped and animal-cult claims independently sourced. |
| R078 | UNESCO World Heritage Centre, [The Rescue of Nubian Monuments and Sites](https://whc.unesco.org/en/activities/173) | The international salvage campaign, relocated monuments, Philae, and the heritage consequences of the High Dam. | Institution-centered monument history; must be paired with social histories and Nubian accounts of displacement. |
| R079 | American University in Cairo, [Social Research Center Ethnographic Survey of Nubia Photograph Collection](https://digitalcollections.aucegypt.edu/digital/collection/p15795coll27) | Pre-inundation communities, the 1961 survey, displacement documentation, and a primary visual archive for Nubian social history. | Historical ethnographic archive created under unequal documentary conditions; review consent, description, and image rights before any reuse. |
| R080 | Menna Agha, [Nubian Architectural and Environmental Features Before and After Displacement: The Model of the Village Tumas wa Afya](https://escholarship.org/uc/item/4tw880z2) | Nubian groups affected by the High Dam, houses as social forms, displacement, adaptation, and cultural persistence. | One village-centered architectural case; do not generalize to every Nubian community or reduce identity to built form. |
| R081 | Egyptian Ministry of Tourism and Antiquities, [The Edfu Temple restoration project reveals colored inscriptions on the roof of the temple](https://egymonuments.gov.eg/en/news/the-edfu-temple-restoration-project-reveals-colored-inscriptions-on-the-roof-of-the-temple-for-the-first-time/) | Current conservation, surviving painted decoration, and the gap between today's stone appearance and the temple's ancient surfaces. | Ministry news release; use conservation reports for technical claims and avoid turning "revealed" into a claim of first discovery. |

### 14.6 Research still required before drafting

The seed ledger is deliberately stronger in methodology than in exhaustive case coverage. Before publication, add specialist sources for:

- recent radiocarbon and archaeological models for Naqada III and political unification;
- Uruk chronology, southern Mesopotamian urbanism, and early cuneiform;
- Egyptian households, childhood, gender, slavery, work crews, and non-elite burials;
- pain, theodicy, divine distance, lament, and specialist editions of the literary and devotional texts used in N16;
- medicine, disability, reproductive health, healing, bioarchaeology, mathematics, Demotic literacy, and scribal practice by period;
- ritual failure, fate, dream books, oracle procedure, omens, and the interpretation of ambiguous outcomes;
- animal cults, animal-mummy economies, breeding, killing, zooarchaeology, and nonhuman agency after the 2009 UEE overview;
- pyramid work settlements, Wadi el-Jarf papyri, quarry landscapes, transport, provisioning, construction experiments, maintenance, and reuse;
- Nile navigation and boat archaeology, the documented history of dahabiyas, colonial travel writing, Egyptian river tourism, Esna barrages and locks, and modern flow management;
- specialist editions of Esna temple inscriptions, urban archaeology of Esna, and independent assessment of the historic-city revitalization project;
- El Kab excavation history, settlement and wall phases, Nekhbet's temples, and current editions of the Ahmose, Paheri, and Ahmose Pennekhbet tomb texts;
- Tell Edfu final reports, the standing temple's construction and ritual program, Edfu festival texts, temple-town relations, and conservation;
- Gebel el-Silsila geology, quarry chronology, work organization, transport, the Speos of Horemheb, and current mission publications;
- Kom Ombo epigraphy and architecture, Harwer's local identity, the instruments-scene debate, crocodile zooarchaeology, mummification, and the Crocodile Museum's collection history;
- verified modern geography and naming for El Hegz, Bisaw, and Daraw; recent regional work on farming, fishing, food, markets, camel trade, animal welfare, and Nile environmental change;
- community-centered and, where possible, locally authored sources for hospitality, cultural tourism, consent, photography, guide mediation, visitor exchange, and the specific communities on the itinerary;
- Nubian-authored, Arabic-language, and Nobiin/Kenzi-informed scholarship on ancient and modern Nubian plurality, displacement, language, cultural life, land claims, tourism, and self-representation;
- social history of the Aswan dams that holds monument rescue and community displacement in the same account;
- sound, music, movement, color, touch, taste, festival emotion, grief, fear, intimacy, and joy beyond the scent case study;
- Nubian, Levantine, Libyan, and Red Sea perspectives;
- Ptolemaic and Roman Egyptian religion, Isis outside Egypt, and Serapis;
- Coptic continuity and change, temple reuse, and late antique material culture;
- biblical Egypt, Exodus cultural memory and historicity, Egyptian-Jewish communities, Alexandria, and current Coptic and monastic scholarship;
- Arabic-language and modern Egyptian scholarship on the ancient past;
- Egyptian contributors to excavation and the formation of Egyptology;
- partage, provenance, restitution, and specific museum object histories;
- Egyptian perspectives on the care, display, naming, imaging, and digital circulation of ancient human remains;
- African, African diasporic, Pan-African, Afrocentric, and modern Egyptian reception;
- film, games, music, tourism, fashion, and occult reception through medium-specific studies;
- contemporary Kemetic religions after the early internet case study, including practitioner-centered and ethnographic sources;
- the textual formation and dating of early Buddhist discourses and scholarship on ritual in early Buddhism.

For each subject, include at least one source by a specialist working in or from the region under discussion where the literature allows. Do not fill these gaps from search summaries.

## 15. Decision log and open questions

### 15.1 Decisions made by this plan

| Decision | Reason |
|---|---|
| Keep course and supplemental sources in separate catalogs. | Readers can audit origin without losing a unified source panel. |
| Use `origin`, not a generic tag alone. | A typed field can drive badges, filters, checks, search, and future migrations reliably. |
| Keep origin separate from evidence. | Source history and evidentiary strength answer different questions. |
| Use a mixed-page research callout sparingly. | It marks substantive additions without making the article unreadable. |
| Replace hard-coded page counts with discovery. | Future content additions should not require updating arbitrary totals. |
| Compare Egypt and Mesopotamia by criteria. | "First" has no defensible answer without specifying what counts. |
| Compare Egypt with early Buddhism narrowly. | It protects against caricaturing Egypt or all Buddhist traditions. |
| Prohibit ancient OCD diagnosis. | The surviving record cannot support clinical diagnosis, and ritual is not itself a disorder. |
| Add suffering and ritual failure as a counterweight to renewal. | The project should not imply that Egyptian systems always restored order or answered personal pain. |
| Keep Egyptian healing categories historically porous. | A medicine-versus-magic contest misdescribes the actors, operations, and evidence. |
| Treat animals through specific relationships. | Iconography, manifestation, a living cult animal, and a votive mummy are not interchangeable. |
| Separate biblical memory from Egyptian history. | Biblical narrative, Egyptian evidence, later reception, and modern identification theories have different evidentiary status. |
| Treat contemporary Kemetic religions as living reconstruction. | Modern practice is neither uninterrupted Pharaonic survival nor merely popular culture. |
| Add dignity review for human remains. | Copyright, ownership, and educational value do not by themselves settle respectful display. |
| Build a reception taxonomy. | It distinguishes direct transmission from adaptation, reinvention, and commerce. |
| Add five specific graph relations, not `influenced`. | The graph should preserve causal, evidentiary, manifestation, and journey-encounter distinctions. |
| Keep comparative geography out of the sacred atlas initially. | The existing place model is Egypt-specific and should not be stretched misleadingly. |
| Make images optional. | Scholarly scope and navigation matter more than adding weakly licensed decoration. |
| Treat R069 as a private itinerary source. | The document establishes this planned sequence but is neither public scholarship nor authority for the history of its stops. |
| Make the cruise route J01, not a faux ancient reconstruction. | The existing Journey component can organize a modern place-based learning sequence while retaining explicit evidence limits. |
| Keep optional Luxor and Aswan tours outside J01. | The supplied document explicitly excludes them from the five-day sailing package. |
| Create eight route articles rather than one oversized travel guide. | Readers need durable site and community context, while the journey should remain a navigational layer that links those articles in order. |
| Leave private and unidentified community stops off the atlas. | A travel itinerary does not authorize precise publication of household or community locations. |

### 15.2 Open questions that do not block phases 0 to 2

1. Should the main navigation receive a permanent "Afterlives" item, or should reception remain an encyclopedia hub until usage data supports a top-level section?
2. Should `web-research-supplement.md` become a changelog, redirect to the research catalog, or remain as a curated research narrative? Decide after its claims are mapped to `R` records.
3. Should evidence remain one dominant page-level value, or later become an array or block-level property? The scope expansion needs explicit origin now but does not require a full evidence redesign.
4. Should comparison tables eventually become a reusable visualization? Start with accessible Markdown and promote only after two pages share the same interaction need.
5. Should the graph receive a `tradition` node kind? Add it only if article and concept nodes cannot express Buddhism, Hermetism, Coptic reception, and modern movements clearly.
6. Which modern-popular-culture cases best match the intended audience? Choose a small documented set after source review rather than trying to cover every medium.
7. Would an ordered route map materially improve J01 after the text journey ships? Keep the transcript as the canonical first release and add a map only if verified public place records and accessibility testing justify it.

If Luna Max reaches one of these choices during implementation, it should take the conservative option stated above and record the decision in the plan or implementation status. None requires stopping for user input unless the choice would create a new top-level navigation section or materially change the public framing of identity and repatriation debates.

## 16. Final acceptance checklist

### Scope and scholarship

- [ ] Twenty-eight new articles exist or an editorially documented merge covers every listed research question.
- [ ] The current general-history gaps in section 3 are covered by a new or revised page.
- [ ] N03 answers the Egypt-Sumer question conditionally and compares explicit criteria.
- [ ] N04 contains the clinical caution and does not diagnose ancient people.
- [ ] N04 covers divination, ritual failure, and evidentiary limits on private doubt.
- [ ] N06 distinguishes early Buddhist sources from later Theravada practice and treats `anicca`, `dukkha`, and `anatta` together without collapsing their meanings.
- [ ] N07 covers gendered religious labor, sexuality, reproduction, childhood, illness, and disability through dated cases rather than timeless social categories.
- [ ] N09 distinguishes enemy ideology, imperial extraction, and evidence for actual violence.
- [ ] N13 applies a dignity framework to human remains separately from rights and provenance.
- [ ] N15 treats contemporary Kemetic religions as living and internally varied reconstructions.
- [ ] N16 includes unresolved suffering and distinguishes Egyptian divine-justice questions from later monotheistic formulations.
- [ ] N17 keeps medicine, magic, and religion historically porous while separating ancient practice from modern efficacy judgments.
- [ ] N18 distinguishes divine form, manifestation, living cult animal, votive mummy, and ordinary animal use.
- [ ] N19 explains monument building through archaeology, skilled labor, logistics, and uncertainty while directly addressing pseudohistory.
- [ ] N20 separates Egyptian evidence, biblical literature, later Jewish and Christian reception, and modern Moses-Akhenaten claims.
- [ ] N21 distinguishes the planned modern sailing, histories of Nile travel, colonial tourism, locks, dams, and the ancient river without claiming continuity.
- [ ] N22 connects Esna's late temple, Khnum theology, conservation, caravanserai, market, and living town without making one period stand for all others.
- [ ] N23 distinguishes El Kab's settlement, walls, cult center, necropolis, and elite tomb biographies by date and evidence.
- [ ] N24 distinguishes Tell Edfu's long settlement history from the standing Graeco-Roman temple and handles Horus/Set ritual locally.
- [ ] N25 connects Gebel el-Silsila's extraction evidence, workers, transport, shrines, and temple-building network without invented reconstruction.
- [ ] N26 distinguishes Sobek, Harwer, paired architecture, crocodile cult relationships, animal mummies, and modern museum interpretation.
- [ ] N27 uses R069 only for itinerary claims, has community-centered sourcing, protects host privacy, and rejects timeless-village framing.
- [ ] N28 distinguishes ancient Nubian regions and states from modern identities, centers displacement as well as monument rescue, and includes Nubian perspectives.
- [ ] The legacy cluster classifies claims as transmission, adaptation, rediscovery, reinvention, commodity, or counter-memory.
- [ ] The legacy cluster includes Greek, Roman, biblical, Jewish, Coptic, Islamic, modern Egyptian, European, African diasporic, and contemporary Kemetic receptions.
- [ ] Every contested synthesis is triangulated or visibly marked as uncertain.

### Provenance and sources

- [ ] Every publishable page has valid origin metadata.
- [ ] Every journey and learning path has valid origin metadata; J01 and its preparation path are `supplemental`.
- [ ] Course source IDs `C01` through `C36` are unchanged.
- [ ] New research uses stable `R` IDs and appears in `research-catalog.md`.
- [ ] Course and supplemental source links route to the correct catalog.
- [ ] Origin and evidence appear as separate accessible labels.
- [ ] Every substantial external factual claim has a source that was opened and checked.
- [ ] No search-result snippet or AI output is treated as a source.
- [ ] R069 has a recorded checksum and internal locator, but no public raw-file link; its use is limited to the planned route and activities.

### Writing and editorial safety

- [ ] Every new or substantially revised user-facing file has passed `/humanizer` in file mode.
- [ ] A post-humanizer diff confirms no changed facts, dates, qualifications, IDs, headings, or links.
- [ ] Period, place, social location, and evidence limits appear early in each new article.
- [ ] "The Egyptians" is not used where a narrower subject is warranted.
- [ ] No page reduces religion to belief, anxiety reduction, politics, or environmental response alone.
- [ ] Clinical, medical, animal, biblical, racial, civilizational, living-religion, human-remains, living-community, tourism, and legacy comparisons include the safeguards in section 4.
- [ ] Direct quotations are short and license-compatible.

### Links, definitions, and discovery

- [ ] Every substantive new page has at least three contextual outgoing and two contextual inbound links; planned articles normally exceed four each.
- [ ] There are no orphan pages, unresolved links, or broken anchors.
- [ ] New pages appear in hubs, Browse, Search, static routes, index, and at least one learning path.
- [ ] The eight new learning paths are complete.
- [ ] Glossary additions in section 9.2 exist and first-use annotation works.
- [ ] New graph relations have readable labels and do not create misleading influence claims.
- [ ] Exact search scenarios in section 12.4 return useful results.
- [ ] J01 is discoverable from Journeys and `egypt-trip-field-guide`, follows the required route, and exposes scene-specific contextual links.

### Application quality

- [ ] Page-count checks are data-driven.
- [ ] Provenance, research sources, callouts, search filters, and relations have unit tests.
- [ ] Application tests cover badge display, source routing, filtering, and path discovery.
- [ ] Journey tests cover backward compatibility, day and stop metadata, scene links, optional-tour exclusion, transcript parity, and private-place handling.
- [ ] Keyboard, screen-reader, mobile, and contrast checks pass.
- [ ] Any new media has cleared rights, attribution, caption, and alternative text.
- [ ] Any human-remains media has explicit metadata, educational rationale, dignity review, and an accessible content warning where required.
- [ ] No identifying host detail, unapproved resident media, private household location, or unnamed Nubian-town coordinate appears in public output.
- [ ] `npm run check` passes.
- [ ] `git diff --check` passes.
- [ ] Generated counts in README and status docs match the final build.
- [ ] `raw/` is unchanged.
- [ ] Unrelated pre-existing worktree changes remain untouched and unstaged.

## 17. Luna Max execution checklist

Use this as the compact handoff after reading the full plan:

1. Re-read all repository instruction files and record the dirty-worktree baseline.
2. Run baseline content, type, and unit checks.
3. Implement `origin`, explicit evidence fallback, dual catalogs, `R` IDs, research callouts, origin UI/filtering, and data-driven page checks.
4. Seed and verify `research-catalog.md`; never cite a search snippet.
5. Write phase 2 articles, including N19 on monuments, labor, and engineering, and revise their dependent existing pages.
6. Write phase 3 articles, including N16 through N18, apply the clinical, medical, animal, suffering, and Buddhist safeguards, and revise the religion core.
7. Write the reception hub, N20 on biblical memory, and the remaining phase 4 articles using the transmission taxonomy; treat Kemeticism as living religion and human remains through dignity review.
8. Register and checksum R069 without exposing it publicly; research and write N21 through N28, then build J01 from the exact included itinerary sequence and living-community safeguards.
9. Add glossary terms, contextual links, graph relations, hubs, aliases, index entries, and eight learning paths.
10. Run `/humanizer` on every user-facing addition or substantial rewrite, then audit the diff for factual drift.
11. Run the full testing and review matrix, resolve every error, and inspect visual changes manually.
12. Append concise phase records to `llm-wiki/log.md` for the material additions and lint pass.
13. Update generated counts only at the end.
14. Inspect status and diff, stage only this work, and leave `raw/` plus unrelated user edits untouched.

The implementation is complete only when section 16 passes. A large article count by itself is not completion; the material must be sourced, qualified, linked, findable, accessible, and visibly distinguished from the original course archive.
