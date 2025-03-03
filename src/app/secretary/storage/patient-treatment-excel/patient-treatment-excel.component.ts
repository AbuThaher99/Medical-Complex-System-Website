import { Component } from '@angular/core';
import { StorageService } from '../../../services/storage.service';
import * as XLSX from 'xlsx';
import {CustomAlertService} from "../../../services/custom-alert.service";

@Component({
  selector: 'app-patient-treatment-excel',
  templateUrl: './patient-treatment-excel.component.html',
  styleUrls: ['./patient-treatment-excel.component.css'],
})
export class PatientTreatmentExcelComponent {
  isLoading = false;
  isDownloading = false;
  excelData: any[] = []; // Store Excel Data
  downloadedFileName: string = ''; // Store file name for download button
  downloadUrl: string = ''; // Firebase download URL

  constructor(private storageService: StorageService,private customAlertService: CustomAlertService) {}

  // Fetch and display Excel file
  loadExcelFile(): void {
    this.isLoading = true;

    // Step 1: Get the Excel file path from Firebase
    this.storageService.getPatientTreatmentExcel().subscribe(
      (filePath) => {
        this.downloadedFileName = this.extractFileName(filePath);
        this.downloadUrl = this.extractDownloadUrl(filePath);
        this.downloadAndDisplayExcel(this.downloadUrl);
      },
      (error) => {
        console.error('Error fetching file path:', error);
        this.customAlertService.show('Error', 'Failed to fetch the Excel file path.');

        this.isLoading = false;
      }
    );
  }

  // Step 2: Download and display the Excel data
  private downloadAndDisplayExcel(fileUrl: string): void {
    this.storageService.downloadExcelFile(fileUrl).subscribe(
      (response) => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });

          // Assuming the first sheet has the required data
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          // Convert Excel sheet data to JSON
          const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          // Convert numeric date serials to readable dates
          this.excelData = rawData.map((row) =>
            Array.isArray(row)
              ? row.map((cell) =>
                cell !== null && cell !== undefined && this.isExcelDate(cell)
                  ? this.excelDateToJSDate(cell)
                  : cell
              )
              : [] // If the row is null or undefined, return an empty array
          );

          this.isLoading = false;
        };

        reader.readAsArrayBuffer(response);
      },
      (error) => {
        console.error('Failed to download the Excel:', error);
        this.customAlertService.show('Error', 'Error downloading the Excel file.');

        this.isLoading = false;
      }
    );
  }

  // Step 3: Download the file directly
  downloadExcelFile(): void {
    if (!this.downloadUrl) {
      this.customAlertService.show('Error', 'No file available to download.');

      return;
    }

    this.isDownloading = true;

    this.storageService.downloadExcelFile(this.downloadUrl).subscribe(
      (response) => {
        const blob = new Blob([response], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        // Trigger browser download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = this.downloadedFileName;
        link.click();
        window.URL.revokeObjectURL(url);

        this.isDownloading = false;
      },
      (error) => {
        console.error('Error downloading the Excel:', error);
        this.customAlertService.show('Error', 'Failed to download the Excel file.');

        this.isDownloading = false;
      }
    );
  }

  // Utility function to extract filename from Firebase URL
  private extractFileName(fileUrl: string): string {
    // Decode the URL to handle encoded characters like %2F
    const decodedUrl = decodeURIComponent(fileUrl);

    // Use regex to match the filename after the last '/' and before '?'
    const match = decodedUrl.match(/[^\/]+(?=\?alt=media)/);

    // If a match is found, return the filename
    return match ? match[0] : '';
  }

  // Extract the direct download URL from Firebase Storage
  private extractDownloadUrl(firebasePath: string): string {
    return firebasePath.includes('https://')
      ? firebasePath
      : `https://firebasestorage.googleapis.com/v0/b/graduationproject-df4b7.appspot.com/o/medical%2FExcel%2F${encodeURIComponent(
        firebasePath
      )}?alt=media`;
  }

  // Utility function to check if a number is a valid Excel date
  private isExcelDate(value: any): boolean {
    return typeof value === 'number' && value > 40000 && value < 60000;
  }

  // Convert Excel serial date number to JS Date format (YYYY-MM-DD)
  private excelDateToJSDate(serial: number): string {
    const excelEpoch = new Date(1899, 11, 30); // Excel uses 1900 as the starting year
    const jsDate = new Date(
      excelEpoch.getTime() + serial * 24 * 60 * 60 * 1000
    );
    return jsDate.toISOString().split('T')[0]; // Format date as YYYY-MM-DD
  }
}
