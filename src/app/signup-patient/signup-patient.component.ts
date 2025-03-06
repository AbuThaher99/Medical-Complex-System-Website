import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ConfigService } from '../services/config.service';
import { CustomAlertService } from "../services/custom-alert.service";

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

  showPassword = false;
  passwordStrengthClass = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private configService: ConfigService,
    private customAlertService: CustomAlertService
  ) {}

  calculateAge() {
    if (this.user.dateOfBirth) {
      const dob = new Date(this.user.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }

      if (age >= 0 && age <= 120) {
        this.patient.age = age;
      }
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  checkPasswordStrength() {
    const password = this.user.password;

    if (!password) {
      this.passwordStrengthClass = '';
      return;
    }

    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[^a-zA-Z0-9]/.test(password);
    const isLongEnough = password.length >= 8;

    const score = [hasLetters, hasNumbers, hasSpecialChars, isLongEnough].filter(Boolean).length;

    if (score <= 2) {
      this.passwordStrengthClass = 'strength-weak';
    } else if (score === 3) {
      this.passwordStrengthClass = 'strength-medium';
    } else {
      this.passwordStrengthClass = 'strength-strong';
    }
  }

  onSubmit(): void {
    const requestBody = {
      age: this.patient.age,
      user: this.user,
      bloodType: this.patient.bloodType,
    };

    const url = `${this.configService.apiUrl}auth`; // Adjust the endpoint if needed

    this.http.post(url, requestBody).subscribe({
      next: (response) => {
        console.log('Patient signed up successfully:', response);
        this.customAlertService.show('Success', 'Registration successful! You can now log in.');
        setTimeout(() => {
          this.router.navigate(['/login']);
        } , 2000);
      },
      error: (error) => {
        console.error('Signup failed:', error);
        this.customAlertService.show('Error', 'Registration failed. Please try again.');
      },
    });
  }

  navigateBasedOnRole() {
    const userRole = localStorage.getItem('role');

    if (!userRole) {
      this.router.navigate(['/login']); // Redirect to login if role is empty
    } else {
      this.router.navigate(['/dashboard']); // Redirect to dashboard if role exists
    }
  }

}
