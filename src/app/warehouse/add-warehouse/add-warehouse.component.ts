import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { WarehouseService } from '../../services/warehouse.service';
import { CustomAlertService } from "../../services/custom-alert.service";

@Component({
  selector: 'app-add-warehouse',
  templateUrl: './add-warehouse.component.html',
  styleUrls: ['./add-warehouse.component.css']
})
export class AddWarehouseComponent implements OnInit {
  @ViewChild('warehouseForm') warehouseForm!: NgForm;

  // Medicine selection data
  medicines: any[] = [];
  selectedMedicineId: number | null = null;
  quantity: number | null = 1; // Default to 1
  filteredMedicines: any[] = [];

  // UI states
  medicinePage = 1;
  medicineSize = 10;
  totalMedicines = 0;
  medicineSearchTerm = '';
  isLoadingMedicines = false;
  showMedicineDropdown = false;
  isSubmitting = false;

  constructor(
    private warehouseService: WarehouseService,
    private customAlertService: CustomAlertService
  ) {}

  ngOnInit(): void {
    this.fetchMedicines();
  }

  // Fetch medicines with pagination
  fetchMedicines(reset: boolean = false): void {
    if (this.isLoadingMedicines || (this.totalMedicines && this.medicines.length >= this.totalMedicines && !reset)) return;

    if (reset) {
      this.medicinePage = 1;
      this.medicines = [];
      this.filteredMedicines = [];
      this.totalMedicines = 0;
    }

    this.isLoadingMedicines = true;

    this.warehouseService.getAllMedicines(this.medicinePage, this.medicineSize).subscribe({
      next: (response) => {
        const newMedicines = response.content.map((medicine: any) => ({
          id: medicine.id,
          name: medicine.name,
          expirationDate: medicine.expirationDate,
          supplier: medicine.supplier
        }));

        this.medicines = [...this.medicines, ...newMedicines];
        this.filteredMedicines = this.medicines; // Update filteredMedicines with the new data
        this.totalMedicines = response.totalElements;
        this.medicinePage++;
        this.isLoadingMedicines = false;
      },
      error: (error) => {
        console.error('Failed to fetch medicines:', error);
        this.isLoadingMedicines = false;
        this.customAlertService.show('Error', 'Failed to load medicines. Please try again.');
      }
    });
  }

  // Handle scrolling in the dropdown to load more medicines
  onMedicineScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 10) {
      this.fetchMedicines();
    }
  }

  // Filter medicines based on search term
  filterMedicines(searchTerm: string): void {
    this.medicineSearchTerm = searchTerm;
    if (searchTerm) {
      this.filteredMedicines = this.medicines.filter(medicine =>
        medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (medicine.supplier?.id && medicine.supplier.id.toString().includes(searchTerm))
      );
    } else {
      this.filteredMedicines = this.medicines;
    }
  }

  // Toggle medicine dropdown visibility
  toggleMedicineDropdown(): void {
    this.showMedicineDropdown = !this.showMedicineDropdown;
  }

  // Hide dropdown after selection
  hideMedicineDropdown(): void {
    setTimeout(() => {
      this.showMedicineDropdown = false;
    }, 200); // Short delay to allow click events to complete
  }

  // Select a medicine from dropdown
  selectMedicine(medicine: any): void {
    this.selectedMedicineId = medicine.id;

    // Format a descriptive string for the selected medicine
    const expiryDate = new Date(medicine.expirationDate).toLocaleDateString();
    this.medicineSearchTerm = `${medicine.name} - ${expiryDate}${medicine.supplier?.id ? ` - Supplier ID: ${medicine.supplier.id}` : ''}`;

    this.showMedicineDropdown = false;
  }

  // Quantity management
  increaseQuantity(): void {
    if (this.quantity === null) {
      this.quantity = 1;
    } else {
      this.quantity++;
    }
  }

  decreaseQuantity(): void {
    if (this.quantity === null || this.quantity <= 1) {
      this.quantity = 1;
    } else {
      this.quantity--;
    }
  }

  // Form submission
  onSubmit(): void {
    if (!this.selectedMedicineId || !this.quantity || this.quantity < 1) {
      // The form is invalid, validation errors will be shown
      return;
    }

    this.isSubmitting = true;

    const payload = {
      quantity: this.quantity,
      medicine: { id: this.selectedMedicineId },
    };

    this.warehouseService.addToWarehouse(payload).subscribe({
      next: (response) => {
        console.log('Medicine added to warehouse successfully:', response);
        this.customAlertService.show('Success', 'Medicine added to warehouse successfully!');
        this.resetForm();
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Failed to add medicine to warehouse:', error);
        this.customAlertService.show('Error', 'Failed to add medicine to warehouse. Please try again.');
        this.isSubmitting = false;
      },
    });
  }

  // Reset form to initial state
  resetForm(): void {
    this.selectedMedicineId = null;
    this.quantity = 1;
    this.medicineSearchTerm = '';
    this.filteredMedicines = this.medicines; // Reset filtered medicines to show all

    // Reset form validation state if the form exists
    if (this.warehouseForm) {
      this.warehouseForm.resetForm();
    }
  }
}
