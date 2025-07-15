import { Component, OnInit, HostListener } from '@angular/core';
import { MedicineService } from '../../services/medicine.service';
import { CustomAlertService } from "../../services/custom-alert.service";

@Component({
  selector: 'app-manage-medicine',
  templateUrl: './manage-medicine.component.html',
  styleUrls: ['./manage-medicine.component.css','./manage-medicine-style1.css','./manage-medicine-style2.css'],
})
export class ManageMedicineComponent implements OnInit {
  // Data
  medicines: any[] = [];
  suppliers: any[] = [];

  // Pagination
  page = 1;
  size = 10;
  totalMedicines = 0;

  // Search and filters
  search = '';
  sortField = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';
  selectedExpiryFilter = '';

  // Dropdowns
  isExpiryDropdownOpen = false;
  isSortDropdownOpen = false;

  // Sort options
  sortOptions = [
    { label: 'Name (A-Z)', value: 'name' },
    { label: 'Name (Z-A)', value: 'name_desc' },
    { label: 'Buy Price: Low to High', value: 'buyPrice' },
    { label: 'Buy Price: High to Low', value: 'buyPrice_desc' },
    { label: 'Sale Price: Low to High', value: 'purchasePrice' },
    { label: 'Sale Price: High to Low', value: 'purchasePrice_desc' },
    { label: 'Expiration: Soonest', value: 'expirationDate' },
    { label: 'Expiration: Latest', value: 'expirationDate_desc' },
    { label: 'Recently Added', value: 'id_desc' },
    { label: 'Oldest Added', value: 'id' }
  ];

  // UI State
  viewMode: 'table' | 'grid' = 'table';
  isLoading = false;
  isSubmitting = false;

  // Supplier data for dropdown
  supplierPage = 1;
  supplierSize = 10;
  totalSuppliers = 0;
  supplierSearchTerm = '';
  filteredSuppliers: any[] = [];
  isLoadingSuppliers = false;
  showSupplierDropdown = false;

  // Edit Modal
  editingMedicine: any = null;
  showEditModal = false;

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
      // On desktop, use saved preference or default
      const savedViewMode = localStorage.getItem('medicineViewMode') as 'table' | 'grid';
      if (savedViewMode) {
        this.viewMode = savedViewMode;
      }
    }
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.fetchMedicines();
    this.fetchSuppliers(true);

    // Handle clicks outside dropdown menus
    document.addEventListener('click', (event) => {
      const dropdowns = document.querySelectorAll('.action-menu.active');
      dropdowns.forEach(dropdown => {
        if (!dropdown.contains(event.target as Node)) {
          dropdown.classList.remove('active');
        }
      });
    });
  }

  // View mode setting
  setViewMode(mode: 'table' | 'grid'): void {
    this.viewMode = mode;
    localStorage.setItem('medicineViewMode', mode);
  }

  // Fetch medicines with filters
  fetchMedicines(): void {
    this.isLoading = true;
    const accessToken = localStorage.getItem('access_token');

    if (accessToken) {
      // Build params based on active filters
      let params: any = {
        page: this.page,
        size: this.size,
        search: this.search
      };

      // Add expiry filter if selected
      if (this.selectedExpiryFilter) {
        params['expiryStatus'] = this.selectedExpiryFilter;
      }

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

      this.medicineService.getMedicines(this.page, this.size, this.search, accessToken).subscribe({
        next: (response) => {
          this.medicines = response.content;
          this.totalMedicines = response.totalElements;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Failed to fetch medicines:', error);
          this.customAlertService.show('Error', 'Failed to load medicines. Please try again.');
          this.isLoading = false;
        },
      });
    } else {
      console.error('No access token found');
      this.isLoading = false;
    }
  }

  // Fetch suppliers for dropdown
  fetchSuppliers(reset: boolean = false): void {
    if (this.isLoadingSuppliers || (this.totalSuppliers && this.suppliers.length >= this.totalSuppliers && !reset)) return;

    if (reset) {
      this.supplierPage = 1;
      this.suppliers = [];
      this.filteredSuppliers = [];
      this.totalSuppliers = 0;
    }

    this.isLoadingSuppliers = true;
    this.medicineService
      .getAllSuppliers(this.supplierPage, this.supplierSize)
      .subscribe({
        next: (response) => {
          const newSuppliers = response.content.map((supplier: any) => ({
            id: supplier.id,
            displayText: `${supplier.name} - ${supplier.companyName}`,
          }));

          this.suppliers = [...this.suppliers, ...newSuppliers];
          this.filteredSuppliers = this.suppliers; // Update filteredSuppliers with the new data
          this.totalSuppliers = response.totalElements;
          this.supplierPage++;
          this.isLoadingSuppliers = false;
        },
        error: (error) => {
          console.error('Failed to fetch suppliers:', error);
          this.isLoadingSuppliers = false;
          this.customAlertService.show('Error', 'Failed to load suppliers. Please try again.');
        },
      });
  }

  // Handle supplier scroll for lazy loading
  onSupplierScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 50) {
      this.fetchSuppliers();
    }
  }

  // Filter suppliers based on search term
  filterSuppliers(searchTerm: string): void {
    this.supplierSearchTerm = searchTerm;
    if (searchTerm) {
      this.filteredSuppliers = this.suppliers.filter(supplier =>
        supplier.displayText.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else {
      this.filteredSuppliers = this.suppliers;
    }
  }

  // Toggle supplier dropdown
  toggleSupplierDropdown(): void {
    this.showSupplierDropdown = !this.showSupplierDropdown;

    // If opening the dropdown, make sure we have suppliers loaded
    if (this.showSupplierDropdown && this.suppliers.length === 0) {
      this.fetchSuppliers(true);
    }
  }

  // Hide supplier dropdown
  hideSupplierDropdown(): void {
    setTimeout(() => {
      this.showSupplierDropdown = false;
    }, 200); // Delay to allow selection before closing
  }

  // Select supplier
  selectSupplier(supplier: any): void {
    if (!this.editingMedicine) return;

    this.editingMedicine.supplier = {
      id: supplier.id,
      name: supplier.name || supplier.displayText.split(' - ')[0],
      companyName: supplier.companyName || supplier.displayText.split(' - ')[1],
      displayText: supplier.displayText
    };
    this.showSupplierDropdown = false;
  }

  // Search handler
  onSearch(): void {
    this.page = 1; // Reset to the first page when searching
    this.fetchMedicines();
  }

  // Clear search
  clearSearch(): void {
    this.search = '';
    this.onSearch();
  }

  // Toggle expiry dropdown
  toggleExpiryDropdown(): void {
    this.isExpiryDropdownOpen = !this.isExpiryDropdownOpen;
    this.isSortDropdownOpen = false; // Close other dropdown
  }

  // Toggle sort dropdown
  toggleSortDropdown(): void {
    this.isSortDropdownOpen = !this.isSortDropdownOpen;
    this.isExpiryDropdownOpen = false; // Close other dropdown
  }

  // Select expiry filter
  selectExpiryFilter(filter: string): void {
    this.selectedExpiryFilter = filter;
    this.isExpiryDropdownOpen = false;
    this.page = 1; // Reset to first page
    this.fetchMedicines();
  }

  // Select sort option
  selectSortOption(sortOption: string): void {
    this.sortField = sortOption;

    // Extract sort direction if included in the field name
    if (sortOption.includes('_desc')) {
      this.sortDirection = 'desc';
    } else {
      this.sortDirection = 'asc';
    }

    this.isSortDropdownOpen = false;
    this.fetchMedicines();
  }

  // Get sort label for display
  getSortLabel(): string {
    const option = this.sortOptions.find(opt => opt.value === this.sortField);
    return option ? option.label : 'Name (A-Z)';
  }

  // Check if filters are active
  hasActiveFilters(): boolean {
    return !!(this.search || this.selectedExpiryFilter || (this.sortField && this.sortField !== 'name'));
  }

  // Reset all filters
  resetFilters(): void {
    this.search = '';
    this.selectedExpiryFilter = '';
    this.sortField = 'name';
    this.sortDirection = 'asc';
    this.page = 1;
    this.fetchMedicines();
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

  // Pagination handlers
  onPageChange(newPage: number): void {
    this.page = newPage;
    this.fetchMedicines();
  }

  // Create page number array for pagination buttons
  getPageNumbers(): number[] {
    const totalPages = Math.ceil(this.totalMedicines / this.size);
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

  // Sort table by column
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

    this.fetchMedicines();
  }

  // Date formatting
  formatDate(dateString: string): string {
    if (!dateString) return 'No date';

    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) return 'Invalid date';

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Current date for min date in forms
  getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
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

  // Expiry status text
  getExpiryStatusText(medicine: any): string {
    if (!medicine.expirationDate) return 'No expiry date';

    const daysUntilExpiry = this.getDaysUntilExpiration(medicine);

    if (daysUntilExpiry < 0) return 'Expired';
    if (daysUntilExpiry < 30) return 'Expires soon';
    if (daysUntilExpiry < 90) return 'Expiring in 3 months';
    return 'Valid';
  }

  // Calculate profit percentage
  calculateProfitPercentage(medicine: any): string {
    if (!medicine.buyPrice || !medicine.purchasePrice) return '0';

    if (medicine.buyPrice <= 0) return '0';

    const profit = medicine.buyPrice - medicine.purchasePrice;
    const percentage = (profit / medicine.buyPrice) * 100;

    return percentage.toFixed(2);
  }

  // Calculate profit percentage for editing medicine
  calculateProfitPercentageForEdit(): string {
    if (!this.editingMedicine) return '0';

    const { buyPrice, purchasePrice } = this.editingMedicine;

    if (!buyPrice || !purchasePrice || buyPrice <= 0) return '0';

    const profit = buyPrice - purchasePrice;
    const percentage = (profit / buyPrice) * 100;

    return percentage.toFixed(2);
  }

  // Get count of expiring medicines
  getExpiringCount(): number {
    return this.medicines.filter(medicine => {
      const daysUntilExpiry = this.getDaysUntilExpiration(medicine);
      return daysUntilExpiry > 0 && daysUntilExpiry < 90;
    }).length;
  }

  // Get average profit margin across all medicines
  getAverageProfitMargin(): string {
    if (!this.medicines.length) return '0';

    const totalPercentages = this.medicines.reduce((sum, medicine) => {
      const percentage = parseFloat(this.calculateProfitPercentage(medicine));
      return sum + (isNaN(percentage) ? 0 : percentage);
    }, 0);

    return (totalPercentages / this.medicines.length).toFixed(2);
  }



  // Open edit modal
  openEditModal(medicine: any): void {
    this.editingMedicine = { ...medicine }; // Create a copy for editing

    // Convert the expiration date to 'yyyy-MM-dd' format for the input field
    if (this.editingMedicine.expirationDate) {
      const expirationDate = new Date(this.editingMedicine.expirationDate);
      this.editingMedicine.expirationDate = expirationDate.toISOString().split('T')[0];
    }

    // Add displayText property for editing form display
    if (this.editingMedicine.supplier) {
      this.editingMedicine.supplier.displayText =
        `${this.editingMedicine.supplier.name} - ${this.editingMedicine.supplier.companyName}`;
    }

    this.showEditModal = true; // Show the modal
  }

  // Close edit modal
  closeEditModal(): void {
    this.showEditModal = false; // Hide the modal
    this.editingMedicine = null; // Clear the editing medicine
    this.showSupplierDropdown = false; // Ensure dropdown is closed
  }

  // Save edited medicine
  saveEdit(): void {
    if (!this.editingMedicine) return;

    this.isSubmitting = true;

    // Form validation
    if (!this.editingMedicine.name ||
      !this.editingMedicine.buyPrice ||
      !this.editingMedicine.purchasePrice ||
      !this.editingMedicine.expirationDate ||
      !this.editingMedicine.supplier ||
      !this.editingMedicine.supplier.id) {
      this.customAlertService.show('Error', 'Please fill in all required fields');
      this.isSubmitting = false;
      return;
    }

    // Convert expirationDate to ISO format
    if (this.editingMedicine.expirationDate) {
      const expirationDate = new Date(this.editingMedicine.expirationDate);
      this.editingMedicine.expirationDate = expirationDate.toISOString();
    }

    this.medicineService.updateMedicine(this.editingMedicine.id, this.editingMedicine).subscribe({
      next: (response) => {
        this.customAlertService.show('Success', 'Medicine updated successfully!');
        this.closeEditModal();
        this.fetchMedicines(); // Refresh the list
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Error updating medicine:', error);
        this.customAlertService.show('Error', 'Failed to update medicine. Please try again.');
        this.isSubmitting = false;
      },
    });
  }

  // Delete medicine handler
  deleteMedicine(medicineId: number): void {
    this.customAlertService.confirm('Confirm Delete', 'Are you sure you want to delete this medicine?').then((confirmed) => {
      if (!confirmed) return;

      this.isSubmitting = true;
      this.medicineService.deleteMedicine(medicineId).subscribe({
        next: () => {
          this.customAlertService.show('Success', 'Medicine deleted successfully!');
          this.fetchMedicines();
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Failed to delete medicine:', error);
          this.customAlertService.show('Error', 'Failed to delete medicine. Please try again.');
          this.isSubmitting = false;
        },
      });
    });
  }

  // For use in template
  protected readonly Math = Math;
}
