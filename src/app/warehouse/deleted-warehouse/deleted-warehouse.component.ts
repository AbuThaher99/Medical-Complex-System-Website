import { Component, OnInit, HostListener } from '@angular/core';
import { WarehouseService } from '../../services/warehouse.service';
import { CustomAlertService } from "../../services/custom-alert.service";

@Component({
  selector: 'app-deleted-warehouse',
  templateUrl: './deleted-warehouse.component.html',
  styleUrls: ['./deleted-warehouse.component.css','./deleted-warehouse-style.css'],
})
export class DeletedWarehouseComponent implements OnInit {
  // Data
  deletedWarehouseStores: any[] = [];

  // Pagination
  page = 1;
  size = 10;
  totalItems = 0;

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
  storeToRestore: any = null;

  // Sort options
  sortOptions = [
    { label: 'Recently Deleted', value: 'deletedDate_desc' },
    { label: 'Oldest Deleted', value: 'deletedDate' },
    { label: 'Medicine Name (A-Z)', value: 'medicineName' },
    { label: 'Medicine Name (Z-A)', value: 'medicineName_desc' },
    { label: 'ID (Ascending)', value: 'id' },
    { label: 'ID (Descending)', value: 'id_desc' },
    { label: 'Quantity (Low to High)', value: 'quantity' },
    { label: 'Quantity (High to Low)', value: 'quantity_desc' }
  ];

  constructor(
    private warehouseService: WarehouseService,
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
      const savedViewMode = localStorage.getItem('deletedWarehouseViewMode') as 'table' | 'grid';
      if (savedViewMode) {
        this.viewMode = savedViewMode;
      }
    }
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.fetchDeletedWarehouseStores();
  }

  // View mode setting
  setViewMode(mode: 'table' | 'grid'): void {
    this.viewMode = mode;
    localStorage.setItem('deletedWarehouseViewMode', mode);
  }

  // Fetch deleted warehouse stores with filters
  fetchDeletedWarehouseStores(): void {
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

    this.warehouseService.getDeletedWarehouseStores(this.page, this.size).subscribe({
      next: (response) => {
        this.deletedWarehouseStores = response.content;
        this.totalItems = response.totalElements;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to fetch deleted warehouse stores:', error);
        this.customAlertService.show('Error', 'Failed to load deleted warehouse stores. Please try again.');
        this.isLoading = false;
      },
    });
  }

  // Search handler
  onSearch(): void {
    this.page = 1; // Reset to the first page when searching
    this.fetchDeletedWarehouseStores();
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
    this.fetchDeletedWarehouseStores();
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
    this.fetchDeletedWarehouseStores();
  }

  // Page navigation
  onPageChange(newPage: number): void {
    this.page = newPage;
    this.fetchDeletedWarehouseStores();
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

    this.fetchDeletedWarehouseStores();
  }

  // Create page number array for pagination buttons
  getPageNumbers(): number[] {
    const totalPages = Math.ceil(this.totalItems / this.size);
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

  // Stats methods
  getRestoredCount(): number {
    return this.restoredCount;
  }

  getOldestDeletedDays(): number {
    if (!this.deletedWarehouseStores || this.deletedWarehouseStores.length === 0) return 0;

    let oldestDate: Date | null = null;

    this.deletedWarehouseStores.forEach(store => {
      const deletedDate = new Date(store.deletedDate || store.lastModifiedDate);
      if (!oldestDate || deletedDate < oldestDate) {
        oldestDate = deletedDate;
      }
    });

    if (!oldestDate) return 0;

    const now = new Date();
    const diffTime = now.getTime() - oldestDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Restore warehouse store methods
  confirmRestore(store: any): void {
    this.storeToRestore = store;
    this.showRestoreModal = true;
  }

  closeRestoreModal(): void {
    this.showRestoreModal = false;
    this.storeToRestore = null;
  }

  restoreWarehouseStore(): void {
    if (!this.storeToRestore) return;

    this.isRestoring = true;
    const storeId = this.storeToRestore.medicine.id;

    this.warehouseService.restoreWarehouseStore(storeId).subscribe({
      next: () => {
        this.customAlertService.show('Success', 'Warehouse store restored successfully!');
        this.restoredCount++;
        this.fetchDeletedWarehouseStores();
        this.closeRestoreModal();
        this.isRestoring = false;
      },
      error: (error) => {
        console.error('Failed to restore warehouse store:', error);
        this.customAlertService.show('Error', 'Failed to restore warehouse store. Please try again.');
        this.isRestoring = false;
      },
    });
  }

  // For use in template
  protected readonly Math = Math;
}
