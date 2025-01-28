import { Component, OnInit } from '@angular/core';
import { WarehouseService } from '../../services/warehouse.service';

@Component({
  selector: 'app-deleted-warehouse',
  templateUrl: './deleted-warehouse.component.html',
  styleUrls: ['./deleted-warehouse.component.css'],
})
export class DeletedWarehouseComponent implements OnInit {
  deletedWarehouseStores: any[] = [];
  page = 1;
  size = 10;
  totalItems = 0;

  constructor(private warehouseService: WarehouseService) {}

  ngOnInit(): void {
    this.fetchDeletedWarehouseStores();
  }

  fetchDeletedWarehouseStores(): void {
    this.warehouseService.getDeletedWarehouseStores(this.page, this.size).subscribe({
      next: (response) => {
        console.log('Deleted Warehouse API Response:', response);
        this.deletedWarehouseStores = response.content;
        this.totalItems = response.totalElements;
      },
      error: (error) => {
        console.error('Failed to fetch deleted warehouse stores:', error);
      },
    });
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.fetchDeletedWarehouseStores();
  }

  restoreWarehouseStore(storeId: number): void {
    if (confirm('Are you sure you want to restore this warehouse store?')) {
      this.warehouseService.restoreWarehouseStore(storeId).subscribe({
        next: () => {
          console.log('Warehouse store restored successfully.');
          alert('Warehouse store restored successfully!');
          this.fetchDeletedWarehouseStores(); // Refresh the list
        },
        error: (error) => {
          console.error('Failed to restore warehouse store:', error);
          alert('Failed to restore warehouse store. Please try again.');
        },
      });
    }
  }

  protected readonly Math = Math;
}
