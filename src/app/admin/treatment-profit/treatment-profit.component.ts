import { Component, OnInit } from '@angular/core';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-treatment-profit',
  templateUrl: './treatment-profit.component.html',
  styleUrls: ['./treatment-profit.component.css']
})
export class TreatmentProfitComponent implements OnInit {
  isLoading: boolean = false;
  downloadUrl: string | null = null;
  errorMessage: string = '';

  constructor(private storageService: StorageService) {}

  ngOnInit(): void {}

  generateTreatmentProfitReport(): void {
    this.isLoading = true;
    this.downloadUrl = null;
    this.errorMessage = '';

    this.storageService.generateTreatmentProfits().subscribe({
      next: (response: any) => {
        this.downloadUrl = this.extractFileUrl(response.message);
        console.log('PDF URL:', this.downloadUrl);
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to generate the report. Please try again later.';
        console.error('Error generating report:', error);
        this.isLoading = false;
      }
    });
  }

  downloadReport(): void {
    if (this.downloadUrl) {
      window.open(this.downloadUrl, '_blank');
    }
  }

  private extractFileUrl(responseMessage: string): string {
    const urlMatch = responseMessage.match(/https:\/\/firebasestorage\.googleapis\.com\/[^\s"]+/);
    return urlMatch ? urlMatch[0] : '';
  }
}
