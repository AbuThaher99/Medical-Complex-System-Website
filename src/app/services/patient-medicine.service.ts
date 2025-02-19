import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root',
})
export class PatientMedicineService {
  private apiUrl = `${this.configService.apiUrl}secretary/patientMedicine`;

  constructor(private http: HttpClient, private configService: ConfigService) {}

  addMedicineToTreatment(treatmentId: number, medicineId: number, quantity: number): Observable<any> {
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const requestBody = {
      quantity: quantity,
      treatment: { id: treatmentId },
      medicine: { id: medicineId }
    };

    return this.http.post(this.apiUrl, requestBody, { headers });
  }

  getAllPatientMedicines(page: number, size: number, search: string, patientIds: number[], treatmentIds: number[], medicineIds: number[]): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (search) params = params.set('search', search);
    if (patientIds?.length) patientIds.forEach(id => params = params.append('patientIds', id.toString()));
    if (treatmentIds?.length) treatmentIds.forEach(id => params = params.append('treatmentIds', id.toString()));
    if (medicineIds?.length) medicineIds.forEach(id => params = params.append('medicineIds', id.toString()));

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    });

    return this.http.get<any>(this.apiUrl, { headers, params });
  }

  updatePatientMedicine(id: number, body: any): Observable<any> {
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    return this.http.put(`${this.apiUrl}/${id}`, body, { headers });
  }

  deletePatientMedicine(id: number): Observable<any> {
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
    });

    return this.http.delete(`${this.apiUrl}/${id}`, { headers });
  }
}
