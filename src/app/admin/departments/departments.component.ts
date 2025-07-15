import { Component, OnInit, OnDestroy, HostBinding } from '@angular/core';
import { DepartmentService } from '../../services/department.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, finalize, takeUntil } from 'rxjs/operators';
import { ConfigService } from '../../services/config.service';
import { Subject } from "rxjs";
import { CustomAlertService } from "../../services/custom-alert.service";

@Component({
  selector: 'app-departments',
  templateUrl: './departments.component.html',
  styleUrls: ['./departments.component.css', './departments-style.css'],
})
export class DepartmentsComponent implements OnInit, OnDestroy {
  // Host class bindings for view toggling
  @HostBinding('class.host-grid-active') get isGridViewActive() { return this.activeView === 'grid'; }
  @HostBinding('class.host-table-active') get isTableViewActive() { return this.activeView === 'table'; }

  // Department data
  departments: any[] = [];
  page = 1;
  size = 10;
  search = '';
  totalDepartments = 0;

  // UI state
  activeView: 'grid' | 'table' = 'grid';
  isLoading = false;
  showEditModal = false;
  selectedDepartment: any = null;

  // Staff selection
  heads: any[] = [];
  secretaries: any[] = [];
  isLoadingHeads = false;
  isLoadingSecretaries = false;
  selectedHeadInfo: string = '';
  selectedSecretaryInfo: string = '';

  // Pagination and search for dropdowns
  headPage = 1;
  headSize = 10;
  totalHeads = 0;
  headSearchTerm = '';
  filteredHeads: any[] = [];

  secretaryPage = 1;
  secretarySize = 10;
  totalSecretaries = 0;
  secretarySearchTerm = '';
  filteredSecretaries: any[] = [];
  showHeadDropdown = false;
  showSecretaryDropdown = false;

  // RxJS subjects
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  // API configuration
  private readonly apiUrl: string;
  private readonly headers: HttpHeaders;

  constructor(
    private departmentService: DepartmentService,
    private http: HttpClient,
    private configService: ConfigService,
    private customAlertService: CustomAlertService
  ) {
    this.apiUrl = `${this.configService.apiUrl}admin`;
    const token = localStorage.getItem('access_token');
    this.headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  ngOnInit(): void {
    this.initViewPreference();
    this.setupSearchObservable();
    this.fetchDepartments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize view preference from localStorage or based on screen size
   */
  initViewPreference(): void {
    const savedViewPreference = localStorage.getItem('departments-view-preference') as 'grid' | 'table';

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
    localStorage.setItem('departments-view-preference', view);
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
   * Set up search observable with debounce
   */
  setupSearchObservable(): void {
    this.searchSubject.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe((searchText) => {
      this.page = 1; // Reset to the first page when filtering
      this.fetchDepartments();
    });
  }

  /**
   * Fetch departments from the server
   */
  fetchDepartments(): void {
    this.isLoading = true;

    this.departmentService
      .getDepartments(this.page, this.size, this.search)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          this.departments = response.content;
          this.totalDepartments = response.totalElements;
        },
        error: (error) => {
          console.error('Failed to fetch departments:', error);
          this.customAlertService.show('Error', 'Failed to fetch departments. Please try again.');
          this.departments = [];
          this.totalDepartments = 0;
        },
      });
  }

  /**
   * Handle page changes
   */
  onPageChange(newPage: number): void {
    if (newPage === this.page || newPage < 1 || newPage > Math.ceil(this.totalDepartments / this.size)) {
      return;
    }

    this.page = newPage;
    this.fetchDepartments();
  }

  /**
   * Handle search input changes
   */
  onSearchChange(query: string): void {
    this.search = query;
    this.searchSubject.next(query);
  }

  /**
   * Clear search input
   */
  clearSearch(): void {
    this.search = '';
    this.searchSubject.next('');
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
   * Delete a department
   */
  deleteDepartment(id: number): void {
    this.customAlertService.confirm('Confirm Delete', 'Are you sure you want to delete this department?').then((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.isLoading = true;
      this.departmentService.deleteDepartment(id)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: (response) => {
            this.customAlertService.show('Success', 'Department deleted successfully!');
            this.fetchDepartments();
          },
          error: (error) => {
            console.error('Failed to delete department:', error);
            this.customAlertService.show('Error', 'Failed to delete department. Please try again.');
          },
        });
    });
  }

  /**
   * Open the edit modal
   */
  openEditModal(department: any): void {
    this.selectedDepartment = { ...department };
    this.showEditModal = true;

    // Reset heads and secretaries data
    this.heads = [];
    this.secretaries = [];

    // Reset pagination counters
    this.headPage = 1;
    this.secretaryPage = 1;
    this.totalHeads = 0;
    this.totalSecretaries = 0;

    // Reset search terms
    this.headSearchTerm = '';
    this.secretarySearchTerm = '';

    // Clear previously selected info
    this.selectedHeadInfo = '';
    this.selectedSecretaryInfo = '';

    // Fetch initial data
    this.fetchHeads();
    this.fetchSecretaries();

    // Set pre-filled values for editing
    setTimeout(() => {
      if (department.headId) {
        this.displaySelectedHeadInfo(department.headId.id);
      } else {
        this.selectedHeadInfo = 'No Head Assigned';
      }

      if (department.secretaryId) {
        this.displaySelectedSecretaryInfo(department.secretaryId.id);
      } else {
        this.selectedSecretaryInfo = 'No Secretary Assigned';
      }
    }, 200);
  }

  /**
   * Close the edit modal
   */
  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedDepartment = null;
    this.selectedHeadInfo = '';
    this.selectedSecretaryInfo = '';
  }

  /**
   * Toggle head dropdown
   */
  toggleHeadDropdown(): void {
    this.showHeadDropdown = !this.showHeadDropdown;
  }

  /**
   * Toggle secretary dropdown
   */
  toggleSecretaryDropdown(): void {
    this.showSecretaryDropdown = !this.showSecretaryDropdown;
  }

  /**
   * Hide dropdown on blur
   */
  hideDropdown(event: FocusEvent, type: 'head' | 'secretary'): void {
    setTimeout(() => {
      if (type === 'head') {
        this.showHeadDropdown = false;
      } else if (type === 'secretary') {
        this.showSecretaryDropdown = false;
      }
    }, 200);
  }

  /**
   * Fetch heads for dropdown
   */
  fetchHeads(): void {
    if (this.isLoadingHeads || (this.totalHeads && this.heads.length >= this.totalHeads)) return;

    this.isLoadingHeads = true;
    this.http
      .get(`${this.apiUrl}/user/doctorsUpdated?page=${this.headPage}&size=${this.headSize}&search=${this.headSearchTerm}`, { headers: this.headers })
      .subscribe(
        (response: any) => {
          const newHeads = response.content.map((head: any) => ({
            id: head.id,
            displayText: `${head.firstName} ${head.lastName} - ID: ${head.id} - Email: ${head.email}`
          }));

          this.heads = [...this.heads, ...newHeads];
          this.filteredHeads = this.heads;
          this.totalHeads = response.totalElements;
          this.headPage++;
          this.isLoadingHeads = false;
        },
        (error) => {
          console.error('Error fetching heads:', error);
          this.isLoadingHeads = false;
        }
      );
  }

  /**
   * Handle scroll event in heads dropdown
   */
  onHeadScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 10) {
      this.fetchHeads();
    }
  }

  /**
   * Select a head from dropdown
   */
  selectHead(head: any): void {
    this.selectedDepartment.headId = { id: head.id };
    this.selectedHeadInfo = head.displayText;
    this.showHeadDropdown = false;
  }

  /**
   * Display selected head info
   */
  displaySelectedHeadInfo(headId: string): void {
    const selectedHead = this.heads.find((head) => head.id === +headId);
    if (selectedHead) {
      this.selectedHeadInfo = selectedHead.displayText;
    } else {
      const url = `${this.apiUrl}/user/${headId}`;
      this.http.get(url, { headers: this.headers }).subscribe(
        (response: any) => {
          if (response) {
            const head = {
              id: response.id,
              displayText: `${response.firstName} ${response.lastName} - ID: ${response.id} - Email: ${response.email}`
            };
            this.heads.push(head);
            this.selectedHeadInfo = head.displayText;
          }
        },
        (error) => {
          console.error('Error fetching head details:', error);
        }
      );
    }
  }

  /**
   * Fetch secretaries for dropdown
   */
  fetchSecretaries(): void {
    if (this.isLoadingSecretaries || (this.totalSecretaries && this.secretaries.length >= this.totalSecretaries)) return;

    this.isLoadingSecretaries = true;
    this.http
      .get(`${this.apiUrl}/user/secretariesUpdated?page=${this.secretaryPage}&size=${this.secretarySize}&search=${this.secretarySearchTerm}`, { headers: this.headers })
      .subscribe(
        (response: any) => {
          const newSecretaries = response.content.map((secretary: any) => ({
            id: secretary.id,
            displayText: `${secretary.firstName} ${secretary.lastName} - ID: ${secretary.id} - Email: ${secretary.email}`
          }));

          this.secretaries = [...this.secretaries, ...newSecretaries];
          this.filteredSecretaries = this.secretaries;
          this.totalSecretaries = response.totalElements;
          this.secretaryPage++;
          this.isLoadingSecretaries = false;
        },
        (error) => {
          console.error('Error fetching secretaries:', error);
          this.isLoadingSecretaries = false;
        }
      );
  }

  /**
   * Handle scroll event in secretaries dropdown
   */
  onSecretaryScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 10) {
      this.fetchSecretaries();
    }
  }

  /**
   * Select a secretary from dropdown
   */
  selectSecretary(secretary: any): void {
    this.selectedDepartment.secretaryId = { id: secretary.id };
    this.selectedSecretaryInfo = secretary.displayText;
    this.showSecretaryDropdown = false;
  }

  /**
   * Display selected secretary info
   */
  displaySelectedSecretaryInfo(secretaryId: string): void {
    const selectedSecretary = this.secretaries.find((secretary) => secretary.id === +secretaryId);
    if (selectedSecretary) {
      this.selectedSecretaryInfo = selectedSecretary.displayText;
    } else {
      const url = `${this.apiUrl}/user/${secretaryId}`;
      this.http.get(url, { headers: this.headers }).subscribe(
        (response: any) => {
          if (response) {
            const secretary = {
              id: response.id,
              displayText: `${response.firstName} ${response.lastName} - ID: ${response.id} - Email: ${response.email}`
            };
            this.secretaries.push(secretary);
            this.selectedSecretaryInfo = secretary.displayText;
          }
        },
        (error) => {
          console.error('Error fetching secretary details:', error);
        }
      );
    }
  }

  /**
   * Filter heads by search term
   */
  filterHeads(searchTerm: string): void {
    this.headSearchTerm = searchTerm;
    this.filteredHeads = this.heads.filter((head) =>
      head.displayText.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  /**
   * Filter secretaries by search term
   */
  filterSecretaries(searchTerm: string): void {
    this.secretarySearchTerm = searchTerm;
    this.filteredSecretaries = this.secretaries.filter((secretary) =>
      secretary.displayText.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  /**
   * Update department
   */
  onUpdateDepartment(): void {
    if (!this.selectedDepartment) {
      return;
    }

    const { id, name, headId, secretaryId } = this.selectedDepartment;
    const data = {
      name,
      headId: { id: headId.id },
      secretaryId: { id: secretaryId.id },
    };

    this.isLoading = true;
    this.departmentService.updateDepartment(id, data)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          this.customAlertService.show('Success', 'Department updated successfully!');
          this.closeEditModal();
          this.fetchDepartments();
        },
        error: (error) => {
          console.error('Failed to update department:', error);
          this.customAlertService.show('Error', 'Failed to update department. Please try again.');
        },
      });
  }

  protected readonly Math = Math;
}
