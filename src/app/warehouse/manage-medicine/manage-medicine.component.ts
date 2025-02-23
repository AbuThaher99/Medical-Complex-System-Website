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

  // Supplier Variables for Lazy Loading
  supplierPage = 1;
  supplierSize = 10;
  totalSuppliers = 0;
  supplierSearchTerm = '';
  filteredSuppliers: any[] = [];
  isLoadingSuppliers = false;
  showSupplierDropdown = false;


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
        },
      });
  }

  onSupplierScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 10) {
      this.fetchSuppliers();
    }
  }
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
  toggleSupplierDropdown(): void {
    this.showSupplierDropdown = !this.showSupplierDropdown;
  }

  hideSupplierDropdown(): void {
    setTimeout(() => {
      this.showSupplierDropdown = false;
    }, 200); // Delay to allow selection before closing
  }
  selectSupplier(supplier: any): void {
    this.editingMedicine.supplier = { id: supplier.id };
    this.editingMedicine.supplier.displayText = supplier.displayText;
    this.showSupplierDropdown = false;
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

    // Set the supplier's displayText if it exists
    if (this.editingMedicine.supplier) {
      const supplier = this.suppliers.find(s => s.id === this.editingMedicine.supplier.id);
      if (supplier) {
        this.editingMedicine.supplier.displayText = supplier.displayText;
      }
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
