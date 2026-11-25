interface AnswerLink { label: string; path: string }
interface Answer { question: string; paragraphs: string[]; links?: AnswerLink[] }
interface Topic { id: string; title: string; answers: Answer[] }

export const faqIntro = 'Sydney’s notes on flights, hotels, cabins, payments, and what to pack for Egypt.';
export const faqTopics: Topic[] = [
  {
    id: 'flights', title: 'Flights and transfers', answers: [
      {
        question: 'When should I arrive and fly home?',
        paragraphs: [
          'Aim to arrive in Cairo by Saturday evening, January 9. Sunday morning is possible but makes for a long travel day. Plan your flight home for very late on Friday, January 15 or later. Most of the group is staying through at least Saturday, January 16.',
          'Add your flights and hotels to the shared tracker from the group chat once you book.',
        ],
      },
      {
        question: 'Which domestic flights is the group booking?',
        paragraphs: [
          'Cairo → Luxor: Sunday, January 10 at 8:00 p.m. Aswan → Cairo: Friday, January 15 at 12:05 p.m. All times are local.',
          'Sydney’s estimates were about US$140 and US$149, respectively, with one carry-on and one checked bag. Check the schedule, fare, and bag allowance with the airline before paying. Sydney suggests skipping paid seat selection for now.',
          'Some guests are taking the sleeper train to Luxor or arriving there earlier. Coordinate alternate plans in the group chat.',
        ],
      },
      {
        question: 'How will we get around?',
        paragraphs: [
          'The group plans to use Uber or a guide in Cairo. Coordinate large airport transfers with Sydney in the group chat.',
          'The current plan for Monday, January 11 is pickup with luggage at Iberotel Luxor, a morning temple visit, and transfer to Esna for boarding. The pickup time and Friday’s Aswan airport transfer are to be confirmed.',
        ],
      },
    ],
  },
  {
    id: 'hotels', title: 'Hotels and roommates', answers: [
      {
        question: 'Where should I stay in Cairo?',
        paragraphs: [
          'The group is coordinating individual hotel bookings around Zamalek for Saturday night, January 9, and for any nights after returning to Cairo on Friday, January 15. Hotel roommates can differ from cabin roommates.',
          'Sydney’s shortlist includes Cairo Marriott and Hilton Cairo Zamalek Residences, with Sofitel Cairo Downtown Nile as another option. Sydney is looking for a cheaper group option after the Marriott rate increased.',
        ],
      },
      {
        question: 'Where are we staying in Luxor?',
        paragraphs: [
          'The group hotel is Iberotel Luxor by JAZ for Sunday night, January 10. Sharing with your cabin mate is an option. If you book another property, let Sydney know so pickup can be coordinated.',
        ],
      },
      {
        question: 'How do cabin assignments work?',
        paragraphs: [
          'Couples have one double bed. Other shared cabins have two twin beds. Sydney’s color-coded roommate assignments are in the private group document.',
        ],
      },
    ],
  },
  {
    id: 'cruise', title: 'Cruise and payments', answers: [
      {
        question: 'What’s included on the boat?',
        paragraphs: [
          'The cruise quote includes four nights aboard, meals and included drinks, guided cruise stops, and entry fees for included visits. The operator describes cabins with private bathrooms and shared deck areas. Swimming and kayaking are optional.',
          'Alcohol is bring-your-own. Sydney’s plan is to shop before boarding and use the boat’s refrigeration and mixers. Alcohol is also available at many Cairo hotels and restaurants.',
        ],
        links: [
          { label: 'Safiya boat tour from Real Egypt', path: 'https://www.youtube.com/watch?v=Y7LRVNd48_I' },
          { label: 'Operator FAQ and onboard amenities', path: 'https://realegypt.com/faqs/' },
          { label: 'Cruise photos and traveler reviews', path: 'https://www.tripadvisor.com/Attraction_Review-g294205-d15582194-Reviews-Dahabiya_Nile_Sailing-Luxor_Nile_River_Valley.html' },
        ],
      },
      {
        question: 'Where can I see the cruise schedule?',
        paragraphs: ['The trip itinerary combines Sydney’s plans with the operator’s draft. Stops and timing may change.'],
        links: [
          { label: 'Group itinerary', path: '/itinerary/' },
          { label: 'Operator’s five-day cruise itinerary', path: 'https://dahabiyanilesailing.com/dahabiya-sailing-on-the-nile-5-days-4-nights-luxor-to-aswan/' },
        ],
      },
      {
        question: 'How much is the cruise deposit?',
        paragraphs: [
          'Sydney’s estimate is US$900 per person including payment and transfer fees. The first installment was US$400. The estimated remaining installment is US$500, which Sydney hoped to collect by the end of November.',
          'Sydney will track actual costs and apply any overpayment to another group expense or refund it. Confirm your balance and payment instructions with Sydney in the group chat.',
        ],
      },
    ],
  },
  {
    id: 'packing', title: 'Visas, packing, and cash', answers: [
      {
        question: 'Do I need a visa?',
        paragraphs: [
          'U.S. and British tourist passport holders need a visa for this itinerary. Egypt offers an online e-visa and eligible travelers can get a visa on arrival. If applying online, allow at least a week before travel. Check the current requirements, fees, and payment options for your passport before departure.',
        ],
        links: [
          { label: 'Official Egyptian e-visa portal', path: 'https://www.visa2egypt.gov.eg/eVisa/Home' },
          { label: 'U.S. passport guidance', path: 'https://travel.state.gov/en/international-travel/travel-advisories/egypt.html' },
          { label: 'British passport guidance', path: 'https://www.gov.uk/foreign-travel-advice/egypt/entry-requirements' },
        ],
      },
      {
        question: 'What is January weather like, and what should I pack?',
        paragraphs: [
          'Plan for mild days and cool evenings. As a packing guide, Cairo is around 66°F (19°C) by day and 48–50°F (9–10°C) at night. Luxor and Aswan tend to be warmer by day, around 73–77°F (23–25°C), with nights around 50–59°F (10–15°C).',
          'Pack layers, loose comfortable clothes, sneakers for tomb and temple visits, and a pair of sandals. Bring modest clothing for village stops and one nicer outfit if you’d like to dress up for dinner in Cairo.',
        ],
      },
      {
        question: 'Should I bring cash?',
        paragraphs: [
          'Bring a card and some Egyptian pounds in small denominations for tips and market purchases. Acceptance varies by merchant and card network. Sydney plans to bring about US$100 in mixed denominations as a backup.',
        ],
      },
    ],
  },
];
