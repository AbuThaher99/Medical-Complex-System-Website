import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap, tap, finalize, catchError } from 'rxjs/operators';
import { ConfigService } from "../../services/config.service";
import { CustomAlertService } from "../../services/custom-alert.service";
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-suppliers',
  templateUrl: './suppliers.component.html',
  styleUrls: ['./suppliers.component.css','./suppliers-style1.css','./suppliers-style2.css'],
})
export class SuppliersComponent implements OnInit {
  @ViewChild('editForm') editForm!: NgForm;

  // Screen size detection
  isMobile: boolean = false;

  // Form controls
  filterForm: FormGroup;
  searchControl = new FormControl('');
  companyControl = new FormControl('');

  // Data
  suppliers: any[] = [];
  filteredMedicines: any[] = [];
  companyList: string[] = [];
  isLoadingCompanies: boolean = false;

  // Stats
  totalSuppliers: number = 0;
  totalMedicines: number = 0;
  uniqueCompanies: number = 0;

  // Pagination
  page: number = 1;
  size: number = 10;
  totalPages: number = 1;
  totalItems: number = 0;

  // UI State
  viewMode: 'table' | 'grid' = 'grid';
  isLoading: boolean = false;
  isSubmitting: boolean = false;
  isDeleting: boolean = false;
  showEditModal: boolean = false;
  showMedicinesModal: boolean = false;
  showDeleteModal: boolean = false;
  selectedSupplier: any = null;
  medicineSearch: string = '';
  medicines: any[] = [];

  // Sorting
  sortField: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  isCompanyDropdownOpen: boolean = false;
  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
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
  // Check if device is mobile
  checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;

    // Force grid view on mobile
    if (this.isMobile) {
      this.viewMode = 'grid';
    } else {
      // On desktop, use saved preference or default
      const savedViewMode = localStorage.getItem('suppliersViewMode') as 'table' | 'grid';
      if (savedViewMode) {
        this.viewMode = savedViewMode;
      }
    }
  }

  ngOnInit(): void {
    // Check screen size
    this.checkScreenSize();

    // Load suppliers
    this.loadSuppliers();

    // Set up search with auto-filtering
    this.searchControl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.page = 1;
        this.loadSuppliers();
      });

    // Set up company filter with auto-filtering
    this.companyControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe((value) => {
        this.page = 1;
        this.loadSuppliers();
      });

    // Load companies with lazy loading approach
    this.setupLazyCompanyLoading();

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

  // Setup lazy loading for company dropdown
  setupLazyCompanyLoading(): void {
    // Load companies when dropdown is focused
    this.extractCompanyList();
  }

  // Fetch all suppliers with filters
  loadSuppliers(): void {
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
      .get<any>(`${this.configService.apiUrl}admin/supplier`, { params, headers })
      .subscribe({
        next: (response) => {
          this.suppliers = response.content || [];
          this.totalPages = response.totalPages || 1;
          this.totalItems = response.totalElements || this.suppliers.length;

          // Calculate stats
          this.updateStats();

          this.isLoading = false;
        },
        error: (error) => {
          console.error('Failed to load suppliers:', error);
          this.customAlertService.show('Error', 'Failed to load suppliers. Please try again.');
          this.isLoading = false;
        }
      });
  }

  // Fetch company name list for filter dropdown with loading indicator


  // Extract unique company names from loaded suppliers
  // Extract unique company names from loaded suppliers
  extractCompanyList(): void {
    this.isLoadingCompanies = true;

    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    // Increase the size parameter to get more companies at once
    const params = new HttpParams()
      .set('page', '1')
      .set('size', '100'); // Changed from 6 to 100 to get more companies

    this.http
      .get<any>(`${this.configService.apiUrl}admin/supplier`, { params, headers })
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

            // Log for debugging
            console.log('Loaded companies:', this.companyList);
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
    this.totalSuppliers = this.totalItems;

    // Count unique companies
    const companies = this.suppliers.map(s => s.companyName);
    this.uniqueCompanies = new Set(companies).size;

    // Count total medicines
    let medicineCount = 0;
    this.suppliers.forEach(supplier => {
      if (supplier.medicines && Array.isArray(supplier.medicines)) {
        medicineCount += supplier.medicines.length;
      }
    });
    this.totalMedicines = medicineCount;
  }

  // Refresh data
  refreshData(): void {
    this.loadSuppliers();
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

    this.loadSuppliers();
  }

  resetFilters(): void {
    this.searchControl.setValue('');
    this.companyControl.setValue('');
    this.page = 1;
    this.loadSuppliers();
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }

  hasActiveFilters(): boolean {
    return !!(this.searchControl.value || this.companyControl.value);
  }

  // View mode management
  setViewMode(mode: 'table' | 'grid'): void {
    // Only change view mode if not on mobile
    if (!this.isMobile) {
      this.viewMode = mode;
      localStorage.setItem('suppliersViewMode', mode);
    }
  }

  // Toggle card action menu
  toggleCardMenu(event: Event): void {
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    const menu = target.closest('.action-menu');

    // Close all other menus first
    document.querySelectorAll('.action-menu.active').forEach(element => {
      if (element !== menu) {
        element.classList.remove('active');
      }
    });

    // Toggle the clicked menu
    menu?.classList.toggle('active');
  }

  // Pagination
  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadSuppliers();
    }
  }

  previousPage(): void {
    if (this.page > 1) {
      this.page--;
      this.loadSuppliers();
    }
  }

  goToPage(pageNum: number): void {
    if (pageNum !== -1 && pageNum !== this.page) {
      this.page = pageNum;
      this.loadSuppliers();
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

  isExpired(dateString: string): boolean {
    if (!dateString) return false;
    const expiryDate = new Date(dateString);
    const today = new Date();
    return expiryDate < today;
  }

  isExpiringWithin(dateString: string, days: number): boolean {
    if (!dateString) return false;
    const expiryDate = new Date(dateString);
    const today = new Date();

    // Check if already expired
    if (expiryDate < today) return false;

    // Add days to today's date
    const warningDate = new Date();
    warningDate.setDate(today.getDate() + days);

    return expiryDate <= warningDate;
  }

  // Modal handling
  openEditModal(supplier: any): void {
    this.selectedSupplier = { ...supplier }; // Clone the supplier object
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedSupplier = null;
  }

  openMedicinesModal(supplier: any): void {
    this.selectedSupplier = supplier;
    this.medicines = supplier.medicines || [];
    this.filteredMedicines = [...this.medicines];
    this.medicineSearch = '';
    this.showMedicinesModal = true;
  }

  closeMedicinesModal(): void {
    this.showMedicinesModal = false;
    this.selectedSupplier = null;
    this.medicines = [];
    this.filteredMedicines = [];
  }

  filterMedicines(): void {
    if (!this.medicineSearch.trim()) {
      this.filteredMedicines = [...this.medicines];
      return;
    }

    const searchLower = this.medicineSearch.toLowerCase();
    this.filteredMedicines = this.medicines.filter(medicine =>
      medicine.name.toLowerCase().includes(searchLower)
    );
  }

  // Delete supplier
  onDelete(supplier: any): void {
    this.selectedSupplier = supplier;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.selectedSupplier = null;
  }

  confirmDelete(): void {
    if (!this.selectedSupplier) return;

    this.isDeleting = true;
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    this.http
      .delete(`${this.configService.apiUrl}admin/supplier/${this.selectedSupplier.id}`, { headers })
      .subscribe({
        next: () => {
          this.isDeleting = false;
          this.customAlertService.show('Success', 'Supplier deleted successfully!');
          this.showDeleteModal = false;
          this.selectedSupplier = null;
          this.loadSuppliers();
        },
        error: (error) => {
          this.isDeleting = false;
          this.customAlertService.show('Error', 'Error deleting supplier: ' + (error.message || 'Unknown error'));
        }
      });
  }

  // Update supplier
  saveUpdatedSupplier(): void {
    if (this.editForm.invalid) {
      // Mark all fields as touched to trigger validation
      Object.keys(this.editForm.controls).forEach(key => {
        this.editForm.controls[key].markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    // Prepare the updated data
    const updatedSupplier = {
      name: this.selectedSupplier.name,
      companyName: this.selectedSupplier.companyName,
      phone: this.selectedSupplier.phone,
      address: this.selectedSupplier.address,
    };

    this.http
      .put(
        `${this.configService.apiUrl}admin/supplier/?id=${this.selectedSupplier.id}`,
        updatedSupplier,
        { headers }
      )
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.customAlertService.show('Success', 'Supplier updated successfully!');
          this.closeEditModal();
          this.loadSuppliers();
        },
        error: (error) => {
          this.isSubmitting = false;
          this.customAlertService.show('Error', 'Error updating supplier: ' + (error.message || 'Unknown error'));
        }
      });
  }

  // Math utility for template
  protected readonly Math = Math;
}
