import { Component, OnInit, HostListener } from '@angular/core';
import { WarehouseService } from '../../services/warehouse.service';
import { CustomAlertService } from "../../services/custom-alert.service";

@Component({
  selector: 'app-manage-warehouse',
  templateUrl: './manage-warehouse.component.html',
  styleUrls: ['./manage-warehouse.component.css','./manage-warehouse-style.css']
})
export class ManageWarehouseComponent implements OnInit {
  // Data
  warehouseStores: any[] = [];

  // Pagination
  page = 1;
  size = 10;
  totalItems = 0;

  // Search and filters
  searchTerm = '';
  sortField = 'id';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Dropdowns
  isSortDropdownOpen = false;
  isPageSizeDropdownOpen = false;

  // Sort options
  sortOptions = [
    { label: 'ID (Ascending)', value: 'id' },
    { label: 'ID (Descending)', value: 'id_desc' },
    { label: 'Medicine Name (A-Z)', value: 'name' },
    { label: 'Medicine Name (Z-A)', value: 'name_desc' },
    { label: 'Quantity (Low to High)', value: 'quantity' },
    { label: 'Quantity (High to Low)', value: 'quantity_desc' }
  ];

  // UI state
  isLoading = false;
  isSubmitting = false;
  viewMode: 'table' | 'grid' = 'table';

  // Edit/Increase modal
  editingStore: any = null;
  showEditModal = false;

  // Decrease modal
  DecreaseStore: any = null;
  showDecreaseModal = false;

  // Quantity for modals
  modalQuantity = 1;

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

  // Check if device is mobile and set appropriate view
  checkScreenSize() {
    const isMobile = window.innerWidth <= 768;

    // On mobile, force grid view
    if (isMobile) {
      this.viewMode = 'grid';
    } else {
      // On desktop, use saved preference or default to table
      const savedViewMode = localStorage.getItem('warehouseViewMode') as 'table' | 'grid';
      if (savedViewMode) {
        this.viewMode = savedViewMode;
      } else {
        this.viewMode = 'table';
      }
    }
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.fetchWarehouseStores();
  }

  fetchWarehouseStores(): void {
    this.isLoading = true;

    // Build query parameters
    const params: any = {
      page: this.page,
      size: this.size
    };

    // Add search term if present
    if (this.searchTerm) {
      params.search = this.searchTerm;
    }

    // Add sorting parameters
    if (this.sortField) {
      // Check if it's a descending sort
      if (this.sortField.includes('_desc')) {
        params.sortBy = this.sortField.replace('_desc', '');
        params.sortDirection = 'desc';
      } else {
        params.sortBy = this.sortField;
        params.sortDirection = this.sortDirection;
      }
    }

    this.warehouseService.getAllWarehouseStores(this.page, this.size).subscribe({
      next: (response) => {
        this.warehouseStores = response.content;
        this.totalItems = response.totalElements;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to fetch warehouse stores:', error);
        this.customAlertService.show('Error', 'Failed to load warehouse data. Please try again.');
        this.isLoading = false;
      },
    });
  }

  // Search methods
  onSearch(): void {
    this.page = 1; // Reset to first page
    this.fetchWarehouseStores();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.onSearch();
  }

  // Sorting methods
  toggleSortDropdown(): void {
    this.isSortDropdownOpen = !this.isSortDropdownOpen;
    this.isPageSizeDropdownOpen = false;
  }

  togglePageSizeDropdown(): void {
    this.isPageSizeDropdownOpen = !this.isPageSizeDropdownOpen;
    this.isSortDropdownOpen = false;
  }

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
    this.fetchWarehouseStores();
  }

  getSortLabel(): string {
    const option = this.sortOptions.find(opt => opt.value === this.sortField);
    return option ? option.label : 'ID (Ascending)';
  }

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

    this.fetchWarehouseStores();
  }

  // Page size change
  changePageSize(newSize: number): void {
    this.size = newSize;
    this.page = 1; // Reset to first page
    this.isPageSizeDropdownOpen = false;
    this.fetchWarehouseStores();
  }

  // Page navigation
  onPageChange(newPage: number): void {
    this.page = newPage;
    this.fetchWarehouseStores();
  }

  // Get page numbers for pagination
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

  // Delete warehouse store
  deleteWarehouseStore(storeId: number): void {
    this.customAlertService.confirm('Confirm Delete', 'Are you sure you want to delete this warehouse store item?').then((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.isSubmitting = true;
      this.warehouseService.deleteWarehouseStore(storeId).subscribe({
        next: () => {
          this.customAlertService.show('Success', 'Warehouse item deleted successfully!');
          this.fetchWarehouseStores();
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Failed to delete warehouse store:', error);
          this.customAlertService.show('Error', 'Failed to delete warehouse item. Please try again.');
          this.isSubmitting = false;
        },
      });
    });
  }

  // Increase quantity modal
  openEditModal(store: any): void {
    this.editingStore = { ...store }; // Create a copy for editing
    this.modalQuantity = 1;
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingStore = null;
    this.modalQuantity = 1;
  }

  // Decrease quantity modal
  openDecreaseModal(store: any): void {
    this.DecreaseStore = { ...store }; // Create a copy for editing
    this.modalQuantity = 1;
    this.showDecreaseModal = true;
  }

  closeDecreaseModal(): void {
    this.showDecreaseModal = false;
    this.DecreaseStore = null;
    this.modalQuantity = 1;
  }

  // Modal quantity controls
  incrementModalQuantity(): void {
    this.modalQuantity++;
  }

  decrementModalQuantity(): void {
    if (this.modalQuantity > 1) {
      this.modalQuantity--;
    }
  }

  // Preview of new stock level after increase
  getNewStockLevel(): number {
    if (!this.editingStore) return 0;
    return (this.editingStore.quantity || 0) + this.modalQuantity;
  }

  // Preview of new stock level after decrease
  getReducedStockLevel(): number {
    if (!this.DecreaseStore) return 0;
    return (this.DecreaseStore.quantity || 0) - this.modalQuantity;
  }

  // Stock level indicators
  getStockStatusClass(store: any): string {
    const quantity = store.quantity || 0;

    if (quantity <= 0) return 'out-of-stock';
    if (quantity < 10) return 'low-stock';
    return 'in-stock';
  }

  getStockStatusText(store: any): string {
    const quantity = store.quantity || 0;

    if (quantity <= 0) return 'Out of Stock';
    if (quantity < 10) return 'Low Stock';
    return 'In Stock';
  }

  // Quantity percentage for visual bar (max at 100)
  getQuantityPercentage(store: any): number {
    const quantity = store.quantity || 0;
    // Scale to a reasonable maximum (e.g., 100 units = 100%)
    return Math.min(100, (quantity / 100) * 100);
  }

  // Stats calculations
  getTotalQuantity(): number {
    return this.warehouseStores.reduce((sum, store) => sum + (store.quantity || 0), 0);
  }

  getLowStockCount(): number {
    return this.warehouseStores.filter(store => (store.quantity || 0) < 10 && (store.quantity || 0) > 0).length;
  }

  // Update quantity (increase)
  updateQuantity(): void {
    if (this.editingStore && this.editingStore.id) {
      if (this.modalQuantity <= 0) {
        this.customAlertService.show('Error', 'Quantity to add must be greater than zero.');
        return;
      }

      this.isSubmitting = true;
      const payload = { quantity: this.modalQuantity };

      // Use the warehouse store ID (not the medicine ID)
      this.warehouseService.updateWarehouseStore(this.editingStore.medicine.id, payload).subscribe({
        next: () => {
          this.customAlertService.show('Success', 'Stock quantity increased successfully!');
          this.closeEditModal();
          this.fetchWarehouseStores();
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Failed to increase quantity:', error);
          this.customAlertService.show('Error', 'Failed to increase quantity. Please try again.');
          this.isSubmitting = false;
        },
      });
    }
  }

  // Decrease quantity
  decreaseQuantity(): void {
    if (this.DecreaseStore && this.DecreaseStore.id) {
      if (this.modalQuantity <= 0) {
        this.customAlertService.show('Error', 'Quantity to decrease must be greater than zero.');
        return;
      }

      if (this.modalQuantity > this.DecreaseStore.quantity) {
        this.customAlertService.show('Error', 'Cannot decrease more than the current stock level.');
        return;
      }

      this.isSubmitting = true;
      const payload = { quantity: this.modalQuantity };

      // Use the warehouse store ID (not the medicine ID)
      console.log('Decrease successful'+this.DecreaseStore.id);
      this.warehouseService.decreaseWarehouseStore(this.DecreaseStore.medicine.id, payload).subscribe({
        next: () => {
          this.customAlertService.show('Success', 'Stock quantity decreased successfully!');
          this.closeDecreaseModal();
          this.fetchWarehouseStores();
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Failed to decrease quantity:', error);
          this.customAlertService.show('Error', 'Failed to decrease quantity. Please try again.');
          this.isSubmitting = false;
        },
      });
    }
  }

  // View mode setting
  setViewMode(mode: 'table' | 'grid'): void {
    this.viewMode = mode;
    localStorage.setItem('warehouseViewMode', mode);
  }

  // For use in template
  protected readonly Math = Math;
}
