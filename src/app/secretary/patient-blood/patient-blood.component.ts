import { Component, OnInit } from '@angular/core';
import { PatientService } from '../../services/patient.service';
import { DonorService } from '../../services/donor.service';
import {CustomAlertService} from "../../services/custom-alert.service";

@Component({
  selector: 'app-patient-blood',
  templateUrl: './patient-blood.component.html',
  styleUrls: ['./patient-blood.component.css'],
})
export class PatientBloodComponent implements OnInit {
  patientBloodRecords: any[] = [];
  patientsList: any[] = [];
  selectedPatientIds: number[] = [];
  filteredPatients: any[] = [];

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

  constructor(private patientService: PatientService,private donorService: DonorService,private customAlertService: CustomAlertService) {}

  ngOnInit(): void {
    this.loadPatientBlood();
    this.loadPatientsList();
  }

  // Fetch patients for the dropdown
  loadPatientsList(): void {
    if (this.loadingPatients || this.patientsPage > this.totalPatientsPages) return;

    this.loadingPatients = true;

    this.patientService.getPatients(this.patientsPage, this.patientsSize).subscribe(
      (data) => {
        if (this.patientsPage === 1) {
          this.patientsList = data.content; // First load
        } else {
          this.patientsList = [...this.patientsList, ...data.content]; // Append new data
        }

        this.filteredPatients = [...this.patientsList]; // Update filtered list
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


  filterPatients(): void {
    if (this.patientSearchQuery.trim()) {
      this.filteredPatients = this.patientsList.filter((patient) =>
        `${patient.id} - ${patient.user.firstName} ${patient.user.lastName}`.toLowerCase().includes(this.patientSearchQuery.toLowerCase())
      );
    } else {
      this.filteredPatients = [...this.patientsList];
    }
  }

  // Fetch patient blood records
  loadPatientBlood(): void {
    this.donorService.getPatientBlood(this.page, this.size, this.searchQuery, this.bloodType, this.selectedPatientIds).subscribe(
      (data) => {
        this.patientBloodRecords = data.content;
        this.totalPages = data.totalPages;
      },
      (error) => {
        console.error('Failed to load patient blood records:', error.message);
      }
    );
  }

  onSearchChange(): void {
    this.page = 1; // Reset to first page
    this.loadPatientBlood();
  }

  togglePatientSelection(patientId: number, event: any): void {
    if (event.target.checked) {
      this.selectedPatientIds.push(patientId);
    } else {
      this.selectedPatientIds = this.selectedPatientIds.filter((id) => id !== patientId);
    }
    this.onSearchChange();
  }

  hideDropdown(): void {
    setTimeout(() => {
      this.showPatientDropdown = false;
    }, 200); // Delay to allow checkbox click to register
  }

  deletePatientBlood(recordId: number): void {
    this.customAlertService.confirm('Confirm Delete', 'Are you sure you want to delete this blood record?').then((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.donorService.deletePatientBlood(recordId).subscribe({
        next: () => {
          this.customAlertService.show('Success', 'Blood record deleted successfully!');
          this.loadPatientBlood(); // Reload records
        },
        error: (error) => {
          console.error('Failed to delete blood record:', error.message);
          this.customAlertService.show('Error', 'Failed to delete blood record: ' + error.message);
        },
      });
    });
  }

  onDropdownScroll(event: any): void {
    const element = event.target;

    if (element.scrollHeight - element.scrollTop <= element.clientHeight + 10) {
      console.log('Bottom reached! Fetching next page...');
      this.loadPatientsList();
    }
  }

}
