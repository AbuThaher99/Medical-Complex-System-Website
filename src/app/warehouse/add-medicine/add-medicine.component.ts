import { Component, OnInit } from '@angular/core';
import { MedicineService } from '../../services/medicine.service';
import {CustomAlertService} from "../../services/custom-alert.service";

@Component({
  selector: 'app-add-medicine',
  templateUrl: './add-medicine.component.html',
  styleUrls: ['./add-medicine.component.css'],
})
export class AddMedicineComponent implements OnInit {
  suppliers: any[] = [];
  filteredSuppliers: any[] = [];
  supplierPage = 1;
  supplierSize = 10;
  totalSuppliers = 0;
  supplierSearchTerm = '';
  isLoadingSuppliers = false;
  showSupplierDropdown = false;

  medicine = {
    name: '',
    buyPrice: 0,
    purchasePrice: 0,
    expirationDate: '',
    supplier: {
      id: null,
      displayText: ''
    },
  };


  constructor(private medicineService: MedicineService,private customAlertService: CustomAlertService) {}

  ngOnInit(): void {
    this.fetchSuppliers();
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
    this.medicineService.getAllSuppliers(this.supplierPage, this.supplierSize).subscribe({
      next: (response) => {
        const newSuppliers = response.content.map((supplier: any) => ({
          id: supplier.id,
          displayText: `${supplier.name} - ${supplier.companyName}`,
        }));

        this.suppliers = [...this.suppliers, ...newSuppliers];
        this.filteredSuppliers = this.suppliers;
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
    this.filteredSuppliers = this.suppliers.filter((supplier) =>
      supplier.displayText.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  toggleSupplierDropdown(): void {
    this.showSupplierDropdown = !this.showSupplierDropdown;
  }

  hideSupplierDropdown(): void {
    setTimeout(() => {
      this.showSupplierDropdown = false;
    }, 200); // Delay to allow selection
  }

  selectSupplier(supplier: any): void {
    this.medicine.supplier = {
      id: supplier.id,
      displayText: supplier.displayText,
    };
    this.showSupplierDropdown = false;
  }

  onSubmit(): void {
    console.log('Submitting medicine:', this.medicine);

    if (!this.medicine.supplier.id) {
      this.customAlertService.show('Error', 'Please select a supplier.');
      return;
    }

    this.medicineService.addMedicine(this.medicine).subscribe({
      next: (response) => {
        console.log('Medicine added successfully:', response);
        this.customAlertService.show('Success', 'Medicine added successfully!');
        this.resetForm();
      },
      error: (error) => {
        console.error('Failed to add medicine:', error);

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

  resetForm(): void {
    this.medicine = {
      name: '',
      buyPrice: 0,
      purchasePrice: 0,
      expirationDate: '',
      supplier: {
        id: null,
        displayText: ''
      },
    };
  }
}
