import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private apiUrl = `${this.configService.apiUrl}doctor/treatments/patient`;
  private apiUrl1 = `${this.configService.apiUrl}secretary/patient`;


  constructor(private http: HttpClient, private configService: ConfigService) {}

  getPatients(page: number, size: number): Observable<any> {
    return this.http.get(`${this.apiUrl}?page=${page}&size=${size}`, {
      headers: new HttpHeaders({
        Authorization: `Bearer ${localStorage.getItem('access_token')}`
      })
    });
  }

  // Fetch all patients with pagination and filters
  getPatientss(
    page: number,
    size: number,
    search: string = '',
    doctorIds: number | number[] = []
  ): Observable<any> {
    const params: any = { page, size };

    if (search) {
      params.search = search;
    }

    // Handle both single number and array for doctorIds
    if (Array.isArray(doctorIds) && doctorIds.length > 0) {
      params.doctorIds = doctorIds.join(',');
    } else if (typeof doctorIds === 'number') {
      params.doctorIds = doctorIds.toString();
    }
    return this.http.get(`${this.apiUrl1}`, {
      params,
      headers: new HttpHeaders({
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      }),
    });

    // print the api url
  }

  // Delete a patient by email
  deletePatient(email: string): Observable<any> {
    return this.http.delete(`${this.apiUrl1}/${email}`, {
      headers: new HttpHeaders({
        Authorization: `Bearer ${localStorage.getItem('access_token')}`
      })
    });
  }

  // Get a patient by ID
  getPatientById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl1}/by-id/${id}`, {
      headers: new HttpHeaders({
        Authorization: `Bearer ${localStorage.getItem('access_token')}`
      })
    });
  }
}
