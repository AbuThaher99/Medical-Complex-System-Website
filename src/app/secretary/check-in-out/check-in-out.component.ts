import { Component } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { ConfigService } from '../../services/config.service';
import {CustomAlertService} from "../../services/custom-alert.service";

@Component({
  selector: 'app-check-in-out',
  templateUrl: './check-in-out.component.html',
  styleUrls: ['./check-in-out.component.css']
})
export class CheckInOutComponent {
  email: string = '';
  isProcessing: boolean = false;
  message: string = '';

  constructor(private http: HttpClient, private configService: ConfigService,private customAlertService: CustomAlertService) {}

  // Perform Check-In
  checkIn(): void {
    if (!this.email) {
      this.customAlertService.show('Error', 'Please enter an email address.');

      return;
    }

    this.isProcessing = true;
    const url = `${this.configService.apiUrl}secretary/employee/CheckIn`;
    const accessToken = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      'accept': '*/*',
      'Authorization': `Bearer ${accessToken}`
    });
    const params = new HttpParams().set('Email', this.email);

    this.http.post(url, null, { headers, params }).subscribe({
      next: () => {
        this.message = `Check-In successful for ${this.email}`;
        this.isProcessing = false;
      },
      error: (error) => {
        console.error('Check-In failed:', error);
        this.message = 'Failed to Check-In. Please try again.';
        this.isProcessing = false;
      }
    });
  }

  // Perform Check-Out
  checkOut(): void {
    if (!this.email) {
      this.customAlertService.show('Error', 'Please enter an email address.');
      return;
    }

    this.isProcessing = true;
    const url = `${this.configService.apiUrl}secretary/employee/CheckOut`;
    const accessToken = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      'accept': '*/*',
      'Authorization': `Bearer ${accessToken}`
    });
    const params = new HttpParams().set('Email', this.email);

    this.http.post(url, null, { headers, params }).subscribe({
      next: () => {
        this.message = `Check-Out successful for ${this.email}`;
        this.isProcessing = false;
      },
      error: (error) => {
        console.error('Check-Out failed:', error);
        this.message = 'Failed to Check-Out. Please try again.';
        this.isProcessing = false;
      }
    });
  }
}
