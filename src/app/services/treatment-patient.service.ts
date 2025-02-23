import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class TreatmentPatientService {
  private apiUrl = `${this.configService.apiUrl}`;

  constructor(private http: HttpClient, private configService: ConfigService) {}

  getTreatments(page: number, size: number): Observable<any> {
    const accessToken = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`,
      'accept': '*/*'
    });
    return this.http.get(`${this.apiUrl}patients/treatment?page=${page}&size=${size}`, { headers });
  }

  submitFeedback(feedback: any): Observable<any> {
    const accessToken = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    });
    return this.http.post(`${this.apiUrl}patients/feedback/`, feedback, { headers });
  }
}
