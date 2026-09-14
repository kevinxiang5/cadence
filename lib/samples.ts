/** Demo transcripts so analysis can be tested without a microphone */

export type SampleAnswer = {
  id: string;
  label: string;
  description: string;
  transcript: string;
  durationSec: number;
};

export const SAMPLE_ANSWERS: SampleAnswer[] = [
  {
    id: 'messy',
    label: 'Messy first take',
    description: 'Lots of fillers and vague words — good for coaching.',
    durationSec: 55,
    transcript:
      "Um so basically I think like the main thing is that I'm a good communicator and um you know I work well with people. Like when I was on my last team we had this project that was basically a lot of work and uh I mean I kind of stepped up and like helped everyone stay on track. It was actually pretty good I guess. You know what I mean? Basically I just try to be a nice person and um make things better.",
  },
  {
    id: 'solid',
    label: 'Solid interview answer',
    description: 'Clear structure, few fillers — room to polish.',
    durationSec: 42,
    transcript:
      "In my last role I led a launch that was slipping behind schedule. The tension came from unclear ownership between design and engineering. I called a thirty-minute alignment meeting, mapped each decision to one owner, and set a daily fifteen-minute check-in for two weeks. We shipped on time, and more importantly the team kept that ownership model afterward. What I learned is that disagreement usually signals missing clarity, not hostility.",
  },
  {
    id: 'filler-heavy',
    label: 'Filler word workout',
    description: 'Packed with um, like, you know — enemy word practice.',
    durationSec: 40,
    transcript:
      "Uh so like I mean the thing is you know basically I want this job because um like I really care about the mission and uh you know I think I would be a good fit. Like I've done a lot of similar work and basically um I learn fast. You know I mean I'm kind of the person who like shows up and actually gets things done.",
  },
  {
    id: 'asr-raw',
    label: 'How the mic often hears you',
    description: 'No periods, swallowed ums written as “a” — what Apple ASR often returns.',
    durationSec: 38,
    transcript:
      "a I think we should umm go with the first option because uhh it is a good plan and a we can start next week but I I need a day to get the stuff ready",
  },
  {
    id: 'story',
    label: 'Storytelling sample',
    description: 'Narrative with some weak vocabulary.',
    durationSec: 48,
    transcript:
      "Last summer I was sitting in a coffee shop when my laptop died mid-pitch to a potential client. I had nothing prepared on paper. So I closed the lid, looked them in the eye, and told the story of why we built the product in the first place. They leaned in. We didn't close that day, but they introduced me to two other buyers. That moment taught me that presence beats polish when the stakes feel real.",
  },
];
