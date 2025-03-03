import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { UserService } from '../../services/user.service';
import { ConfigService } from '../../services/config.service';
import {CustomAlertService} from "../../services/custom-alert.service";

@Component({
  selector: 'app-deleted-users',
  templateUrl: './deleted-users.component.html',
  styleUrls: ['./deleted-users.component.css']
})
export class DeletedUsersComponent implements OnInit {
  users: any[] = [];
  page = 1;
  size = 10;
  search = '';
  role = '';
  totalUsers = 0;

  constructor(private userService: UserService, private http: HttpClient, private configService: ConfigService,private customAlertService: CustomAlertService
  ) {}

  ngOnInit(): void {
    this.fetchDeletedUsers();
  }

  fetchDeletedUsers(): void {
    const url = `${this.configService.apiUrl}admin/user/deleted`;
    const accessToken = localStorage.getItem('access_token');

    if (!accessToken) {
      this.customAlertService.show('Error', 'No access token found. Please log in.');

      return;
    }

    const headers = new HttpHeaders({
      'accept': '*/*',
      'Authorization': `Bearer ${accessToken}`
    });

    const params = new HttpParams()
      .set('page', this.page.toString())
      .set('size', this.size.toString())
      .set('search', this.search)
      .set('role', this.role);

    this.http.get(url, { headers, params }).subscribe({
      next: (response: any) => {
        this.users = response.content;
        this.totalUsers = response.totalElements;
      },
      error: (error) => {
        console.error('Failed to fetch deleted users:', error);
        this.customAlertService.show('Error', 'Failed to fetch deleted users. Please try again.');

      }
    });
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.fetchDeletedUsers();
  }

  restoreUser(userId: number): void {
    this.customAlertService.confirm('Confirm Restore', 'Are you sure you want to restore this user').then((confirmed) => {

      if (!confirmed) {
        return;
      }

      const url = `${this.configService.apiUrl}admin/user/restore/${userId}`;
      const accessToken = localStorage.getItem('access_token');

      if (!accessToken) {
        this.customAlertService.show('Error', 'No access token found. Please log in.');

        return;
      }

      const headers = new HttpHeaders({
        'accept': '*/*',
        'Authorization': `Bearer ${accessToken}`
      });

      this.http.post(url, null, {headers}).subscribe({
        next: () => {
          this.customAlertService.show('Success', 'User restored successfully!');

          this.fetchDeletedUsers();
        },
        error: (error) => {
          console.error('Failed to restore user:', error);
          this.customAlertService.show('Error', 'Failed to restore user. Please try again.');

        }
      });
    });
  }

  protected readonly Math = Math;
}
