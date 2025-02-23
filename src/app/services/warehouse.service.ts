import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root',
})
export class WarehouseService {
  private apiUrl = `${this.configService.apiUrl}warehouse-store/`;

  constructor(private http: HttpClient, private configService: ConfigService) {}

  getAllMedicines(page: number, size: number): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    });

    // Add pagination and search parameters to the API request
    const params = {
      page: page.toString(),
      size: size.toString(),

    };

    return this.http.get(`${this.apiUrl}medicines-not-in-warehouse`, {
      headers,
      params
    });
  }


  addToWarehouse(payload: any): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    });

    return this.http.post(this.apiUrl, payload, { headers });
  }

  getAllWarehouseStores(page: number, size: number): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    });

    return this.http.get(`${this.configService.apiUrl}warehouse-store`, {
      headers,
      params: {
        page: page.toString(),
        size: size.toString(),
      },
    });
  }

  deleteWarehouseStore(storeId: number): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    });

    return this.http.delete(`${this.apiUrl}${storeId}`, { headers });
  }

  updateWarehouseStore(storeId: number, payload: any): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    });

    return this.http.put(`${this.apiUrl}${storeId}`, payload, { headers });
  }

  decreaseWarehouseStore(storeId: number, payload: any): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    });

    return this.http.put(`${this.apiUrl}decrease/${storeId}`, payload, { headers });
  }

  getDeletedWarehouseStores(page: number, size: number): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    });

    return this.http.get<any>(
      `${this.configService.apiUrl}warehouse-store/deleted?page=${page}&size=${size}`,
      { headers }
    );
  }

  restoreWarehouseStore(storeId: number): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    });

    return this.http.put<any>(
      `${this.configService.apiUrl}warehouse-store/restore/${storeId}`,
      {},
      { headers }
    );
  }

}
