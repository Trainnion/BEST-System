/**
 * BEST - Local Kaagapay knowledge base (WP-09, plan Sec. 7.5).
 *
 * ---------------------------------------------------------------------------
 * IMPORTANT: THIS IS SAMPLE COPY PENDING TEAM REVIEW. Every entry below is
 * authored placeholder content that the team (including a Bisaya-speaking
 * reviewer) must verify line by line before this system ever goes live, and
 * the plan's delivery note in Sec. 7.5 says the local engine is only as good
 * as this file. NOTHING HERE IS LEGAL ADVICE. Fees, hours and steps must be
 * checked against the barangay hall's actual office orders.
 * ---------------------------------------------------------------------------
 *
 * Three languages: English (en), Tagalog (tl), Cebuano/Bisaya (ceb).
 * Entries are short on purpose: answers are rendered in a chat bubble and on
 * entry-level phones. Every entry carries the `review` marker below.
 */

export const KB_REVIEW_MARKER = 'team-review-required';

/** Barangay hall sample details (fake/sample data only, Sec. 10 of AGENTS.md). */
export const OFFICE = {
  address: 'Barangay Hall, Purok 1 (sample address)',
  hours: 'Monday to Friday, 8:00 AM to 5:00 PM (sample hours)',
  lunch: '12:00 NN to 1:00 PM (sample)',
  phone_note:
    'Ask the front desk for the current official contact numbers (sample note).',
};

/**
 * Core service entries. Each answer is short; `checklist` items are the
 * requirements shown to the resident. Fees are sample values.
 */
export const KB_ENTRIES = [
  {
    topic: 'clearance',
    service: 'Barangay Clearance',
    route: '/services/request',
    keywords: [
      'clearance', 'barangay clearance', 'police clearance requirement',
      'sertipiko', 'sertificado', 'pagpapatunay', 'clearance para',
    ],
    answer: {
      en: 'A Barangay Clearance is issued the same day for complete applications. Bring your requirements to the front desk, pay the fee, and the clearance is printed while you wait.',
      tl: 'Ang Barangay Clearance ay inisyu sa parehong araw kung kumpleto ang requirements. Magdala ng mga kailangan sa front desk, magbayad ng fee, at prinnt agad ang clearance.',
      ceb: 'Ang Barangay Clearance ihatag sa samang adlaw kon kompleto ang mga kinahanglanon. Dad-a ang mga requirements sa front desk, mobayad sa fee, ug i-print dayon ang clearance.',
    },
    fees: {
      en: 'Fee: PHP 50.00 (sample fee; the Treasurer confirms the current amount).',
      tl: 'Bayad: PHP 50.00 (halimbawang halaga; kokumpirmahin ng Treasurer).',
      ceb: 'Bayad: PHP 50.00 (sample nga kantidad; kumpirmahi sa Treasurer).',
    },
    steps: {
      en: ['Present a valid ID at the front desk.', 'Fill out the request slip.', 'Pay the fee and keep the receipt.', 'Wait for printing (same day).'],
      tl: ['Magpakita ng valid ID sa front desk.', 'Sagutan ang request slip.', 'Magbayad at itago ang resibo.', 'Hintaying i-print (parehong araw).'],
      ceb: ['Pagpakita ug balido nga ID sa front desk.', 'Pun-a ang request slip.', 'Mobayad ug bantayi ang resibo.', 'Hulat nga i-print (samang adlaw).'],
    },
    checklist: {
      en: ['One valid government ID', 'Completed request slip', 'PHP 50.00 fee (sample)'],
      tl: ['Isang valid na government ID', 'Nakumpletong request slip', 'PHP 50.00 na bayad (sample)'],
      ceb: ['Usa ka balido nga government ID', 'Kompleto nga request slip', 'PHP 50.00 nga bayad (sample)'],
    },
    review: KB_REVIEW_MARKER,
  },
  {
    topic: 'indigency',
    service: 'Certificate of Indigency',
    route: '/services/request',
    keywords: [
      'indigency', 'indigent', 'poor certificate', 'hospital assistance',
      'walang pera', 'kakapusan', 'kakaposan', 'pamatuod nga kalisod',
      'certificate of indigency',
    ],
    answer: {
      en: 'A Certificate of Indigency certifies that a household is in financial need, usually for hospital or scholarship use. It is issued free of charge after a short interview with a staff member.',
      tl: 'Ang Certificate of Indigency ay patunay na nangangailangan ang sambahayan, kadalasang para sa hospital o scholarship. Libre ito matapos ang maikling pakikipanayam sa staff.',
      ceb: 'Ang Certificate of Indigency pamatuod nga nanginahanglan ang panimalay, kasagaran para sa hospital o scholarship. Libre kini human sa mubo nga pakigsulti sa staff.',
    },
    fees: {
      en: 'Fee: none (free of charge).',
      tl: 'Bayad: wala (libre).',
      ceb: 'Bayad: wala (libre).',
    },
    steps: {
      en: ['Bring a valid ID.', 'State the reason (hospital, school, etc.).', 'Brief interview at the front desk.', 'Sign the issuance log and receive the certificate.'],
      tl: ['Magdala ng valid ID.', 'Sabihin ang dahilan (hospital, paaralan, atbp.).', 'Maikling panayam sa front desk.', 'Pumirma sa issuance log at kunin ang certificate.'],
      ceb: ['Dad-a ang balido nga ID.', 'Istorya ang rason (hospital, eskwelahan, ug uban pa).', 'Mubo nga pakigsulti sa front desk.', 'Mupirma sa issuance log ug daw-a ang certificate.'],
    },
    checklist: {
      en: ['Valid ID', 'Reason for the request', 'No fee'],
      tl: ['Valid na ID', 'Dahilan ng kahilingan', 'Walang bayad'],
      ceb: ['Balido nga ID', 'Rason sa hangyo', 'Walay bayad'],
    },
    review: KB_REVIEW_MARKER,
  },
  {
    topic: 'business-clearance',
    service: 'Business Clearance',
    route: '/services/business-clearance',
    keywords: [
      'business', 'business clearance', 'negosyo', 'permit to operate',
      'negosyo clearance', 'business permit', 'store', 'sari-sari',
    ],
    answer: {
      en: 'A Business Clearance starts with a mandatory in-person screening by the Treasurer. Submit the appointment request online or at the hall; the Treasurer assesses the fee at the screening. Business clearances are never approved online.',
      tl: 'Ang Business Clearance ay nagsisimula sa mandatory na in-person screening ng Treasurer. Mag-request ng appointment online o sa hall; sa screening tinatantya ang fee. Walang online approval ng business clearance.',
      ceb: 'Ang Business Clearance nagsugod sa mandatory nga in-person screening sa Treasurer. Maghangyo ug appointment online o sa hall; sa screening gitantiya ang fee. Wala jud online nga approval.',
    },
    fees: {
      en: 'Fee: assessed by the Treasurer during screening (based on declared income).',
      tl: 'Bayad: tinatantya ng Treasurer sa screening (batay sa declared income).',
      ceb: 'Bayad: itantiya sa Treasurer sa screening (base sa declared income).',
    },
    steps: {
      en: ['Submit the appointment request.', 'Wait for the confirmed screening date.', 'Bring the requirements to the Treasurer.', 'Pay the assessed fee and receive the official receipt.'],
      tl: ['Isumite ang appointment request.', 'Hintayin ang kumpirmadong petsa ng screening.', 'Dalhin ang requirements kay Treasurer.', 'Magbayad at kunin ang official receipt.'],
      ceb: ['Isumite ang appointment request.', 'Hulata ang kumpirmadong petsa sa screening.', 'Dad-a ang mga requirements sa Treasurer.', 'Mobayad ug daw-a ang official receipt.'],
    },
    checklist: {
      en: ['Business name and address', 'Nature of business', 'Valid ID of the owner', 'In-person Treasurer screening'],
      tl: ['Pangalan at address ng negosyo', 'Uri ng negosyo', 'Valid ID ng may-ari', 'In-person na screening ng Treasurer'],
      ceb: ['Ngalan ug address sa negosyo', 'Lahi sa negosyo', 'Balido nga ID sa tag-iya', 'In-person nga screening sa Treasurer'],
    },
    review: KB_REVIEW_MARKER,
  },
  {
    topic: 'blotter',
    service: 'Anonymous Blotter Report',
    route: '/blotter',
    keywords: [
      'blotter', 'report', 'complaint', 'reklamo', 'sumbong', 'ireport',
      'pagsumbong', 'incident', 'insidente',
    ],
    answer: {
      en: 'You can file an anonymous blotter report online. BEST stores no name, IP address or cookie with the report, and the narrative is encrypted on the server so only authorized officers can read it. You receive a tracking code for status checks.',
      tl: 'Maaari kang mag-file ng anonymous na blotter report online. Walang nakastore na pangalan, IP address o cookie, at naka-encrypt sa server ang salaysay na only authorized officers ang makababasa. May makukuha kang tracking code.',
      ceb: 'Pwede ka mag-file ug anonymous nga blotter report online. Wala may nastore nga ngalan, IP address o cookie, ug na-encrypt sa server ang salaysay nga authorized officers ra ang kabasa. Maabot ka ug tracking code.',
    },
    fees: { en: 'Fee: none.', tl: 'Bayad: wala.', ceb: 'Bayad: wala.' },
    steps: {
      en: ['Open the blotter page and solve the short privacy challenge.', 'Choose the incident type and purok.', 'Write the report without names or contact numbers.', 'Save the tracking code for status updates.'],
      tl: ['Buksan ang blotter page at i-solve ang maikling privacy challenge.', 'Piliin ang uri ng insidente at purok.', 'Isulat ang ulat nang walang pangalan o contact number.', 'Itago ang tracking code para sa status update.'],
      ceb: ['Ablihi ang blotter page ug kuhaa ang mubo nga privacy challenge.', 'Pilia ang lahi sa insidente ug purok.', 'Sulat ang report nga walay ngalan o contact number.', 'Bantayi ang tracking code para sa status update.'],
    },
    checklist: {
      en: ['What happened (no names, no phone numbers)', 'Incident type', 'Purok / zone', 'Date of incident'],
      tl: ['Kung ano ang nangyari (walang pangalan, walang numero)', 'Uri ng insidente', 'Purok / zone', 'Petsa ng insidente'],
      ceb: ['Unsa ang nahitabo (walay ngalan, walay numero)', 'Lahi sa insidente', 'Purok / zone', 'Petsa sa insidente'],
    },
    review: KB_REVIEW_MARKER,
  },
  {
    topic: 'digital-id',
    service: 'Digital Barangay ID (view-only)',
    route: '/id-card',
    keywords: [
      'digital id', 'id card', 'barangay id', 'e-id', 'eid', 'identification',
      'resident id', 'ako id',
    ],
    answer: {
      en: 'Verified residents can view their own Digital Barangay ID in the app. The card is view-only: it is not a printed card and cannot be shared from the app. Your resident account must be activated first.',
      tl: 'Ang mga verified resident ay maaaring makita ang kanilang Digital Barangay ID sa app. View-only ito: hindi ito printed card at hindi maaaring i-share mula sa app. Dapat munang ma-activate ang resident account.',
      ceb: 'Ang mga verified resident makakita sa ilang kaugalingong Digital Barangay ID sa app. View-only kini: dili kini printed card ug dili madula gikan sa app. Kinahanglan una nga ma-activate ang resident account.',
    },
    fees: { en: 'Fee: none for viewing.', tl: 'Bayad: wala sa pag-view.', ceb: 'Bayad: wala sa pagtan-aw.' },
    steps: {
      en: ['Get an activation slip from the hall (staff issue it after verifying you).', 'Activate your account on this device.', 'Open the Digital ID page and view your card.'],
      tl: ['Kumuha ng activation slip sa hall (ini-issue ng staff pagkatapos i-verify ka).', 'I-activate ang account sa device na ito.', 'Buksan ang Digital ID page at tingnan ang card.'],
      ceb: ['Kuhaa ang activation slip sa hall (i-issue sa staff human sa pag-verify).', 'I-activate ang account niini nga device.', 'Ablihi ang Digital ID page ug tan-awa ang card.'],
    },
    checklist: {
      en: ['Verified resident account', 'Activation code from the hall', 'Own device only'],
      tl: ['Verified na resident account', 'Activation code mula sa hall', 'Sariling device lamang'],
      ceb: ['Verified nga resident account', 'Activation code gikan sa hall', 'Kaugalingong device lamang'],
    },
    review: KB_REVIEW_MARKER,
  },
  {
    topic: 'office-hours',
    service: 'Office Hours',
    route: '/',
    keywords: [
      'hours', 'open', 'closed', 'schedule', 'oras', 'bukas', 'sara',
      'horario', 'tawag', 'contact', 'location', 'saan', 'asa', 'where',
    ],
    answer: {
      en: `The barangay hall is open ${OFFICE.hours}, with a lunch break at ${OFFICE.lunch}.`,
      tl: `Bukas ang barangay hall tuwing ${OFFICE.hours}, may lunch break sa ${OFFICE.lunch}.`,
      ceb: `Bukas ang barangay hall matag ${OFFICE.hours}, naay lunch break sa ${OFFICE.lunch}.`,
    },
    fees: { en: '', tl: '', ceb: '' },
    steps: {
      en: ['Walk-ins are entertained at the front desk.', `${OFFICE.phone_note}`],
      tl: ['Tinatanggap ang walk-in sa front desk.', `${OFFICE.phone_note}`],
      ceb: ['Gitugot ang walk-in sa front desk.', `${OFFICE.phone_note}`],
    },
    checklist: { en: [], tl: [], ceb: [] },
    review: KB_REVIEW_MARKER,
  },
];

/** Find a KB entry by topic. @param {string} topic */
export function getEntry(topic) {
  return KB_ENTRIES.find((entry) => entry.topic === topic) || null;
}
