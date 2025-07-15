import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {ConfigService} from "./config.service";

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${this.configService.apiUrl}admin/user`;

  constructor(private http: HttpClient,private configService: ConfigService) {}

  getUsers(page: number, size: number, search: string, role: string): Observable<any> {
    const token = localStorage.getItem('access_token');

    if (!token) {
      throw new Error('No access token found in local storage');
    }

    const headers = new HttpHeaders({
      'accept': '*/*',
      'Authorization': `Bearer ${token}`
    });

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('search', search)
      .set('role', role);

    return this.http.get(this.apiUrl, { headers, params });
  }

  viewUser(userId: number): Observable<any> {
    const token = localStorage.getItem('access_token');

    if (!token) {
      throw new Error('No access token found in local storage');
    }

    const headers = new HttpHeaders({
      'accept': '*/*',
      'Authorization': `Bearer ${token}`
    });

    const url = `${this.apiUrl}/${userId}`;
    return this.http.get(url, { headers });
  }

  viewDeletedUser(userId: number): Observable<any> {
    const token = localStorage.getItem('access_token');

    if (!token) {
      throw new Error('No access token found in local storage');
    }

    const headers = new HttpHeaders({
      'accept': '*/*',
      'Authorization': `Bearer ${token}`
    });

    const url = `${this.apiUrl}/deleted/${userId}`;
    return this.http.get(url, { headers });
  }

  deleteUser(userId: number): Observable<any> {
    const token = localStorage.getItem('access_token');

    if (!token) {
      throw new Error('No access token found in local storage');
    }

    const headers = new HttpHeaders({
      'accept': '*/*',
      'Authorization': `Bearer ${token}`
    });

    const url = `${this.apiUrl}/${userId}`;
    return this.http.delete(url, { headers });
  }
}
