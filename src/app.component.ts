
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { GeminiService } from './services/gemini.service.ts';
import { Character } from './models/character.model.ts';
import { OutputCardComponent } from './components/output-card.component.ts';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [OutputCardComponent],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly geminiService = inject(GeminiService);

  theme = signal('A cyberpunk detective haunted by a past case');
  isLoading = signal(false);
  character = signal<Character | null>(null);
  error = signal<string | null>(null);
  additionalInstructions = signal('');

  imagePreview = signal<string | null>(null);
  imageData = signal<{ data: string; mimeType: string } | null>(null);
  isAnalyzing = signal(false);

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }
    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
        this.error.set('Please select an image file.');
        return;
    }

    this.isAnalyzing.set(true);
    this.error.set(null);
    this.character.set(null);

    const reader = new FileReader();
    reader.onload = async (e: any) => {
      const base64String = e.target.result.split(',')[1];
      this.imagePreview.set(e.target.result);
      this.imageData.set({ data: base64String, mimeType: file.type });
      
      try {
        const suggestedTheme = await this.geminiService.analyzeImageForTheme(this.imageData()!);
        this.theme.set(suggestedTheme);
      } catch(err: any) {
        this.error.set(err.message || 'Failed to analyze image.');
        this.removeImage(); // clear image if analysis fails
      } finally {
        this.isAnalyzing.set(false);
      }
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  removeImage(event?: MouseEvent): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.imagePreview.set(null);
    this.imageData.set(null);
  }

  async generateCharacter() {
    if (!this.theme() || this.isLoading() || this.isAnalyzing()) {
      return;
    }

    this.isLoading.set(true);
    this.character.set(null);
    this.error.set(null);

    try {
      const result = await this.geminiService.generateCharacter(this.theme(), this.imageData(), this.additionalInstructions());
      this.character.set(result);
    } catch (e: any) {
      this.error.set(e.message || 'An unknown error occurred.');
    } finally {
      this.isLoading.set(false);
    }
  }

  getPersonaString(char: Character | null): string {
    if (!char) return '';
    return JSON.stringify(char.persona, null, 2);
  }

  getArrayString(arr: string[] | undefined): string {
    if (!arr) return '';
    return arr.join(', ');
  }

  updateTheme(event: Event): void {
    const input = event.target as HTMLTextAreaElement;
    this.theme.set(input.value);
  }

  updateAdditionalInstructions(event: Event): void {
    const input = event.target as HTMLTextAreaElement;
    this.additionalInstructions.set(input.value);
  }

  downloadCharacterData(): void {
    const char = this.character();
    if (!char) {
      return;
    }

    const characterName = (char.name.split(',')[0].trim() || 'Unnamed Character').replace(/[^a-z0-9]/gi, '_');
    const content = `
CHARACTER PROFILE: ${characterName}
==================================================

[ Title ]
${char.title}

--------------------------------------------------

[ Name Suggestions ]
${char.name}

--------------------------------------------------

[ Description ]
${char.description}

--------------------------------------------------

[ Persona ]
${this.getPersonaString(char)}

--------------------------------------------------

[ First Message ]
${char.first_message}

--------------------------------------------------

[ Scenario ]
${char.scenario}

--------------------------------------------------

[ Example Dialogue ]
${char.example_dialogue}

--------------------------------------------------

[ Image Prompt ]
${char.image_prompt}

--------------------------------------------------

[ Custom Tags ]
${this.getArrayString(char.custom_tags)}

--------------------------------------------------

[ Categories ]
${this.getArrayString(char.categories)}
    `.trim().replace(/\n/g, '\r\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Character - ${characterName}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
