import { Component, OnInit } from '@angular/core';
import { WarehouseService } from '../../services/warehouse.service';
import {CustomAlertService} from "../../services/custom-alert.service";

@Component({
  selector: 'app-add-warehouse',
  templateUrl: './add-warehouse.component.html',
  styleUrl: './add-warehouse.component.css'
})
export class AddWarehouseComponent {
  medicines: any[] = [];
  selectedMedicineId: number | null = null;
  quantity: number | null = null;
  filteredMedicines: any[] = [];


  medicinePage = 1;
  medicineSize = 10;
  totalMedicines = 0;
  medicineSearchTerm = '';
  isLoadingMedicines = false;
  showMedicineDropdown = false;

  constructor(private warehouseService: WarehouseService,private customAlertService: CustomAlertService) {}

  ngOnInit(): void {
    this.fetchMedicines();
  }

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
      }
    });
  }

  onMedicineScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 10) {
      this.fetchMedicines();
    }
  }
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
  toggleMedicineDropdown(): void {
    this.showMedicineDropdown = !this.showMedicineDropdown;
  }

  hideMedicineDropdown(): void {
    setTimeout(() => {
      this.showMedicineDropdown = false;
    }, 200); // Allows selection before hiding
  }
  selectMedicine(medicine: any): void {
    this.selectedMedicineId = medicine.id;
    this.medicineSearchTerm = `${medicine.name} - ${new Date(medicine.expirationDate).toLocaleDateString()} - Supplier ID: ${medicine.supplier?.id}`;
    this.showMedicineDropdown = false;
  }

  onSubmit(): void {
    if (!this.selectedMedicineId || !this.quantity) {
      this.customAlertService.show('Error', 'Please select a medicine and enter a valid quantity.');
      return;
    }

    const payload = {
      quantity: this.quantity,
      medicine: { id: this.selectedMedicineId },
    };

    this.warehouseService.addToWarehouse(payload).subscribe({
      next: (response) => {
        console.log('Medicine added to warehouse successfully:', response);
        this.customAlertService.show('Success', 'Medicine added to warehouse successfully!');
        this.fetchMedicines();
        this.resetForm();
      },
      error: (error) => {
        console.error('Failed to add medicine to warehouse:', error);
        this.customAlertService.show('Error', 'Failed to add medicine to warehouse. Please try again.');

      },
    });
  }

  resetForm(): void {
    this.selectedMedicineId = null;
    this.quantity = null;
    this.medicineSearchTerm = '';
    this.filteredMedicines = this.medicines; // Reset filtered medicines to show all
  }
}
