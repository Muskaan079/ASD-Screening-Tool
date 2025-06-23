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
]; 