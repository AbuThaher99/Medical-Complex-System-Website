import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root',
})
export class DonorService {
  private apiUrl = `${this.configService.apiUrl}blood/donor`;
  private apiUrl2 = `${this.configService.apiUrl}blood`;
  constructor(private http: HttpClient, private configService: ConfigService) {}

  addDonor(donor: any): Observable<any> {
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    return this.http.post(this.apiUrl, donor, { headers });
  }

  getDonors(page: number, size: number, search: string, bloodType: string, donorIds: number[] | null, gender: string): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (search) params = params.set('search', search);
    if (bloodType) params = params.set('bloodType', bloodType);
    if (gender) params = params.set('gender', gender);

    // Ensure donorIds is always an array
    if (donorIds && Array.isArray(donorIds) && donorIds.length) {
      donorIds.forEach(id => params = params.append('donorIds', id.toString()));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    });

    return this.http.get<any>(this.apiUrl, { headers, params });
  }

  getDeletedDonors(
    page: number,
    size: number,
    search: string,
    bloodType: string,
    donorIds: number[] | null,
    gender: string
  ): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (search) params = params.set('search', search);
    if (bloodType) params = params.set('bloodType', bloodType);
    if (gender) params = params.set('gender', gender);

    // Ensure donorIds is always an array
    if (donorIds && Array.isArray(donorIds) && donorIds.length) {
      donorIds.forEach((id) => {
        params = params.append('donorIds', id.toString());
      });
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    });

    return this.http.get(`${this.apiUrl2}/DeletedDonor`, { headers, params });
  }

  updateDonor(id: number, donor: any): Observable<any> {
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    return this.http.put(`${this.apiUrl}/${id}`, donor, { headers });
  }

  deleteDonor(id: number): Observable<any> {
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
    });

    return this.http.delete(`${this.apiUrl}/${id}`, { headers });
  }

  addDonation(donorId: number, donation: any): Observable<any> {
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    return this.http.post(`${this.configService.apiUrl}blood/donation/${donorId}`, donation, { headers });
  }
  restoreDonor(donorId: number): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    });

    return this.http.put(`${this.apiUrl2}/restoreDonor/${donorId}`, {}, { headers });
  }

  getDonations(
    page: number,
    size: number,
    search: string,
    bloodType: string,
    donorIds: number[] | null,
    quantity: number | null
  ): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (search) params = params.set('search', search);
    if (bloodType) params = params.set('bloodType', bloodType);
    if (quantity !== null) params = params.set('quantity', quantity.toString());

    if (donorIds && Array.isArray(donorIds) && donorIds.length) {
      donorIds.forEach(id => params = params.append('donorIds', id.toString()));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    });

    return this.http.get<any>(`${this.apiUrl2}/donations`, { headers, params });
  }
  takeBlood(data: any): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    });

    return this.http.post(`${this.apiUrl2}/takeBlood`, data, { headers });
  }
  getPatientBlood(page: number, size: number, search: string, bloodType: string, patientIds: number[] | null): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (search) params = params.set('search', search);
    if (bloodType) params = params.set('bloodType', bloodType);

    if (patientIds && Array.isArray(patientIds) && patientIds.length) {
      patientIds.forEach(id => params = params.append('patientIds', id.toString()));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    });

    return this.http.get<any>(`${this.apiUrl2}/patientsBlood`, { headers, params });
  }

  deletePatientBlood(recordId: number): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    });

    return this.http.delete(`${this.apiUrl2}/patientsBlood/${recordId}`, { headers });
  }


  getDeletedPatientBlood(
    page: number,
    size: number,
    search: string,
    bloodType: string,
    patientIds: number[]
  ): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (search) params = params.set('search', search);
    if (bloodType) params = params.set('bloodType', bloodType);
    if (patientIds.length) {
      patientIds.forEach(id => params = params.append('patientIds', id.toString()));
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    });

    return this.http.get(`${this.apiUrl2}/DeletedPatientsBlood`, { headers, params });
  }

  // Restore Deleted Patient Blood Record
  restorePatientBlood(id: number): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    });

    return this.http.put(`${this.apiUrl2}/restorePatientsBlood/${id}`, {}, { headers });
  }
}
