
export interface Character {
  title: string;
  name: string;
  description: string;
  persona: Persona;
  first_message: string;
  scenario: string;
  example_dialogue: string;
  custom_tags: string[];
  categories: string[];
  image_prompt: string;
}

export interface Persona {
  background_story: string;
  appearance: Appearance;
  personality: string[];
}

export interface Appearance {
  hair: string;
  eye: string;
  body: string;
  clothes: string;
  accessories: string;
}
