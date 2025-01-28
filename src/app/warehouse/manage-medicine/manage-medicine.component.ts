import { Component, OnInit } from '@angular/core';
import { MedicineService } from '../../services/medicine.service';

@Component({
  selector: 'app-manage-medicine',
  templateUrl: './manage-medicine.component.html',
  styleUrls: ['./manage-medicine.component.css'],
})
export class ManageMedicineComponent implements OnInit {
  medicines: any[] = [];
  suppliers: any[] = [];
  page = 1;
  size = 10;
  search = '';
  totalMedicines = 0;

  editingMedicine: any = null; // For editing a medicine
  showEditModal = false; // Controls the visibility of the edit modal

  constructor(private medicineService: MedicineService) {}

  ngOnInit(): void {
    this.fetchMedicines();
    this.fetchSuppliers();
  }

  fetchMedicines(): void {
    const accessToken = localStorage.getItem('access_token');

    if (accessToken) {
      this.medicineService.getMedicines(this.page, this.size, this.search, accessToken).subscribe({
        next: (response) => {
          console.log('API Response:', response);
          this.medicines = response.content;
          this.totalMedicines = response.totalElements;
        },
        error: (error) => {
          console.error('Failed to fetch medicines:', error);
        },
      });
    } else {
      console.error('No access token found');
    }
  }

  fetchSuppliers(): void {
    this.medicineService.getAllSuppliers(1, 10).subscribe({
      next: (response) => {
        console.log('Fetched suppliers:', response);
        this.suppliers = response.content;
      },
      error: (error) => {
        console.error('Failed to fetch suppliers:', error);
      },
    });
  }

  onSearch(): void {
    this.page = 1; // Reset to the first page when searching
    this.fetchMedicines();
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.fetchMedicines();
  }

  openEditModal(medicine: any): void {
    this.editingMedicine = { ...medicine }; // Create a copy for editing

    // Convert the expiration date to 'yyyy-MM-dd' format for the input field
    if (this.editingMedicine.expirationDate) {
      const expirationDate = new Date(this.editingMedicine.expirationDate);
      this.editingMedicine.expirationDate = expirationDate.toISOString().split('T')[0];
    }

    this.showEditModal = true; // Show the modal
  }

  closeEditModal(): void {
    this.showEditModal = false; // Hide the modal
    this.editingMedicine = null; // Clear the editing medicine
  }

  saveEdit(): void {
    if (this.editingMedicine) {
      // Convert expirationDate to ISO format (if not already in ISO format)
      if (this.editingMedicine.expirationDate) {
        const expirationDate = new Date(this.editingMedicine.expirationDate);
        this.editingMedicine.expirationDate = expirationDate.toISOString();
      }

      // Ensure supplier.id is included
      if (!this.editingMedicine.supplier || !this.editingMedicine.supplier.id) {
        alert('Please select a supplier before saving.');
        return;
      }

      this.medicineService.updateMedicine(this.editingMedicine.id, this.editingMedicine).subscribe({
        next: (response) => {
          console.log('Medicine updated successfully:', response);
          alert('Medicine updated successfully!');
          this.closeEditModal(); // Close the modal
          this.fetchMedicines(); // Refresh the list
        },
        error: (error) => {
          console.error('Error updating medicine:', error);
          alert('Failed to update medicine. Please try again.');
        },
      });
    }
  }


  deleteMedicine(medicineId: number): void {
    if (confirm('Are you sure you want to delete this medicine?')) {
      this.medicineService.deleteMedicine(medicineId).subscribe({
        next: () => {
          console.log('Medicine deleted successfully.');
          alert('Medicine deleted successfully!');
          this.fetchMedicines(); // Refresh the list
        },
        error: (error) => {
          console.error('Failed to delete medicine:', error);
          alert('Failed to delete medicine. Please try again.');
        },
      });
    }
  }

  protected readonly Math = Math;
}
