import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpResponse} from '@angular/common/http';
import {Observable, tap, throwError} from 'rxjs';
import { Router } from '@angular/router';
import {catchError} from "rxjs/operators";
import {ConfigService} from "./config.service";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private http: HttpClient, private router: Router,private configService: ConfigService) {}

  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem('refresh_token');
    console.log('Refreshing token:', refreshToken);

    if (!refreshToken || this.isTokenExpired(refreshToken)) {
      this.logout();
      return throwError(() => new Error('No refresh token available or token expired'));
    }

    return new Observable((observer) => {
      fetch(`${this.configService.apiUrl}auth/refresh-token`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${refreshToken}`,
          'Content-Type': 'application/json',
          Accept: '*/*',
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Failed to refresh token');
          }
          return response.json();
        })
        .then((data) => {
          console.log('Token refreshed successfully:', data);
          localStorage.setItem('access_token', data.access_token);
          localStorage.setItem('refresh_token', data.refresh_token);
          observer.next(data);
          observer.complete();
        })
        .catch((error) => {
          console.error('Refresh token failed:', error);
          this.logout();
          observer.error(error);
        });
    });
  }



  logout() {

  }

  private isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload) return true;

    const expiry = payload.exp;
    const now = Math.floor(Date.now() / 1000);
    console.log('Token expiry:', expiry, 'Current time:', now);
    return now >= expiry;
  }


  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch (e) {
      console.error('Error decoding token:', e);
      return null;
    }
  }

}
