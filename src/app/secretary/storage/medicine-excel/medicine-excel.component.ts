import { Component } from '@angular/core';
import { StorageService } from '../../../services/storage.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-medicine-excel',
  templateUrl: './medicine-excel.component.html',
  styleUrls: ['./medicine-excel.component.css'],
})
export class MedicineExcelComponent {
  isLoading = false;
  isDownloading = false;
  excelData: any[] = [];
  downloadedFileName: string = '';

  constructor(private storageService: StorageService) {}

  // Fetch and display the Medicine Excel file
  loadMedicineExcel(): void {
    this.isLoading = true;

    this.storageService.getMedicineExcel().subscribe(
      (filePath) => {
        this.downloadedFileName = this.extractFileUrl(filePath);
        console.log('Extracted File Name:', this.downloadedFileName);
        this.downloadAndDisplayExcel(filePath);
      },
      (error) => {
        console.error('Error fetching file path:', error);
        alert('Failed to fetch the Medicine Excel file path.');
        this.isLoading = false;
      }
    );
  }

  // Download and display the Excel content
  private downloadAndDisplayExcel(filePath: string): void {
    this.storageService.downloadExcelFile(filePath).subscribe(
      (response) => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });

          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          // Convert Excel date serials to readable dates
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
        alert('Error downloading the Medicine Excel file.');
        this.isLoading = false;
      }
    );
  }

  // Download the Excel file directly
  downloadExcelFile(): void {
    if (!this.downloadedFileName) {
      alert('No file available to download.');
      return;
    }

    this.isDownloading = true;

    this.storageService.downloadExcelFile(this.downloadedFileName).subscribe(
      (response) => {
        const blob = new Blob([response], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = this.extractFileName(this.downloadedFileName);
        link.click();
        window.URL.revokeObjectURL(url);

        this.isDownloading = false;
      },
      (error) => {
        console.error('Failed to download the Medicine Excel:', error);
        alert('Failed to download the Medicine Excel file.');
        this.isDownloading = false;
      }
    );
  }


  private extractFileName(fileUrl: string): string {
    const decodedUrl = decodeURIComponent(fileUrl);
    const match = decodedUrl.match(/[^\/]+(?=\?alt=media)/);
    return match ? match[0] : '';
  }

  private isExcelDate(value: any): boolean {
    return typeof value === 'number' && value > 40000 && value < 60000;
  }

  private excelDateToJSDate(serial: number): string {
    const excelEpoch = new Date(1899, 11, 30);
    const jsDate = new Date(excelEpoch.getTime() + serial * 24 * 60 * 60 * 1000);
    return jsDate.toISOString().split('T')[0];
  }

  private extractFileUrl(responseUrl: string): string {
    return responseUrl.includes('https://')
      ? responseUrl
      : `https://firebasestorage.googleapis.com/v0/b/graduationproject-df4b7.appspot.com/o/medical%2FExcel%2F${encodeURIComponent(
        responseUrl
      )}?alt=media`;
  }
}
