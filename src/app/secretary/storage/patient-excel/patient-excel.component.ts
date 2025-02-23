import { Component } from '@angular/core';
import { StorageService } from '../../../services/storage.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-patient-excel',
  templateUrl: './patient-excel.component.html',
  styleUrls: ['./patient-excel.component.css'],
})
export class PatientExcelComponent {
  isLoading = false;
  isDownloading = false;
  excelData: any[] = [];
  downloadedFileUrl: string = '';

  constructor(private storageService: StorageService) {}

  // Fetch and display the Patient Excel file
  loadPatientExcel(): void {
    this.isLoading = true;

    this.storageService.getPatientExcel().subscribe(
      (fileUrl) => {
        this.downloadedFileUrl = this.extractFileUrl(fileUrl);
        this.downloadAndDisplayExcel(this.downloadedFileUrl);
      },
      (error) => {
        console.error('Error fetching file URL:', error);
        alert('Failed to fetch the Patient Excel file URL.');
        this.isLoading = false;
      }
    );
  }

  // Download and display the Excel content
  private downloadAndDisplayExcel(fileUrl: string): void {
    this.storageService.downloadExcelFile(fileUrl).subscribe(
      (response) => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });

          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          // Convert numeric date serials to readable dates
          this.excelData = rawData.map((row) =>
            Array.isArray(row)
              ? row.map((cell) =>
                cell !== null && cell !== undefined && this.isExcelDate(cell)
                  ? this.excelDateToJSDate(cell)
                  : cell
              )
              : []
          );

          this.isLoading = false;
        };

        reader.readAsArrayBuffer(response);
      },
      (error) => {
        console.error('Failed to download Excel:', error);
        alert('Error downloading the Patient Excel file.');
        this.isLoading = false;
      }
    );
  }

  // Download the Excel file directly
  downloadExcelFile(): void {
    if (!this.downloadedFileUrl) {
      alert('No file available to download.');
      return;
    }

    this.isDownloading = true;

    this.storageService.downloadExcelFile(this.downloadedFileUrl).subscribe(
      (response) => {
        const blob = new Blob([response], {
          type: 'application/vnd.ms-excel',
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = this.extractFileName(this.downloadedFileUrl);
        link.click();
        window.URL.revokeObjectURL(url);

        this.isDownloading = false;
      },
      (error) => {
        console.error('Failed to download the Patient Excel:', error);
        alert('Failed to download the Patient Excel file.');
        this.isDownloading = false;
      }
    );
  }

// Utility to extract only the filename from the full Firebase URL
// Extract only the filename from a full Firebase URL
  private extractFileName(fileUrl: string): string {
    // Decode the URL to handle encoded characters like %2F
    const decodedUrl = decodeURIComponent(fileUrl);

    // Use regex to match the filename after the last '/' and before '?'
    const match = decodedUrl.match(/[^\/]+(?=\?alt=media)/);

    // If a match is found, return the filename
    return match ? match[0] : '';
  }



  // Utility to extract the direct download URL
  private extractFileUrl(responseUrl: string): string {
    return responseUrl.includes('https://')
      ? responseUrl
      : `https://firebasestorage.googleapis.com/v0/b/graduationproject-df4b7.appspot.com/o/medical%2FExcel%2F${encodeURIComponent(
        responseUrl
      )}?alt=media`;
  }

  // Check if a number represents an Excel date
  private isExcelDate(value: any): boolean {
    return typeof value === 'number' && value > 40000 && value < 60000;
  }

  // Convert Excel date serial number to readable date
  private excelDateToJSDate(serial: number): string {
    const excelEpoch = new Date(1899, 11, 30);
    const jsDate = new Date(excelEpoch.getTime() + serial * 24 * 60 * 60 * 1000);
    return jsDate.toISOString().split('T')[0];
  }
}
