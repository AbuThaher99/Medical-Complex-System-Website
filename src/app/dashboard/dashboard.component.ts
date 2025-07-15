import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { ConfigService } from '../services/config.service';
import { CustomAlertService } from "../services/custom-alert.service";

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css','./dashboard-style.css']
})
export class DashboardComponent implements OnInit {
  @ViewChild('userInfoForm') userInfoForm!: NgForm;
  @ViewChild('passwordForm') passwordForm!: NgForm;

  // User data
  user: any = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    image: '',
    role: '',
    createdAt: ''
  };

  // Original user data for reset functionality
  originalUserData: any = {};

  // Password data
  password = {
    oldPassword: '',
    newPassword: ''
  };

  // UI state variables
  activeTab: 'info' | 'password' = 'info';
  selectedFile: File | null = null;
  isUploading: boolean = false;
  isUpdating: boolean = false;
  isChangingPassword: boolean = false;
  showOldPassword: boolean = false;
  showNewPassword: boolean = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private configService: ConfigService,
    private customAlertService: CustomAlertService
  ) {}

  ngOnInit(): void {
    this.fetchUserDetails();
  }

  // Tab Navigation
  setActiveTab(tab: 'info' | 'password'): void {
    this.activeTab = tab;
  }

  // Fetch user details from API
  fetchUserDetails(): void {
    const url = `${this.configService.apiUrl}auth/getUser`;
    const accessToken = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      'accept': '*/*',
      'Authorization': `Bearer ${accessToken}`
    });

    this.http.get(url, { headers }).subscribe({
      next: (response: any) => {
        this.user = response;

        // Store original data for reset
        this.originalUserData = {...this.user};

        // Format date of birth
        if (this.user.dateOfBirth) {
          const date = new Date(this.user.dateOfBirth);
          const offset = date.getTimezoneOffset() * 60000; // Convert offset to milliseconds
          const localDate = new Date(date.getTime() - offset);
          this.user.dateOfBirth = localDate.toISOString().split('T')[0];
        }

        // Store user role and ID in localStorage
        if (this.user.role) {
          localStorage.setItem('role', this.user.role);
        }
        if (this.user.id) {
          localStorage.setItem('id', this.user.id.toString());
        }
      },
      error: (error) => {
        console.error('Failed to fetch user details:', error);
        this.customAlertService.show('Error', 'Failed to load your profile. Please try again.');
        this.router.navigate(['/login']);
      }
    });
  }

  // Handle file selection for profile image
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type and size
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        this.customAlertService.show('Error', 'Please select a valid image file (JPG, JPEG, or PNG).');
        return;
      }

      if (file.size > maxSize) {
        this.customAlertService.show('Error', 'Image size should not exceed 5MB.');
        return;
      }

      this.selectedFile = file;

      // Preview the image
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.user.image = e.target.result;
      };
      reader.readAsDataURL(file);

      // Automatically upload the image
      this.uploadProfileImage();
    }
  }

  // Upload profile image to the server
  uploadProfileImage(): void {
    if (!this.selectedFile) {
      return;
    }

    this.isUploading = true;
    const url = `${this.configService.apiUrl}storage/fileSystem`;
    const accessToken = localStorage.getItem('access_token');

    // Prepare FormData to send the file
    const formData = new FormData();
    formData.append('image', this.selectedFile);

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`,
    });

    // Upload the image
    this.http.post(url, formData, { headers, responseType: 'text' }).subscribe({
      next: (response: any) => {
        // The backend directly returns the URL as a plain string
        if (response && response.startsWith('https://')) {
          this.user.image = response.trim();
          this.updateUserInfo(); // Automatically save the new image URL
        } else {
          console.error('Unexpected response format:', response);
          this.customAlertService.show('Error', 'Failed to upload profile image. Unexpected response from server.');
        }
        this.isUploading = false;
      },
      error: (error) => {
        console.error('Failed to upload profile image:', error);
        this.customAlertService.show('Error', 'Failed to upload profile image. Please try again.');
        this.isUploading = false;
      },
    });
  }

  // Update user information
  updateUserInfo(): void {
    // If form is invalid, show validation errors
    if (this.userInfoForm && this.userInfoForm.invalid) {
      Object.keys(this.userInfoForm.controls).forEach(key => {
        const control = this.userInfoForm.controls[key];
        control.markAsTouched();
      });
      return;
    }

    this.isUpdating = true;
    const userId = this.user.id;
    const url = `${this.configService.apiUrl}admin/user/${userId}`;
    const accessToken = localStorage.getItem('access_token');

    // Set up headers
    const headers = new HttpHeaders({
      'accept': '*/*',
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    });

    // Prepare the request body
    const requestBody = {
      firstName: this.user.firstName,
      lastName: this.user.lastName,
      address: this.user.address,
      phone: this.user.phone,
      dateOfBirth: new Date(this.user.dateOfBirth).toISOString(),
      image: this.user.image || '',
    };

    // Make the PUT request
    this.http.put(url, requestBody, { headers }).subscribe({
      next: (response) => {
        console.log('User information updated successfully:', response);
        this.customAlertService.show('Success', 'Your profile has been updated successfully!');
        this.isUpdating = false;

        // Update original data for reset functionality
        this.originalUserData = {...this.user};
      },
      error: (error) => {
        console.error('Failed to update user information:', error);
        this.customAlertService.show('Error', 'Failed to update your profile. Please try again.');
        this.isUpdating = false;
      }
    });
  }

  // Change user password
  changePassword(): void {
    // If form is invalid, show validation errors
    if (this.passwordForm && this.passwordForm.invalid) {
      Object.keys(this.passwordForm.controls).forEach(key => {
        const control = this.passwordForm.controls[key];
        control.markAsTouched();
      });
      return;
    }

    this.isChangingPassword = true;
    const url = `${this.configService.apiUrl}admin/user/changePassword`;
    const accessToken = localStorage.getItem('access_token');

    // Ensure the user's email is available
    const email = this.user.email;

    // Check if email, oldPassword, and newPassword are available
    if (!email || !this.password.oldPassword || !this.password.newPassword) {
      this.customAlertService.show('Error', 'Please fill in all required fields.');
      this.isChangingPassword = false;
      return;
    }

    // Set up headers
    const headers = new HttpHeaders({
      'accept': '*/*',
      'Authorization': `Bearer ${accessToken}`
    });

    // Set up query parameters
    const params = new HttpParams()
      .set('email', email)
      .set('oldPassword', this.password.oldPassword)
      .set('newPassword', this.password.newPassword);

    // Make the POST request
    this.http.post(url, null, { headers, params }).subscribe({
      next: (response) => {
        console.log('Password changed successfully:', response);
        this.customAlertService.show('Success', 'Your password has been changed successfully!');
        this.resetPasswordForm();
        this.isChangingPassword = false;
      },
      error: (error) => {
        console.error('Failed to change password:', error);
        this.customAlertService.show('Error', 'Failed to change your password. Please verify your current password and try again.');
        this.isChangingPassword = false;
      }
    });
  }

  // Reset user info form to original values
  resetUserInfo(): void {
    this.user = {...this.originalUserData};

    // Format date of birth
    if (this.user.dateOfBirth) {
      const date = new Date(this.user.dateOfBirth);
      const offset = date.getTimezoneOffset() * 60000;
      const localDate = new Date(date.getTime() - offset);
      this.user.dateOfBirth = localDate.toISOString().split('T')[0];
    }

    // Reset form validation
    if (this.userInfoForm) {
      this.userInfoForm.resetForm(this.user);
    }

    this.customAlertService.show('Info', 'Form reset to original values.');
  }

  // Reset password form
  resetPasswordForm(): void {
    this.password.oldPassword = '';
    this.password.newPassword = '';

    // Reset form validation
    if (this.passwordForm) {
      this.passwordForm.resetForm();
    }
  }

  // Toggle password visibility
  toggleOldPassword(): void {
    this.showOldPassword = !this.showOldPassword;
  }

  toggleNewPassword(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  // Password validation helpers
  hasUppercase(str: string): boolean {
    return str ? /[A-Z]/.test(str) : false;
  }

  hasNumber(str: string): boolean {
    return str ? /[0-9]/.test(str) : false;
  }
}
