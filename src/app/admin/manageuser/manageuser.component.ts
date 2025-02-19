import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-manageuser',
  templateUrl: './manageuser.component.html',
  styleUrls: ['./manageuser.component.css'],
})
export class ManageuserComponent implements OnInit {
  users: any[] = [];
  page = 1;
  size = 10;
  search = '';
  role = '';
  totalUsers = 0;
  selectedUser: any = null;

  private searchSubject = new Subject<{ search: string; role: string }>();

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.fetchUsers();

    // Real-time filtering with debounce
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe(({ search, role }) => {
      this.page = 1; // Reset to the first page when filtering
      this.search = search;
      this.role = role;
      this.fetchUsers();
    });
  }

  fetchUsers(): void {
    this.userService.getUsers(this.page, this.size, this.search, this.role).subscribe((response) => {
      this.users = response.content; // Assuming the response has a 'content' array
      this.totalUsers = response.totalElements; // Assuming the response has 'totalElements'
    });
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.fetchUsers();
  }

  onSearchChange(search: string): void {
    this.searchSubject.next({ search, role: this.role });
  }

  onRoleChange(role: string): void {
    this.searchSubject.next({ search: this.search, role });
  }

  viewUser(userId: number): void {
    this.userService.viewUser(userId).subscribe({
      next: (response) => {
        this.selectedUser = response;
        this.selectedUser.beginTime = this.convertToTimeFormat(this.selectedUser.beginTime);
        this.selectedUser.endTime = this.convertToTimeFormat(this.selectedUser.endTime);
      },
      error: (error) => {
        console.error('Failed to fetch user details:', error);
        alert('Failed to fetch user details. Please try again.');
      },
    });
  }

  convertToTimeFormat(time: string): string {
    if (!time) return time;

    const [hours, minutes, seconds] = time.split(':');
    const timeObject = new Date(1970, 0, 1, parseInt(hours), parseInt(minutes), parseInt(seconds));
    return timeObject.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  closeModal(): void {
    this.selectedUser = null; // Hide the modal
  }

  deleteUser(userId: number): void {
    const confirmDelete = confirm('Are you sure you want to delete this user?');
    if (!confirmDelete) {
      return;
    }

    this.userService.deleteUser(userId).subscribe({
      next: (response) => {
        console.log('User deleted successfully:', response);
        alert('User deleted successfully!');
        this.fetchUsers(); // Refresh the user list after deletion
      },
      error: (error) => {
        console.error('Failed to delete user:', error);
        alert('Failed to delete user. Please try again.');
      },
    });
  }

  protected readonly Math = Math;
}
