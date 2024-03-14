import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  // private backendUrl = 'http://localhost:3000';
  private backendUrl = 'https://assignment3-backend.uw.r.appspot.com/';

  constructor(private http: HttpClient) {}

  // In AppService
  searchStocks(query: string): Observable<any[]> {
    // Example URL, replace with your actual backend endpoint that returns the search results
    return this.http.get<any[]>(`${this.backendUrl}/search?q=${query}`).pipe(
      map((results) =>
        results.map((item) => ({
          symbol: item.symbol, // Adjust based on the actual response structure
          description: item.description, // Adjust based on the actual response structure
        }))
      )
    );
  }

  fetchStockProfile(symbol: string): Observable<any> {
    return this.http.get(
      `${this.backendUrl}/api/stock/profile?symbol=${symbol}`
    );
  }

  fetchStockQuote(symbol: string): Observable<any> {
    return this.http.get(`${this.backendUrl}/api/stock/quote?symbol=${symbol}`);
  }
}
