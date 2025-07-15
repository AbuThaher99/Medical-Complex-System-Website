import { Component, OnInit, OnDestroy, HostBinding } from '@angular/core';
import { DepartmentService } from '../../services/department.service';
import { debounceTime, distinctUntilChanged, finalize, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { CustomAlertService } from "../../services/custom-alert.service";

@Component({
  selector: 'app-deleted-department',
  templateUrl: './deleted-department.component.html',
  styleUrls: ['./deleted-department.component.css'],
})
export class DeletedDepartmentComponent implements OnInit, OnDestroy {
  // Host class bindings for view toggling
  @HostBinding('class.host-grid-active') get isGridViewActive() { return this.activeView === 'grid'; }
  @HostBinding('class.host-table-active') get isTableViewActive() { return this.activeView === 'table'; }

  // Department data
  deletedDepartments: any[] = [];
  page = 1;
  size = 10;
  totalDepartments = 0;
  searchQuery: string = '';

  // UI state
  activeView: 'grid' | 'table' = 'grid';
  isLoading = false;

  // RxJS subjects
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private departmentService: DepartmentService,
    private customAlertService: CustomAlertService
  ) {}

  ngOnInit(): void {
    this.initViewPreference();
    this.setupSearchObservable();
    this.fetchDeletedDepartments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize view preference from localStorage or based on screen size
   */
  initViewPreference(): void {
    const savedViewPreference = localStorage.getItem('deleted-departments-view-preference') as 'grid' | 'table';

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
    this.activeView = view;
    localStorage.setItem('deleted-departments-view-preference', view);
    this.applyViewClass();
  }

  private applyViewClass(): void {
    const container = document.querySelector('.manage-user-container');
    if (container) {
      // Remove both classes first
      container.classList.remove('grid-view-active', 'table-view-active');

      // Add the new active view class
      container.classList.add(`${this.activeView}-view-active`);
    }
  }

  /**
   * Setup search observable with debounce
   */
  setupSearchObservable(): void {
    this.searchSubject.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe((searchText) => {
      this.page = 1; // Reset to the first page when filtering
      this.searchQuery = searchText;
      this.fetchDeletedDepartments();
    });
  }

  /**
   * Fetch deleted departments from server
   */
  fetchDeletedDepartments(): void {
    this.isLoading = true;

    this.departmentService.getDeletedDepartments(this.page, this.size, this.searchQuery)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          this.deletedDepartments = response.content;
          this.totalDepartments = response.totalElements;
        },
        error: (error) => {
          console.error('Failed to fetch deleted departments:', error);
          if (error.status === 403) {
            this.customAlertService.show('Error', 'You do not have permission to access this resource.');
          } else {
            this.customAlertService.show('Error', 'Failed to fetch deleted departments. Please try again.');
          }
          this.deletedDepartments = [];
          this.totalDepartments = 0;
        },
      });
  }

  /**
   * Handle search input changes
   */
  onSearchInputChange(query: string): void {
    this.searchSubject.next(query);
  }

  /**
   * Clear search input
   */
  clearSearch(): void {
    this.searchQuery = '';
    this.searchSubject.next('');
  }

  /**
   * Handle page changes
   */
  onPageChange(newPage: number): void {
    if (newPage === this.page || newPage < 1 || newPage > Math.ceil(this.totalDepartments / this.size)) {
      return;
    }

    this.page = newPage;
    this.fetchDeletedDepartments();
  }

  /**
   * Get pagination array for numbered pagination
   */
  getPaginationArray(): number[] {
    const totalPages = Math.ceil(this.totalDepartments / this.size);

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
   * Restore a deleted department
   */
  restoreDepartment(id: number): void {
    this.customAlertService.confirm('Confirm Restore', 'Are you sure you want to restore this department?').then((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.isLoading = true;
      this.departmentService.restoreDepartment(id)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: (response) => {
            this.customAlertService.show('Success', 'Department restored successfully!');
            this.fetchDeletedDepartments(); // Refresh the list after restoration
          },
          error: (error) => {
            console.error('Failed to restore department:', error);
            this.customAlertService.show('Error', 'Failed to restore department. Please try again.');
          },
        });
    });
  }

  protected readonly Math = Math;
}
