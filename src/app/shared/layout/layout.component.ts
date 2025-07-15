import { Component, OnInit, HostListener } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { ConfigService } from "../../services/config.service";

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css','./additionStyle.css']
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

  isRefreshing = false;
  private touchStartY = 0;
  private touchMoveY = 0;
  private readonly REFRESH_THRESHOLD = 100;

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
    const userProfileElement = document.querySelector('.user-profile');
    const dropdownMenuElement = document.querySelector('.dropdown-menu');
    const notificationsElement = document.querySelector('.notifications');
    const notificationsDropdownElement = document.querySelector('.notifications-dropdown');
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navElement = document.querySelector('.dashboard-nav');

    // Mobile nav specific handling
    if (window.innerWidth < 768) {
      // Close notifications dropdown when clicking outside
      if (notificationsElement && notificationsDropdownElement) {
        if (!notificationsElement.contains(event.target as Node) &&
          !notificationsDropdownElement.contains(event.target as Node)) {
          this.showNotifications = false;
        }
      }

      // Close mobile nav when clicking outside, except for nav toggle and nav itself
      if (this.mobileNavOpen &&
        navElement &&
        !navElement.contains(event.target as Node) &&
        !(mobileMenuToggle && mobileMenuToggle.contains(event.target as Node))) {
        this.mobileNavOpen = false;
        this.sidebarCollapsed = true;
      }
    } else {
      // Desktop navigation handling (previous logic)
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
  }
  onTouchStart(event: TouchEvent) {
    const notificationsList = document.querySelector('.notifications-list');
    if (notificationsList?.scrollTop === 0) {
      this.touchStartY = event.touches[0].clientY;
    }
  }

  onTouchMove(event: TouchEvent) {
    if (this.touchStartY > 0) {
      this.touchMoveY = event.touches[0].clientY;
      const pull = this.touchMoveY - this.touchStartY;

      if (pull > 0 && pull < this.REFRESH_THRESHOLD) {
        event.preventDefault();
      }
    }
  }

  onTouchEnd() {
    if (this.touchStartY > 0 && this.touchMoveY > 0) {
      const pull = this.touchMoveY - this.touchStartY;

      if (pull > this.REFRESH_THRESHOLD) {
        this.refreshNotifications();
      }
    }

    this.touchStartY = 0;
    this.touchMoveY = 0;
  }

  refreshNotifications() {
    this.isRefreshing = true;
    this.fetchNotifications().then(() => {
      setTimeout(() => {
        this.isRefreshing = false;
      }, 1000);
    });
  }
  checkScreenSize() {
    if (window.innerWidth < 768) {
      this.sidebarCollapsed = true;
      this.mobileNavOpen = false;
      this.showNotifications = false; // Close notifications when resizing
    } else {
      this.mobileNavOpen = false;
      this.sidebarCollapsed = false;
    }
  }


  toggleSidebar() {
    // For mobile: when nav is open, closing sidebar means closing nav
    if (window.innerWidth < 768 && this.mobileNavOpen) {
      this.mobileNavOpen = false;
      this.sidebarCollapsed = true;
    } else {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    }
  }

  toggleMobileNav() {
    this.mobileNavOpen = !this.mobileNavOpen;

    // When opening mobile nav, always collapse sidebar
    if (this.mobileNavOpen) {
      this.sidebarCollapsed = false;
    }
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

  async fetchNotifications(): Promise<void> {
    const accessToken = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
      accept: '*/*',
    });

    return new Promise((resolve, reject) => {
      this.http
        .get(`${this.configService.apiUrl}patients/treatment/patientNotifications`, { headers })
        .subscribe({
          next: (response: any) => {
            this.notifications = response;
            this.unreadNotificationsCount = this.notifications.filter((n) => !n.read).length;
            resolve();
          },
          error: (error) => {
            console.error('Failed to fetch notifications:', error);
            reject(error);
          }
        });
    });
  }

  onNotificationClick(): void {
    this.showNotifications = !this.showNotifications;

    if (window.innerWidth < 768) {
      // Force full-screen behavior and prevent scrolling
      document.body.style.overflow = this.showNotifications ? 'hidden' : 'auto';
      document.documentElement.style.overflow = this.showNotifications ? 'hidden' : 'auto';
    }

    // Close other dropdowns when opening notifications
    if (this.showNotifications) {
      this.isDropdownOpen = false;
    }
  }

  closeNotifications(): void {
    this.showNotifications = false;

    if (window.innerWidth < 768) {
      // Restore scrolling when closing notifications
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    }
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
