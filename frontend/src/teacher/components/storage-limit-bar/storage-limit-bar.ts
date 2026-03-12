import { Component, computed, inject } from '@angular/core';
import { MaterialiService, STORAGE_LIMIT_B } from '../../../services/materiali/materiali-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-storage-limit-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './storage-limit-bar.html',
  styleUrl: './storage-limit-bar.scss',
})
export class StorageLimitBar {
  private readonly materialiService = inject(MaterialiService);

  totalSize = this.materialiService.totalByteSize;
  limit = STORAGE_LIMIT_B;

  percentage = computed(() => {
    const p = (this.totalSize() / this.limit) * 100;
    return Math.min(p, 100);
  });

  formattedTotalSize = computed(() => this.formatBytes(this.totalSize()));
  formattedLimit = computed(() => this.formatBytes(this.limit));

  isCritical = computed(() => this.percentage() > 90);

  private formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}
