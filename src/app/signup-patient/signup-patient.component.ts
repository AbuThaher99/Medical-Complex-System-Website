import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { ConfigService } from '../services/config.service';

@Component({
  selector: 'app-signup-patient',
  templateUrl: './signup-patient.component.html',
  styleUrls: ['./signup-patient.component.css'],
})
export class SignupPatientComponent {
  user: any = {
    password: '',
    firstName: '',
    lastName: '',
    address: '',
    phone: '',
    dateOfBirth: '',
    email: '',
    role: 'PATIENT',
  };

  patient: any = {
    age: 0,
    bloodType: { id: 0 },
  };

  constructor(
    private http: HttpClient,
    private router: Router,
    private configService: ConfigService
  ) {}

  onSubmit(): void {
    const requestBody = {
      age: this.patient.age,
      user: this.user,
      bloodType: this.patient.bloodType,
    };

    // Call the signup API for patients
    const url = `${this.configService.apiUrl}auth`; // Adjust the endpoint if needed

    this.http.post(url, requestBody).subscribe({
      next: (response) => {
        console.log('Patient signed up successfully:', response);
        alert('Registration successful! You can now log in.');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Signup failed:', error);
        alert('Registration failed. Please try again.');
      },
    });
  }
}
