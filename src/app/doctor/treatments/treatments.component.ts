import { Component, OnInit } from '@angular/core';
import { DoctorService } from '../../services/doctor.service';
import { PatientService } from '../../services/patient.service';
import { WarehouseService } from '../../services/warehouse.service';

import {debounceTime, distinctUntilChanged, finalize, switchMap} from 'rxjs/operators';
import { Subject } from 'rxjs';
import {PatientMedicineService} from "../../services/patient-medicine.service";
import {CustomAlertService} from "../../services/custom-alert.service";

@Component({
  selector: 'app-treatments',
  templateUrl: './treatments.component.html',
  styleUrls: ['./treatments.component.css']
})
export class TreatmentsComponent implements OnInit {
  treatments: any[] = [];
  patients: any[] = [];
  filteredPatients: any[] = [];
  selectedPatientIds: number[] = [];
  doctors: any[] = [];
  medicines: any[] = [];
  patientSearchQuery: string = '';

  page = 1;
  size = 10;
  totalTreatments = 0;
  showEditModal = false;
  editingTreatment: any = null;
  showPatientDropdown = false;
  loadingPatients = false;
  loadingDoctors = false;
  showPatientFilterDropdown = false;
  showPatientEditDropdown = false;
  showAddMedicineModal: boolean = false;
  selectedTreatmentId: number | null = null;
  selectedMedicineId: number | null = null;
  medicineQuantity: number = 1;

  currentPatientPage = 1; // Track the page number
  patientPageSize = 10;   // Number of patients per request
  totalPatients = 0;      // Total number of patients in DB
  loadingMorePatients = false; // Loading indicator


  currentDoctorPage = 1;
  doctorPageSize = 10;
  totalDoctors = 0;
  loadingMoreDoctors = false;

  currentEditPatientPage = 1;
  editPatientPageSize = 10;
  totalEditPatients = 0;
  loadingMoreEditPatients = false;

  currentMedicinePage: number = 1;
  medicinePageSize: number = 10; // adjust as needed
  totalMedicines: number = 0;
  loadingMoreMedicines: boolean = false;



  showMedicineDropdownModal = false;
  selectedMedicine: any = null;
  selectedMedicineDisplayText = '';

  showDoctorDropdownModal: boolean = false;
  showPatientDropdownModal: boolean = false;


  filteredMedicines: any[] = [];
  medicineSearchQuery: string = '';

  filteredDoctors: any[] = []; // Add this variable
  doctorSearchQuery: string = ''; // Add this variable

  filteredEditPatients: any[] = [];
  patientEditSearchQuery: string = '';


  dropdown: any;
  searchTerm = '';
  private searchSubject = new Subject<string>();
  private medicineSearchSubject = new Subject<string>();
  private doctorSearchSubject = new Subject<string>();
  private patientEditSearchSubject = new Subject<string>();

  isLoading: boolean = false;
  isEditModalLoading: boolean = false;
  isMedicineModalLoading: boolean = false;
  isSaving: boolean = false;
  isSavingMedicine: boolean = false;

  constructor(private doctorService: DoctorService, private patientService: PatientService,private warehouseService: WarehouseService
  ,private patientMedicineService: PatientMedicineService,private customAlertService: CustomAlertService) {}

  ngOnInit(): void {
    this.fetchTreatments();

    // Setup search debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        this.isLoading = true;
        this.searchTerm = term;
        return this.doctorService.getTreatments(this.page, this.size, this.selectedPatientIds, this.searchTerm)
          .pipe(finalize(() => this.isLoading = false));
      })
    ).subscribe(response => {
      this.treatments = response.content;
      this.totalTreatments = response.totalElements;
    });

    this.medicineSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe((term) => {
      this.medicineSearchQuery = term;
      this.filterMedicines();
    });

    this.doctorSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe((term) => {
      this.doctorSearchQuery = term;
      this.filterDoctors();
    });

    this.patientEditSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe((term) => {
      this.patientEditSearchQuery = term;
      this.filterEditPatients();
    });
  }
  loadMedicines(reset: boolean = false): void {
    if (reset) {
      this.medicines = [];
      this.filteredMedicines = [];
      this.currentMedicinePage = 1;
      this.totalMedicines = 0;
      this.medicineSearchQuery = '';
      this.isMedicineModalLoading = true;
    }

    if (this.loadingMoreMedicines ||
      (this.totalMedicines && this.medicines.length >= this.totalMedicines)) {
      return;
    }

    this.loadingMoreMedicines = true;
    this.warehouseService.getAllWarehouseStores(this.currentMedicinePage, this.medicinePageSize)
      .pipe(finalize(() => {
        this.loadingMoreMedicines = false;
        this.isMedicineModalLoading = false;
      }))
      .subscribe({
        next: (response: any) => {
          this.medicines = [...this.medicines, ...response.content];
          this.totalMedicines = response.totalElements;
          this.currentMedicinePage++;
          this.filterMedicines();
        },
        error: (error) => {
          console.error('Error loading medicines:', error);
          this.customAlertService.show('Error', 'Failed to load medicines');
        }
      });
  }




  fetchTreatments(): void {
    this.isLoading = true;
    this.doctorService.getTreatments(this.page, this.size, this.selectedPatientIds, this.searchTerm)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          this.treatments = response.content || [];
          this.totalTreatments = response.totalElements;
        },
        error: (error) => {
          console.error("Error fetching treatments:", error);
          this.treatments = [];
          this.customAlertService.show('Error', 'Failed to load treatments');
        },
      });
  }

  loadPatientsForFilter(): void {
    this.showPatientFilterDropdown = true;

    this.patients = [];
    this.filteredPatients = [];
    this.currentPatientPage = 1;
    this.totalPatients = 0;

    this.fetchPatients();
  }


  fetchPatients(): void {
    if (this.loadingPatients || (this.totalPatients && this.patients.length >= this.totalPatients)) return;

    this.loadingPatients = true;

    this.patientService.getPatients(this.currentPatientPage, this.patientPageSize)
      .pipe(finalize(() => this.loadingPatients = false))
      .subscribe({
        next: (response) => {
          const newPatients = response.content.map((patient: any) => ({
            id: patient.id,
            displayText: `${patient.id} - ${patient.user.firstName} ${patient.user.lastName} - ${patient.user.email}`
          }));

          this.patients = [...this.patients, ...newPatients];
          this.filteredPatients = [...this.patients];
          this.totalPatients = response.totalElements;
          this.currentPatientPage++;
        },
        error: (error) => {
          console.error('Failed to load patients:', error);
          this.customAlertService.show('Error', 'Failed to load patients');
        }
      });
  }

  onPatientDropdownScroll(event: Event): void {
    const target = event.target as HTMLElement;

    // Check if the user has scrolled to the bottom of the dropdown
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 10) {
      this.fetchPatients();
    }
  }


  loadPatientsForEdit(callback?: () => void): void {
    if (this.loadingMoreEditPatients || (this.totalEditPatients && this.patients.length >= this.totalEditPatients)) return;

    this.loadingMoreEditPatients = true;

    this.patientService.getPatients(this.currentEditPatientPage, this.editPatientPageSize)
      .pipe(finalize(() => {
        this.loadingMoreEditPatients = false;
        if (callback) callback();
      }))
      .subscribe({
        next: (response) => {
          const newPatients = response.content.map((patient: any) => ({
            id: patient.id,
            displayText: `${patient.id} - ${patient.user.firstName} ${patient.user.lastName} - ${patient.user.email}`
          }));

          this.patients = [...this.patients, ...newPatients];
          this.totalEditPatients = response.totalElements;
          this.currentEditPatientPage++;
          this.filterEditPatients();
        },
        error: (error) => {
          console.error('Failed to load patients:', error);
          this.customAlertService.show('Error', 'Failed to load patients');
        }
      });
  }


  onSearch(event: any): void {
    const term = event.target.value;
    this.searchSubject.next(term);
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.fetchTreatments();
  }

  openEditModal(treatment: any): void {
    this.isEditModalLoading = true;
    this.editingTreatment = { ...treatment };
    this.showEditModal = true;

    if (this.editingTreatment.treatmentDate) {
      const treatmentDate = new Date(this.editingTreatment.treatmentDate);
      this.editingTreatment.treatmentDate = treatmentDate.toISOString().split('T')[0];
    }

    // Reset and reload dropdown lists
    this.patients = [];
    this.doctors = [];
    this.currentEditPatientPage = 1;
    this.currentDoctorPage = 1;

    // Load both data sets concurrently
    let patientsLoaded = false;
    let doctorsLoaded = false;

    // Function to check if loading is complete
    const checkLoadingComplete = () => {
      if (patientsLoaded && doctorsLoaded) {
        this.isEditModalLoading = false;
      }
    };

    this.loadPatientsForEdit(() => {
      const selectedPatient = this.patients.find(p => p.id === this.editingTreatment.patient.id);
      this.editingTreatment.patient = selectedPatient || { id: '', displayText: 'Unknown' };
      patientsLoaded = true;
      checkLoadingComplete();
    });

    this.loadDoctors(() => {
      const selectedDoctor = this.doctors.find(d => d.id === this.editingTreatment.doctor.id);
      this.editingTreatment.doctor = selectedDoctor || { id: '', displayText: 'Unknown' };
      doctorsLoaded = true;
      checkLoadingComplete();
    });

    this.showPatientDropdownModal = false;
    this.showDoctorDropdownModal = false;
  }




  closeEditModal(): void {
    this.showEditModal = false;
    this.editingTreatment = null;
    this.showPatientDropdownModal = false;
    this.showDoctorDropdownModal = false;
    this.showPatientFilterDropdown = false;
    this.patientSearchQuery = '';
    this.filteredPatients = [];
    this.patients = [];
  }

  saveEdit(): void {
    if (this.editingTreatment) {
      this.isSaving = true;
      this.doctorService.updateTreatment(this.editingTreatment.id, this.editingTreatment)
        .pipe(finalize(() => this.isSaving = false))
        .subscribe({
          next: () => {
            this.customAlertService.show('Success', 'Treatment updated successfully!');
            this.closeEditModal();
            this.fetchTreatments();
          },
          error: (error) => {
            console.error('Update failed:', error);
            this.customAlertService.show('Error', 'Failed to update treatment');
          }
        });
    }
  }

  deleteTreatment(id: number): void {
    this.customAlertService.confirm('Confirm Delete', 'Are you sure you want to delete this treatment?').then((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.isLoading = true;
      this.doctorService.deleteTreatment(id)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: () => {
            this.customAlertService.show('Success', 'Treatment deleted successfully!');
            this.fetchTreatments();
          },
          error: (error) => {
            console.error('Delete failed:', error);
            this.customAlertService.show('Error', 'Failed to delete treatment.');
          },
        });
    });
  }
  loadDoctors(callback?: () => void): void {
    if (this.loadingMoreDoctors || (this.totalDoctors && this.doctors.length >= this.totalDoctors)) return;

    this.loadingMoreDoctors = true;

    this.doctorService.getDoctors(this.currentDoctorPage, this.doctorPageSize)
      .pipe(finalize(() => {
        this.loadingMoreDoctors = false;
        if (callback) callback();
      }))
      .subscribe({
        next: (response) => {
          const newDoctors = response.content.map((doctor: any) => ({
            id: doctor.id,
            displayText: `${doctor.id} - ${doctor.user.firstName} ${doctor.user.lastName} - ${doctor.user.email}`
          }));

          this.doctors = [...this.doctors, ...newDoctors];
          this.totalDoctors = response.totalElements;
          this.currentDoctorPage++;
          this.filterDoctors();
        },
        error: (error) => {
          console.error('Failed to load doctors:', error);
          this.customAlertService.show('Error', 'Failed to load doctors');
        }
      });
  }



  openAddMedicineModal(treatment: any): void {
    this.selectedTreatmentId = treatment.id;
    this.showAddMedicineModal = true;

    // Reset dropdown state for medicines
    this.showMedicineDropdownModal = false;
    this.selectedMedicine = null;
    this.selectedMedicineDisplayText = '';
    this.medicines = [];
    this.filteredMedicines = [];
    this.currentMedicinePage = 1;
    this.totalMedicines = 0;
    this.medicineSearchQuery = '';

    // Load the first page of medicines
    this.loadMedicines(true);
  }


  closeAddMedicineModal(): void {
    this.showAddMedicineModal = false;
    this.selectedTreatmentId = null;
    this.selectedMedicine = null;
    this.selectedMedicineDisplayText = '';
    this.medicineQuantity = 1;
  }

  saveMedicine() {
    if (!this.selectedTreatmentId || !this.selectedMedicine || this.medicineQuantity <= 0) {
      this.customAlertService.show('Error', 'Please select a medicine and enter a valid quantity.');
      return;
    }

    this.selectedMedicineId = this.selectedMedicine.medicine.id;
    this.isSavingMedicine = true;

    this.patientMedicineService.addMedicineToTreatment(this.selectedTreatmentId, this.selectedMedicineId, this.medicineQuantity)
      .pipe(finalize(() => this.isSavingMedicine = false))
      .subscribe({
        next: () => {
          this.customAlertService.show('Success', 'Medicine added successfully!');
          this.closeAddMedicineModal();
        },
        error: (error) => {
          console.error('Failed to add medicine:', error);
          this.customAlertService.show('Error', 'Failed to add medicine');
        }
      });
  }

  onPatientEditDropdownScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 10) {
      this.loadPatientsForEdit();
    }
  }

  onDoctorDropdownScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 10) {
      this.loadDoctors();
    }
  }


  hideDropdown(event: FocusEvent, type: string, section: string): void {
    setTimeout(() => {
      const target = event.relatedTarget as HTMLElement;

      // Check if the new focus is inside a dropdown list
      // (meaning the user clicked inside the dropdown)
      if (target && target.closest('.dropdown-list')) {
        return;
      }

      if (section === 'modal') {
        if (type === 'doctor') {
          this.showDoctorDropdownModal = false;
        }
        if (type === 'patient') {
          this.showPatientDropdownModal = false;
        }
        if (type === 'medicine') {
          this.showMedicineDropdownModal = false;
        }
      } else if (section === 'filter') {
        if (type === 'patient') {
          this.showPatientFilterDropdown = false;

          this.patientSearchQuery = '';
          this.filteredPatients = [...this.patients];
        }
      }
    }, 200);
  }



  selectDoctor(doctor: any): void {
    this.editingTreatment.doctor = {
      id: doctor.id,
      displayText: doctor.displayText // No need to access `user`
    };
    this.showDoctorDropdownModal = false;
  }


  selectPatient(patient: any, section: string): void {
    if (section === 'modal') {
      this.editingTreatment.patient = { id: patient.id, displayText: patient.displayText };

      // Delay to ensure UI updates properly
      setTimeout(() => {
        this.showPatientDropdownModal = false;
      }, 100);
    }
  }

  filterPatients(): void {
    this.filteredPatients = this.patients.filter(patient =>
      patient.displayText.toLowerCase().includes(this.patientSearchQuery.toLowerCase())
    );
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

    // Apply the filter immediately after selection
    this.applyPatientFilter();
  }
  applyPatientFilter(): void {
    this.page = 1; // Reset pagination on filter change
    this.fetchTreatments(); // Fetch treatments based on the selected patients
  }

  onMedicineScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 10) {
      this.loadMedicines();
    }
  }

  selectMedicine(medicine: any): void {
    this.selectedMedicine = medicine;
    this.selectedMedicineId = medicine.medicine.id;
    this.selectedMedicineDisplayText = `${medicine.medicine.id} - ${medicine.medicine.name} - ${medicine.medicine.buyPrice}`;
    this.showMedicineDropdownModal = false;
  }


  filterMedicines(): void {
    const searchTerm = this.medicineSearchQuery.toLowerCase().trim();

    this.filteredMedicines = this.medicines.filter((med) => {
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
    this.medicineSearchSubject.next(target.value);
  }
  onDoctorSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.doctorSearchSubject.next(target.value);
  }
  onPatientEditSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.patientEditSearchSubject.next(target.value);
  }

  protected readonly Math = Math;

  private filterDoctors(): void {
    const searchTerm = this.doctorSearchQuery.toLowerCase().trim();

    // Filter from the original list instead of modifying the doctors array
    this.filteredDoctors = this.doctors.filter((doctor) => {
      const doctorName = `${doctor.displayText}`.toLowerCase();
      return doctorName.includes(searchTerm);
    });
  }

  private filterEditPatients() {
    const searchTerm = this.patientEditSearchQuery.toLowerCase().trim();

    this.filteredEditPatients = this.patients.filter((patient) => {
      const patientName = `${patient.displayText}`.toLowerCase();
      return patientName.includes(searchTerm);
    });
  }
}
