import { Component, OnInit } from '@angular/core';
import { PatientMedicineService } from '../../services/patient-medicine.service';
import { PatientService } from '../../services/patient.service';
import { DoctorService } from '../../services/doctor.service';
import { WarehouseService } from '../../services/warehouse.service';
import {Subject} from "rxjs";
import {debounceTime, distinctUntilChanged} from "rxjs/operators";
import {CustomAlertService} from "../../services/custom-alert.service";

@Component({
  selector: 'app-patient-medicines',
  templateUrl: './patient-medicines.component.html',
  styleUrls: ['./patient-medicines.component.css','./patient-medicnes-style.css']
})
export class PatientMedicinesComponent implements OnInit {
  patientMedicines: any[] = [];
  patients: any[] = [];
  treatments: any[] = [];
  medicines: any[] = [];
  filteredPatients: any[] = [];
  filteredTreatments: any[] = [];
  filteredMedicines: any[] = [];

  selectedPatientIds: number[] = [];
  selectedTreatmentIds: number[] = [];
  selectedMedicineIds: number[] = [];

  searchQuery: string = '';
  patientSearchQuery: string = '';
  treatmentSearchQuery: string = '';
  medicineSearchQuery: string = '';
  page: number = 1;
  size: number = 10;
  totalPages: number = 1;

  showPatientDropdown: boolean = false;
  selectedTreatmentName: string = '';
  selectedMedicineName: string = '';
  showEditModal: boolean = false;

  showTreatmentDropdownModal: boolean = false;
  showMedicineDropdownModal: boolean = false;

  showTreatmentDropdownFilter: boolean = false;
  showMedicineDropdownFilter: boolean = false;
  editingRecord: any = null; // Holds the record being edited

  // Pagination for Lazy Loading
  patientsPage: number = 1;
  treatmentsPage: number = 1;
  medicinesPage: number = 1;
  patientsSize: number = 10;
  treatmentsSize: number = 10;
  medicinesSize: number = 10;
  totalPatientsPages: number = 1;
  totalTreatmentsPages: number = 1;
  totalMedicinesPages: number = 1;

  loadingPatients: boolean = false;
  loadingTreatments: boolean = false;
  loadingMedicines: boolean = false;

  filteredMedicinesEdit: any[] = [];
  private medicineSearchEditSubject = new Subject<string>();
  medicineSearchEditQuery: string = '';

  filteredTreatmentsEdit: any[] = [];
  private treatmentSearchEditSubject = new Subject<string>();
  treatmentSearchEditQuery: string = '';
  viewMode: 'table' | 'card' = 'table';
  constructor(
    private patientMedicineService: PatientMedicineService,
    private patientService: PatientService,
    private doctorService: DoctorService,
    private warehouseService: WarehouseService,
    private customAlertService: CustomAlertService

  ) {}

  ngOnInit(): void {
    this.loadPatientMedicines();
    this.loadPatients();
    this.loadTreatments();
    this.loadMedicines();
    this.checkScreenSize();

    // Listen for window resize events
    window.addEventListener('resize', () => {
      this.checkScreenSize();
    });

    this.medicineSearchEditSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe((term) => {
      this.medicineSearchEditQuery = term;
      this.filterMedicinesEdit();
    });

    this.treatmentSearchEditSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe((term) => {
      this.treatmentSearchEditQuery = term;
      this.filterTreatmentsEdit();
    });
  }

  loadPatientMedicines(): void {
    this.patientMedicineService.getAllPatientMedicines(
      this.page,
      this.size,
      this.searchQuery,
      this.selectedPatientIds,
      this.selectedTreatmentIds,
      this.selectedMedicineIds
    ).subscribe(data => {
      this.patientMedicines = data.content;
      this.totalPages = data.totalPages;
    });
  }

  loadPatients(): void {
    if (this.loadingPatients || this.patientsPage > this.totalPatientsPages) return;

    this.loadingPatients = true;

    this.patientService.getPatients(this.patientsPage, this.patientsSize).subscribe(
      (data) => {
        this.patients = [...this.patients, ...data.content];
        this.filteredPatients = [...this.patients]; // Initialize filtered list

        this.totalPatientsPages = data.totalPages;
        this.patientsPage++;
        this.loadingPatients = false;
      },
      (error) => {
        console.error('Failed to load patients:', error.message);
        this.loadingPatients = false;
      }
    );
  }
  hideDropdown(event: FocusEvent, type: string, section: string): void {
    setTimeout(() => {
      const target = event.relatedTarget as HTMLElement;
      if (target && target.closest('.dropdown-list')) return;

      if (section === 'filter') {
        if (type === 'patient') this.showPatientDropdown = false;
        if (type === 'treatment') this.showTreatmentDropdownFilter = false;
        if (type === 'medicine') this.showMedicineDropdownFilter = false;
      } else if (section === 'modal') {
        if (type === 'treatment') this.showTreatmentDropdownModal = false;
        if (type === 'medicine') this.showMedicineDropdownModal = false;
      }
    }, 200);
  }
  loadTreatments(callback?: () => void): void {
    if (this.loadingTreatments || this.treatmentsPage > this.totalTreatmentsPages) return;

    this.loadingTreatments = true;

    this.doctorService.getTreatments(this.treatmentsPage, this.treatmentsSize, [], '').subscribe(
      (data) => {
        this.treatments = [...this.treatments, ...data.content];
        this.filteredTreatments = [...this.treatments]; // Initialize filtered list
        this.totalTreatmentsPages = data.totalPages;
        this.treatmentsPage++;
        this.loadingTreatments = false;
        this.filterTreatmentsEdit();
        if (callback) callback(); // Execute callback after loading
      },
      (error) => {
        console.error('Failed to load treatments:', error.message);
        this.loadingTreatments = false;
      }
    );
  }

  loadMedicines(callback?: () => void): void {
    if (this.loadingMedicines || this.medicinesPage > this.totalMedicinesPages) return;

    this.loadingMedicines = true;

    this.warehouseService.getAllWarehouseStores(this.medicinesPage, this.medicinesSize).subscribe(
      (data) => {
        this.medicines = [...this.medicines, ...data.content];
        this.filteredMedicines = [...this.medicines]; // Initialize filtered list
        this.totalMedicinesPages = data.totalPages;
        this.medicinesPage++;
        this.loadingMedicines = false;
        this.filterMedicinesEdit();
        if (callback) callback(); // Execute callback after loading
      },
      (error) => {
        console.error('Failed to load medicines:', error.message);
        this.loadingMedicines = false;
      }
    );
  }

  onDropdownScroll(event: any, type: string): void {
    const element = event.target;
    if (element.scrollHeight - element.scrollTop <= element.clientHeight + 10) {
      if (type === 'patient') this.loadPatients();
      if (type === 'treatment') this.loadTreatments();
      if (type === 'medicine') this.loadMedicines();
    }
  }
  onSearchChange(): void {
    this.loadPatientMedicines();
  }

  toggleSelection(list: number[], id: number, event: any): void {
    if (event.target.checked) {
      if (!list.includes(id)) {
        list.push(id);
      }
    } else {
      const index = list.indexOf(id);
      if (index > -1) {
        list.splice(index, 1);
      }
    }
    this.loadPatientMedicines();
  }


  onPageChange(newPage: number): void {
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.page = newPage;
      this.loadPatientMedicines();
    }
  }

  openEditModal(record: any): void {
    this.editingRecord = { ...record }; // Clone the record to avoid direct binding
    this.showEditModal = true;

    // Reset and reload dropdown lists
    this.treatments = [];
    this.medicines = [];
    this.treatmentsPage = 1;
    this.medicinesPage = 1;

    this.loadTreatments(() => {
      // Set the selected treatment name after treatments are loaded
      const selectedTreatment = this.treatments.find(t => t.id === this.editingRecord.treatment.id);
      this.selectedTreatmentName = selectedTreatment ? `${selectedTreatment.id} - $${selectedTreatment.price}` : 'Select Treatment';
    });

    this.loadMedicines(() => {
      // Set the selected medicine name after medicines are loaded
      const selectedMedicine = this.medicines.find(m => m.medicine.id === this.editingRecord.medicine.id);
      this.selectedMedicineName = selectedMedicine ? `${selectedMedicine.medicine.id} - ${selectedMedicine.medicine.name} - $${selectedMedicine.medicine.buyPrice}` : 'Select Medicine';
    });
  }




  closeEditModal(): void {
    this.showEditModal = false;
    this.editingRecord = null;
  }
  updatePatientMedicine(): void {
    const body = {
      quantity: this.editingRecord.quantity,
      treatment: { id: this.editingRecord.treatment.id },
      medicine: { id: this.editingRecord.medicine.id },
    };

    this.patientMedicineService.updatePatientMedicine(this.editingRecord.id, body).subscribe(
      () => {
        this.customAlertService.show('Success', 'Patient Medicine updated successfully!');

        this.loadPatientMedicines(); // Reload the table
        this.closeEditModal();
      },
      (error) => {
        this.customAlertService.show('Error', 'Failed to update Patient Medicine: ' + error.message);

      }
    );
  }
  deletePatientMedicine(id: number): void {
    this.customAlertService.confirm('Confirm Delete', 'Are you sure you want to delete this Patient Medicine?').then((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.patientMedicineService.deletePatientMedicine(id).subscribe({
        next: () => {
          this.customAlertService.show('Success', 'Patient Medicine deleted successfully!');
          this.loadPatientMedicines(); // Reload the table
        },
        error: (error) => {
          console.error('Failed to delete Patient Medicine:', error.message);
          this.customAlertService.show('Error', 'Failed to delete Patient Medicine: ' + error.message);
        },
      });
    });
  }
  calculateTotalPrice(record: any): number {
    const treatmentPrice = record.treatment.price;
    const medicinePrice = record.medicine.buyPrice;
    const quantity = record.quantity;

    return treatmentPrice + (medicinePrice * quantity);
  }
  selectTreatment(treatment: any) {
    this.editingRecord.treatment = { id: treatment.id, price: treatment.price };
    this.selectedTreatmentName = `${treatment.id} - $${treatment.price}`;
    this.showTreatmentDropdownModal = false; // Close dropdown after selection
  }

  selectMedicine(medicine: any) {
    this.editingRecord.medicine = { id: medicine.medicine.id, name: medicine.medicine.name, buyPrice: medicine.medicine.buyPrice };
    this.selectedMedicineName = `${medicine.medicine.id} - ${medicine.medicine.name} - $${medicine.medicine.buyPrice}`;
    this.showMedicineDropdownModal = false; // Close dropdown after selection
  }

  filterPatients(): void {
    this.filteredPatients = this.patients.filter(patient =>
      `${patient.id} ${patient.user.firstName} ${patient.user.lastName} ${patient.user.email}`
        .toLowerCase()
        .includes(this.patientSearchQuery.toLowerCase())
    );
  }

  filterTreatments(): void {
    this.filteredTreatments = this.treatments.filter(treatment =>
      `${treatment.id} ${treatment.price}`
        .toLowerCase()
        .includes(this.treatmentSearchQuery.toLowerCase())
    );
  }

  filterMedicines(): void {
    this.filteredMedicines = this.medicines.filter(medicine =>
      `${medicine.medicine.id} ${medicine.medicine.name} ${medicine.medicine.buyPrice}`
        .toLowerCase()
        .includes(this.medicineSearchQuery.toLowerCase())
    );
  }


  filterMedicinesEdit(): void {
    const searchTerm = this.medicineSearchEditQuery.toLowerCase().trim();

    this.filteredMedicinesEdit = this.medicines.filter((med) => {
      const medName = med.medicine.name.toLowerCase();
      const medId = String(med.medicine.id).toLowerCase();
      const medPrice = String(med.medicine.buyPrice).toLowerCase();

      return (
        medName.includes(searchTerm) ||
        medId.includes(searchTerm) ||
        medPrice.includes(searchTerm)
      );
    });
  }

  onMedicineSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.medicineSearchEditSubject.next(target.value);
  }

  private filterTreatmentsEdit() {
    const searchTerm = this.treatmentSearchEditQuery.toLowerCase().trim();

    this.filteredTreatmentsEdit = this.treatments.filter((treat) => {
      const treatId = String(treat.id).toLowerCase();
      const treatPrice = String(treat.price).toLowerCase();

      return treatId.includes(searchTerm) || treatPrice.includes(searchTerm);
    });
  }

  onTreatmentSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.treatmentSearchEditSubject.next(target.value);
  }

  toggleView(mode: 'table' | 'card'): void {
    this.viewMode = mode;
    localStorage.setItem('medicineViewMode', mode);
  }

// Check screen size and set appropriate view
  checkScreenSize(): void {
    if (window.innerWidth <= 768) {
      // On mobile, always use card view
      this.viewMode = 'card';
    } else {
      // On desktop, use saved preference or default to table
      const savedViewMode = localStorage.getItem('medicineViewMode') as 'table' | 'card';
      this.viewMode = (savedViewMode === 'card') ? 'card' : 'table';
    }
  }

// Get the initials from first and last name
  getInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

// Remove filter from a list
  removeFilter(list: number[], id: number): void {
    const index = list.indexOf(id);
    if (index > -1) {
      list.splice(index, 1);
      this.loadPatientMedicines();
    }
  }

// Get patient name for display in filter chips
  getPatientName(id: number): string {
    const patient = this.patients.find(p => p.id === id);
    if (patient) {
      return `${patient.user.firstName} ${patient.user.lastName}`;
    }
    return `Patient #${id}`;
  }

// Get medicine name for display in filter chips
  getMedicineName(id: number): string {
    const medicine = this.medicines.find(m => m.medicine.id === id);
    if (medicine) {
      return medicine.medicine.name;
    }
    return `Medicine #${id}`;
  }

// Get total items count
  getTotalItems(): number {
    return this.totalPages * this.size;
  }

// Calculate total price for edit preview
  calculateTotalPriceForEdit(): number {
    if (!this.editingRecord || !this.editingRecord.treatment || !this.editingRecord.medicine) {
      return 0;
    }

    const treatmentPrice = this.editingRecord.treatment.price || 0;
    const medicinePrice = this.editingRecord.medicine.buyPrice || 0;
    const quantity = this.editingRecord.quantity || 0;

    return treatmentPrice + (medicinePrice * quantity);
  }

// Check if form is valid for submission
  isFormValid(): boolean {
    if (!this.editingRecord) return false;

    return (
      this.editingRecord.treatment &&
      this.editingRecord.treatment.id &&
      this.editingRecord.medicine &&
      this.editingRecord.medicine.id &&
      this.editingRecord.quantity > 0
    );
  }
  ngOnDestroy(): void {
    // Remove event listener to prevent memory leaks
    window.removeEventListener('resize', () => {
      this.checkScreenSize();
    });
  }
}
