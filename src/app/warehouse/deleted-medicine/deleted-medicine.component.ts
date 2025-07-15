import { Component, OnInit, HostListener } from '@angular/core';
import { MedicineService } from '../../services/medicine.service';
import { CustomAlertService } from "../../services/custom-alert.service";

@Component({
  selector: 'app-deleted-medicine',
  templateUrl: './deleted-medicine.component.html',
  styleUrls: ['./deleted-medicine.component.css','./deleted-medicine-style.css'],
})
export class DeletedMedicineComponent implements OnInit {
  // Data
  deletedMedicines: any[] = [];

  // Pagination
  page = 1;
  size = 10;
  totalDeletedMedicines = 0;

  // Search and sorting
  search = '';
  sortField = 'deletedDate';
  sortDirection: 'asc' | 'desc' = 'desc';

  // UI state
  viewMode: 'table' | 'grid' = 'grid';
  isLoading = false;
  isRestoring = false;

  // Dropdowns
  isSortDropdownOpen = false;
  isPageSizeDropdownOpen = false;

  // Restore tracking
  restoredCount = 0;
  showRestoreModal = false;
  medicineToRestore: any = null;

  // Sort options
  sortOptions = [
    { label: 'Recently Deleted', value: 'deletedDate_desc' },
    { label: 'Oldest Deleted', value: 'deletedDate' },
    { label: 'Name (A-Z)', value: 'name' },
    { label: 'Name (Z-A)', value: 'name_desc' },
    { label: 'ID (Ascending)', value: 'id' },
    { label: 'ID (Descending)', value: 'id_desc' },
    { label: 'Expiring Soonest', value: 'expirationDate' },
    { label: 'Expiring Latest', value: 'expirationDate_desc' }
  ];

  constructor(
    private medicineService: MedicineService,
    private customAlertService: CustomAlertService
  ) {
    this.checkScreenSize();
  }

  // Screen size detection
  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  // Check if device is mobile
  checkScreenSize() {
    const isMobile = window.innerWidth <= 768;

    // Force grid view on mobile
    if (isMobile) {
      this.viewMode = 'grid';
    } else {
      // On desktop, use saved preference or default to table
      const savedViewMode = localStorage.getItem('deletedMedicineViewMode') as 'table' | 'grid';
      if (savedViewMode) {
        this.viewMode = savedViewMode;
      }
    }
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.fetchDeletedMedicines();
  }

  // View mode setting
  setViewMode(mode: 'table' | 'grid'): void {
    this.viewMode = mode;
    localStorage.setItem('deletedMedicineViewMode', mode);
  }

  // Fetch deleted medicines with filters
  fetchDeletedMedicines(): void {
    this.isLoading = true;

    // Build params based on active filters
    let params: any = {
      page: this.page,
      size: this.size,
      search: this.search
    };

    // Add sorting parameters
    if (this.sortField) {
      // Check if it's a descending sort
      if (this.sortField.includes('_desc')) {
        params['sortBy'] = this.sortField.replace('_desc', '');
        params['sortDirection'] = 'desc';
      } else {
        params['sortBy'] = this.sortField;
        params['sortDirection'] = this.sortDirection;
      }
    }

    this.medicineService.getDeletedMedicines(this.page, this.size, this.search).subscribe({
      next: (response) => {
        this.deletedMedicines = response.content;
        this.totalDeletedMedicines = response.totalElements;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to fetch deleted medicines:', error);
        this.customAlertService.show('Error', 'Failed to load deleted medicines. Please try again.');
        this.isLoading = false;
      },
    });
  }

  // Search handler
  onSearch(): void {
    this.page = 1; // Reset to the first page when searching
    this.fetchDeletedMedicines();
  }

  // Clear search
  clearSearch(): void {
    this.search = '';
    this.onSearch();
  }

  // Toggle sort dropdown
  toggleSortDropdown(): void {
    this.isSortDropdownOpen = !this.isSortDropdownOpen;
    this.isPageSizeDropdownOpen = false;
  }

  // Toggle page size dropdown
  togglePageSizeDropdown(): void {
    this.isPageSizeDropdownOpen = !this.isPageSizeDropdownOpen;
    this.isSortDropdownOpen = false;
  }

  // Select sort option
  selectSortOption(sortOption: string): void {
    this.sortField = sortOption;

    // Extract sort direction if included in field name
    if (sortOption.includes('_desc')) {
      this.sortDirection = 'desc';
    } else {
      this.sortDirection = 'asc';
    }

    this.isSortDropdownOpen = false;
    this.page = 1; // Reset to first page
    this.fetchDeletedMedicines();
  }

  // Get sort label for display
  getSortLabel(): string {
    const option = this.sortOptions.find(opt => opt.value === this.sortField);
    return option ? option.label : 'Recently Deleted';
  }

  // Page size change
  changePageSize(newSize: number): void {
    this.size = newSize;
    this.page = 1; // Reset to first page
    this.isPageSizeDropdownOpen = false;
    this.fetchDeletedMedicines();
  }

  // Page navigation
  onPageChange(newPage: number): void {
    this.page = newPage;
    this.fetchDeletedMedicines();
  }

  // Sort by column
  sortBy(field: string): void {
    if (this.sortField === field) {
      // Toggle direction if already sorting by this field
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      this.sortField = this.sortDirection === 'desc' ? `${field}_desc` : field;
    } else {
      // Set new sort field with default ascending direction
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    this.fetchDeletedMedicines();
  }

  // Create page number array for pagination buttons
  getPageNumbers(): number[] {
    const totalPages = Math.ceil(this.totalDeletedMedicines / this.size);
    const totalVisiblePages = 5;
    const pages: number[] = [];

    if (totalPages <= totalVisiblePages) {
      // If total pages is less than visible pages, show all
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always include first page
      pages.push(1);

      // Calculate start and end of middle pages
      let middleStart = Math.max(2, this.page - 1);
      let middleEnd = Math.min(totalPages - 1, this.page + 1);

      // Adjust when close to beginning or end
      if (this.page <= 3) {
        middleEnd = 4;
      } else if (this.page >= totalPages - 2) {
        middleStart = totalPages - 3;
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
      if (middleEnd < totalPages - 1) {
        pages.push(-1); // -1 represents ellipsis
      }

      // Always include last page
      pages.push(totalPages);
    }

    return pages;
  }

  // Date formatting
  formatDate(dateString: string): string {
    if (!dateString) return 'Unknown';

    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) return 'Invalid date';

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Get time ago string
  getTimeAgo(dateString: string): string {
    if (!dateString) return 'Unknown';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';

    const now = new Date();
    const diff = now.getTime() - date.getTime();

    // Convert to seconds, minutes, hours, days
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else if (hours > 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (minutes > 0) {
      return `${minutes} ${minutes === 1 ? 'min' : 'mins'} ago`;
    } else {
      return 'Just now';
    }
  }

  // Get days until expiration
  getDaysUntilExpiration(medicine: any): number {
    if (!medicine.expirationDate) return 0;

    const expiryDate = new Date(medicine.expirationDate);
    const today = new Date();

    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Expiry status classifier
  getExpiryStatusClass(medicine: any): string {
    if (!medicine.expirationDate) return '';

    const daysUntilExpiry = this.getDaysUntilExpiration(medicine);

    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry < 30) return 'expiring-soon';
    if (daysUntilExpiry < 90) return 'expiring-warning';
    return 'valid';
  }

  // Stats methods
  getRestoredCount(): number {
    return this.restoredCount;
  }

  getOldestDeletedDays(): number {
    if (!this.deletedMedicines || this.deletedMedicines.length === 0) return 0;

    let oldestDate: Date | null = null;

    this.deletedMedicines.forEach(medicine => {
      const deletedDate = new Date(medicine.deletedDate || medicine.lastModifiedDate);
      if (!oldestDate || deletedDate < oldestDate) {
        oldestDate = deletedDate;
      }
    });

    if (!oldestDate) return 0;

    const now = new Date();
    const diffTime = now.getTime() - oldestDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Restore medicine methods
  confirmRestore(medicine: any): void {
    this.medicineToRestore = medicine;
    this.showRestoreModal = true;
  }

  closeRestoreModal(): void {
    this.showRestoreModal = false;
    this.medicineToRestore = null;
  }

  restoreMedicine(): void {
    if (!this.medicineToRestore) return;

    this.isRestoring = true;
    const medicineId = this.medicineToRestore.id;

    this.medicineService.restoreMedicine(medicineId).subscribe({
      next: () => {
        this.customAlertService.show('Success', 'Medicine restored successfully!');
        this.restoredCount++;
        this.fetchDeletedMedicines();
        this.closeRestoreModal();
        this.isRestoring = false;
      },
      error: (error) => {
        console.error('Failed to restore medicine:', error);
        this.customAlertService.show('Error', 'Failed to restore medicine. Please try again.');
        this.isRestoring = false;
      },
    });
  }

  // For use in template
  protected readonly Math = Math;
}
