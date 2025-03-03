import { Component, OnInit } from '@angular/core';
import { MedicineService } from '../../services/medicine.service';
import {CustomAlertService} from "../../services/custom-alert.service";

@Component({
  selector: 'app-deleted-medicine',
  templateUrl: './deleted-medicine.component.html',
  styleUrls: ['./deleted-medicine.component.css'],
})
export class DeletedMedicineComponent implements OnInit {
  deletedMedicines: any[] = [];
  page = 1;
  size = 10;
  search = '';
  totalDeletedMedicines = 0;

  constructor(private medicineService: MedicineService,private customAlertService: CustomAlertService) {}

  ngOnInit(): void {
    this.fetchDeletedMedicines();
  }

  fetchDeletedMedicines(): void {
    this.medicineService.getDeletedMedicines(this.page, this.size, this.search).subscribe({
      next: (response) => {
        console.log('API Response:', response);
        this.deletedMedicines = response.content;
        this.totalDeletedMedicines = response.totalElements;
      },
      error: (error) => {
        console.error('Failed to fetch deleted medicines:', error);
      },
    });
  }

  onSearch(): void {
    this.page = 1; // Reset to the first page when searching
    this.fetchDeletedMedicines();
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.fetchDeletedMedicines();
  }

  restoreMedicine(medicineId: number): void {
    this.customAlertService.confirm('Confirm Restore', 'Are you sure you want to restore this medicine?').then((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.medicineService.restoreMedicine(medicineId).subscribe({
        next: () => {
          console.log('Medicine restored successfully.');
          this.customAlertService.show('Success', 'Medicine restored successfully!');
          this.fetchDeletedMedicines();
        },
        error: (error) => {
          console.error('Failed to restore medicine:', error);
          this.customAlertService.show('Error', 'Failed to restore medicine. Please try again.');
        },
      });
    });
  }

  protected readonly Math = Math;
}
