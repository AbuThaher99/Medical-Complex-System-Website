import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ConfigService {
    readonly apiUrl: string = 'https://medical-latest.onrender.com/';

    constructor() {}
}
