import { Component, OnInit, HostListener } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { ConfigService } from "../../services/config.service";
import { CustomAlertService } from "../../services/custom-alert.service";
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-deleted-suppliers',
  templateUrl: './deleted-suppliers.component.html',
  styleUrls: ['./deleted-suppliers.component.css','./deleted-suppliers-style.css'],
})
export class DeletedSuppliersComponent implements OnInit {
  // Screen size detection
  isMobile: boolean = false;

  // Form controls
  filterForm: FormGroup;
  searchControl = new FormControl('');
  companyControl = new FormControl('');

  // Data
  deletedSuppliers: any[] = [];
  companyList: string[] = [];
  isLoadingCompanies: boolean = false;

  // Stats
  totalItems: number = 0;
  uniqueCompanies: number = 0;
  restoredCount: number = 0;

  // Pagination
  page: number = 1;
  size: number = 10;
  totalPages: number = 1;

  // UI State
  viewMode: 'table' | 'grid' = 'grid';
  isLoading: boolean = false;
  isRestoring: boolean = false;
  restoringId: number | null = null;
  showRestoreModal: boolean = false;
  selectedSupplier: any = null;
  isCompanyDropdownOpen: boolean = false;

  // Sorting
  sortField: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private configService: ConfigService,
    private customAlertService: CustomAlertService
  ) {
    this.filterForm = this.fb.group({
      search: this.searchControl,
      companyName: this.companyControl
    });

    // Check initial screen size
    this.checkScreenSize();
  }

  // Detect screen size changes
  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  // Check if device is mobile
  checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;

    // Force grid view on mobile
    if (this.isMobile) {
      this.viewMode = 'grid';
    } else {
      // On desktop, use saved preference or default
      const savedViewMode = localStorage.getItem('deletedSuppliersViewMode') as 'table' | 'grid';
      if (savedViewMode) {
        this.viewMode = savedViewMode;
      }
    }
  }

  toggleCompanyDropdown(): void {
    this.isCompanyDropdownOpen = !this.isCompanyDropdownOpen;

    // If opening the dropdown and no companies loaded yet, fetch them
    if (this.isCompanyDropdownOpen && this.companyList.length === 0 && !this.isLoadingCompanies) {
      this.extractCompanyList();
    }
  }

  selectCompany(company: string): void {
    this.companyControl.setValue(company);
    this.isCompanyDropdownOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Get the custom dropdown element
    const dropdownElement = document.querySelector('.custom-dropdown');

    // Check if click was outside the dropdown
    if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
      this.isCompanyDropdownOpen = false;
    }
  }

  ngOnInit(): void {
    // Check screen size
    this.checkScreenSize();

    // Load deleted suppliers
    this.loadDeletedSuppliers();

    // Set up search with auto-filtering
    this.searchControl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.page = 1;
        this.loadDeletedSuppliers();
      });

    // Set up company filter with auto-filtering
    this.companyControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.page = 1;
        this.loadDeletedSuppliers();
      });

    // Mock restoration count (you might want to fetch this from the server)
    this.restoredCount = 0;

    // Handle clicks outside dropdown menus
    document.addEventListener('click', (event) => {
      const dropdowns = document.querySelectorAll('.action-menu.active');
      dropdowns.forEach(dropdown => {
        if (!dropdown.contains(event.target as Node)) {
          dropdown.classList.remove('active');
        }
      });
    });

    window.addEventListener('resize', () => {
      this.isCompanyDropdownOpen = false;
    });
  }

  // Fetch all deleted suppliers with filters
  loadDeletedSuppliers(): void {
    this.isLoading = true;

    const { search, companyName } = this.filterForm.value;
    let params = new HttpParams()
      .set('page', this.page.toString())
      .set('size', this.size.toString());

    if (search) {
      params = params.set('search', search);
    }

    if (companyName) {
      params = params.set('companyName', companyName);
    }

    // Add sorting if active
    if (this.sortField) {
      params = params
        .set('sortBy', this.sortField)
        .set('sortDirection', this.sortDirection);
    }

    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    this.http
      .get<any>(`${this.configService.apiUrl}admin/supplier/deleted`, { params, headers })
      .subscribe({
        next: (response) => {
          this.deletedSuppliers = response.content || [];
          this.totalPages = response.totalPages || 1;
          this.totalItems = response.totalElements || this.deletedSuppliers.length;

          // Calculate stats
          this.updateStats();

          this.isLoading = false;
        },
        error: (error) => {
          console.error('Failed to load deleted suppliers:', error);
          this.customAlertService.show('Error', 'Failed to load deleted suppliers. Please try again.');
          this.isLoading = false;
        }
      });
  }

  // Extract unique company names
  extractCompanyList(): void {
    this.isLoadingCompanies = true;

    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    // Increase the size parameter to get more companies at once
    const params = new HttpParams()
      .set('page', '1')
      .set('size', '100');

    this.http
      .get<any>(`${this.configService.apiUrl}admin/supplier/deleted`, { params, headers })
      .pipe(
        finalize(() => {
          this.isLoadingCompanies = false;
        })
      )
      .subscribe({
        next: (response) => {
          if (response.content && Array.isArray(response.content)) {
            const companies = response.content.map((s: any) => s.companyName);
            // @ts-ignore
            this.companyList = [...new Set(companies)].filter(c => !!c);
          }
        },
        error: (error) => {
          console.error('Failed to load companies:', error);
          this.customAlertService.show('Error', 'Failed to load companies. Please try again.');
        }
      });
  }

  // Calculate dashboard stats
  updateStats(): void {
    // Count unique companies
    const companies = this.deletedSuppliers.map(s => s.companyName);
    this.uniqueCompanies = new Set(companies).size;
  }

  // Refresh data
  refreshData(): void {
    this.loadDeletedSuppliers();
  }

  // Sort table by column
  sortBy(field: string): void {
    if (this.sortField === field) {
      // Toggle direction if already sorting by this field
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Set new sort field with default ascending direction
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    this.loadDeletedSuppliers();
  }

  // Reset filters
  resetFilters(): void {
    this.searchControl.setValue('');
    this.companyControl.setValue('');
    this.page = 1;
    this.loadDeletedSuppliers();
  }

  // Clear search
  clearSearch(): void {
    this.searchControl.setValue('');
  }

  // Check if there are active filters
  hasActiveFilters(): boolean {
    return !!(this.searchControl.value || this.companyControl.value);
  }

  // View mode management
  setViewMode(mode: 'table' | 'grid'): void {
    // Only change view mode if not on mobile
    if (!this.isMobile) {
      this.viewMode = mode;
      localStorage.setItem('deletedSuppliersViewMode', mode);
    }
  }

  // Pagination
  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadDeletedSuppliers();
    }
  }

  previousPage(): void {
    if (this.page > 1) {
      this.page--;
      this.loadDeletedSuppliers();
    }
  }

  goToPage(pageNum: number): void {
    if (pageNum !== -1 && pageNum !== this.page) {
      this.page = pageNum;
      this.loadDeletedSuppliers();
    }
  }

  getPageNumbers(): number[] {
    const totalVisiblePages = 5;
    const pages: number[] = [];

    if (this.totalPages <= totalVisiblePages) {
      // If total pages is less than visible pages, show all
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always include first page
      pages.push(1);

      // Calculate start and end of middle pages
      let middleStart = Math.max(2, this.page - 1);
      let middleEnd = Math.min(this.totalPages - 1, this.page + 1);

      // Adjust when close to beginning or end
      if (this.page <= 3) {
        middleEnd = 4;
      } else if (this.page >= this.totalPages - 2) {
        middleStart = this.totalPages - 3;
      }

      // Add ellipsis if needed at the beginning
      if (middleStart > 2) {
        pages.push(-1); // -1 represents ellipsis
      }

      // Add middle pages
      for (let i = middleStart; i <= middleEnd; i++) {
        pages.push(i);
      }

      // Add ellipsis if needed at the end
      if (middleEnd < this.totalPages - 1) {
        pages.push(-1); // -1 represents ellipsis
      }

      // Always include last page
      pages.push(this.totalPages);
    }

    return pages;
  }

  // Helper functions
  getSupplierInitials(supplier: any): string {
    if (!supplier || !supplier.name) return '?';

    const nameParts = supplier.name.split(' ');
    if (nameParts.length === 1) {
      return (nameParts[0].charAt(0) || '?').toUpperCase();
    }

    return (
      (nameParts[0].charAt(0) || '') +
      (nameParts[nameParts.length - 1].charAt(0) || '')
    ).toUpperCase();
  }

  // Restore supplier functions
  onRestore(supplier: any): void {
    this.selectedSupplier = supplier;
    this.showRestoreModal = true;
  }

  cancelRestore(): void {
    this.showRestoreModal = false;
    this.selectedSupplier = null;
  }

  restoreSupplier(supplierId: number): void {
    // Find the supplier object for the modal
    const supplier = this.deletedSuppliers.find(s => s.id === supplierId);
    if (supplier) {
      this.selectedSupplier = supplier;
      this.showRestoreModal = true;
    }
  }

  confirmRestore(): void {
    if (!this.selectedSupplier) return;

    this.isRestoring = true;
    this.restoringId = this.selectedSupplier.id;

    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    this.http
      .put(`${this.configService.apiUrl}admin/supplier/restore/${this.selectedSupplier.id}`, null, { headers })
      .subscribe({
        next: () => {
          this.isRestoring = false;
          this.restoringId = null;
          this.restoredCount++;
          this.customAlertService.show('Success', 'Supplier restored successfully!');
          this.showRestoreModal = false;
          this.selectedSupplier = null;
          this.loadDeletedSuppliers();
        },
        error: (error) => {
          this.isRestoring = false;
          this.restoringId = null;
          this.customAlertService.show('Error', 'Error restoring supplier: ' + (error.message || 'Unknown error'));
        }
      });
  }

  // Math utility for template
  protected readonly Math = Math;
}
