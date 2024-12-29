import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChartAPIService {
  constructor(private http:HttpClient) { }

  fetchChartData(fetchFrom:any):Observable<any> {
    return this.http.get<any>(`http://localhost:3000/${fetchFrom}`)
  }
}
