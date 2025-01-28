import { Component, OnInit } from '@angular/core';
import { MedicineService } from '../../services/medicine.service';

@Component({
  selector: 'app-add-medicine',
  templateUrl: './add-medicine.component.html',
  styleUrls: ['./add-medicine.component.css'],
})
export class AddMedicineComponent implements OnInit {
  suppliers: any[] = [];
  medicine = {
    name: '',
    buyPrice: 0,
    purchasePrice: 0,
    expirationDate: '',
    supplier: {
      id: null,
    },
  };

  constructor(private medicineService: MedicineService) {}

  ngOnInit(): void {
    this.fetchSuppliers();
  }

  fetchSuppliers(): void {
    this.medicineService.getAllSuppliers(1, 10).subscribe({
      next: (response) => {
        console.log('Suppliers fetched:', response.content);
        this.suppliers = response.content;
      },
      error: (error) => {
        console.error('Failed to fetch suppliers:', error);
      },
    });
  }

  onSubmit(): void {
    console.log('Submitting medicine:', this.medicine);

    if (!this.medicine.supplier.id) {
      alert('Please select a supplier.');
      return;
    }

    this.medicineService.addMedicine(this.medicine).subscribe({
      next: (response) => {
        console.log('Medicine added successfully:', response);
        alert('Medicine added successfully!');
        // navigate to the warehouse page

        this.resetForm();
      },
      error: (error) => {
        console.error('Failed to add medicine:', error);

        if (error.status === 401) {
          alert('Unauthorized! Please log in again.');
        } else if (error.status === 400) {
          alert('Bad request! Check the submitted data.');
        } else {
          alert('Failed to add medicine. Please try again.');
        }
      },
    });
  }

  resetForm(): void {
    this.medicine = {
      name: '',
      buyPrice: 0,
      purchasePrice: 0,
      expirationDate: '',
      supplier: {
        id: null,
      },
    };
  }
}
