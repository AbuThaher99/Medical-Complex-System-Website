import { Component } from '@angular/core';
import { DonorService } from '../../services/donor.service';
import {CustomAlertService} from "../../services/custom-alert.service";

@Component({
  selector: 'app-add-donor',
  templateUrl: './add-donor.component.html',
  styleUrls: ['./add-donor.component.css'],
})
export class AddDonorComponent {
  donor = {
    name: '',
    phone: '',
    bloodType: '',
    gender: '',
  };

  bloodTypes = ['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE'];
  genders = ['MALE', 'FEMALE'];

  constructor(private donorService: DonorService,private customAlertService: CustomAlertService) {}

  addDonor(): void {
    if (this.donor.name && this.donor.phone && this.donor.bloodType && this.donor.gender) {
      this.donorService.addDonor(this.donor).subscribe(
        () => {
          this.customAlertService.show('Success', 'Donor added successfully!');
          this.resetForm();
        },
        (error) => {
          this.customAlertService.show('Error', 'Failed to add donor');

        }
      );
    } else {
      this.customAlertService.show('Error', 'Please fill in all the fields.');

    }
  }

  resetForm(): void {
    this.donor = {
      name: '',
      phone: '',
      bloodType: '',
      gender: '',
    };
  }
}
