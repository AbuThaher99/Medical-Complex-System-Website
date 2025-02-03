import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class TreatmentService {
  private apiUrl = `${this.configService.apiUrl}doctor/treatments`;

  constructor(private http: HttpClient, private configService: ConfigService) {}

  addTreatment(treatmentData: any): Observable<any> {
    return this.http.post(this.apiUrl, treatmentData, {
      headers: new HttpHeaders({
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      })
    });
  }
}
