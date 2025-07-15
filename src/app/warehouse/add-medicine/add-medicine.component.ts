import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MedicineService } from '../../services/medicine.service';
import { CustomAlertService } from "../../services/custom-alert.service";
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-medicine',
  templateUrl: './add-medicine.component.html',
  styleUrls: ['./add-medicine.component.css','./add-medicine-style.css'],
})
export class AddMedicineComponent implements OnInit {
  @ViewChild('medicineForm') medicineForm!: NgForm;
  @ViewChild('supplierInput') supplierInput!: ElementRef;
  @ViewChild('scanner') scannerElement!: ElementRef;

  // UI State
  isSubmitting: boolean = false;
  showSupplierDropdown: boolean = false;
  showPreview: boolean = true;
  currentStep: number = 1;
  isMobileView: boolean = false;
  screenWidth: number = 0;
  medicineImage: string | null = null;
  showScanner: boolean = false;
  scannerSupported: boolean = false;

  // Supplier Data
  suppliers: any[] = [];
  filteredSuppliers: any[] = [];
  supplierPage: number = 1;
  supplierSize: number = 10;
  totalSuppliers: number = 0;
  supplierSearchTerm: string = '';
  isLoadingSuppliers: boolean = false;

  // Medicine Form Data
  medicine = {
    name: '',
    buyPrice: 0,
    purchasePrice: 0,
    expirationDate: this.getCurrentDate(),
    quantity: 0,
    dosage: '',
    supplier: {
      id: null,
      displayText: ''
    },
  };


  constructor(
    private medicineService: MedicineService,
    private customAlertService: CustomAlertService,
    private router: Router
  ) {
    this.checkScreenSize();
  }

  ngOnInit(): void {
    this.fetchSuppliers();
    this.checkScannerSupport();
  }

  // Check if barcode scanner is supported
  checkScannerSupport(): void {
    this.scannerSupported = 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
  }

  // Start barcode scanner
  startScanner(): void {
    this.showScanner = true;

    // We'll implement this in a real app with a barcode scanning library
    // For now, just simulate scanning after a delay
    setTimeout(() => {
      this.closeScanner();
      this.medicine.name = "Scanned Medicine " + Math.floor(Math.random() * 1000);
      this.customAlertService.show('Success', 'Barcode scanned successfully!');
    }, 3000);
  }

  // Close barcode scanner
  closeScanner(): void {
    this.showScanner = false;
  }

  // Check screen size and set mobile view
  @HostListener('window:resize', ['$event'])
  checkScreenSize(): void {
    this.screenWidth = window.innerWidth;
    this.isMobileView = window.innerWidth <= 768;
  }

  // Navigate to next step (mobile)
  nextStep(): void {
    if (this.currentStep < 3) {
      this.currentStep++;
    }
  }

  // Navigate to previous step (mobile)
  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  // Go to specific step (mobile)
  goToStep(step: number): void {
    if (step >= 1 && step <= 3) {
      this.currentStep = step;
    }
  }

  // Toggle preview visibility
  togglePreview(): void {
    this.showPreview = !this.showPreview;
  }

  // Get total profit based on quantity
  getTotalProfit(): string {
    if (!this.medicine.buyPrice || !this.medicine.purchasePrice || !this.medicine.quantity) return '0.00';

    const profitPerUnit = this.medicine.buyPrice - this.medicine.purchasePrice;
    const totalProfit = profitPerUnit * this.medicine.quantity;

    return totalProfit.toFixed(2);
  }

  // Format date for display
  formatDate(dateString: string): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Get days until expiration
  getDaysUntilExpiration(): number {
    if (!this.medicine.expirationDate) return 0;

    const today = new Date();
    const expiryDate = new Date(this.medicine.expirationDate);
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  }

  // Handle image selection
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        this.medicineImage = e.target.result;
      };

      reader.readAsDataURL(input.files[0]);
    }
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Don't close if clicking inside the dropdown
    const dropdown = document.querySelector('.custom-dropdown');
    if (dropdown && !dropdown.contains(event.target as Node) && !this.isEventFromSupplierInput(event)) {
      this.hideSupplierDropdown();
    }
  }

  // Helper to check if click is from supplier input
  isEventFromSupplierInput(event: MouseEvent): boolean {
    if (!this.supplierInput) return false;
    return this.supplierInput.nativeElement.contains(event.target as Node);
  }

  // Gets the current date in YYYY-MM-DD format for min date
  getCurrentDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  // Toggle supplier dropdown
  toggleSupplierDropdown(): void {
    this.showSupplierDropdown = !this.showSupplierDropdown;

    // Focus the input if opening dropdown
    if (this.showSupplierDropdown && this.supplierInput) {
      setTimeout(() => {
        this.supplierInput.nativeElement.focus();
      }, 0);
    }

    // Fetch more suppliers if needed
    if (this.showSupplierDropdown && this.suppliers.length === 0) {
      this.fetchSuppliers(true);
    }
  }

  // Hide supplier dropdown
  hideSupplierDropdown(): void {
    this.showSupplierDropdown = false;
  }

  // Fetch suppliers with pagination
  fetchSuppliers(reset: boolean = false): void {
    // Skip if already loading or if we've reached the end of the list
    if (this.isLoadingSuppliers || (this.totalSuppliers && this.suppliers.length >= this.totalSuppliers && !reset)) {
      return;
    }

    // Reset state if requested
    if (reset) {
      this.supplierPage = 1;
      this.suppliers = [];
      this.filteredSuppliers = [];
      this.totalSuppliers = 0;
    }

    this.isLoadingSuppliers = true;

    this.medicineService.getAllSuppliers(this.supplierPage, this.supplierSize).subscribe({
      next: (response) => {
        const newSuppliers = response.content.map((supplier: any) => ({
          id: supplier.id,
          displayText: `${supplier.name} - ${supplier.companyName}`,
        }));

        this.suppliers = [...this.suppliers, ...newSuppliers];

        // Apply any active filter
        if (this.supplierSearchTerm) {
          this.filterSuppliers(this.supplierSearchTerm);
        } else {
          this.filteredSuppliers = this.suppliers;
        }

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

  // Handle scroll event to load more suppliers
  onSupplierScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 50) {
      this.fetchSuppliers();
    }
  }

  // Filter suppliers based on search term
  filterSuppliers(searchTerm: string): void {
    this.supplierSearchTerm = searchTerm;
    this.filteredSuppliers = this.suppliers.filter((supplier) =>
      supplier.displayText.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Select a supplier from the dropdown
  selectSupplier(supplier: any): void {
    this.medicine.supplier = {
      id: supplier.id,
      displayText: supplier.displayText,
    };
    this.showSupplierDropdown = false;
  }

  // Calculate profit margin percentage
  getProfitMargin(): string {
    if (!this.medicine.buyPrice || !this.medicine.purchasePrice) return '0.00';

    const profit = this.medicine.buyPrice - this.medicine.purchasePrice;
    const margin = (profit / this.medicine.buyPrice) * 100;

    return margin.toFixed(2);
  }

  // Get profit margin CSS class
  getProfitMarginClass(): string {
    const margin = parseFloat(this.getProfitMargin());

    if (margin < 15) return 'low';
    if (margin < 30) return 'medium';
    return 'high';
  }

  // Get profit meter width for visualization
  getProfitMeterWidth(): string {
    const margin = parseFloat(this.getProfitMargin());
    // Cap at 50% for the meter (50% profit is already excellent)
    const cappedMargin = Math.min(margin, 50);

    return `${cappedMargin * 2}%`;
  }

  // Form submission handler
  onSubmit(): void {
    if (this.medicineForm.invalid || !this.medicine.supplier.id) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.medicineForm.controls).forEach(key => {
        this.medicineForm.controls[key].markAsTouched();
      });

      if (!this.medicine.supplier.id) {
        this.customAlertService.show('Error', 'Please select a supplier.');
      }

      // If on mobile, navigate to the appropriate step with errors
      if (this.isMobileView) {
        if (!this.medicine.name || !this.medicine.supplier.id) {
          this.goToStep(1);
        } else if (!this.medicine.buyPrice || !this.medicine.purchasePrice || !this.medicine.expirationDate) {
          this.goToStep(2);
        }
      }

      return;
    }

    this.isSubmitting = true;

    this.medicineService.addMedicine(this.medicine).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.customAlertService.show('Success', 'Medicine added successfully!');

        // Redirect to medicine list or reset form based on preference
        // this.router.navigate(['/warehouse/medicines']);
        this.resetForm();

        // Reset to first step if on mobile
        if (this.isMobileView) {
          this.goToStep(1);
        }
      },
      error: (error) => {
        this.isSubmitting = false;

        if (error.status === 401) {
          this.customAlertService.show('Error', 'Unauthorized! Please log in again.');
        } else if (error.status === 400) {
          this.customAlertService.show('Error', 'Bad request! Check the submitted data.');
        } else {
          this.customAlertService.show('Error', 'Failed to add medicine. Please try again.');
        }
      },
    });
  }

  // Reset form to initial state
  resetForm(): void {
    this.medicine = {
      name: '',
      buyPrice: 0,
      purchasePrice: 0,
      expirationDate: this.getCurrentDate(),
      quantity: 0,
      dosage: '',
      supplier: {
        id: null,
        displayText: ''
      },
    };

    this.medicineImage = null;

    // Reset form validation state
    if (this.medicineForm) {
      this.medicineForm.resetForm();
    }
  }
}
