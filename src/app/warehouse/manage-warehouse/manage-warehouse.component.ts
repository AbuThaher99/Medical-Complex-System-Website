import { Component } from '@angular/core';
import { WarehouseService } from '../../services/warehouse.service';

@Component({
  selector: 'app-manage-warehouse',
  templateUrl: './manage-warehouse.component.html',
  styleUrl: './manage-warehouse.component.css'
})
export class ManageWarehouseComponent {
  warehouseStores: any[] = [];
  page = 1;
  size = 10;
  totalItems = 0;
  editingStore: any = null; // For editing a warehouse store item
  showEditModal = false;

  DecreaseStore: any = null; // For editing a warehouse store item
  showDecreaseModal = false;

  constructor(private warehouseService: WarehouseService) {}

  ngOnInit(): void {
    this.fetchWarehouseStores();
  }

  fetchWarehouseStores(): void {
    this.warehouseService.getAllWarehouseStores(this.page, this.size).subscribe({
      next: (response) => {
        console.log('API Response:', response);
        this.warehouseStores = response.content;
        this.totalItems = response.totalElements;
      },
      error: (error) => {
        console.error('Failed to fetch warehouse stores:', error);
      },
    });
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.fetchWarehouseStores();
  }

  deleteWarehouseStore(storeId: number): void {
    if (confirm('Are you sure you want to delete this warehouse store?')) {
      this.warehouseService.deleteWarehouseStore(storeId).subscribe({
        next: () => {
          console.log('Warehouse store deleted successfully.');
          alert('Warehouse store deleted successfully!');
          this.fetchWarehouseStores(); // Refresh the list
        },
        error: (error) => {
          console.error('Failed to delete warehouse store:', error);
          alert('Failed to delete warehouse store. Please try again.');
        },
      });
    }
  }

  openEditModal(store: any): void {
    this.editingStore = { ...store }; // Create a copy for editing
    this.showEditModal = true; // Show the modal
  }

  closeEditModal(): void {
    this.showEditModal = false; // Hide the modal
    this.editingStore = null; // Clear the editing store
  }

  openDecreaseModal(store: any): void {
    this.DecreaseStore = { ...store }; // Create a copy for editing
    this.showDecreaseModal = true; // Show the modal
  }

  closeDecreaseModal(): void {
    this.showDecreaseModal = false; // Hide the modal
    this.DecreaseStore = null; // Clear the editing store
  }

  updateQuantity(): void {
    if (this.editingStore && this.editingStore.id) {
      const incrementValue = Number((document.getElementById('increaseQuantity') as HTMLInputElement).value); // Get the user input

      if (incrementValue <= 0) {
        alert("Quantity to add must be greater than zero.");
        return;
      }

      const payload = { quantity: incrementValue }; // Send only the amount to increase

      console.log("Sending increment request:", payload);

      this.warehouseService.updateWarehouseStore(this.editingStore.id, payload).subscribe({
        next: (response) => {
          console.log('Quantity increased successfully:', response);
          alert('Quantity increased successfully!');
          this.closeEditModal();
          this.fetchWarehouseStores(); // Refresh the list
        },
        error: (error) => {
          console.error('Failed to increase quantity:', error);
          alert('Failed to increase quantity. Please try again.');
        },
      });
    }
  }

  decreaseQuantity(): void {
    if (this.DecreaseStore && this.DecreaseStore.id) {
      const decrementValue = Number((document.getElementById('decreaseQuantity') as HTMLInputElement).value); // Get the user input

      if (decrementValue <= 0) {
        alert("Quantity to decrease must be greater than zero.");
        return;
      }

      const payload = { quantity: decrementValue }; // Send only the decrement value

      console.log("Sending decrement request:", payload);

      this.warehouseService.decreaseWarehouseStore(this.DecreaseStore.id, payload).subscribe({
        next: (response) => {
          console.log('Quantity decreased successfully:', response);
          alert('Quantity decreased successfully!');
          this.closeDecreaseModal();
          this.fetchWarehouseStores(); // Refresh the list
        },
        error: (error) => {
          console.error('Failed to decrease quantity:', error);
          alert('Failed to decrease quantity. Please try again.');
        },
      });
    }
  }

  protected readonly Math = Math;
}
