import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import {ConfigService} from "./config.service";

@Injectable({
  providedIn: 'root',
})
export class DepartmentService {
  private apiUrl = `${this.configService.apiUrl}admin/departments`;

  constructor(private http: HttpClient,private configService: ConfigService) {}

  getDepartments(page: number, size: number, search: string = ''): Observable<any> {
    const token = localStorage.getItem('access_token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('search', search);

    return this.http.get(this.apiUrl, { headers, params });
  }

  deleteDepartment(id: number): Observable<any> {
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.delete(`${this.apiUrl}/${id}`, { headers });
  }

  updateDepartment(id: number, data: any): Observable<any> {
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    return this.http.put(`${this.apiUrl}/${id}`, data, { headers });
  }

  getDeletedDepartments(page: number, size: number, search: string = ''): Observable<any> {
    const token = localStorage.getItem('access_token');


    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('search', search);


    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get(`${this.apiUrl}/deleted`, { params, headers });
  }

  restoreDepartment(id: number): Observable<any> {
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.put(`${this.apiUrl}/restore/${id}`, {}, { headers });
  }
}
