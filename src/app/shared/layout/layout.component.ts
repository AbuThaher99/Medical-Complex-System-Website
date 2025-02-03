import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import {ConfigService} from "../../services/config.service";

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit {
  user: any = {
    firstName: '',
    lastName: '',
    image: './assets/profile.png'
  }; // Initialize user data
  role: string | null = null; // Initialize role
  isDropdownOpen: boolean = false;
  adminSubNavOpen: boolean = false;
  warehouseSubNavOpen: boolean = false;
  constructor(private http: HttpClient, private router: Router,private configService: ConfigService) {}

  ngOnInit(): void {
    this.fetchUserDetails(); // Fetch user details when the component initializes
  }
  toggleAdminSubNav(): void {
    this.adminSubNavOpen = !this.adminSubNavOpen;
  }

  toggleWarehouseSubNav(): void {
    this.warehouseSubNavOpen = !this.warehouseSubNavOpen;
  }
  fetchUserDetails(): void {
    const url = `${this.configService.apiUrl}auth/getUser`; // Replace with your API endpoint
    const accessToken = localStorage.getItem('access_token');

    if (!accessToken) {
      this.router.navigate(['/login']); // Redirect to login if no token is found
      return;
    }

    const headers = new HttpHeaders({
      'accept': '*/*',
      'Authorization': `Bearer ${accessToken}`
    });

    this.http.get(url, { headers }).subscribe({
      next: (response: any) => {
        this.user = response; // Assign user data
        this.role = response.role; // Assign role
      },
      error: (error) => {
        console.error('Failed to fetch user details:', error);
        this.router.navigate(['/login']); // Redirect to login on error
      }
    });
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  logout(): void {
    console.log('Logging out user'); // Debug log
    const accessToken = localStorage.getItem('access_token');

    if (accessToken) {
      this.http.post(`${this.configService.apiUrl}auth/logout`, {}, {
        headers: new HttpHeaders({
          'Authorization': `Bearer ${accessToken}`
        })
      }).subscribe({
        next: () => {
          console.log('Logged out successfully');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          this.router.navigate(['/login']);
        },
        error: (error) => {
          console.error('Logout failed:', error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          this.router.navigate(['/login']);
        }
      });
    } else {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      this.router.navigate(['/login']);
    }
  }
}
