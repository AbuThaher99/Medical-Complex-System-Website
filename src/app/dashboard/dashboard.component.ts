import { Component, OnInit } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import { Router } from '@angular/router';
import { ConfigService } from '../services/config.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  user: any = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    image: ''
  };
  password = {
    oldPassword: '',
    newPassword: ''
  };
  selectedFile: File | null = null;

  constructor(private http: HttpClient, private router: Router,private configService: ConfigService) {}

  ngOnInit(): void {
    this.fetchUserDetails();
  }

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
        if (this.user.dateOfBirth) {
          const date = new Date(this.user.dateOfBirth);
          const offset = date.getTimezoneOffset() * 60000; // Convert offset to milliseconds
          const localDate = new Date(date.getTime() - offset);
          this.user.dateOfBirth = localDate.toISOString().split('T')[0];
        }
      },
      error: (error) => {
        console.error('Failed to fetch user details:', error);
        this.router.navigate(['/login']);
      }
    });
    localStorage.setItem('role', this.user.role);
    localStorage.setItem('id', this.user.id);
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.user.image = e.target.result; // Preview the image
      };
      reader.readAsDataURL(file);

      // Automatically upload the image and update user profile
      this.uploadProfileImage();
    }
  }

  updateUserInfo(): void {
    const userId = this.user.id; // Use the user's ID
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
      dateOfBirth: new Date(this.user.dateOfBirth).toISOString(),// Convert to ISO format
      image: this.user.image, // Include the uploaded image URL

    };

    // Log the request body for debugging
    console.log('Request Body:', JSON.stringify(requestBody, null, 2));

    // Make the PUT request
    this.http.put(url, requestBody, { headers }).subscribe({
      next: (response) => {
        console.log('User information updated successfully:', response);
        alert('User information updated successfully!');
      },
      error: (error) => {
        console.error('Failed to update user information:', error);
        alert('Failed to update user information. Please try again.');
      }
    });
  }
  changePassword(): void {
    const url = `${this.configService.apiUrl}admin/user/changePassword`;
    const accessToken = localStorage.getItem('access_token');

    // Ensure the user's email is available
    const email = this.user.email; // Assuming the user's email is stored in this.user.email

    // Check if email, oldPassword, and newPassword are available
    if (!email || !this.password.oldPassword || !this.password.newPassword) {
      alert('Please fill in all required fields.');
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
        // clear the password fields
        this.password.oldPassword = '';
        this.password.newPassword = '';
        alert('Password changed successfully!');
      },
      error: (error) => {
        console.error('Failed to change password:', error);
        alert('Failed to change password. Please try again.');
      }
    });
  }

  uploadProfileImage(): void {
    if (!this.selectedFile) {
      alert('Please select an image to upload.');
      return;
    }

    const url = `${this.configService.apiUrl}storage/fileSystem`;
    const accessToken = localStorage.getItem('access_token');

    // Prepare FormData to send the file as multipart/form-data
    const formData = new FormData();
    formData.append('image', this.selectedFile);

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`,
    });

    // Upload the image
    this.http.post(url, formData, { headers, responseType: 'text' }).subscribe({
      next: (response: any) => {
        console.log('Image uploaded successfully:', response);

        // The backend directly returns the URL as a plain string
        if (response && response.startsWith('https://')) {
          this.user.image = response.trim(); // Directly use the response as image URL
          this.updateUserInfo(); // Automatically save the new image URL
        } else {
          console.error('Unexpected response format:', response);
        }
      },
      error: (error) => {
        console.error('Failed to upload profile image:', error);
        alert('Failed to upload profile image. Please try again.');
      },
    });
  }


}
