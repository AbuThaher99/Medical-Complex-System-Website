import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { ConfigService } from '../../services/config.service';
import { CustomAlertService } from '../../services/custom-alert.service';
import { trigger, style, animate, transition } from '@angular/animations';
import { interval } from 'rxjs';

interface Activity {
  email: string;
  type: 'check-in' | 'check-out';
  time: Date;
}

@Component({
  selector: 'app-check-in-out',
  templateUrl: './check-in-out.component.html',
  styleUrls: ['./check-in-out.component.css'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
})
export class CheckInOutComponent implements OnInit {
  email: string = '';
  isProcessing: boolean = false;
  message: string = '';
  currentTime: Date = new Date();
  lastActionTime: Date = new Date();
  showEmailError: boolean = false;
  isCheckOutMode: boolean = false;
  checkedInStatus: boolean = false;
  recentAction: boolean = false;
  showRecentActivity: boolean = false;

  // Sample recent activities - in a real app, these would come from an API call
  recentActivities: Activity[] = [];

  constructor(
    private http: HttpClient,
    private configService: ConfigService,
    private customAlertService: CustomAlertService
  ) {}

  ngOnInit(): void {
    // Update current time every second
    interval(1000).subscribe(() => {
      this.currentTime = new Date();
    });

    // Simulate loading recent activities from an API
    // In a real implementation, you would call an API endpoint
    this.loadRecentActivities();
  }

  // Load recent check-in/check-out activities
  loadRecentActivities(): void {
    // For demo purposes, we'll create sample data
    // In a real application, you would fetch this from an API
    const now = new Date();

    this.recentActivities = [
      {
        email: 'john.doe@example.com',
        type: 'check-in',
        time: new Date(now.getTime() - 45 * 60000) // 45 minutes ago
      },
      {
        email: 'jane.smith@example.com',
        type: 'check-in',
        time: new Date(now.getTime() - 90 * 60000) // 90 minutes ago
      },
      {
        email: 'john.doe@example.com',
        type: 'check-out',
        time: new Date(now.getTime() - 20 * 60000) // 20 minutes ago
      }
    ];

    this.showRecentActivity = this.recentActivities.length > 0;
  }

  validateEmail(): boolean {
    if (!this.email) {
      this.showEmailError = true;
      this.customAlertService.show('Error', 'Please enter an email address.');
      return false;
    }

    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!emailPattern.test(this.email)) {
      this.showEmailError = true;
      this.customAlertService.show('Error', 'Please enter a valid email address.');
      return false;
    }

    return true;
  }

  // Perform Check-In
  checkIn(): void {
    if (!this.validateEmail()) {
      return;
    }

    this.isProcessing = true;
    this.isCheckOutMode = false;

    const url = `${this.configService.apiUrl}secretary/employee/CheckIn`;
    const accessToken = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      'accept': '*/*',
      'Authorization': `Bearer ${accessToken}`
    });
    const params = new HttpParams().set('Email', this.email);

    this.http.post(url, null, { headers, params }).subscribe({
      next: () => {
        this.lastActionTime = new Date();
        this.message = `Check-In successful for ${this.email}`;
        this.isProcessing = false;
        this.checkedInStatus = true;
        this.recentAction = true;

        // Add to recent activities
        this.addRecentActivity('check-in');
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
    if (!this.validateEmail()) {
      return;
    }

    this.isProcessing = true;
    this.isCheckOutMode = true;

    const url = `${this.configService.apiUrl}secretary/employee/CheckOut`;
    const accessToken = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      'accept': '*/*',
      'Authorization': `Bearer ${accessToken}`
    });
    const params = new HttpParams().set('Email', this.email);

    this.http.post(url, null, { headers, params }).subscribe({
      next: () => {
        this.lastActionTime = new Date();
        this.message = `Check-Out successful for ${this.email}`;
        this.isProcessing = false;
        this.checkedInStatus = false;
        this.recentAction = true;

        // Add to recent activities
        this.addRecentActivity('check-out');
      },
      error: (error) => {
        console.error('Check-Out failed:', error);
        this.message = 'Failed to Check-Out. Please try again.';
        this.isProcessing = false;
      }
    });
  }

  // Add a new activity to the recent activities list
  addRecentActivity(type: 'check-in' | 'check-out'): void {
    const newActivity: Activity = {
      email: this.email,
      type: type,
      time: new Date()
    };

    // Add to the beginning of the array
    this.recentActivities.unshift(newActivity);

    // Limit the list to 5 activities
    if (this.recentActivities.length > 5) {
      this.recentActivities = this.recentActivities.slice(0, 5);
    }

    this.showRecentActivity = true;
  }
}
