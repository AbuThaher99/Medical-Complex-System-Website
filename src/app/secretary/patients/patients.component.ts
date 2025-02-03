import {Component, OnInit} from '@angular/core';
import { PatientService } from '../../services/patient.service';
import { DoctorService } from '../../services/doctor.service';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-patients',
  templateUrl: './patients.component.html',
  styleUrls: ['./patients.component.css'],
})
export class PatientsComponent implements OnInit {
  patients: any[] = [];
  doctors: any[] = [];
  filteredDoctors: any[] = [];
  page = 1;
  size = 10;
  totalElements = 0;
  searchTerm = '';
  selectedDoctorId: number | null = null;
  private searchSubject = new Subject<string>();
  dropdownOpen = false;
  selectedDoctorIds: number[] = [];
  showPatientModal = false;
  selectedPatient: any = null;

  constructor(
    private patientService: PatientService,
    private doctorService: DoctorService
  ) {}

  ngOnInit(): void {
    this.fetchPatients();
    this.loadDoctors();

    // Debounce search input
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.fetchPatients();
      });
  }

  fetchPatients(): void {
    this.patientService
      .getPatientss(this.page, this.size, this.searchTerm, this.selectedDoctorIds)
      .subscribe({
        next: (response) => {
          this.patients = response.content;
          this.totalElements = response.totalElements;
        },
        error: (error) => {
          console.error('Error fetching patients:', error);
        },
      });
  }

  onSearch(event: any): void {
    this.searchTerm = event.target.value;
    this.searchSubject.next(this.searchTerm);
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.fetchPatients();
  }

  deletePatient(email: string): void {
    if (confirm('Are you sure you want to delete this patient?')) {
      this.patientService.deletePatient(email).subscribe({
        next: () => {
          alert('Patient deleted successfully!');
          this.fetchPatients();
        },
        error: (error) => {
          console.error('Error deleting patient:', error);
          alert('Failed to delete patient.');
        },
      });
    }
  }

  getPatientById(id: number): void {
    this.patientService.getPatientById(id).subscribe({
      next: (response) => {
        this.selectedPatient = response;
        this.showPatientModal = true;
      },
      error: (error) => {
        console.error('Error fetching patient details:', error);
      },
    });
  }

  closePatientModal(): void {
    this.showPatientModal = false;
    this.selectedPatient = null;
  }

  onDoctorCheckboxChange(event: any, doctorId: number): void {
    if (event.target.checked) {
      // Add doctorId to the selected list
      this.selectedDoctorIds.push(doctorId);
    } else {
      // Remove doctorId from the selected list
      this.selectedDoctorIds = this.selectedDoctorIds.filter((id) => id !== doctorId);
    }
    this.fetchPatients();
  }


  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  loadDoctors(): void {
    this.doctorService.getDoctors(1, 100).subscribe({
      next: (response) => {
        this.doctors = response.content;
        this.filteredDoctors = [...this.doctors]; // Initialize filteredDoctors
      },
      error: (error) => {
        console.error('Error fetching doctors:', error);
      },
    });
  }
  filterDoctors(event: any): void {
    const query = event.target.value.toLowerCase();
    this.filteredDoctors = this.doctors.filter(
      (doctor) =>
        doctor.user.firstName.toLowerCase().includes(query) ||
        doctor.user.lastName.toLowerCase().includes(query) ||
        doctor.user.email.toLowerCase().includes(query)
    );
  }

  protected readonly Math = Math;
}
