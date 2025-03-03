import { Component, OnInit } from '@angular/core';
import { DonorService } from '../../services/donor.service';
import { PatientService } from '../../services/patient.service';
import {CustomAlertService} from "../../services/custom-alert.service";

@Component({
  selector: 'app-deleted-patient-blood',
  templateUrl: './deleted-patient-blood.component.html',
  styleUrls: ['./deleted-patient-blood.component.css'],
})
export class DeletedPatientBloodComponent implements OnInit {
  deletedPatientBlood: any[] = []; // Deleted blood records
  patientsList: any[] = []; // All patients for filtering
  filteredPatients: any[] = []; // Filtered patients
  selectedPatientIds: number[] = []; // Selected patient IDs

  page = 1;
  size = 10;
  totalPages = 1;
  searchQuery = '';
  bloodType = '';
  patientSearchQuery = '';

  patientsPage = 1;
  patientsSize = 10; // Load only 10 patients at a time
  totalPatientsPages = 1;
  loadingPatients = false; // Prevent multiple calls


  showPatientDropdown = false;

  bloodTypes = ['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE'];

  constructor(private donorService: DonorService, private patientService: PatientService,private customAlertService: CustomAlertService) {}

  ngOnInit(): void {
    this.loadDeletedPatientBlood();
    this.loadPatients(); // Load patients for filtering
  }

  // Fetch Deleted Patient Blood Records
  loadDeletedPatientBlood(): void {
    this.donorService
      .getDeletedPatientBlood(this.page, this.size, this.searchQuery, this.bloodType, this.selectedPatientIds)
      .subscribe((data) => {
        this.deletedPatientBlood = data.content;
        this.totalPages = data.totalPages;
      });
  }

  // Fetch Patients for Filtering
  loadPatients(): void {
    if (this.loadingPatients || this.patientsPage > this.totalPatientsPages) return;

    this.loadingPatients = true;

    this.patientService.getPatients(this.patientsPage, this.patientsSize).subscribe((data) => {
      if (this.patientsPage === 1) {
        this.patientsList = data.content; // First load
      } else {
        this.patientsList = [...this.patientsList, ...data.content]; // Append new data
      }

      this.filteredPatients = [...this.patientsList]; // Update filtered list
      this.totalPatientsPages = data.totalPages; // Store total pages
      this.patientsPage++; // Move to next page
      this.loadingPatients = false;
    }, () => {
      this.loadingPatients = false; // Prevent infinite loading if error occurs
    });
  }

  // Filter Patients in the Dropdown
  filterPatients(): void {
    if (this.patientSearchQuery.trim()) {
      this.filteredPatients = this.patientsList.filter((patient) =>
        `${patient.id} - ${patient.user.firstName} ${patient.user.lastName}`
          .toLowerCase()
          .includes(this.patientSearchQuery.toLowerCase())
      );
    } else {
      this.filteredPatients = [...this.patientsList];
    }
  }

  // Apply Filters
  onSearchChange(): void {
    this.page = 1;
    this.loadDeletedPatientBlood();
  }

  // Select/Unselect Patients
  togglePatientSelection(patientId: number, event: any): void {
    if (event.target.checked) {
      this.selectedPatientIds.push(patientId);
    } else {
      this.selectedPatientIds = this.selectedPatientIds.filter((id) => id !== patientId);
    }
    this.onSearchChange();
  }

  // Hide Dropdown
  hideDropdown(): void {
    setTimeout(() => {
      this.showPatientDropdown = false;
    }, 200);
  }

  restorePatientBlood(id: number): void {
    this.customAlertService.confirm('Confirm Restore', 'Are you sure you want to restore this patient blood record?').then((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.donorService.restorePatientBlood(id).subscribe({
        next: () => {
          this.customAlertService.show('Success', 'Patient blood record restored successfully!');
          this.loadDeletedPatientBlood();
        },
        error: (error) => {
          console.error('Failed to restore:', error.message);
          this.customAlertService.show('Error', 'Failed to restore: ' + error.message);
        },
      });
    });
  }

  onDropdownScroll(event: any): void {
    const bottomReached = event.target.scrollHeight - event.target.scrollTop <= event.target.clientHeight + 10;
    if (bottomReached) {
      this.loadPatients(); // Load next batch
    }
  }

}
