import { Component, OnInit } from '@angular/core';
import { DoctorService } from '../../services/doctor.service';
import { PatientService } from '../../services/patient.service';
import { WarehouseService } from '../../services/warehouse.service';

import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subject } from 'rxjs';
import {PatientMedicineService} from "../../services/patient-medicine.service";

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

  dropdown: any;
  searchTerm = '';
  private searchSubject = new Subject<string>();

  constructor(private doctorService: DoctorService, private patientService: PatientService,private warehouseService: WarehouseService
  ,private patientMedicineService: PatientMedicineService) {}

  ngOnInit(): void {
    this.fetchTreatments();
    this.loadMedicines();

    // Debounce search input for treatments
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        this.searchTerm = term;
        return this.doctorService.getTreatments(this.page, this.size, this.selectedPatientIds, this.searchTerm);
      })
    ).subscribe(response => {
      this.treatments = response.content;
      this.totalTreatments = response.totalElements;
    });
  }
  loadMedicines() {
    this.warehouseService.getAllWarehouseStores(1, 100).subscribe((data: any) => {
      this.medicines = data.content;
    });
  }
  fetchTreatments(): void {
    this.doctorService.getTreatments(this.page, this.size, this.selectedPatientIds, this.searchTerm).subscribe({
      next: (response) => {
        this.treatments = response.content || [];
        this.totalTreatments = response.totalElements;
      },
      error: (error) => {
        console.error("Error fetching treatments:", error);
        this.treatments = [];
      },
    });
  }

  loadPatientsForFilter(): void {
    if (this.patients.length === 0) {
      this.currentPatientPage = 1;  // Reset page
      this.fetchPatients();
    }
    this.showPatientFilterDropdown = true;
  }

  fetchPatients(): void {
    if (this.loadingPatients || (this.totalPatients && this.patients.length >= this.totalPatients)) return;

    this.loadingPatients = true;

    this.patientService.getPatients(this.currentPatientPage, this.patientPageSize).subscribe({
      next: (response) => {
        const newPatients = response.content.map((patient: any) => ({
          id: patient.id,
          displayText: `${patient.id} - ${patient.user.firstName} ${patient.user.lastName} - ${patient.user.email}`
        }));

        this.patients = [...this.patients, ...newPatients];
        this.filteredPatients = [...this.patients];
        this.totalPatients = response.totalElements;
        this.currentPatientPage++;
        this.loadingPatients = false;
      },
      error: (error) => {
        console.error('Failed to load patients:', error);
        this.loadingPatients = false;
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
    this.loadingPatients = true; // Show loading state while fetching

    this.patientService.getPatients(1, 10).subscribe({
      next: (response) => {
        this.patients = response.content.map((patient: any) => ({
          id: patient.id,
          displayText: `${patient.id} - ${patient.user.firstName} ${patient.user.lastName} - ${patient.user.email}`
        }));

        this.filteredPatients = [...this.patients];
        this.showPatientEditDropdown = true;
        this.loadingPatients = false;

        // Execute callback after fetching
        if (callback) callback();
      },
      error: (error) => {
        console.error('Failed to load patients:', error);
        this.loadingPatients = false;
      }
    });
  }


  hidePatientDropdown(event?: FocusEvent): void {
    const relatedTarget = event?.relatedTarget as HTMLElement;

    // Check if the related target is inside the dropdown
    if (relatedTarget && this.dropdown.nativeElement.contains(relatedTarget)) {
      return; // Do not hide the dropdown
    }

    this.showPatientFilterDropdown = false;
    this.showPatientEditDropdown = false;
  }
  onSearch(event: any): void {
    const term = event.target.value;
    this.searchSubject.next(term);
  }

  onSearchPatients(event: any): void {
    const term = event.target.value.toLowerCase();
    this.filteredPatients = this.patients.filter(patient =>
      patient.displayText.toLowerCase().includes(term)
    );
  }


  onPatientSelectionChange(patientId: number, isChecked: boolean): void {
    if (isChecked) {
      if (!this.selectedPatientIds.includes(patientId)) {
        this.selectedPatientIds.push(patientId);
      }
    } else {
      this.selectedPatientIds = this.selectedPatientIds.filter(id => id !== patientId);
    }

    console.log('Selected Patients:', this.selectedPatientIds);
    this.fetchTreatments(); // Apply filter after selection change
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.fetchTreatments();
  }

  openEditModal(treatment: any): void {
    this.editingTreatment = { ...treatment };
    this.showPatientEditDropdown = false;
    this.showPatientFilterDropdown = false;
    if (this.editingTreatment.treatmentDate) {
      const treatmentDate = new Date(this.editingTreatment.treatmentDate);
      this.editingTreatment.treatmentDate = treatmentDate.toISOString().split('T')[0];
    }

    // Force reload patients and doctors every time
    this.loadPatientsForEdit(() => {
      setTimeout(() => {
        this.editingTreatment.patient = this.patients.find(p => p.id === treatment.patient.id) || { id: '', displayText: 'Unknown - No Email' };
      }, 100);
    });

    this.loadDoctors(() => {
      setTimeout(() => {
        this.editingTreatment.doctor = this.doctors.find(d => d.id === treatment.doctor.id) || { id: '', displayText: 'Unknown - No Email' };
      }, 100);
    });

    this.showEditModal = true;
  }




  closeEditModal(): void {
    this.showEditModal = false;
    this.editingTreatment = null;
  }

  saveEdit(): void {
    if (this.editingTreatment) {
      this.doctorService.updateTreatment(this.editingTreatment.id, this.editingTreatment)
        .subscribe(() => {
          alert('Treatment updated successfully!');
          this.closeEditModal();
          this.fetchTreatments();
        }, error => {
          console.error('Update failed:', error);
          alert('Failed to update treatment.');
        });
    }
  }

  deleteTreatment(id: number): void {
    if (confirm('Are you sure you want to delete this treatment?')) {
      this.doctorService.deleteTreatment(id).subscribe(() => {
        alert('Treatment deleted successfully!');
        this.fetchTreatments();
      }, error => {
        console.error('Delete failed:', error);
        alert('Failed to delete treatment.');
      });
    }
  }
  loadDoctors(callback?: () => void): void {
    this.loadingDoctors = true; // Show loading state

    this.doctorService.getDoctors(1, 10).subscribe({
      next: (response) => {
        this.doctors = response.content.map((doctor: any) => ({
          id: doctor.id,
          displayText: `${doctor.id} - ${doctor.user.firstName} ${doctor.user.lastName} - ${doctor.user.email}`
        }));

        this.loadingDoctors = false;

        if (callback) callback();
      },
      error: (error) => {
        console.error('Failed to load doctors:', error);
        this.loadingDoctors = false;
      }
    });
  }

  openAddMedicineModal(treatment: any) {
    this.selectedTreatmentId = treatment.id;
    this.showAddMedicineModal = true;
  }

  closeAddMedicineModal() {
    this.showAddMedicineModal = false;
    this.selectedTreatmentId = null;
    this.selectedMedicineId = null;
    this.medicineQuantity = 1;
  }
  saveMedicine() {
    if (!this.selectedTreatmentId || !this.selectedMedicineId || this.medicineQuantity <= 0) {
      alert('Please select a medicine and enter a valid quantity.');
      return;
    }

    this.patientMedicineService.addMedicineToTreatment(this.selectedTreatmentId, this.selectedMedicineId, this.medicineQuantity)
      .subscribe(
        () => {
          alert('Medicine added successfully!');
          this.closeAddMedicineModal();
        },
        error => {
          alert('Failed to add medicine: ' + error.message);
        }
      );
  }
  protected readonly Math = Math;
}
