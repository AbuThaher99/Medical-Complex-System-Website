import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private apiUrl = `${this.configService.apiUrl}storage`;

  constructor(private http: HttpClient, private configService: ConfigService) {}

  getPatientTreatmentExcel(): Observable<string> {
    const token = localStorage.getItem('access_token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: '*/*',
    });

    return this.http.get(`${this.apiUrl}/patientTreatmentExcel`, {
      headers,
      responseType: 'text',
    });
  }
  getPatientExcel(): Observable<string> {
    const token = localStorage.getItem('access_token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: '*/*',
    });

    return this.http.get(`${this.apiUrl}/patientExcel`, {
      headers,
      responseType: 'text', // Expecting plain text (file path)
    });
  }

  getMedicineExcel(): Observable<string> {
    const token = localStorage.getItem('access_token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: '*/*',
    });

    return this.http.get(`${this.apiUrl}/medicineExcel`, {
      headers,
      responseType: 'text',
    });
  }
  downloadExcelFile(filePath: string): Observable<Blob> {
    const token = localStorage.getItem('access_token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: '*/*',
    });
    console.log(filePath);
    const fileName = this.extractFileName(filePath);
    console.log('Extracted File Name:', this.extractFileName(filePath));

    return this.http.get(`${this.apiUrl}/fileSystem/${fileName}`, {
      headers,
      responseType: 'blob',
    });
  }

  private extractFileName(fileUrl: string): string {
    const decodedUrl = decodeURIComponent(fileUrl);

    const match = decodedUrl.match(/[^\/]+(?=\?alt=media)/);

    return match ? match[0] : '';
  }

  generateTreatmentProfits(): Observable<any> {
    const token = localStorage.getItem('access_token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: '*/*',
    });

    const apiUrl = `${this.configService.apiUrl}reports/generateTreatmentProfits?headerBgColor=%234F81BD&headerTextColor=%23FFFFFF&tableRowColor1=%23B8CCE4&tableRowColor2=%23DBE5F1`;

    return this.http.get(apiUrl, {
      headers,
    });
  }
  generateSalaryReport(): Observable<any> {
    const token = localStorage.getItem('access_token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: '*/*',
    });

    const apiUrl = `${this.configService.apiUrl}reports/generateSalary?roles=ADMIN&roles=DOCTOR&roles=SECRETARY&roles=WAREHOUSE_EMPLOYEE&headerBgColor=%234F81BD&headerTextColor=%23FFFFFF&tableRowColor1=%23B8CCE4&tableRowColor2=%23DBE5F1`;

    return this.http.get(apiUrl, {
      headers,
    });
  }


}
