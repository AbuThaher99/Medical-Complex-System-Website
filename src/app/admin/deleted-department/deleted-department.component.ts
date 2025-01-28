import { Component, OnInit } from '@angular/core';
import { DepartmentService } from '../../services/department.service';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-deleted-department',
  templateUrl: './deleted-department.component.html',
  styleUrls: ['./deleted-department.component.css'],
})
export class DeletedDepartmentComponent implements OnInit {
  deletedDepartments: any[] = [];
  page = 1;
  size = 10;
  totalDepartments = 0;
  searchQuery: string = ''; // Holds the search query
  searchSubject: Subject<string> = new Subject<string>(); // Subject for search input changes

  constructor(private departmentService: DepartmentService) {}

  ngOnInit(): void {
    this.fetchDeletedDepartments();

    // Subscribe to the searchSubject to handle real-time search
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged()) // Wait 300ms and only emit distinct values
      .subscribe((searchText) => {
        this.page = 1; // Reset to the first page when searching
        this.fetchDeletedDepartments(searchText);
      });
  }

  fetchDeletedDepartments(search: string = ''): void {
    this.departmentService.getDeletedDepartments(this.page, this.size, search).subscribe({
      next: (response) => {
        this.deletedDepartments = response.content;
        this.totalDepartments = response.totalElements;
      },
      error: (error) => {
        console.error('Failed to fetch deleted departments:', error);
        if (error.status === 403) {
          alert('You do not have permission to access this resource.');
        } else {
          alert('Failed to fetch deleted departments. Please try again.');
        }
      },
    });
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.fetchDeletedDepartments(this.searchQuery);
  }

  onSearchInputChange(query: string): void {
    this.searchSubject.next(query); // Emit the search query
  }

  restoreDepartment(id: number): void {
    const confirmRestore = confirm('Are you sure you want to restore this department?');
    if (!confirmRestore) {
      return;
    }

    this.departmentService.restoreDepartment(id).subscribe({
      next: (response) => {
        console.log('Department restored successfully:', response);
        alert('Department restored successfully!');
        this.fetchDeletedDepartments(); // Refresh the list after restoration
      },
      error: (error) => {
        console.error('Failed to restore department:', error);
        alert('Failed to restore department. Please try again.');
      },
    });
  }

  protected readonly Math = Math;
}
