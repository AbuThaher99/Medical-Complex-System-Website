import { Component, OnInit } from '@angular/core';
import { TreatmentPatientService } from '../../services/treatment-patient.service';
import {CustomAlertService} from "../../services/custom-alert.service";

@Component({
  selector: 'app-my-treatments',
  templateUrl: './my-treatments.component.html',
  styleUrls: ['./my-treatments.component.css']
})
export class MyTreatmentsComponent implements OnInit {
  treatments: any[] = [];
  page = 1;
  size = 10;
  totalPages = 0;
  feedbackModalOpen = false;
  feedback = { comment: '', rating: 0, doctorId: 0, patientId: 0, treatmentId: 0 };

  constructor(private treatmentService: TreatmentPatientService,private customAlertService: CustomAlertService) {}

  ngOnInit(): void {
    this.loadTreatments();
  }

  loadTreatments(): void {
    this.treatmentService.getTreatments(this.page, this.size).subscribe((response) => {
      this.treatments = response.content;
      this.totalPages = response.totalPages;
    });
  }

  openFeedbackModal(doctorId: number, patientId: number, treatmentId: number, isRated: boolean): void {
    if (isRated) {
      this.customAlertService.show('Error', 'Feedback has already been submitted for this treatment.');
      return;
    }

    this.feedback = {
      comment: '',
      rating: 0,
      doctorId,
      patientId,
      treatmentId
    };
    this.feedbackModalOpen = true;
  }

  submitFeedback(): void {
    if (this.feedback.rating === 0 || this.feedback.rating === null || this.feedback.comment === '') {
      this.customAlertService.show('Error', 'Please select a rating.');
      return;
    }
    const payload = {
      comment: this.feedback.comment,
      rating: this.feedback.rating,
      doctor: { id: this.feedback.doctorId },
      patient: { id: this.feedback.patientId },
      treatment: { id: this.feedback.treatmentId }
    };

    this.treatmentService.submitFeedback(payload).subscribe(() => {
      this.customAlertService.show('Success', 'Feedback submitted successfully!');
      this.feedbackModalOpen = false;
      this.loadTreatments(); // Refresh treatments to reflect feedback status
    }, () => {
      this.customAlertService.show('Error', 'Failed to submit feedback.');

    });
  }

  closeModal(): void {
    this.feedbackModalOpen = false;
  }

  previousPage(): void {
    if (this.page > 1) {
      this.page--;
      this.loadTreatments();
    }
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadTreatments();
    }
  }
}
