import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private apiUrl = `${this.configService.apiUrl}doctor/treatments`;

  constructor(private http: HttpClient, private configService: ConfigService) {}
  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
      Accept: '*/*'
    });
  }
  getTreatments(page: number, size: number, patientIds: number[], search: string): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    // Append multiple patient IDs
    if (patientIds && patientIds.length) {
      patientIds.forEach(id => {
        params = params.append('patientIds', id.toString());
      });
    }

    // Add search filter
    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<any>(this.apiUrl, { headers: this.getAuthHeaders(), params });
  }
  updateTreatment(id: number, treatmentData: any): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.put(url, treatmentData, { headers: this.getAuthHeaders() });
  }

  /** ✅ **Delete Treatment** */
  deleteTreatment(id: number): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete(url, { headers: this.getAuthHeaders() });
  }
  getDoctors(page: number, size: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/doctor?page=${page}&size=${size}`, {
      headers: new HttpHeaders({
        Authorization: `Bearer ${localStorage.getItem('access_token')}`
      })
    });
  }
}
