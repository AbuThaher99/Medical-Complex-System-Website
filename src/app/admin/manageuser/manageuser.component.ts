import { Component, OnInit, OnDestroy, HostBinding, ElementRef } from '@angular/core';
import { UserService } from '../../services/user.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize, takeUntil } from 'rxjs/operators';
import { CustomAlertService } from "../../services/custom-alert.service";

@Component({
  selector: 'app-manageuser',
  templateUrl: './manageuser.component.html',
  styleUrls: ['./manageuser.component.css','./manage-user-style.css'],
})
export class ManageuserComponent implements OnInit, OnDestroy {
  // Host class bindings for view toggling
  @HostBinding('class.host-grid-active') get isGridViewActive() { return this.activeView === 'grid'; }
  @HostBinding('class.host-table-active') get isTableViewActive() { return this.activeView === 'table'; }

  // User data
  users: any[] = [];
  page = 1;
  size = 10;
  search = '';
  role = '';
  totalUsers = 0;
  selectedUser: any = null;

  // UI state
  activeView: 'grid' | 'table' = 'grid';
  isLoading = false;
  isSearching = false;

  // RxJS subjects
  private searchSubject = new Subject<{ search: string; role: string }>();
  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserService,
    private customAlertService: CustomAlertService,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.initViewPreference();
    this.setupSearchObservable();
    this.fetchUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize view preference from localStorage or based on screen size
   */
  initViewPreference(): void {
    const savedViewPreference = localStorage.getItem('users-view-preference') as 'grid' | 'table';

    if (savedViewPreference) {
      this.toggleView(savedViewPreference);
    } else {
      // Default to grid on mobile, table on desktop
      const defaultView = window.innerWidth < 768 ? 'grid' : 'table';
      this.toggleView(defaultView);
    }
  }

  /**
   * Toggle between grid and table views
   */
  toggleView(view: 'grid' | 'table'): void {
    console.log('Before toggle:', {
      activeView: this.activeView,
      containerClasses: document.querySelector('.manage-user-container')?.className
    });

    // Update the view
    this.activeView = view;
    localStorage.setItem('users-view-preference', view);
    this.applyViewClass();

    console.log('After toggle:', {
      activeView: this.activeView,
      containerClasses: document.querySelector('.manage-user-container')?.className
    });
  }

  private applyViewClass(): void {
    const container = document.querySelector('.manage-user-container');
    if (container) {
      // Remove both classes first
      container.classList.remove('grid-view-active', 'table-view-active');

      // Add the new active view class
      container.classList.add(`${this.activeView}-view-active`);

      console.log(`Applied ${this.activeView}-view-active to container`);
    } else {
      console.error('Could not find .manage-user-container element');
    }
  }
  /**
   * Set up search observable with debounce
   */
  setupSearchObservable(): void {
    this.searchSubject.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged((prev, curr) =>
        prev.search === curr.search && prev.role === curr.role
      )
    ).subscribe(({ search, role }) => {
      this.page = 1; // Reset to the first page when filtering
      this.search = search;
      this.role = role;
      this.fetchUsers();
    });
  }

  /**
   * Fetch users from the server
   */
  fetchUsers(): void {
    this.isLoading = true;
    console.log('Fetching users with params:', {
      page: this.page,
      size: this.size,
      search: this.search,
      role: this.role
    });

    this.userService.getUsers(this.page, this.size, this.search, this.role)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          if (response && response.content) {
            this.users = response.content;
            this.totalUsers = response.totalElements || 0;
            console.log(`Loaded ${this.users.length} users out of ${this.totalUsers} total`);
          } else {
            console.warn('Empty or invalid response from API:', response);
            this.users = [];
            this.totalUsers = 0;
          }
        },
        error: (error) => {
          console.error('Failed to fetch users:', error);
          this.customAlertService.show('Error', 'Failed to load users. Please try again.');
          this.users = [];
          this.totalUsers = 0;
        }
      });
  }

  /**
   * Handle page changes
   */
  onPageChange(newPage: number): void {
    if (newPage === this.page || newPage < 1 || newPage > Math.ceil(this.totalUsers / this.size)) {
      return;
    }

    this.page = newPage;
    this.fetchUsers();
  }

  /**
   * Handle search input changes
   */
  onSearchChange(search: string): void {
    this.isSearching = true;
    this.searchSubject.next({ search, role: this.role });
  }

  /**
   * Handle role filter changes
   */
  onRoleChange(role: string): void {
    this.searchSubject.next({ search: this.search, role });
  }

  /**
   * Clear search input
   */
  clearSearch(): void {
    this.search = '';
    this.searchSubject.next({ search: '', role: this.role });
  }

  /**
   * Reset all filters
   */
  resetFilters(): void {
    this.search = '';
    this.role = '';
    this.searchSubject.next({ search: '', role: '' });
  }

  /**
   * View user details
   */
  viewUser(userId: number): void {
    this.isLoading = true;

    this.userService.viewUser(userId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          this.selectedUser = response;

          if (this.selectedUser) {
            // Format time values if they exist
            if (this.selectedUser.beginTime) {
              this.selectedUser.beginTime = this.convertToTimeFormat(this.selectedUser.beginTime);
            }

            if (this.selectedUser.endTime) {
              this.selectedUser.endTime = this.convertToTimeFormat(this.selectedUser.endTime);
            }
          }
        },
        error: (error) => {
          console.error('Failed to fetch user details:', error);
          this.customAlertService.show('Error', 'Failed to fetch user details. Please try again.');
        },
      });
  }

  /**
   * Close the user details modal
   */
  closeModal(): void {
    this.selectedUser = null;
  }

  /**
   * Delete a user
   */
  deleteUser(userId: number): void {
    this.customAlertService.confirm('Confirm Delete', 'Are you sure you want to delete this user?')
      .then((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.isLoading = true;

        this.userService.deleteUser(userId)
          .pipe(finalize(() => this.isLoading = false))
          .subscribe({
            next: () => {
              this.customAlertService.show('Success', 'User deleted successfully!');
              this.fetchUsers(); // Refresh the user list after deletion
            },
            error: (error) => {
              console.error('Failed to delete user:', error);
              this.customAlertService.show('Error', 'Failed to delete user. Please try again.');
            },
          });
      });
  }

  /**
   * Get pagination array for numbered pagination
   */
  getPaginationArray(): number[] {
    const totalPages = Math.ceil(this.totalUsers / this.size);

    if (totalPages <= 5) {
      return Array(totalPages).fill(0).map((_, i) => i + 1);
    }

    if (this.page <= 3) {
      return [1, 2, 3, 4, 5];
    }

    if (this.page >= totalPages - 2) {
      return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [this.page - 2, this.page - 1, this.page, this.page + 1, this.page + 2];
  }

  /**
   * Convert time string to formatted time
   */
  convertToTimeFormat(time: string): string {
    if (!time) return time;

    try {
      const [hours, minutes, seconds] = time.split(':');
      const timeObject = new Date(1970, 0, 1, parseInt(hours), parseInt(minutes), parseInt(seconds));
      return timeObject.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.error('Error formatting time:', error);
      return time;
    }
  }

  /**
   * Helper methods for user details
   */
  getUserInitials(user: any): string {
    const firstName = user.user?.firstName || user.firstName || '';
    const lastName = user.user?.lastName || user.lastName || '';

    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }

  getUserFullName(user: any): string {
    const firstName = user.user?.firstName || user.firstName || '';
    const lastName = user.user?.lastName || user.lastName || '';

    return `${firstName} ${lastName}`;
  }

  getUserEmail(user: any): string {
    return user.user?.email || user.email || '';
  }

  getUserRole(user: any): string {
    return user.user?.role || user.role || '';
  }

  isDoctor(user: any): boolean {
    return (user.user?.role || user.role) === 'DOCTOR';
  }

  isPatient(user: any): boolean {
    return (user.user?.role || user.role) === 'PATIENT';
  }

  hasSalary(user: any): boolean {
    return !!(user.user?.salary || user.salary);
  }

  getSalaryType(user: any): string {
    return user.user?.salary?.salaryType || user.salary?.salaryType || '';
  }

  isMonthlySalary(user: any): boolean {
    return (user.user?.salary?.salaryType || user.salary?.salaryType) === 'MONTHLY';
  }

  isHourlySalary(user: any): boolean {
    return (user.user?.salary?.salaryType || user.salary?.salaryType) === 'HOURLY';
  }

  getMonthlySalary(user: any): number {
    return user.user?.salary?.salaryAmount || user.salary?.salaryAmount || 0;
  }

  getHourlyRate(user: any): number {
    return user.user?.salary?.hourRate || user.salary?.hourRate || 0;
  }

  getHoursWorked(user: any): number {
    return user.user?.salary?.hourWork || user.salary?.hourWork || 0;
  }

  protected readonly Math = Math;
}
