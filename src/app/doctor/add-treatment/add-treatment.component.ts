import { Component, HostListener, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DoctorService } from '../../services/doctor.service';
import { PatientService } from '../../services/patient.service';
import { TreatmentService } from '../../services/treatment.service';

@Component({
  selector: 'app-add-treatment',
  templateUrl: './add-treatment.component.html',
  styleUrls: ['./add-treatment.component.css']
})
export class AddTreatmentComponent implements OnInit {
  treatmentForm: FormGroup;
  doctors: any[] = [];
  patients: any[] = [];

  showDoctorDropdown = false;
  showPatientDropdown = false;

  doctorPage = 1;
  doctorPageSize = 10;
  totalDoctors = 0;
  loadingDoctors = false;

  patientPage = 1;
  patientPageSize = 10;
  totalPatients = 0;
  loadingPatients = false;

  doctorSearchTerm = '';
  patientSearchTerm = '';

  filteredDoctors: any[] = [];
  filteredPatients: any[] = [];


  constructor(
    private fb: FormBuilder,
    private doctorService: DoctorService,
    private patientService: PatientService,
    private treatmentService: TreatmentService
  ) {
    this.treatmentForm = this.fb.group({
      doctorId: ['', Validators.required],
      patientId: ['', Validators.required],
      treatmentDate: ['', Validators.required],
      diseaseDescription: ['', Validators.required],
      note: [''],
      price: ['', [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.loadDoctors();
    this.loadPatients();
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.modal-dropdown')) {
      this.showDoctorDropdown = false;
      this.showPatientDropdown = false;
    }
  }
  hideDropdown(event: FocusEvent, type: 'doctor' | 'patient'): void {
    setTimeout(() => {
      if (type === 'doctor') {
        this.showDoctorDropdown = false;
      } else if (type === 'patient') {
        this.showPatientDropdown = false;
      }
    }, 200); // Delay to allow click event to register
  }

  loadDoctors(): void {
    if (this.loadingDoctors || (this.totalDoctors && this.doctors.length >= this.totalDoctors)) return;

    this.loadingDoctors = true;
    this.doctorService.getDoctors(this.doctorPage, this.doctorPageSize).subscribe({
      next: (response) => {
        const newDoctors = response.content.map((doctor: any) => ({
          id: doctor.id,
          displayText: `${doctor.id} - ${doctor.user.firstName} ${doctor.user.lastName} - ${doctor.user.email}`
        }));

        this.doctors = [...this.doctors, ...newDoctors];
        this.filteredDoctors = this.doctors; // Initialize filtered doctors
        this.totalDoctors = response.totalElements;
        this.doctorPage++;
        this.loadingDoctors = false;
      },
      error: (error) => {
        console.error('Failed to load doctors:', error);
        this.loadingDoctors = false;
      }
    });
  }


  loadPatients(): void {
    if (this.loadingPatients || (this.totalPatients && this.patients.length >= this.totalPatients)) return;

    this.loadingPatients = true;
    this.patientService.getPatients(this.patientPage, this.patientPageSize).subscribe({
      next: (response) => {
        const newPatients = response.content.map((patient: any) => ({
          id: patient.id,
          displayText: `${patient.id} - ${patient.user.firstName} ${patient.user.lastName} - ${patient.user.email}`
        }));

        this.patients = [...this.patients, ...newPatients];
        this.filteredPatients = this.patients; // Initialize filtered patients
        this.totalPatients = response.totalElements;
        this.patientPage++;
        this.loadingPatients = false;
      },
      error: (error) => {
        console.error('Failed to load patients:', error);
        this.loadingPatients = false;
      }
    });
  }

  onDoctorScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 10) {
      this.loadDoctors();
    }
  }

  onPatientScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 10) {
      this.loadPatients();
    }
  }

  onSubmit(): void {
    if (this.treatmentForm.invalid) {
      alert('Please fill all required fields.');
      return;
    }

    const treatmentData = {
      doctor: { id: this.treatmentForm.value.doctorId },
      patient: { id: this.treatmentForm.value.patientId },
      treatmentDate: new Date(this.treatmentForm.value.treatmentDate).toISOString(),
      diseaseDescription: this.treatmentForm.value.diseaseDescription,
      note: this.treatmentForm.value.note,
      price: this.treatmentForm.value.price
    };

    this.treatmentService.addTreatment(treatmentData).subscribe({
      next: () => {
        alert('Treatment added successfully!');
        this.treatmentForm.reset();
      },
      error: (error) => {
        console.error('Failed to add treatment:', error);
        alert('Failed to add treatment. Please try again.');
      }
    });
  }

  selectDoctor(doctor: any): void {
    this.doctorSearchTerm = `${doctor.displayText}`;
    this.treatmentForm.patchValue({ doctorId: doctor.id });
    this.showDoctorDropdown = false;
  }

  selectPatient(patient: any): void {
    this.patientSearchTerm = `${patient.displayText}`;
    this.treatmentForm.patchValue({ patientId: patient.id });
    this.showPatientDropdown = false;
  }


  toggleDoctorDropdown(): void {
    this.showDoctorDropdown = !this.showDoctorDropdown;
  }

  togglePatientDropdown(): void {
    this.showPatientDropdown = !this.showPatientDropdown;
  }


  filterDoctors(searchTerm: string): void {
    this.filteredDoctors = this.doctors.filter((doctor) =>
      doctor.displayText.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  filterPatients(searchTerm: string): void {
    this.filteredPatients = this.patients.filter((patient) =>
      patient.displayText.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

}
