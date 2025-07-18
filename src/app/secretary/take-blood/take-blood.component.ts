import { Component, OnInit } from '@angular/core';
import { PatientService } from '../../services/patient.service';
import { DonorService } from '../../services/donor.service';
import { CustomAlertService } from "../../services/custom-alert.service";

@Component({
  selector: 'app-take-blood',
  templateUrl: './take-blood.component.html',
  styleUrls: ['./take-blood.component.css'],
})
export class TakeBloodComponent implements OnInit {
  patients: any[] = [];
  filteredPatients: any[] = [];
  selectedPatientId: number | null = null;
  selectedPatient: any = null;
  quantity: number | null = null;
  patientSearchQuery = '';
  showPatientDropdown = false;
  page = 1;
  size = 10;
  totalPages = 1;
  isLoading = false;

  constructor(
    private patientService: PatientService,
    private donorService: DonorService,
    private customAlertService: CustomAlertService
  ) {}

  ngOnInit(): void {
    this.loadPatients();
  }

  // Fetch patients with lazy loading
  loadPatients(): void {
    if (this.isLoading || this.page > this.totalPages) return; // Prevent duplicate requests
    this.isLoading = true;

    this.patientService.getPatients(this.page, this.size).subscribe(
      (data) => {
        this.patients = [...this.patients, ...data.content]; // Append new patients
        this.filteredPatients = [...this.patients]; // Update filtered patients
        this.totalPages = data.totalPages;
        this.page++; // Move to the next page
        this.isLoading = false;
      },
      (error) => {
        console.error('Failed to load patients:', error.message);
        this.isLoading = false;
      }
    );
  }

  // Filter Patients in Dropdown
  filterPatients(): void {
    if (this.patientSearchQuery.trim()) {
      this.filteredPatients = this.patients.filter(patient => {
        const searchString = `${patient.id} - ${patient.user.firstName} ${patient.user.lastName} ${patient.user.email}`.toLowerCase();
        return searchString.includes(this.patientSearchQuery.toLowerCase());
      });
    } else {
      this.filteredPatients = [...this.patients];
    }
  }

  // Select Patient
  selectPatient(patientId: number): void {
    this.selectedPatientId = patientId;
    this.selectedPatient = this.patients.find(patient => patient.id === patientId);
    this.showPatientDropdown = false;
  }

  // Change Patient Selection
  changePatient(): void {
    this.selectedPatientId = null;
    this.selectedPatient = null;
    this.showPatientDropdown = true;
  }

  // Get Patient Initials
  getPatientInitials(patient: any): string {
    if (!patient || !patient.user) return '';

    const firstName = patient.user.firstName || '';
    const lastName = patient.user.lastName || '';

    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  // Get Percentage for Quantity Visualization (0-100%)
  getQuantityPercentage(): number {
    if (!this.quantity) return 0;

    // Cap at 1000ml (for visualization purposes)
    const cappedQuantity = Math.min(this.quantity, 1000);
    return (cappedQuantity / 1000) * 100;
  }

  // Check if form is valid for submission
  isFormValid(): boolean {
    return !!this.selectedPatientId &&
      !!this.quantity &&
      this.quantity > 0 &&
      this.quantity <= 1000;
  }

  // Take Blood
  takeBlood(): void {
    if (!this.isFormValid()) {
      this.customAlertService.show('Error', 'Please select a patient and enter a valid quantity (1-1000ml).');
      return;
    }

    const requestBody = {
      patients: { id: this.selectedPatientId },
      quantity: this.quantity,
    };

    this.donorService.takeBlood(requestBody).subscribe(
      () => {
        this.customAlertService.show('Success', 'Blood taken successfully!');
        this.selectedPatientId = null;
        this.selectedPatient = null;
        this.quantity = null;
      },
      (error) => {
        console.error('Failed to take blood:', error.message);
        this.customAlertService.show('Error', 'Failed to take blood: ' + error.message);
      }
    );
  }

  // Hide the dropdown with delay to allow click selection
  hideDropdown(): void {
    setTimeout(() => {
      this.showPatientDropdown = false;
    }, 200);
  }

  // Lazy load more patients when scrolled to the bottom
  onDropdownScroll(event: any): void {
    const element = event.target;
    if (element.scrollHeight - element.scrollTop <= element.clientHeight + 10) {
      this.loadPatients(); // Load more patients if needed
    }
  }
}
