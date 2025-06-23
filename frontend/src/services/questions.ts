export interface Question {
  id: number;
  domain: string;
  text: string;
  severity: 'mild' | 'moderate' | 'severe';
}

export const questions: Question[] = [
  {
    id: 1,
    domain: 'Social Communication',
    text: 'Do you find it difficult to maintain eye contact during conversations?',
    severity: 'mild',
  },
  {
    id: 2,
    domain: 'Social Interaction',
    text: 'Do you struggle to understand social cues, such as facial expressions or tone of voice?',
    severity: 'moderate',
  },
  {
    id: 3,
    domain: 'Repetitive Behaviors',
    text: 'Do you engage in repetitive movements or speech (e.g., hand-flapping, repeating phrases)?',
    severity: 'mild',
  },
  {
    id: 4,
    domain: 'Restricted Interests',
    text: 'Do you have intensely focused interests or hobbies that you spend a lot of time on?',
    severity: 'moderate',
  },
  {
    id: 5,
    domain: 'Sensory Sensitivity',
    text: 'Are you unusually sensitive to sounds, lights, textures, or other sensory input?',
    severity: 'severe',
  },
  {
    id: 6,
    domain: 'Routine and Change',
    text: 'Do you become very distressed when your daily routine is disrupted?',
    severity: 'moderate',
  },
  {
    id: 7,
    domain: 'Social Communication',
    text: 'Do you have difficulty understanding sarcasm or jokes that rely on tone of voice?',
    severity: 'moderate',
  },
  {
    id: 8,
    domain: 'Social Interaction',
    text: 'Do you prefer to play alone rather than with other people?',
    severity: 'mild',
  },
  {
    id: 9,
    domain: 'Communication',
    text: 'Do you have trouble starting or maintaining conversations?',
    severity: 'moderate',
  },
  {
    id: 10,
    domain: 'Sensory Processing',
    text: 'Do you notice small sounds that others don\'t seem to hear?',
    severity: 'mild',
  },
  {
    id: 11,
    domain: 'Social Skills',
    text: 'Do you find it hard to make friends your own age?',
    severity: 'moderate',
  },
  {
    id: 12,
    domain: 'Emotional Regulation',
    text: 'Do you have difficulty understanding or expressing your emotions?',
    severity: 'moderate',
  },
  {
    id: 13,
    domain: 'Attention and Focus',
    text: 'Do you have trouble focusing on tasks that don\'t interest you?',
    severity: 'mild',
  },
  {
    id: 14,
    domain: 'Motor Skills',
    text: 'Do you have difficulty with coordination or fine motor skills?',
    severity: 'mild',
  },
  {
    id: 15,
    domain: 'Language Development',
    text: 'Did you start speaking later than other children your age?',
    severity: 'moderate',
  },
  {
    id: 16,
    domain: 'Social Imagination',
    text: 'Do you have difficulty understanding other people\'s thoughts or feelings?',
    severity: 'moderate',
  },
  {
    id: 17,
    domain: 'Flexibility',
    text: 'Do you get upset when things don\'t go exactly as planned?',
    severity: 'moderate',
  },
  {
    id: 18,
    domain: 'Sensory Seeking',
    text: 'Do you seek out certain sensory experiences (like spinning, rocking, or touching specific textures)?',
    severity: 'mild',
  },
  {
    id: 19,
    domain: 'Communication',
    text: 'Do you take things literally and have trouble understanding figurative language?',
    severity: 'moderate',
  },
  {
    id: 20,
    domain: 'Social Interaction',
    text: 'Do you prefer to follow strict rules and routines in social situations?',
    severity: 'mild',
  },
]; 