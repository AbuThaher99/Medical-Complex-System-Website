import { Component } from '@angular/core';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-salary-report',
  templateUrl: './salary-report.component.html',
  styleUrls: ['./salary-report.component.css']
})
export class SalaryReportComponent {
  isLoading: boolean = false;
  downloadUrl: string | null = null;
  errorMessage: string = '';

  constructor(private storageService: StorageService) {}

  // Generate Salary Report
  generateSalaryReport(): void {
    this.isLoading = true;
    this.downloadUrl = null;
    this.errorMessage = '';

    this.storageService.generateSalaryReport().subscribe({
      next: (response: any) => {
        this.downloadUrl = this.extractFileUrl(response.message);
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to generate the salary report.';
        console.error('Error generating report:', error);
        this.isLoading = false;
      }
    });
  }

  // Extract the Firebase File URL
  private extractFileUrl(responseMessage: string): string {
    const urlMatch = responseMessage.match(/https:\/\/firebasestorage\.googleapis\.com\/[^\s"]+/);
    return urlMatch ? urlMatch[0] : '';
  }

  // Download the report
  downloadReport(): void {
    if (this.downloadUrl) {
      window.open(this.downloadUrl, '_blank');
    }
  }
}
