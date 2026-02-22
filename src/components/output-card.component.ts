
import { Component, ChangeDetectionStrategy, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-output-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-gray-800 rounded-lg shadow-lg overflow-hidden h-full flex flex-col">
      <div class="p-4 flex justify-between items-center bg-gray-700/50">
        <h3 class="text-lg font-semibold text-cyan-400">{{ title() }}</h3>
        <button
          (click)="copyToClipboard()"
          [disabled]="!content() || isLoading()"
          class="px-3 py-1.5 text-xs font-medium rounded-md flex items-center transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          [class]="copied() ? 'bg-green-600 text-white' : 'bg-gray-600 hover:bg-cyan-500 text-gray-200 hover:text-white'">
          <svg *ngIf="!copied()" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <svg *ngIf="copied()" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          {{ copied() ? 'Copied!' : 'Copy' }}
        </button>
      </div>
      <div class="p-4 flex-grow overflow-y-auto min-h-[8rem]">
        @if (isLoading()) {
          <div class="space-y-3">
            <div class="h-4 bg-gray-700/50 rounded-md w-3/4 relative overflow-hidden shimmer-bg"></div>
            <div class="h-4 bg-gray-700/50 rounded-md w-full relative overflow-hidden shimmer-bg"></div>
            <div class="h-4 bg-gray-700/50 rounded-md w-5/6 relative overflow-hidden shimmer-bg"></div>
          </div>
        } @else {
          <pre class="text-gray-300 whitespace-pre-wrap break-words font-sans text-sm">{{ content() || '-' }}</pre>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutputCardComponent {
  title = input.required<string>();
  content = input<string | undefined | null>();
  isLoading = input<boolean>(false);
  copied = signal(false);

  copyToClipboard(): void {
    const textToCopy = this.content();
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    }).catch(err => console.error('Failed to copy text: ', err));
  }
}
