import { Component, OnInit, OnDestroy, HostBinding } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize, takeUntil } from 'rxjs/operators';
import { ConfigService } from '../../services/config.service';
import { CustomAlertService } from "../../services/custom-alert.service";
import {UserService} from "../../services/user.service";

@Component({
  selector: 'app-deleted-users',
  templateUrl: './deleted-users.component.html',
  styleUrls: ['./deleted-users.component.css','./deleted-users-style.css']
})
export class DeletedUsersComponent implements OnInit, OnDestroy {
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
  isRestoring = false;
  isSearching = false;

  // RxJS subjects
  private searchSubject = new Subject<{ search: string; role: string }>();
  private destroy$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    private configService: ConfigService,
    private customAlertService: CustomAlertService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.initViewPreference();
    this.setupSearchObservable();
    this.fetchDeletedUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize view preference from localStorage or based on screen size
   */
  initViewPreference(): void {
    const savedViewPreference = localStorage.getItem('deleted-users-view-preference') as 'grid' | 'table';

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
    // Update the view
    this.activeView = view;
    localStorage.setItem('deleted-users-view-preference', view);
    this.applyViewClass();
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
      this.fetchDeletedUsers();
    });
  }

  /**
   * Fetch deleted users from the server
   */
  fetchDeletedUsers(): void {
    this.isLoading = true;
    const url = `${this.configService.apiUrl}admin/user/deleted`;
    const accessToken = localStorage.getItem('access_token');

    if (!accessToken) {
      this.customAlertService.show('Error', 'No access token found. Please log in.');
      this.isLoading = false;
      return;
    }

    const headers = new HttpHeaders({
      'accept': '*/*',
      'Authorization': `Bearer ${accessToken}`
    });

    const params = new HttpParams()
      .set('page', this.page.toString())
      .set('size', this.size.toString())
      .set('search', this.search)
      .set('role', this.role);

    this.http.get(url, { headers, params })
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response: any) => {
          this.users = response.content;
          this.totalUsers = response.totalElements;
        },
        error: (error) => {
          console.error('Failed to fetch deleted users:', error);
          this.customAlertService.show('Error', 'Failed to fetch deleted users. Please try again.');
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
    this.fetchDeletedUsers();
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

    this.userService.viewDeletedUser(userId)
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
   * Restore a deleted user
   */
  async restoreUser(userId: number): Promise<void> {
    try {
      const confirmed = await this.customAlertService.confirm(
        'Confirm Restore',
        'Are you sure you want to restore this user?'
      );

      if (!confirmed) {
        return;
      }

      this.isRestoring = true;
      const url = `${this.configService.apiUrl}admin/user/restore/${userId}`;
      const accessToken = localStorage.getItem('access_token');

      if (!accessToken) {
        this.customAlertService.show('Error', 'No access token found. Please log in.');
        this.isRestoring = false;
        return;
      }

      const headers = new HttpHeaders({
        'accept': '*/*',
        'Authorization': `Bearer ${accessToken}`
      });

      await this.http.post(url, null, { headers }).toPromise();
      this.customAlertService.show('Success', 'User restored successfully!');
      // If we had a selected user and it was the one that was restored, close the modal
      if (this.selectedUser && this.selectedUser.id === userId) {
        this.closeModal();
      }
      this.fetchDeletedUsers();
    } catch (error) {
      console.error('Failed to restore user:', error);
      this.customAlertService.show('Error', 'Failed to restore user. Please try again.');
    } finally {
      this.isRestoring = false;
    }
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
