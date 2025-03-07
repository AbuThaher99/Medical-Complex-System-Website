import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { ConfigService } from '../services/config.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  credentials = { email: '', password: '' }; // Updated to match API
  errorMessage: string = '';
  isLoading: boolean = false; // Add loading state
  isSendingCode = false;
  verificationMessage = '';
  verificationErrorMessage = '';
  constructor(private http: HttpClient, private router: Router ,private configService: ConfigService) {}

  ngOnInit() {
    // Check if the user is already logged in and the token is valid
    const accessToken = localStorage.getItem('access_token');
    if (accessToken && !this.isTokenExpired(accessToken)) {
      this.router.navigate(['/home']); // Redirect to home if already logged in
    } else if (accessToken && this.isTokenExpired(accessToken)) {
      // If the access token is expired, try refreshing it
      this.refreshToken();
    }
  }

  onSubmit() {
    this.isLoading = true;
    this.errorMessage = '';

    const url = `${this.configService.apiUrl}auth/login`; // API endpoint
    const headers = new HttpHeaders({
      'accept': '*/*',
      'Content-Type': 'application/json'
    });

    this.http.post(url, this.credentials, { headers })
      .subscribe({
        next: (response: any) => {
          this.isLoading = false;
          if (response.access_token && response.refresh_token) {
            localStorage.setItem('access_token', response.access_token);
            localStorage.setItem('refresh_token', response.refresh_token);
          }
          this.router.navigate(['/home']);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Login failed:', error);
          setTimeout(() => {
            this.errorMessage = error.error?.message || 'Invalid email or password';
          });

        }
      });
  }


  // Refresh token logic
  private refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      this.errorMessage = 'Session expired. Please log in again.';
      return;
    }

    const url = `${this.configService.apiUrl}auth/refresh-token`; // Refresh token API endpoint
    const headers = new HttpHeaders({
      'accept': '*/*',
      'Authorization': `Bearer ${refreshToken}`
    });

    this.http.post(url, {}, { headers })
      .subscribe({
        next: (response: any) => {
          // Save new tokens to localStorage
          if (response.access_token && response.refresh_token) {
            localStorage.setItem('access_token', response.access_token);
            localStorage.setItem('refresh_token', response.refresh_token);
          }

          // Redirect to home page
          this.router.navigate(['/home']);
        },
        error: (error) => {
          console.error('Refresh token failed:', error);
          this.errorMessage = 'Session expired. Please log in again.';
          localStorage.removeItem('access_token'); // Clear invalid tokens
          localStorage.removeItem('refresh_token');
        }
      });
  }
  sendVerificationCode(): void {
    if (!this.credentials.email) {
      this.verificationErrorMessage = 'Please enter your email first.';
      return;
    }

    this.isSendingCode = true;
    this.verificationErrorMessage = '';
    this.verificationMessage = '';

    const headers = new HttpHeaders({
      accept: '*/*',
    });

    const apiUrl = `${this.configService.apiUrl}auth/send-verification-code?email=${encodeURIComponent(
      this.credentials.email
    )}`;

    this.http.post(apiUrl, '', { headers, responseType: 'text' }).subscribe({
      next: (response: string) => {
        if (response.includes('Verification code sent to email')) {
          this.verificationMessage = 'Verification code has been sent to your email!';
        } else {
          this.verificationMessage = 'Received unexpected response: ' + response;
        }
        this.isSendingCode = false;
      },
      error: (error) => {
        console.error('Error sending verification code:', error);
        this.verificationErrorMessage =
          'Failed to send the verification code. Please try again.';
        this.isSendingCode = false;
      },
    });
  }


  // Helper function to check if the token is expired
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1])); // Decode the token payload
      const expiry = payload.exp; // Get the expiration timestamp
      const currentTime = Math.floor(Date.now() / 1000); // Get the current time in seconds
      return currentTime >= expiry; // Check if the token is expired
    } catch (error) {
      console.error('Error decoding token:', error);
      return true; // Assume the token is expired if there's an error
    }
  }
}
