import { Component, OnInit } from '@angular/core';
import { WarehouseService } from '../../services/warehouse.service';

@Component({
  selector: 'app-add-warehouse',
  templateUrl: './add-warehouse.component.html',
  styleUrl: './add-warehouse.component.css'
})
export class AddWarehouseComponent {
  medicines: any[] = [];
  selectedMedicineId: number | null = null;
  quantity: number | null = null;

  constructor(private warehouseService: WarehouseService) {}

  ngOnInit(): void {
    this.fetchMedicines();
  }

  fetchMedicines(): void {
    this.warehouseService.getAllMedicines().subscribe({
      next: (response) => {
        this.medicines = response.content; // Assuming response.content contains the medicines
      },
      error: (error) => {
        console.error('Failed to fetch medicines:', error);
      },
    });
  }

  onSubmit(): void {
    if (!this.selectedMedicineId || !this.quantity) {
      alert('Please select a medicine and enter a valid quantity.');
      return;
    }

    const payload = {
      quantity: this.quantity,
      medicine: { id: this.selectedMedicineId },
    };

    this.warehouseService.addToWarehouse(payload).subscribe({
      next: (response) => {
        console.log('Medicine added to warehouse successfully:', response);
        alert('Medicine added to warehouse successfully!');
        this.fetchMedicines();
        this.resetForm();
      },
      error: (error) => {
        console.error('Failed to add medicine to warehouse:', error);
        alert('Failed to add medicine to warehouse. Please try again.');
      },
    });
  }

  resetForm(): void {
    this.selectedMedicineId = null;
    this.quantity = null;
  }
}
