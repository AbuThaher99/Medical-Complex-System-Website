import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { ConfigService } from '../../services/config.service';


@Component({
  selector: 'app-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.css']
})
export class AddUserComponent implements OnInit {
  user: any = {
    password: '',
    firstName: '',
    lastName: '',
    address: '',
    phone: '',
    dateOfBirth: '',
    email: '',
    role: 'ADMIN',
    salary: {
      salaryType: 'MONTHLY',
      fixedSalary: 0,
      hourRate: 0,
      hourWork: 0
    }
  };

  doctor: any = {
    specialization: 'CARDIOLOGIST',
    beginTime: { hour: 0, minute: 0, second: 0, nano: 0 },
    endTime: { hour: 0, minute: 0, second: 0, nano: 0 }
  };

  patient: any = {
    age: 0,
    bloodType: { id: 0 }
  };

  constructor(private http: HttpClient, private router: Router ,private configService: ConfigService) {}

  ngOnInit(): void {}

  onRoleChange(): void {
    // Reset additional fields when role changes
    this.doctor = {
      specialization: 'CARDIOLOGIST',
      beginTime: { hour: 0, minute: 0, second: 0, nano: 0 },
      endTime: { hour: 0, minute: 0, second: 0, nano: 0 }
    };
    this.patient = {
      age: 0,
      bloodType: { id: 0 }
    };
  }

  onSubmit(): void {
    const accessToken = localStorage.getItem('access_token');

    if (!accessToken) {
      alert('No access token found. Please log in.');
      return;
    }

    const headers = new HttpHeaders({
      'accept': '*/*',
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    });

    // Prepare the user object based on the selected role
    let requestBody: any;

    switch (this.user.role) {
      case 'DOCTOR':
        requestBody = {
          specialization: this.doctor.specialization,
          beginTime: this.doctor.beginTime,
          endTime: this.doctor.endTime,
          user: this.user
        };
        break;
      case 'PATIENT':
        requestBody = {
          age: this.patient.age,
          user: this.user,
          bloodType: this.patient.bloodType
        };
        break;
      default:
        // For other roles (ADMIN, SECRETARY, WAREHOUSE_EMPLOYEE)
        requestBody = this.user;
        break;
    }

    // Adjust the salary object based on the selected salary type
    if (this.user.role !== 'PATIENT') {
      if (this.user.salary.salaryType === 'MONTHLY') {
        requestBody.salary = {
          salaryType: 'MONTHLY',
          fixedSalary: this.user.salary.fixedSalary || 0, // Use fixedSalary only
          salaryAmount:  0.0,
        };

        delete this.user.salary.hourRate;
        delete this.user.salary.hourWork;

      } else if (this.user.salary.salaryType === 'HOURLY') {
        requestBody.salary = {
          salaryType: 'HOURLY',
          hourRate: this.user.salary.hourRate || 0,
          hourWork: this.user.salary.hourWork || 0,
        };
        delete this.user.salary.fixedSalary;
      }
    }

    // Determine the API endpoint based on the role
    let url = '';
    const  baseUrl = this.configService.apiUrl;
    switch (this.user.role) {
      case 'DOCTOR':
        url = `${baseUrl}admin/doctors/`; // Use base URL dynamically
        break;
      case 'PATIENT':
        url = `${baseUrl}auth`; // Use base URL dynamically
        break;
      default:
        url = `${baseUrl}admin/user/`; // Use base URL dynamically
        break;
    }

    // Make the POST request
    this.http.post(url, requestBody, { headers }).subscribe({
      next: (response) => {
        console.log('User added successfully:', response);
        alert('User added successfully!');
        this.router.navigate(['/admin/manageuser']);
      },
      error: (error) => {
        console.error('Failed to add user:', error);
        alert('Failed to add user. Please try again.');
      }
    });
  }
}
