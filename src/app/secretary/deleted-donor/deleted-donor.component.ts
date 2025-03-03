import { Component, OnInit } from '@angular/core';
import { DonorService } from '../../services/donor.service';
import {CustomAlertService} from "../../services/custom-alert.service";

@Component({
  selector: 'app-deleted-donor',
  templateUrl: './deleted-donor.component.html',
  styleUrls: ['./deleted-donor.component.css'],
})
export class DeletedDonorComponent implements OnInit {
  deletedDonors: any[] = []; // Deleted donors displayed in the table
  donorsList: any[] = []; // Donors for dropdown
  filteredDonors: any[] = []; // Filtered donors for dropdown
  selectedDonorIds: number[] = []; // Selected donor IDs

  page = 1;
  size = 10;
  totalPages = 1;
  searchQuery = '';
  bloodType = '';
  gender = '';
  donorSearchQuery = ''; // Search query for dropdown filtering

  showDonorDropdown = false; // Dropdown visibility state

  bloodTypes = [
    'A_POSITIVE',
    'A_NEGATIVE',
    'B_POSITIVE',
    'B_NEGATIVE',
    'O_POSITIVE',
    'O_NEGATIVE',
    'AB_POSITIVE',
    'AB_NEGATIVE',
  ];
  genders = ['MALE', 'FEMALE'];

  constructor(private donorService: DonorService,private customAlertService: CustomAlertService) {}

  ngOnInit(): void {
    this.loadDeletedDonors();
    this.loadDonorList(); // Load donors for dropdown
  }

  loadDonorList(): void {
    this.donorService.getDeletedDonors(1, 100, '', '', [], '').subscribe((data) => {
      this.donorsList = data.content;
      this.filteredDonors = [...this.donorsList]; // Initialize filtered donors
    });
  }

  onDropdownScroll(event: any): void {
    const bottomReached = event.target.scrollHeight - event.target.scrollTop <= event.target.clientHeight + 10;
    if (bottomReached) {
      this.loadDonorList(); // Load the next batch of donors
    }
  }

  filterDonors(): void {
    if (this.donorSearchQuery.trim()) {
      this.filteredDonors = this.donorsList.filter((donor) =>
        `${donor.id} - ${donor.name}`.toLowerCase().includes(this.donorSearchQuery.toLowerCase())
      );
    } else {
      this.filteredDonors = [...this.donorsList]; // Reset to full list if query is empty
    }
  }

  loadDeletedDonors(): void {
    this.donorService
      .getDeletedDonors(
        this.page,
        this.size,
        this.searchQuery,
        this.bloodType,
        this.selectedDonorIds,
        this.gender
      )
      .subscribe((data) => {
        this.deletedDonors = data.content;
        this.totalPages = data.totalPages;
      });
  }

  onSearchChange(): void {
    this.page = 1; // Reset to first page
    this.loadDeletedDonors();
  }

  toggleDonorSelection(donorId: number, event: any): void {
    if (event.target.checked) {
      this.selectedDonorIds.push(donorId);
    } else {
      this.selectedDonorIds = this.selectedDonorIds.filter((id) => id !== donorId);
    }
    this.onSearchChange();
  }

  hideDropdown(event: FocusEvent): void {
    setTimeout(() => {
      this.showDonorDropdown = false;
    }, 200); // Delay to allow checkbox clicks to register
  }

  restoreDonor(donorId: number): void {
    this.customAlertService.confirm('Confirm Restore', 'Are you sure you want to restore this donor?').then((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.donorService.restoreDonor(donorId).subscribe({
        next: () => {
          this.customAlertService.show('Success', 'Donor restored successfully!');
          this.loadDeletedDonors();
        },
        error: (error) => {
          console.error('Failed to restore donor:', error.message);
          this.customAlertService.show('Error', 'Failed to restore donor: ' + error.message);
        },
      });
    });
  }
}
