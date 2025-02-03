import { Component, OnInit } from '@angular/core';
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
  loadingDoctors = false;
  loadingPatients = false;

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

  ngOnInit(): void {}

  loadDoctors(event: any) {
    if (this.doctors.length === 0) {
      this.loadingDoctors = true;
      this.doctorService.getDoctors(1, 10).subscribe({
        next: (response) => {
          this.doctors = response.content.map((doctor: any) => ({
            id: doctor.id,
            displayText: `${doctor.id} - ${doctor.user.firstName} ${doctor.user.lastName} - ${doctor.user.email}`
          }));
          this.loadingDoctors = false;
        },
        error: (error) => {
          console.error('Failed to load doctors:', error);
          this.loadingDoctors = false;
        }
      });
    }
  }

  loadPatients(event: any) {
    if (this.patients.length === 0) {
      this.loadingPatients = true;
      this.patientService.getPatients(1, 10).subscribe({
        next: (response) => {
          this.patients = response.content.map((patient: any) => ({
            id: patient.id,
            displayText: `${patient.id} - ${patient.user.firstName} ${patient.user.lastName} - ${patient.user.email}`
          }));
          this.loadingPatients = false;
        },
        error: (error) => {
          console.error('Failed to load patients:', error);
          this.loadingPatients = false;
        }
      });
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
      next: (response) => {
        console.log('Treatment added successfully:', response);
        alert('Treatment added successfully!');
        this.treatmentForm.reset();
      },
      error: (error) => {
        console.error('Failed to add treatment:', error);
        alert('Failed to add treatment. Please try again.');
      }
    });
  }
}
