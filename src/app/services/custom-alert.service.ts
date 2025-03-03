import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CustomAlertService {
  private alertSubject = new BehaviorSubject<{ title: string; message: string; visible: boolean; isConfirmation: boolean }>({
    title: '',
    message: '',
    visible: false,
    isConfirmation: false,
  });

  alertState$ = this.alertSubject.asObservable();

  // Show a regular alert
  show(title: string, message: string) {
    this.alertSubject.next({ title, message, visible: true, isConfirmation: false });
  }

  // Show a confirmation dialog
  confirm(title: string, message: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.alertSubject.next({ title, message, visible: true, isConfirmation: true });

      // Listen for the user's choice
      const subscription = this.alertState$.subscribe((state) => {
        if (!state.visible) {
          resolve(state.isConfirmation);
          subscription.unsubscribe();
        }
      });
    });
  }

  // Close the alert/dialog
  close(confirmed: boolean = false) {
    this.alertSubject.next({ title: '', message: '', visible: false, isConfirmation: confirmed });
  }
}
