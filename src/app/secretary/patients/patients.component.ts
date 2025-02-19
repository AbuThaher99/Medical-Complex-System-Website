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
  doctorSearchQuery: string = '';

  showPatientModal = false;
  selectedPatient: any = null;
  doctorsPage: number = 1;
  doctorsSize: number = 10;
  totalDoctorsPages: number = 1;
  loadingDoctors: boolean = false;
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
      if (!this.selectedDoctorIds.includes(doctorId)) {
        this.selectedDoctorIds.push(doctorId);
      }
    } else {
      this.selectedDoctorIds = this.selectedDoctorIds.filter(id => id !== doctorId);
    }
    this.fetchPatients();
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  loadDoctors(): void {
    if (this.loadingDoctors || this.doctorsPage > this.totalDoctorsPages) return;

    this.loadingDoctors = true;

    this.doctorService.getDoctors(this.doctorsPage, this.doctorsSize).subscribe({
      next: (response) => {
        this.doctors = [...this.doctors, ...response.content]; // Append new doctors
        this.filteredDoctors = [...this.doctors]; // Initialize filtered list
        this.totalDoctorsPages = response.totalPages;
        this.doctorsPage++; // Prepare for next page load
        this.loadingDoctors = false;
      },
      error: (error) => {
        console.error('Error fetching doctors:', error);
        this.loadingDoctors = false;
      },
    });
  }
  filterDoctors(): void {
    const query = this.doctorSearchQuery.toLowerCase().trim();

    this.filteredDoctors = this.doctors.filter((doctor) => {
      const fullName = `${doctor.user.firstName} ${doctor.user.lastName}`.toLowerCase();
      return fullName.includes(query) || doctor.user.email.toLowerCase().includes(query) || doctor.specialization.toLowerCase().includes(query);
    });
  }


  openDropdown(): void {
    this.dropdownOpen = true;
  }

  // Close Dropdown (Delays to allow selection)
  closeDropdown(): void {
    setTimeout(() => {
      this.dropdownOpen = false;
    }, 200);
  }

  // Lazy Load More Doctors on Scroll
  onDropdownScroll(event: any): void {
    const element = event.target;
    if (element.scrollHeight - element.scrollTop <= element.clientHeight + 10) {
      this.loadDoctors();
    }
  }
  protected readonly Math = Math;
}
