export const tripTitle = 'Sydney’s 30th Birthday on the Nile';
export const tripDates = 'January 11–15, 2027';
export const tripDescription = 'Five days and four nights on a private dahabiya, from Luxor to Aswan.';
export const sailingCompanion = '/journeys/esna-to-aswan-dahabiya/';

interface TripDay {
  date: string;
  label: string;
  title: string;
  image: string;
  imageCaption: string;
  highlight: string;
  birthday?: boolean;
  stops: string[];
  note?: string;
  reading?: { path: string; label: string };
}

export const tripDays: TripDay[] = [
  {
    date: '2027-01-11',
    label: 'Monday, Jan 11',
    title: 'Luxor to Esna',
    image: 'luxor',
    imageCaption: 'Karnak’s Hypostyle Hall',
    highlight: 'Karnak & boarding day',
    stops: [
      'Visit Karnak Temple with the group in the morning.',
      'Get picked up in Luxor for the roughly one-hour drive to Esna.',
      'Visit the Temple of Esna, the Wekalet Al-Geddawi caravanserai, and Al-Qissariya market.',
      'Board the dahabiya for lunch and sailing. Dinner aboard.',
    ],
    note: 'The cruise operator lists a visit to El Hegz after embarkation. The timing is to be confirmed with the group’s Karnak visit.',
    reading: { path: '/wiki/esna-khnum-temple-and-layered-town/', label: 'Read about Esna' },
  },
  {
    date: '2027-01-12',
    label: 'Tuesday, Jan 12',
    title: 'El Kab and Edfu',
    image: 'edfu',
    imageCaption: 'Temple of Horus at Edfu',
    highlight: 'Ancient walls & the Temple of Horus',
    stops: [
      'Have breakfast aboard, then explore the walls of ancient Nekheb and the New Kingdom tombs at El Kab.',
      'Sail to Edfu to visit the Temple of Horus.',
      'Have dinner aboard.',
    ],
    reading: { path: '/wiki/edfu-temple-town-and-sacred-history/', label: 'Read about the Temple of Horus' },
  },
  {
    date: '2027-01-13',
    label: 'Wednesday, Jan 13',
    title: 'Bisaw and Gebel el-Silsila',
    image: 'silsila',
    imageCaption: 'The sandstone banks at Gebel el-Silsila',
    highlight: 'Nile fishing & a barbecue',
    stops: [
      'Visit Bisaw Island for Nile fishing and traditional sun-bread baking.',
      'Explore the sandstone quarry and shrines at Gebel el-Silsila.',
      'Have a barbecue dinner. The day’s catch may be part of the meal.',
    ],
    reading: { path: '/wiki/gebel-el-silsila-quarrying-sacred-landscape/', label: 'Read about the quarry and shrines' },
  },
  {
    date: '2027-01-14',
    label: 'Thursday, Jan 14',
    title: 'Kom Ombo and Daraw',
    image: 'komombo',
    imageCaption: 'Kom Ombo’s riverside temple',
    highlight: 'Temples, a market & farewell dinner',
    birthday: true,
    stops: [
      'Visit the double temple of Sobek and Haroeris at Kom Ombo and see mummified crocodiles at the Crocodile Museum.',
      'Shop for dinner ingredients at the Daraw market and learn about the camel trade.',
      'Swim or kayak if you’d like, then have farewell dinner aboard.',
    ],
    note: 'The operator also lists a visit to a Nubian community. Confirm with the group whether it’s on the schedule.',
    reading: { path: '/wiki/kom-ombo-sobek-harwer-and-crocodiles/', label: 'Read about Kom Ombo' },
  },
  {
    date: '2027-01-15',
    label: 'Friday, Jan 15',
    title: 'Aswan to Cairo',
    image: 'aswan',
    imageCaption: 'The Nile at Aswan',
    highlight: 'Breakfast aboard & the Cairo flight',
    stops: [
      'Have breakfast aboard and check out in Aswan.',
      'The group plans to take the noon flight to Cairo.',
    ],
    note: 'Checkout time and airport transfer arrangements are to be confirmed.',
  },
];

export const tripDetails = [
  {
    title: 'Transfers',
    items: [
      'Monday: Karnak in the morning, then pickup in Luxor for the drive to Esna. Pickup time and meeting point are to be confirmed.',
      'Friday: Breakfast and checkout in Aswan before the group’s planned noon flight to Cairo. The airport transfer is to be confirmed.',
    ],
  },
  {
    title: 'What’s included',
    items: [
      'Four nights in double cabins, meals and drinks aboard, guided cruise stops, and entry fees for included visits.',
      'Alcohol and optional tours are separate.',
    ],
  },
  {
    title: 'On board and ashore',
    items: [
      'The operator asks guests to dress conservatively for village visits.',
      'Swimming and kayaking are optional. Request a kayak at least two days before the cruise.',
      'The operator may adjust the itinerary if sailing conditions change.',
    ],
  },
];
