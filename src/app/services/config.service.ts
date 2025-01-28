import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  readonly apiUrl: string = 'http://localhost:8080/';

  constructor() {}
}
