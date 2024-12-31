import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment.development';

@Injectable({
  providedIn: 'root'
})
export class ChartAPIService {
  constructor(private http:HttpClient) { }

  fetchChartData(fetchFrom:any, body:any):Observable<any> {
    return this.http.post<any>(`http://localhost:3000/api/${fetchFrom}`, body)
  }
}
