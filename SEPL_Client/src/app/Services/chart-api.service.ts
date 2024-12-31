import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChartAPIService {
  constructor(private http:HttpClient) { }

  fetchChartData(stationName:any, fetchFrom:any, body:any):Observable<any> {
    return this.http.post<any>(`http://localhost:3000/${stationName}/${fetchFrom}`, body)
  }
}
