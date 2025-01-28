import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import { ConfigService } from './config.service';
import {catchError} from "rxjs/operators";

@Injectable({
  providedIn: 'root',
})
export class MedicineService {
  private apiUrl = `${this.configService.apiUrl}admin/medicine/`;

  constructor(private http: HttpClient, private configService: ConfigService) {}
  private getAuthHeaders(): HttpHeaders {
    const accessToken = localStorage.getItem('access_token');
    return new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: '*/*',
    });
  }
  getAllSuppliers(page: number, size: number): Observable<any> {
    const url = `${this.apiUrl}AllSuppliers?page=${page}&size=${size}`;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    });
    return this.http.get(url, { headers });
  }

  addMedicine(medicineData: any): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
      Accept: '*/*',
    });

    console.log('Sending request with headers:', headers);
    console.log('Payload:', medicineData);

    return this.http.post(this.apiUrl, medicineData, { headers });
  }

  getMedicines(page: number, size: number, search: string, accessToken: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`
    });

    return this.http.get<any>(`${this.configService.apiUrl}admin/medicine`, {
      headers,
      params: {
        page: page.toString(),
        size: size.toString(),
        search: search
      }
    });
  }
  updateMedicine(id: number, medicineData: any): Observable<any> {
    const url = `${this.apiUrl}${id}`;

    // Ensure supplier.id is included in the update payload
    if (!medicineData.supplier || !medicineData.supplier.id) {
      console.error('Supplier ID is missing in the update payload!');
      return throwError(() => new Error('Supplier ID is required for updating a medicine.'));
    }

    console.log('Update Payload:', medicineData); // Debug log for the payload

    return this.http.put(url, medicineData, { headers: this.getAuthHeaders() }).pipe(
      catchError((error) => {
        console.error('Update medicine failed:', error);
        return throwError(() => error);
      })
    );
  }

  deleteMedicine(id: number): Observable<any> {
    const url = `${this.apiUrl}${id}`;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    });
    return this.http.delete(url, { headers });
  }

  getDeletedMedicines(page: number, size: number, search: string): Observable<any> {
    const url = `${this.apiUrl}deleted?page=${page}&size=${size}&search=${search}`;
    const headers = this.getAuthHeaders();
    return this.http.get(url, { headers });
  }

  restoreMedicine(id: number): Observable<any> {
    const url = `${this.apiUrl}restore/${id}`;
    const headers = this.getAuthHeaders();
    return this.http.put(url, {}, { headers });
  }
}
