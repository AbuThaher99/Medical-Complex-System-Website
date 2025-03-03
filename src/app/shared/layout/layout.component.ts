import { Component, OnInit, HostListener } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { ConfigService } from "../../services/config.service";

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
  };
  role: string | null = null;
  isDropdownOpen: boolean = false;
  adminSubNavOpen: boolean = false;
  warehouseSubNavOpen: boolean = false;
  secretarySubNavOpen: boolean = false;
  sidebarCollapsed: boolean = false;
  mobileNavOpen: boolean = false;

  showNotifications = false;
  notifications: any[] = [];
  unreadNotificationsCount = 0;

  constructor(
    private http: HttpClient,
    private router: Router,
    private configService: ConfigService
  ) {}

  ngOnInit(): void {
    this.fetchUserDetails();
    this.checkScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Close dropdowns when clicking outside
    const userProfileElement = document.querySelector('.user-profile');
    const dropdownMenuElement = document.querySelector('.dropdown-menu');
    const notificationsElement = document.querySelector('.notifications');
    const notificationsDropdownElement = document.querySelector('.notifications-dropdown');

    if (userProfileElement && dropdownMenuElement) {
      if (!userProfileElement.contains(event.target as Node) &&
        !dropdownMenuElement.contains(event.target as Node)) {
        this.isDropdownOpen = false;
      }
    }

    if (notificationsElement && notificationsDropdownElement) {
      if (!notificationsElement.contains(event.target as Node) &&
        !notificationsDropdownElement.contains(event.target as Node)) {
        this.showNotifications = false;
      }
    }
  }

  checkScreenSize() {
    // Auto-collapse sidebar on small screens
    if (window.innerWidth < 768) {
      this.sidebarCollapsed = true;
    }
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  toggleMobileNav() {
    this.mobileNavOpen = !this.mobileNavOpen;
  }

  closeMobileNav() {
    this.mobileNavOpen = false;
  }

  fetchUserDetails(): void {
    const url = `${this.configService.apiUrl}auth/getUser`;
    const accessToken = localStorage.getItem('access_token');

    if (!accessToken) {
      this.router.navigate(['/login']);
      return;
    }

    const headers = new HttpHeaders({
      'accept': '*/*',
      'Authorization': `Bearer ${accessToken}`
    });

    this.http.get(url, { headers }).subscribe({
      next: (response: any) => {
        this.user = response;
        this.role = response.role;

        if (this.user?.role === 'PATIENT') {
          this.fetchNotifications();
        }
      },
      error: (error) => {
        console.error('Failed to fetch user details:', error);
        this.router.navigate(['/login']);
      }
    });
  }

  fetchNotifications(): void {
    const accessToken = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
      accept: '*/*',
    });

    this.http
      .get(`${this.configService.apiUrl}patients/treatment/patientNotifications`, { headers })
      .subscribe((response: any) => {
        this.notifications = response;
        this.unreadNotificationsCount = this.notifications.filter((n) => !n.read).length;
      }, (error) => {
        console.error('Failed to fetch notifications:', error);
      });
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  onNotificationClick(): void {
    this.toggleNotifications();
  }

  markAsRead(notificationId: number): void {
    const accessToken = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
      accept: '*/*',
    });

    this.http
      .post(`${this.configService.apiUrl}patients/treatment/read/${notificationId}`, {}, { headers })
      .subscribe(() => {
        // Mark notification as read locally
        const notification = this.notifications.find((n) => n.id === notificationId);
        if (notification) {
          notification.read = true;
        }

        // Update unread notifications count
        this.unreadNotificationsCount = this.notifications.filter((n) => !n.read).length;
      });
  }

  toggleAdminSubNav(): void {
    this.adminSubNavOpen = !this.adminSubNavOpen;
    // Close other submenus when opening this one
    if (this.adminSubNavOpen) {
      this.secretarySubNavOpen = false;
      this.warehouseSubNavOpen = false;
    }
  }

  toggleSecretarySubNav(): void {
    this.secretarySubNavOpen = !this.secretarySubNavOpen;
    // Close other submenus when opening this one
    if (this.secretarySubNavOpen) {
      this.adminSubNavOpen = false;
      this.warehouseSubNavOpen = false;
    }
  }

  toggleWarehouseSubNav(): void {
    this.warehouseSubNavOpen = !this.warehouseSubNavOpen;
    // Close other submenus when opening this one
    if (this.warehouseSubNavOpen) {
      this.adminSubNavOpen = false;
      this.secretarySubNavOpen = false;
    }
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
    // Close notifications when opening user dropdown
    if (this.isDropdownOpen) {
      this.showNotifications = false;
    }
  }

  logout(): void {
    const accessToken = localStorage.getItem('access_token');

    if (accessToken) {
      this.http.post(`${this.configService.apiUrl}auth/logout`, {}, {
        headers: new HttpHeaders({
          'Authorization': `Bearer ${accessToken}`
        })
      }).subscribe({
        next: () => {
          this.clearLocalStorage();
          this.router.navigate(['/login']);
        },
        error: () => {
          this.clearLocalStorage();
          this.router.navigate(['/login']);
        }
      });
    } else {
      this.clearLocalStorage();
      this.router.navigate(['/login']);
    }
  }

  private clearLocalStorage(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('role');
    localStorage.removeItem('id');
  }
}
