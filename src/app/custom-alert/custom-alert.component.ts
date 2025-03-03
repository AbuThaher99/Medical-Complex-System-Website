import { Component } from '@angular/core';
import { CustomAlertService } from '../services/custom-alert.service';

@Component({
  selector: 'app-custom-alert',
  templateUrl: './custom-alert.component.html',
  styleUrls: ['./custom-alert.component.css'],
})
export class CustomAlertComponent {
  title: string = '';
  message: string = '';
  isVisible: boolean = false;
  isConfirmation: boolean = false;

  constructor(private customAlertService: CustomAlertService) {
    // Subscribe to the alert state
    this.customAlertService.alertState$.subscribe((state) => {
      this.title = state.title;
      this.message = state.message;
      this.isVisible = state.visible;
      this.isConfirmation = state.isConfirmation;
    });
  }

  // Close the alert/dialog
  close() {
    this.customAlertService.close();
  }

  // Confirm the dialog
  confirm(confirmed: boolean) {
    this.customAlertService.close(confirmed);
  }
}
