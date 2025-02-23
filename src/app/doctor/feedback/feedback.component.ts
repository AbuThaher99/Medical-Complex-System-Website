import {Component, OnInit} from '@angular/core';
import {DoctorService} from "../../services/doctor.service";

@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.component.html',
  styleUrl: './feedback.component.css'
})
export class FeedbackComponent implements OnInit {
  feedbacks: any[] = [];
  page = 1;
  size = 10;
  totalPages = 0;

  constructor(private doctorService: DoctorService) {}

  ngOnInit(): void {
    this.loadFeedbacks();
  }

  loadFeedbacks(): void {
    this.doctorService.getFeedbacks(this.page, this.size).subscribe((response) => {
      this.feedbacks = response.content;
      this.totalPages = response.totalPages;
    });
  }

  previousPage(): void {
    if (this.page > 1) {
      this.page--;
      this.loadFeedbacks();
    }
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadFeedbacks();
    }
  }
}
