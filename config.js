// ─────────────────────────────────────────────────────────────
//  EVERYTHING PERSONAL LIVES HERE. Edit, save, done.
//  Anything marked [PLACEHOLDER] is a guess: replace it with the real thing.
// ─────────────────────────────────────────────────────────────
const partnerName = 'Priya';   // [PLACEHOLDER] her name, as you'd say it out loud
const myName = 'Raga';         // [PLACEHOLDER] your name, used in the letter and the footer

export default {
  partnerName,
  myName,

  // The day you two became "a thing". Drives the "Since we started:" counter.
  // ISO format: YYYY-MM-DDTHH:mm:ss+05:30 (IST). 21 Sep 2026 = day 11 on 2 Oct 2026.
  anniversaryDate: '2026-09-21T00:00:00+05:30',

  /* ───────── 2 · HERO ───────── */
  heroTitle: `I Love You, ${partnerName}`,
  heroSubtitle: 'This one\u2019s for you.',

  /* ───────── 3 · HOW THIS STARTED ───────── */
  storyTitle: 'The honest version',
  // 3–4 lines. They reveal word by word while you scroll.
  storyLines: [
    'It\u2019s been exactly 11 days.',
    'Being around you makes me feel so safe. I\u2019ve never felt trust like this in my life.',
    'I\u2019m not trying to rush anything, but I didn\u2019t want to wait to tell you how I feel.'
  ],

  /* ───────── 4 · WHAT I REALLY LOVE ABOUT YOU (8 cards, shown in this order) ─────────
     icon = the file name (without .svg) of a pixel icon in assets/icons/. To remove one, delete its line. animal = bear | boar | deer | fox | rabbit | wolf | cat | dog | squirrel (the one who walks in next to it). */
  reasonsEyebrow: 'A few things',
  reasonsTitle: 'What I really love about you',
  reasons: [
    { icon: 'coffee', animal: 'bear',       title: 'Warmth',        text: 'Whenever I talk with you, my heart feels so warm.' },
    { icon: 'home', animal: 'rabbit',         title: 'Safe space',    text: 'I truly can be myself around you. I\u2019ve never been like this in front of anyone.' },
    { icon: 'flag', animal: 'wolf',         title: 'Courage',       text: 'You\u2019re so brave. You never back out from the decisions you take.' },
    { icon: 'leaf', animal: 'boar',         title: 'Down-to-earth', text: 'You don\u2019t care about materialistic things.' },
    { icon: 'check-double', animal: 'dog', title: 'Loyalty',       text: 'You show up, and you mean what you say.' },
    { icon: 'compass', animal: 'deer',      title: 'Maturity',      text: 'You talk and handle social interactions like an adult, and I love that.' },
    { icon: 'users', animal: 'squirrel',        title: 'Social',        text: 'You just know how to handle people.' },
    { icon: 'sparkles', animal: 'cat',     title: 'Beautiful',     text: 'Inside and out. And yes, I noticed.' }
  ],

  /* ───────── 5 · OUR FUTURE (a pixel heart builds itself while you scroll; tap it) ───────── */
  futureEyebrow: 'Looking ahead',
  futureTitle: 'Let\u2019s work hard for our future, and for ourselves',
  futureBody:
    'I want to build something real with you, and that takes work. ' +
    'So let\u2019s work hard for our future, and for ourselves too: our own goals, our own growth. ' +
    'We\u2019re not perfect, and that\u2019s okay. We just keep showing up, keep learning, and keep cheering each other on.',
  futureChips: ['Build our future', 'Grow as ourselves', 'Cheer each other on'],
  futureTap: 'Tap the heart',
  futureTapReplies: ['Aww.', 'Again?', 'Okay, I\u2019m blushing.', 'Keep going.', 'Careful, it\u2019s getting warm.', 'Almost there.', 'Last one.'],
  futureTapMax: 8,                                                // how many taps until the biggest effect (then it starts over)
  futureTapFinal: 'It\u2019s all yours.',

  /* ───────── 5b · MY SIDE OF IT (a deck of cards that deals itself out while you scroll) ─────────
     These are Raga's own promises, in his own words. Each card = { title, text }. Add or delete cards freely (the deck adapts). */
  notesEyebrow: 'My side of it',
  notesTitle: 'What I promise you',
  notesHint: 'Scroll, or tap the card',
  notesLabel: 'Promise',
  notes: [
    { title: 'I will help you', text: 'I\u2019ll help you. I\u2019ll build the foundations, and you can keep building from there, so we can both work together and reach our goals.' },
    { title: 'I\u2019ll be open',        text: 'I won\u2019t hide my emotions. I\u2019ll be open about anything on my mind.' },
    { title: 'I\u2019ll look after you', text: 'I\u2019ll take care of your health and remove any stress, whatsoever.' },
    { title: 'I won\u2019t judge',       text: 'I\u2019ll never judge you or make you feel insecure about yourself.' },
    { title: 'You\u2019ll be loved',     text: 'I\u2019ll make sure you\u2019re so loved that you won\u2019t go searching for love anywhere else.' },
    { title: 'I\u2019ll never be toxic', text: 'I\u2019ll never be toxic to you, never treat you like an object, and never make you feel worse.' }
  ],

  /* ───────── 5d · PHOTOS ─────────
     Drop your pictures into assets/photos/ (jpg, png, webp). They show up here on their own, in file-name order.
     No pictures in that folder = this whole section stays hidden. Optional captions, by file name: */
  photosEyebrow: 'Frames',
  photosTitle: 'Us, so far',
  photoCaptions: {
    // '01.jpg': 'A caption for this one',
  },

  /* ───────── 8 · THE NIGHT SKY (the page that opens after she clicks the button) ───────── */
  // [PLACEHOLDER] My words: change them to whatever you'd like to say under the stars.
  nightTitle: 'Let\u2019s grow together, Priya',
  nightShy: 'pls pamper me alot',
  nightShyClick: 'Mommy',                                         // what the same little box says after she taps it (tap again to go back)                                // the tiny, shy box in the bottom-left corner (a blushing emoji sits beside it)
  nightHint: 'Tap the sky to make a wish',
  nightBack: 'Back to the sunset',
  // [PLACEHOLDER] Little words that float up with the hearts when she clicks the button. Add, change or delete freely.
  risingWords: ['Na bangaram', 'Sundhari', 'My teddy bear', 'ILYSMMMM', 'ILY', 'Priyaaaa', 'Sathyabhama', 'Pithambhari'],

  /* ───────── 6 · THE LETTER (no text: when it opens, kisses and hearts are thrown at the screen) ───────── */
  letterEyebrow: 'One more thing',
  letterTitle: 'A letter for you',
  letterHint: 'Tap the seal to open it',
  letterHintAfter: 'Tap the envelope for more',

  /* ───────── 7 · FINALE ───────── */
  finaleLabel: 'Tonight',
  finaleTitle: 'Here\u2019s to what\u2019s next.',
  counterLabel: 'Since we started:',
  loveButton: 'Click if you love me too',
  finalMessage: 'I LOVE YOU MORE',

  // Optional song. Put an mp3 here. It only plays after the user clicks the music button.
  musicFile: 'assets/audio/song.mp3'
};
